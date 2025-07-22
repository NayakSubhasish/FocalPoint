const express = require('express');
const { User, Project, Task, TimeEntry, sequelize } = require('../models');
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

module.exports = router;
