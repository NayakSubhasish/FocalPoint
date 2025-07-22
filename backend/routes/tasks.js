const express = require('express');
const { Task, Project, User } = require('../models');
const { auth, authorize } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// Get all tasks (admin, project_manager, and team_leader)
router.get('/', auth, authorize(['admin', 'project_manager', 'team_leader']), async (req, res) => {
  try {
    const tasks = await Task.findAll({
      include: [
        {
          model: Project,
          attributes: ['id', 'name', 'description', 'status'],
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: User,
          as: 'assignees',
          attributes: ['id', 'name', 'email'],
          through: { attributes: [] },
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
          model: Project,
          attributes: ['id', 'name', 'description', 'status'],
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: User,
          as: 'assignees',
          attributes: ['id', 'name', 'email'],
          through: { attributes: [] },
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
    console.error('Get project tasks error:', error);
    res.status(500).json({ message: 'Error fetching project tasks.' });
  }
});

// Get tasks assigned to current user
router.get('/my-tasks', auth, async (req, res) => {
  try {
    // First fetch tasks that may be relevant
    const tasks = await Task.findAll({
      include: [
        {
          model: Project,
          attributes: ['id', 'name', 'description', 'status'],
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: User,
          as: 'assignees',
          attributes: ['id', 'name', 'email'],
          through: { attributes: [] },
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    // Filter tasks that have the current user either as primary assignee or in assignees list
    const userTasks = tasks.filter(task => task.assignedTo === req.user.id || (task.assignees && task.assignees.some(u => u.id === req.user.id)));
    res.json(userTasks);
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
      assignedTo, // Expect an array of userIds
      priority,
      estimatedHours,
      estimatedTransactions,
      transactionType,
      deadline,
      ownerId, // optional only used by admin/pm
    } = req.body;

    const assigneeIds = Array.isArray(assignedTo) ? assignedTo : (assignedTo ? [assignedTo] : []);
    const primaryAssigneeId = assigneeIds.length ? assigneeIds[0] : null;

    const task = await Task.create({
      title,
      description,
      projectId,
      assignedTo: primaryAssigneeId,
      ownerId: req.user.id,
      priority,
      estimatedHours,
      estimatedTransactions,
      transactionType,
      deadline,
    });

    if (assigneeIds.length) {
      await task.setAssignees(assigneeIds);
    }

    const createdTask = await Task.findByPk(task.id, {
      include: [
        {
          model: Project,
          attributes: ['id', 'name', 'description', 'status'],
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: User,
          as: 'assignees',
          attributes: ['id', 'name', 'email'],
          through: { attributes: [] },
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

// Update task (admin, project_manager, team_leader, team_member)
router.put('/:id', auth, authorize(['admin', 'project_manager', 'team_leader', 'team_member']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      projectId,
      assignedTo, // May be array or single value
      status,
      priority,
      estimatedHours,
      estimatedTransactions,
      transactionType,
      deadline,
      ownerId, // optional
    } = req.body;

    const task = await Task.findByPk(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    const assigneeIds = Array.isArray(assignedTo) ? assignedTo : (assignedTo ? [assignedTo] : []);
    const primaryAssigneeId = assigneeIds.length ? assigneeIds[0] : null;

    const updates = {
      title,
      description,
      projectId,
      assignedTo: primaryAssigneeId,
      status,
      priority,
      estimatedHours,
      estimatedTransactions,
      transactionType,
      deadline,
    };

    if (typeof ownerId !== 'undefined') {
      if (!['admin','project_manager'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Not authorized to change task owner.' });
      }
      updates.ownerId = ownerId;
    }

    await task.update(updates);

    // Update many-to-many relationship
    await task.setAssignees(assigneeIds);

    const updatedTask = await Task.findByPk(id, {
      include: [
        {
          model: Project,
          attributes: ['id', 'name', 'description', 'status'],
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: User,
          as: 'assignees',
          attributes: ['id', 'name', 'email'],
          through: { attributes: [] },
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