const express = require('express');
const { Task, Project, User } = require('../models');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all tasks (admin, project_manager, and team_leader)
router.get('/', auth, authorize(['admin', 'project_manager', 'team_leader']), async (req, res) => {
  try {
    const tasks = await Task.findAll({
      include: [
        {
          model: Project,
          attributes: ['id', 'name'],
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });
    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Error fetching tasks.' });
  }
});

// Get tasks for a specific project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const tasks = await Task.findAll({
      where: { projectId: req.params.projectId },
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });
    res.json(tasks);
  } catch (error) {
    console.error('Get project tasks error:', error);
    res.status(500).json({ message: 'Error fetching project tasks.' });
  }
});

// Get tasks assigned to current user
router.get('/my-tasks', auth, async (req, res) => {
  try {
    const tasks = await Task.findAll({
      where: { assignedTo: req.user.id },
      include: [
        {
          model: Project,
          attributes: ['id', 'name'],
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });
    res.json(tasks);
  } catch (error) {
    console.error('Get my tasks error:', error);
    res.status(500).json({ message: 'Error fetching your tasks.' });
  }
});

// Create new task (admin, project_manager, and team_leader)
router.post('/', auth, authorize(['admin', 'project_manager', 'team_leader']), async (req, res) => {
  try {
    const {
      title,
      description,
      projectId,
      assignedTo,
      priority,
      estimatedHours,
      estimatedTransactions,
      transactionType,
      deadline,
    } = req.body;

    const task = await Task.create({
      title,
      description,
      projectId,
      assignedTo: assignedTo || null,
      priority,
      estimatedHours,
      estimatedTransactions,
      transactionType,
      deadline,
    });

    const createdTask = await Task.findByPk(task.id, {
      include: [
        {
          model: Project,
          attributes: ['id', 'name'],
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    res.status(201).json(createdTask);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Error creating task.' });
  }
});

// Update task (admin, project_manager, and team_leader)
router.put('/:id', auth, authorize(['admin', 'project_manager', 'team_leader', 'team_member']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      projectId,
      assignedTo,
      status,
      priority,
      estimatedHours,
      estimatedTransactions,
      transactionType,
      deadline,
    } = req.body;

    const task = await Task.findByPk(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    await task.update({
      title,
      description,
      projectId,
      assignedTo: assignedTo || null,
      status,
      priority,
      estimatedHours,
      estimatedTransactions,
      transactionType,
      deadline,
    });

    const updatedTask = await Task.findByPk(id, {
      include: [
        {
          model: Project,
          attributes: ['id', 'name'],
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    res.json(updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Error updating task.' });
  }
});

// Delete task (admin, project_manager, and team_leader)
router.delete('/:id', auth, authorize(['admin', 'project_manager', 'team_leader']), async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findByPk(id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    await task.destroy();
    res.json({ message: 'Task deleted successfully.' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Error deleting task.' });
  }
});

module.exports = router; 