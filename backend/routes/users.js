const express = require('express');
const { User } = require('../models');
const { auth, authorize } = require('../middleware/auth');
const db = require('../models');

const router = express.Router();

// Get all users (admin and project managers can view for assignment purposes)
router.get('/', auth, authorize(['admin', 'project_manager', 'team_leader']), async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'isActive'],
      order: [['createdAt', 'DESC']],
    });
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Error fetching users.' });
  }
});

// Create new user (admin, project managers, and team leaders)
router.post('/', auth, authorize(['admin', 'project_manager', 'team_leader']), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    
    // Project managers and team leaders cannot create admin users
    if ((req.user.role === 'project_manager' || req.user.role === 'team_leader') && role === 'admin') {
      return res.status(403).json({ message: 'Project managers and team leaders cannot create admin users.' });
    }
    
    const user = await User.create({
      name,
      email,
      password,
      role,
    });
    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error('Create user error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Email already exists.' });
    }
    res.status(500).json({ message: 'Error creating user.' });
  }
});

// Update user (admin, project managers, and team leaders)
router.put('/:id', auth, authorize(['admin', 'project_manager', 'team_leader']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, isActive } = req.body;
    
    if (!name || !email || !role) {
      return res.status(400).json({ message: 'Name, email, and role are required.' });
    }
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Project managers and team leaders cannot update admin users or change users to admin role
    if (req.user.role === 'project_manager' || req.user.role === 'team_leader') {
      if (user.role === 'admin') {
        return res.status(403).json({ message: 'Project managers and team leaders cannot modify admin users.' });
      }
      if (role === 'admin') {
        return res.status(403).json({ message: 'Project managers and team leaders cannot assign admin role.' });
      }
    }

    // Prepare update data
    const updateData = {
      name,
      role,
      isActive: isActive !== undefined ? isActive : user.isActive,
    };

    // Only update email if it's different (to avoid unique constraint issues)
    if (email !== user.email) {
      updateData.email = email;
    }

    // Only update password if provided
    if (password && password.trim() !== '') {
      updateData.password = password;
    }

    await user.update(updateData);

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    });
  } catch (error) {
    console.error('Update user error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Email already exists.' });
    }
    res.status(500).json({ message: 'Error updating user.' });
  }
});

// Delete user (admin, project managers, and team leaders)
router.delete('/:id', auth, authorize(['admin', 'project_manager', 'team_leader']), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent users from deleting themselves
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account.' });
    }
    
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Project managers and team leaders cannot delete admin users
    if ((req.user.role === 'project_manager' || req.user.role === 'team_leader') && user.role === 'admin') {
      return res.status(403).json({ message: 'Project managers and team leaders cannot delete admin users.' });
    }

    // Check if user is admin - prevent deleting other admins (for admin users)
    if (req.user.role === 'admin' && user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete admin users.' });
    }

    // Hard delete the user
    await user.destroy();
    res.json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Error deleting user.' });
  }
});

// List all users (admin only) - Alternative endpoint for user management
router.get('/all', auth, authorize(['admin']), async (req, res) => {
  try {
    const users = await db.User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
    });
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 