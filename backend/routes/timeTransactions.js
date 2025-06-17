const express = require('express');
const { TimeEntry, Task, User, ProjectTeam } = require('../models');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get time entries (with role-based access)
router.get('/', auth, async (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user.id;
    let where = {};
    // Admins and project managers see all entries
    if (role === 'admin' || role === 'project_manager') {
      // no filter
    } else if (role === 'team_leader') {
      // find projects where user is lead
      const leadProjects = await ProjectTeam.findAll({ where: { userId, role: 'lead' } });
      const projectIds = leadProjects.map(pt => pt.projectId);
      // find member userIds in those projects
      const members = await ProjectTeam.findAll({ where: { projectId: projectIds, role: 'member' } });
      const memberIds = [...new Set(members.map(pt => pt.userId))];
      where.userId = [userId, ...memberIds];
    } else {
      // team_member sees only own entries
      where.userId = userId;
    }
    const entries = await TimeEntry.findAll({
      where,
      include: [
        { model: Task, as: 'task', attributes: ['id', 'title'] },
        { model: User, as: 'user', attributes: ['id', 'name'] },
      ],
      order: [['date', 'DESC']],
    });
    res.json(entries);
  } catch (error) {
    console.error('Get time entries error:', error);
    res.status(500).json({ message: 'Error fetching time entries.' });
  }
});

// Create a new time entry
router.post('/', auth, async (req, res) => {
  console.log('TimeTransactions POST body:', req.body);
  try {
    const { taskId, hours, transactions, transactionType, date } = req.body;
    if (!taskId) {
      return res.status(400).json({ message: 'taskId is required.' });
    }
    const entry = await TimeEntry.create({
      userId: req.user.id,
      taskId,
      hours: hours || 0,
      transactions: transactions || 0,
      transactionType,
      date: date || new Date(),
    });
    console.log('Created TimeEntry:', entry.toJSON());
    const fullEntry = await TimeEntry.findByPk(entry.id, {
      include: [
        { model: Task, as: 'task', attributes: ['id', 'title'] },
      ],
    });
    res.status(201).json(fullEntry);
  } catch (error) {
    console.error('Create time entry error:', error);
    res.status(500).json({ message: 'Error creating time entry.' });
  }
});

// Update a time entry
router.put('/:id', auth, async (req, res) => {
  try {
    const entry = await TimeEntry.findByPk(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Time entry not found.' });
    const role = req.user.role;
    const userId = req.user.id;
    let allowed = false;
    if (role === 'admin' || role === 'project_manager') {
      allowed = true;
    } else if (role === 'team_leader') {
      // team leader can update own or team members'
      const leadProjects = await ProjectTeam.findAll({ where: { userId, role: 'lead' } });
      const projectIds = leadProjects.map(pt => pt.projectId);
      const members = await ProjectTeam.findAll({ where: { projectId: projectIds, role: 'member' } });
      const memberIds = members.map(pt => pt.userId);
      if (entry.userId === userId || memberIds.includes(entry.userId)) allowed = true;
    } else {
      // team_member can update own only
      if (entry.userId === userId) allowed = true;
    }
    if (!allowed) return res.status(403).json({ message: 'Forbidden' });
    const { taskId, hours, transactions, transactionType, date } = req.body;
    await entry.update({ taskId, hours, transactions, transactionType, date });
    const updated = await TimeEntry.findByPk(req.params.id, {
      include: [
        { model: Task, as: 'task', attributes: ['id', 'title'] },
        { model: User, as: 'user', attributes: ['id', 'name'] },
      ],
    });
    res.json(updated);
  } catch (error) {
    console.error('Update time entry error:', error);
    res.status(500).json({ message: 'Error updating time entry.' });
  }
});

// Delete a time entry
router.delete('/:id', auth, async (req, res) => {
  try {
    const entry = await TimeEntry.findByPk(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Time entry not found.' });
    const role = req.user.role;
    const userId = req.user.id;
    let allowed = false;
    if (role === 'admin' || role === 'project_manager') {
      allowed = true;
    } else if (role === 'team_leader') {
      const leadProjects = await ProjectTeam.findAll({ where: { userId, role: 'lead' } });
      const projectIds = leadProjects.map(pt => pt.projectId);
      const members = await ProjectTeam.findAll({ where: { projectId: projectIds, role: 'member' } });
      const memberIds = members.map(pt => pt.userId);
      if (entry.userId === userId || memberIds.includes(entry.userId)) allowed = true;
    } else {
      if (entry.userId === userId) allowed = true;
    }
    if (!allowed) return res.status(403).json({ message: 'Forbidden' });
    await entry.destroy();
    res.json({ message: 'Time entry deleted successfully.' });
  } catch (error) {
    console.error('Delete time entry error:', error);
    res.status(500).json({ message: 'Error deleting time entry.' });
  }
});

module.exports = router; 