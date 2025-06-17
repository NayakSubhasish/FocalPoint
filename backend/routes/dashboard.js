const express = require('express');
const { User, Project, Task, sequelize } = require('../models');
const { auth, authorize } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// Extract dateRange from query for filtering
function getDateFilter(query) {
  const { startDate, endDate } = query;
  if (startDate && endDate) {
    return { createdAt: { [Op.between]: [new Date(startDate), new Date(endDate)] } };
  }
  return {};
}

// Get dashboard statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = {};
    const dateFilter = getDateFilter(req.query);
    
    // Total counts
    stats.totalUsers = await User.count();
    stats.totalProjects = await Project.count({ where: dateFilter });
    stats.totalTasks = await Task.count({ where: dateFilter });
    
    // Project status breakdown
    const projectStatuses = await Project.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('status')), 'count']
      ],
      where: dateFilter,
      group: ['status'],
      raw: true
    });
    
    stats.projectsByStatus = projectStatuses.reduce((acc, item) => {
      acc[item.status] = parseInt(item.count);
      return acc;
    }, {});
    
    // Task status breakdown
    const taskStatuses = await Task.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('status')), 'count']
      ],
      where: dateFilter,
      group: ['status'],
      raw: true
    });
    
    stats.tasksByStatus = taskStatuses.reduce((acc, item) => {
      acc[item.status] = parseInt(item.count);
      return acc;
    }, {});
    
    // Set default values for removed time tracking
    stats.totalHours = 0;
    stats.weeklyHours = 0;
    stats.transactions = 0;
    
    res.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Error fetching dashboard statistics' });
  }
});

// Get recent activities (simplified without time logs)
router.get('/activities', auth, async (req, res) => {
  try {
    const activities = [];
    
    // Recent projects
    const recentProjects = await Project.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['name']
        }
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
    
    // Recent tasks
    const recentTasks = await Task.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Project,
          attributes: ['name']
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['name']
        }
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
    
    // Sort activities by timestamp
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json(activities.slice(0, 10));
  } catch (error) {
    console.error('Dashboard activities error:', error);
    res.status(500).json({ message: 'Error fetching recent activities' });
  }
});

// Reports endpoints
// Tasks by Status
router.get('/reports/tasks-by-status', auth, async (req, res) => {
  try {
    const dateFilter = getDateFilter(req.query);
    const data = await Task.findAll({
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('status')), 'count']],
      where: dateFilter,
      group: ['status'],
      raw: true,
    });
    res.json(data.map(item => ({ status: item.status, count: parseInt(item.count) })));
  } catch (error) {
    console.error('Tasks by status report error:', error);
    res.status(500).json({ message: 'Error fetching tasks by status' });
  }
});
// Tasks by Priority
router.get('/reports/tasks-by-priority', auth, async (req, res) => {
  try {
    const dateFilter = getDateFilter(req.query);
    const data = await Task.findAll({
      attributes: ['priority', [sequelize.fn('COUNT', sequelize.col('priority')), 'count']],
      where: dateFilter,
      group: ['priority'],
      raw: true,
    });
    res.json(data.map(item => ({ priority: item.priority, count: parseInt(item.count) })));
  } catch (error) {
    console.error('Tasks by priority report error:', error);
    res.status(500).json({ message: 'Error fetching tasks by priority' });
  }
});
// Transactions per Task
router.get('/reports/transactions-by-task', auth, async (req, res) => {
  try {
    const dateFilter = getDateFilter(req.query);
    const data = await Task.findAll({
      attributes: ['title', [sequelize.fn('SUM', sequelize.col('estimatedTransactions')), 'transactions']],
      where: dateFilter,
      group: ['title'],
      raw: true,
    });
    res.json(data.map(item => ({ title: item.title, transactions: parseInt(item.transactions) })));
  } catch (error) {
    console.error('Transactions by task report error:', error);
    res.status(500).json({ message: 'Error fetching transactions by task' });
  }
});
// User Workload (tasks count per user)
router.get('/reports/user-workload', auth, async (req, res) => {
  try {
    const dateFilter = getDateFilter(req.query);
    const data = await Task.findAll({
      attributes: ['assignedTo', [sequelize.fn('COUNT', sequelize.col('assignedTo')), 'count']],
      where: { ...dateFilter, assignedTo: { [Op.ne]: null } },
      include: [{ model: User, as: 'assignee', attributes: ['name'] }],
      group: ['assignedTo', 'assignee.name'],
      raw: true,
    });
    res.json(data.map(item => ({ user: item['assignee.name'], count: parseInt(item.count) })));
  } catch (error) {
    console.error('User workload report error:', error);
    res.status(500).json({ message: 'Error fetching user workload' });
  }
});

// Time Series: Tasks Over Time
router.get('/series/tasks-over-time', auth, async (req, res) => {
  try {
    const dateFilter = getDateFilter(req.query);
    const data = await Task.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      where: dateFilter,
      group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
      raw: true,
    });
    res.json(data.map(item => ({ date: item.date, count: parseInt(item.count) })));
  } catch (error) {
    console.error('Tasks over time report error:', error);
    res.status(500).json({ message: 'Error fetching tasks over time' });
  }
});

module.exports = router; 