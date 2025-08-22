const express = require('express');
const { User, Project, Task, TimeEntry, Break, sequelize } = require('../models');
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// ✅ Sanitize and build date filter safely
function getDateFilter(query) {
  const { startDate, endDate } = query;

  // Validate non-empty and valid date
  const isValid = (dateStr) => dateStr && !isNaN(new Date(dateStr));

  if (isValid(startDate) && isValid(endDate)) {
    return {
      createdAt: {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      }
    };
  }

  return {}; // No filter
}

// ✅ Dashboard Stats
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = {};
    const dateFilter = getDateFilter(req.query);

    // Total counts
    stats.totalUsers = await User.count();
    stats.totalProjects = await Project.count({ where: dateFilter });
    stats.totalTasks = await Task.count({ where: dateFilter });

    // Project Status
    const allProjectStatuses = ['planning', 'active', 'on_hold', 'completed', 'cancelled'];
    const projectStatuses = await Project.findAll({
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('status')), 'count']],
      where: dateFilter,
      group: ['status'],
      raw: true
    });
    stats.projectsByStatus = allProjectStatuses.reduce((acc, status) => {
      const found = projectStatuses.find(item => item.status === status);
      acc[status] = found ? parseInt(found.count) : 0;
      return acc;
    }, {});

    // Task Status
    const allTaskStatuses = ['todo', 'in_progress', 'review', 'completed'];
    const taskStatuses = await Task.findAll({
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('status')), 'count']],
      where: dateFilter,
      group: ['status'],
      raw: true
    });
    stats.tasksByStatus = allTaskStatuses.reduce((acc, status) => {
      const found = taskStatuses.find(item => item.status === status);
      acc[status] = found ? parseInt(found.count) : 0;
      return acc;
    }, {});

    // Time & Transactions
    const hoursSum = await TimeEntry.sum('hours', { where: dateFilter });
    stats.totalHours = hoursSum ? parseFloat(hoursSum.toFixed(2)) : 0;
    stats.totalTransactions = (await TimeEntry.sum('transactions', { where: dateFilter })) || 0;

    // Breaks & Leisure
    const totalBreaks = await Break.count({ where: dateFilter });
    const totalBreakHours = await Break.sum('duration', { where: dateFilter });
    stats.totalBreaks = totalBreaks || 0;
    stats.totalBreakHours = totalBreakHours ? parseFloat((totalBreakHours / 60).toFixed(2)) : 0; // Convert minutes to hours

    // Direct counts
    stats.activeProjects = await Project.count({ where: { ...dateFilter, status: 'active' } });
    stats.completedTasks = await Task.count({ where: { ...dateFilter, status: 'completed' } });
    stats.pendingTasks = await Task.count({
      where: {
        ...dateFilter,
        status: ['todo', 'in_progress', 'review']
      }
    });

    // Add these lines to ensure all expected keys are present
    stats.activeProjects = stats.projectsByStatus['active'] || 0;
    stats.completedTasks = stats.tasksByStatus['completed'] || 0;
    stats.pendingTasks = (stats.tasksByStatus['todo'] || 0)
                       + (stats.tasksByStatus['in_progress'] || 0)
                       + (stats.tasksByStatus['review'] || 0);
    stats.totalTransactions = stats.totalTransactions || 0; // for frontend compatibility

    res.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Error fetching dashboard statistics' });
  }
});

// ✅ Recent Activities
router.get('/activities', auth, async (req, res) => {
  try {
    const activities = [];

    const recentProjects = await Project.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'manager', attributes: ['name'] }
      ]
    });

    recentProjects.forEach(project => {
      activities.push({
        type: 'project',
        action: 'created',
        description: `Project "${project.name}" was created`,
        timestamp: project.createdAt,
        user: project.manager?.name || 'Unknown'
      });
    });

    const recentTasks = await Task.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Project, attributes: ['name'] },
        { model: User, as: 'assignee', attributes: ['name'] }
      ]
    });

    recentTasks.forEach(task => {
      activities.push({
        type: 'task',
        action: 'created',
        description: `Task "${task.title}" was created in project "${task.Project?.name}"`,
        timestamp: task.createdAt,
        user: task.assignee?.name || 'Unassigned'
      });
    });

    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(activities.slice(0, 10));
  } catch (error) {
    console.error('Dashboard activities error:', error);
    res.status(500).json({ message: 'Error fetching recent activities' });
  }
});

// ✅ Tasks by Status Report
router.get('/reports/tasks-by-status', auth, async (req, res) => {
  try {
    const dateFilter = getDateFilter(req.query);
    const data = await Task.findAll({
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('status')), 'count']],
      where: dateFilter,
      group: ['status'],
      raw: true
    });

    res.json(data.map(item => ({
      status: item.status,
      count: parseInt(item.count)
    })));
  } catch (error) {
    console.error('Tasks by status report error:', error);
    res.status(500).json({ message: 'Error fetching tasks by status' });
  }
});

// ✅ Tasks by Priority Report
router.get('/reports/tasks-by-priority', auth, async (req, res) => {
  try {
    const dateFilter = getDateFilter(req.query);
    const data = await Task.findAll({
      attributes: ['priority', [sequelize.fn('COUNT', sequelize.col('priority')), 'count']],
      where: dateFilter,
      group: ['priority'],
      raw: true
    });

    res.json(data.map(item => ({
      priority: item.priority,
      count: parseInt(item.count)
    })));
  } catch (error) {
    console.error('Tasks by priority report error:', error);
    res.status(500).json({ message: 'Error fetching tasks by priority' });
  }
});

// ✅ Transactions per Task Report
router.get('/reports/transactions-by-task', auth, async (req, res) => {
  try {
    const dateFilter = getDateFilter(req.query);
    const data = await Task.findAll({
      attributes: ['title', [sequelize.fn('SUM', sequelize.col('estimatedTransactions')), 'transactions']],
      where: dateFilter,
      group: ['title'],
      raw: true
    });

    res.json(data.map(item => ({
      title: item.title,
      transactions: parseInt(item.transactions)
    })));
  } catch (error) {
    console.error('Transactions by task report error:', error);
    res.status(500).json({ message: 'Error fetching transactions by task' });
  }
});

// ✅ User Workload Report
router.get('/reports/user-workload', auth, async (req, res) => {
  try {
    const dateFilter = getDateFilter(req.query);

    const data = await Task.findAll({
      attributes: [
        [sequelize.col('assignees.id'), 'userId'],
        [sequelize.fn('COUNT', sequelize.col('Task.id')), 'count']
      ],
      where: dateFilter,
      include: [
        {
          model: User,
          as: 'assignees',
          attributes: ['name'],
          through: { attributes: [] }
        }
      ],
      group: ['assignees.id', 'assignees.name'],
      raw: true
    });

    res.json(
      data.map((item) => ({
        user: item['assignees.name'],
        count: parseInt(item.count, 10)
      }))
    );
  } catch (error) {
    console.error('User workload report error:', error);
    res.status(500).json({ message: 'Error fetching user workload' });
  }
});

// ✅ Tasks Over Time (Time Series)
router.get('/series/tasks-over-time', auth, async (req, res) => {
  try {
    const dateFilter = getDateFilter(req.query);
    const data = await Task.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: dateFilter,
      group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
      raw: true
    });

    res.json(data.map(item => ({
      date: item.date,
      count: parseInt(item.count)
    })));
  } catch (error) {
    console.error('Tasks over time report error:', error);
    res.status(500).json({ message: 'Error fetching tasks over time' });
  }
});

// ✅ Projects by Status Report
router.get('/reports/projects-by-status', auth, async (req, res) => {
  try {
    const dateFilter = getDateFilter(req.query);
    const data = await Project.findAll({
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('status')), 'count']],
      where: dateFilter,
      group: ['status'],
      raw: true
    });

    res.json(data.map(item => ({
      status: item.status,
      count: parseInt(item.count)
    })));
  } catch (error) {
    console.error('Projects by status report error:', error);
    res.status(500).json({ message: 'Error fetching projects by status' });
  }
});

// Add Project Report endpoint
router.get('/reports/project-report', auth, async (req, res) => {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    // Fetch all projects
    const projects = await Project.findAll({ attributes: ['id', 'name', 'createdAt'], raw: true });
    const report = await Promise.all(projects.map(async (project) => {
      const createdAt = new Date(project.createdAt);
      const projectsReceived = (createdAt >= firstDayOfMonth && createdAt < now) ? 1 : 0;

      // Tasks created today
      const tasksToday = await Task.count({
        where: {
          projectId: project.id,
          createdAt: { [Op.between]: [todayStart, tomorrowStart] }
        }
      });

      // Time entries for this project
      const recordsLogged = await TimeEntry.count({
        include: [{ model: Task, as: 'task', where: { projectId: project.id }, attributes: [] }]
      });
      const recordsProcessed = await TimeEntry.sum('transactions', {
        include: [{ model: Task, as: 'task', where: { projectId: project.id }, attributes: [] }]
      }) || 0;
      const totalHours = await TimeEntry.sum('hours', {
        include: [{ model: Task, as: 'task', where: { projectId: project.id }, attributes: [] }]
      }) || 0;
      const avgMinutesPerRecord = recordsProcessed > 0
        ? parseFloat(((totalHours / recordsProcessed) * 60).toFixed(2))
        : 0;

      // Breakdown per agent
      const perAgentRaw = await TimeEntry.findAll({
        attributes: ['userId', [sequelize.fn('COUNT', sequelize.col('TimeEntry.id')), 'count'], [sequelize.fn('SUM', sequelize.col('hours')), 'hours']],
        include: [
          { model: Task, as: 'task', where: { projectId: project.id }, attributes: [] },
          { model: User, as: 'user', attributes: ['name'] }
        ],
        group: ['userId', 'user.name'],
        raw: true
      });
      const recordsPerAgent = perAgentRaw.map(item => ({ user: item['user.name'], count: parseInt(item.count, 10) }));
      const timePerAgent = perAgentRaw.map(item => ({ user: item['user.name'], hours: parseFloat(item.hours) }));

      return {
        projectName: project.name,
        projectsReceived,
        tasksToday,
        recordsLogged,
        recordsProcessed,
        avgMinutesPerRecord,
        totalHours: parseFloat(totalHours.toFixed(2)),
        recordsPerAgent,
        timePerAgent
      };
    }));

    res.json(report);
  } catch (error) {
    console.error('Project report error:', error);
    res.status(500).json({ message: 'Error fetching project report' });
  }
});

// ✅ User Daily Logs Report - time and transactions per user for a given date (defaults to today)
router.get('/reports/user-daily-logs', auth, async (req, res) => {
  try {
    const targetDate = req.query.date && !isNaN(new Date(req.query.date))
      ? new Date(req.query.date)
      : new Date();

    const dateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD

    const data = await TimeEntry.findAll({
      attributes: [
        'userId',
        [sequelize.fn('SUM', sequelize.col('hours')), 'hours'],
        [sequelize.fn('SUM', sequelize.col('transactions')), 'transactions']
      ],
      where: { date: dateStr },
      include: [
        { model: User, as: 'user', attributes: ['name'] },
        {
          model: Task,
          as: 'task',
          attributes: ['title'],
          include: [{ model: Project, attributes: ['name'] }]
        }
      ],
      group: ['userId', 'user.name', 'task.id', 'task.title', 'task.Project.id', 'task.Project.name'],
      raw: true
    });

    res.json(
      data.map(item => ({
        user: item['user.name'],
        project: item['task.Project.name'],
        task: item['task.title'],
        hours: parseFloat(parseFloat(item.hours).toFixed(2)),
        transactions: parseInt(item.transactions, 10)
      }))
    );
  } catch (error) {
    console.error('User daily logs report error:', error);
    res.status(500).json({ message: 'Error fetching daily user logs' });
  }
});

// ✅ User Monthly Logs Report - aggregated time and transactions per user for the current (or provided) month
router.get('/reports/user-monthly-logs', auth, async (req, res) => {
  try {
    let baseDate = new Date();
    if (req.query.month && /^\d{4}-\d{2}$/.test(req.query.month)) {
      // month in YYYY-MM format
      const [year, month] = req.query.month.split('-').map(Number);
      baseDate = new Date(year, month - 1, 1);
    }

    const firstDay = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
    const lastDay = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0); // last day of month

    const data = await TimeEntry.findAll({
      attributes: [
        'userId',
        [sequelize.fn('SUM', sequelize.col('hours')), 'hours'],
        [sequelize.fn('SUM', sequelize.col('transactions')), 'transactions']
      ],
      where: {
        date: {
          [Op.between]: [firstDay.toISOString().split('T')[0], lastDay.toISOString().split('T')[0]]
        }
      },
      include: [
        { model: User, as: 'user', attributes: ['name'] },
        {
          model: Task,
          as: 'task',
          attributes: ['title'],
          include: [{ model: Project, attributes: ['name'] }]
        }
      ],
      group: ['userId', 'user.name', 'task.id', 'task.title', 'task.Project.id', 'task.Project.name'],
      raw: true
    });

    res.json(
      data.map(item => ({
        user: item['user.name'],
        project: item['task.Project.name'],
        task: item['task.title'],
        hours: parseFloat(parseFloat(item.hours).toFixed(2)),
        transactions: parseInt(item.transactions, 10)
      }))
    );
  } catch (error) {
    console.error('User monthly logs report error:', error);
    res.status(500).json({ message: 'Error fetching monthly user logs' });
  }
});

// ✅ Breaks & Leisure Report - comprehensive break analysis
router.get('/reports/breaks-leisure', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let whereClause = {};
    
    // Add date range filter if provided
    if (startDate && endDate) {
      whereClause.startTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereClause.startTime = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      whereClause.startTime = {
        [Op.lte]: new Date(endDate)
      };
    }

    // Role-based access control
    const role = req.user.role;
    const userId = req.user.id;
    
    if (role === 'team_member') {
      whereClause.userId = userId;
    } else if (role === 'team_leader') {
      // Team leaders can see breaks for their team members
      const leadProjects = await sequelize.models.ProjectTeam.findAll({ 
        where: { userId, role: 'lead' } 
      });
      const projectIds = leadProjects.map(pt => pt.projectId);
      const members = await sequelize.models.ProjectTeam.findAll({ 
        where: { projectId: projectIds, role: 'member' } 
      });
      const memberIds = [...new Set(members.map(pt => pt.userId))];
      whereClause.userId = [userId, ...memberIds];
    }
    // Admins and project managers can see all breaks (no additional filter)

    const breaks = await Break.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] }
      ],
      order: [['startTime', 'DESC']],
      raw: true,
      nest: true
    });

    // Calculate statistics
    const totalBreaks = breaks.length;
    const totalDuration = breaks.reduce((sum, b) => sum + (b.duration || 0), 0);
    const averageDuration = totalBreaks > 0 ? Math.round(totalDuration / totalBreaks) : 0;
    
    // Group by type
    const breaksByType = breaks.reduce((acc, b) => {
      const type = b.type;
      if (!acc[type]) {
        acc[type] = { count: 0, duration: 0, breaks: [] };
      }
      acc[type].count++;
      acc[type].duration += b.duration || 0;
      acc[type].breaks.push(b);
      return acc;
    }, {});

    // Group by user
    const breaksByUser = breaks.reduce((acc, b) => {
      const userName = b.user?.name || 'Unknown';
      if (!acc[userName]) {
        acc[userName] = { count: 0, duration: 0, breaks: [] };
      }
      acc[userName].count++;
      acc[userName].duration += b.duration || 0;
      acc[userName].breaks.push(b);
      return acc;
    }, {});

    // Daily breakdown
    const breaksByDay = breaks.reduce((acc, b) => {
      const date = new Date(b.startTime).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { count: 0, duration: 0, breaks: [] };
      }
      acc[date].count++;
      acc[date].duration += b.duration || 0;
      acc[date].breaks.push(b);
      return acc;
    }, {});

    res.json({
      summary: {
        totalBreaks,
        totalDuration: Math.round(totalDuration),
        totalHours: parseFloat((totalDuration / 60).toFixed(2)),
        averageDuration,
        averageHours: parseFloat((averageDuration / 60).toFixed(2))
      },
      breaksByType,
      breaksByUser,
      breaksByDay,
      detailedBreaks: breaks.map(b => ({
        id: b.id,
        employee: b.user?.name || 'Unknown',
        type: b.type,
        description: b.description,
        startTime: b.startTime,
        endTime: b.endTime,
        duration: b.duration,
        durationHours: b.duration ? parseFloat((b.duration / 60).toFixed(2)) : 0,
        isActive: b.isActive,
        date: new Date(b.startTime).toISOString().split('T')[0]
      }))
    });
  } catch (error) {
    console.error('Breaks & Leisure report error:', error);
    res.status(500).json({ message: 'Error fetching breaks & leisure report' });
  }
});

// ✅ Agent-wise Daily Report - comprehensive daily transaction and break analysis per agent
router.get('/reports/agent-wise-daily', auth, async (req, res) => {
  try {
    const targetDate = req.query.date && !isNaN(new Date(req.query.date))
      ? new Date(req.query.date)
      : new Date();

    const dateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Role-based access control
    const role = req.user.role;
    const userId = req.user.id;
    let userFilter = {};
    
    if (role === 'team_member') {
      userFilter = { id: userId };
    } else if (role === 'team_leader') {
      // Team leaders can see reports for their team members
      const leadProjects = await sequelize.models.ProjectTeam.findAll({ 
        where: { userId, role: 'lead' } 
      });
      const projectIds = leadProjects.map(pt => pt.projectId);
      const members = await sequelize.models.ProjectTeam.findAll({ 
        where: { projectId: projectIds, role: 'member' } 
      });
      const memberIds = [...new Set(members.map(pt => pt.userId))];
      userFilter = { id: [userId, ...memberIds] };
    }
    // Admins and project managers can see all users (no filter)

    // Get all users based on role permissions
    const users = await User.findAll({
      where: userFilter,
      attributes: ['id', 'name', 'email'],
      order: [['name', 'ASC']]
    });

    const agentReports = await Promise.all(users.map(async (user) => {
      // Get time entries for the user on the target date
      const timeEntries = await TimeEntry.findAll({
        where: { 
          userId: user.id,
          date: dateStr 
        },
        include: [
          {
            model: Task,
            as: 'task',
            attributes: ['id', 'title'],
            include: [{ 
              model: Project, 
              attributes: ['id', 'name'] 
            }]
          }
        ],
        order: [['createdAt', 'ASC']]
      });

      // Get breaks for the user on the target date
      const breaks = await Break.findAll({
        where: {
          userId: user.id,
          startTime: {
            [Op.between]: [
              new Date(`${dateStr}T00:00:00.000Z`),
              new Date(`${dateStr}T23:59:59.999Z`)
            ]
          }
        },
        order: [['startTime', 'ASC']]
      });

      // Calculate work metrics
      const totalWorkHours = timeEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
      const totalTransactions = timeEntries.reduce((sum, entry) => sum + (entry.transactions || 0), 0);
      
      // Calculate break metrics
      const totalBreaks = breaks.length;
      const totalBreakMinutes = breaks.reduce((sum, b) => sum + (b.duration || 0), 0);
      const totalBreakHours = totalBreakMinutes / 60;
      
      // Office hours analysis (9 hours total: 8 work + 1 break)
      const expectedWorkHours = 8;
      const expectedBreakHours = 1;
      const expectedTotalHours = 9;
      
      // Calculate efficiency and compliance
      const workHoursCompliance = totalWorkHours >= expectedWorkHours ? 100 : (totalWorkHours / expectedWorkHours) * 100;
      const breakHoursCompliance = totalBreakHours <= expectedBreakHours ? 100 : Math.max(0, 100 - ((totalBreakHours - expectedBreakHours) / expectedBreakHours) * 100);
      const overallCompliance = (workHoursCompliance + breakHoursCompliance) / 2;
      
      // Productivity metrics
      const transactionsPerHour = totalWorkHours > 0 ? totalTransactions / totalWorkHours : 0;
      const averageMinutesPerTransaction = totalTransactions > 0 ? (totalWorkHours * 60) / totalTransactions : 0;
      
      // Break analysis
      const breaksByType = breaks.reduce((acc, b) => {
        const type = b.type;
        if (!acc[type]) {
          acc[type] = { count: 0, duration: 0 };
        }
        acc[type].count++;
        acc[type].duration += b.duration || 0;
        return acc;
      }, {});
      
      // Time distribution throughout the day
      const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => {
        const hourStart = new Date(`${dateStr}T${String(hour).padStart(2, '0')}:00:00.000Z`);
        const hourEnd = new Date(`${dateStr}T${String(hour).padStart(2, '0')}:59:59.999Z`);
        
        const workInHour = timeEntries.filter(entry => {
          const entryTime = new Date(entry.createdAt);
          return entryTime >= hourStart && entryTime <= hourEnd;
        }).reduce((sum, entry) => sum + (entry.hours || 0), 0);
        
        const breaksInHour = breaks.filter(b => {
          const breakStart = new Date(b.startTime);
          return breakStart >= hourStart && breakStart <= hourEnd;
        });
        
        return {
          hour,
          workHours: workInHour,
          breakCount: breaksInHour.length,
          breakMinutes: breaksInHour.reduce((sum, b) => sum + (b.duration || 0), 0)
        };
      });

      return {
        agent: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        date: dateStr,
        workMetrics: {
          totalWorkHours: parseFloat(totalWorkHours.toFixed(2)),
          totalTransactions,
          transactionsPerHour: parseFloat(transactionsPerHour.toFixed(2)),
          averageMinutesPerTransaction: parseFloat(averageMinutesPerTransaction.toFixed(2)),
          workHoursCompliance: parseFloat(workHoursCompliance.toFixed(1))
        },
        breakMetrics: {
          totalBreaks,
          totalBreakMinutes,
          totalBreakHours: parseFloat(totalBreakHours.toFixed(2)),
          breaksByType,
          breakHoursCompliance: parseFloat(breakHoursCompliance.toFixed(1)),
          averageBreakDuration: totalBreaks > 0 ? Math.round(totalBreakMinutes / totalBreaks) : 0
        },
        officeHours: {
          expectedWorkHours,
          expectedBreakHours,
          expectedTotalHours,
          actualTotalHours: parseFloat((totalWorkHours + totalBreakHours).toFixed(2)),
          overallCompliance: parseFloat(overallCompliance.toFixed(1)),
          hoursDeficit: Math.max(0, expectedWorkHours - totalWorkHours),
          excessBreakHours: Math.max(0, totalBreakHours - expectedBreakHours)
        },
        projectBreakdown: timeEntries.reduce((acc, entry) => {
          const projectName = entry.task?.Project?.name || 'Unknown Project';
          const taskTitle = entry.task?.title || 'Unknown Task';
          
          if (!acc[projectName]) {
            acc[projectName] = { 
              hours: 0, 
              transactions: 0, 
              tasks: {} 
            };
          }
          
          acc[projectName].hours += entry.hours || 0;
          acc[projectName].transactions += entry.transactions || 0;
          
          if (!acc[projectName].tasks[taskTitle]) {
            acc[projectName].tasks[taskTitle] = { 
              hours: 0, 
              transactions: 0 
            };
          }
          
          acc[projectName].tasks[taskTitle].hours += entry.hours || 0;
          acc[projectName].tasks[taskTitle].transactions += entry.transactions || 0;
          
          return acc;
        }, {}),
        hourlyDistribution,
        detailedTimeEntries: timeEntries.map(entry => ({
          id: entry.id,
          project: entry.task?.Project?.name || 'Unknown',
          task: entry.task?.title || 'Unknown',
          hours: entry.hours,
          transactions: entry.transactions,
          fileName: entry.fileName,
          transactionType: entry.transactionType,
          createdAt: entry.createdAt
        })),
        detailedBreaks: breaks.map(b => ({
          id: b.id,
          type: b.type,
          description: b.description,
          startTime: b.startTime,
          endTime: b.endTime,
          duration: b.duration,
          durationHours: b.duration ? parseFloat((b.duration / 60).toFixed(2)) : 0,
          isActive: b.isActive
        }))
      };
    }));

    // Calculate team summary if multiple agents
    const teamSummary = agentReports.length > 1 ? {
      totalAgents: agentReports.length,
      totalWorkHours: agentReports.reduce((sum, agent) => sum + agent.workMetrics.totalWorkHours, 0),
      totalTransactions: agentReports.reduce((sum, agent) => sum + agent.workMetrics.totalTransactions, 0),
      totalBreaks: agentReports.reduce((sum, agent) => sum + agent.breakMetrics.totalBreaks, 0),
      totalBreakHours: agentReports.reduce((sum, agent) => sum + agent.breakMetrics.totalBreakHours, 0),
      averageCompliance: agentReports.reduce((sum, agent) => sum + agent.officeHours.overallCompliance, 0) / agentReports.length,
      topPerformer: agentReports.reduce((top, agent) => 
        agent.workMetrics.transactionsPerHour > (top?.workMetrics?.transactionsPerHour || 0) ? agent : top
      , null),
      complianceBreakdown: {
        fullyCompliant: agentReports.filter(agent => agent.officeHours.overallCompliance >= 90).length,
        partiallyCompliant: agentReports.filter(agent => agent.officeHours.overallCompliance >= 70 && agent.officeHours.overallCompliance < 90).length,
        nonCompliant: agentReports.filter(agent => agent.officeHours.overallCompliance < 70).length
      }
    } : null;

    res.json({
      date: dateStr,
      agentReports,
      teamSummary
    });

  } catch (error) {
    console.error('Agent-wise daily report error:', error);
    res.status(500).json({ message: 'Error fetching agent-wise daily report' });
  }
});

module.exports = router;
