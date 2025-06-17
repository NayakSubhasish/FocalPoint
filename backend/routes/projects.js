const express = require('express');
const { Project, User, Task, ProjectTeam } = require('../models');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Test route to check if basic functionality works
router.get('/test', (req, res) => {
  res.json({ message: 'Projects route is working', timestamp: new Date() });
});

// Get all projects
router.get('/', auth, authorize(['admin', 'project_manager', 'team_leader', 'team_member']), async (req, res) => {
  try {
    console.log('Fetching projects...');
    const projects = await Project.findAll({
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
        {
          model: User,
          as: 'teamLeader',
          attributes: ['id', 'name'],
          required: false,
        },
        {
          model: User,
          as: 'teamMembers',
          attributes: ['id', 'name'],
          through: { attributes: ['role'] },
        },
      ],
    });
    console.log('Projects found:', projects.length);
    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get project by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
        {
          model: User,
          as: 'teamLeader',
          attributes: ['id', 'name'],
          required: false,
        },
        {
          model: User,
          as: 'teamMembers',
          attributes: ['id', 'name'],
          through: { attributes: ['role'] },
        },
      ],
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Error fetching project.', error: error.message });
  }
});

// Create project
router.post('/', auth, authorize(['admin', 'project_manager', 'team_leader']), async (req, res) => {
  try {
    const { name, description, startDate, endDate, billingMethod, estimatedHours, estimatedTransactions, managerId, teamLeaderId, teamMemberIds } = req.body;
    
    if (!name || !description) {
      return res.status(400).json({ message: 'Name and description are required' });
    }
    
    // Use the current user as manager if no managerId provided
    const finalManagerId = managerId || req.user.id;
    
    const project = await Project.create({
      name,
      description,
      startDate: startDate || null,
      endDate: endDate || null,
      billingMethod: billingMethod || 'hourly',
      estimatedHours: estimatedHours || 0,
      estimatedTransactions: estimatedTransactions || 0,
      managerId: finalManagerId,
      teamLeaderId: teamLeaderId || null,
      status: 'planning'
    });

    // Associate team leader and members
    if (teamLeaderId) {
      await ProjectTeam.create({ projectId: project.id, userId: teamLeaderId, role: 'lead' });
    }
    if (Array.isArray(teamMemberIds) && teamMemberIds.length) {
      const members = teamMemberIds.filter(id => id !== teamLeaderId);
      if (members.length) {
        await ProjectTeam.bulkCreate(
          members.map(id => ({ projectId: project.id, userId: id, role: 'member' }))
        );
      }
    }

    const createdProject = await Project.findByPk(project.id, {
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
        {
          model: User,
          as: 'teamLeader',
          attributes: ['id', 'name'],
          required: false,
        },
        {
          model: User,
          as: 'teamMembers',
          attributes: ['id', 'name'],
          through: { attributes: ['role'] },
        },
      ],
    });

    res.status(201).json(createdProject);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update project
router.put('/:id', auth, authorize(['admin', 'project_manager', 'team_leader']), async (req, res) => {
  try {
    console.log('Update project body:', req.body);
    const { id } = req.params;
    const { name, description, startDate, endDate, billingMethod, estimatedHours, estimatedTransactions, managerId, status, teamLeaderId, teamMemberIds } = req.body;
    
    if (!name || !description) {
      return res.status(400).json({ message: 'Name and description are required' });
    }
    
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Use current managerId if no new one provided
    const finalManagerId = managerId || project.managerId;

    await project.update({
      name,
      description,
      startDate: startDate || null,
      endDate: endDate || null,
      billingMethod: billingMethod || 'hourly',
      estimatedHours: estimatedHours || 0,
      estimatedTransactions: estimatedTransactions || 0,
      managerId: finalManagerId,
      teamLeaderId: teamLeaderId || project.teamLeaderId,
      status: status || project.status
    });

    // Update team associations
    await ProjectTeam.destroy({ where: { projectId: id } });
    if (teamLeaderId) {
      await ProjectTeam.create({ projectId: id, userId: teamLeaderId, role: 'lead' });
    }
    if (Array.isArray(teamMemberIds) && teamMemberIds.length) {
      const members = teamMemberIds.filter(uid => uid !== teamLeaderId);
      if (members.length) {
        await ProjectTeam.bulkCreate(
          members.map(uid => ({ projectId: id, userId: uid, role: 'member' }))
        );
      }
    }

    const updatedProject = await Project.findByPk(id, {
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
        {
          model: User,
          as: 'teamLeader',
          attributes: ['id', 'name'],
          required: false,
        },
        {
          model: User,
          as: 'teamMembers',
          attributes: ['id', 'name'],
          through: { attributes: ['role'] },
        },
      ],
    });

    res.json(updatedProject);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete project
router.delete('/:id', auth, authorize(['admin', 'project_manager', 'team_leader']), async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findByPk(id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    await project.destroy();
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 