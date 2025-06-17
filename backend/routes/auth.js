const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models');
const { auth, authorize } = require('../middleware/auth');
console.log(auth);
// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    console.log('Registration attempt:', { name, email, role });

    // Validate role
    const validRoles = ['admin', 'project_manager', 'team_member'];
    if (role && !validRoles.includes(role)) {
      console.log('Invalid role:', role);
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    // Check if user already exists
    const existingUser = await db.User.findOne({ where: { email } });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    console.log('Creating new user...');
    const user = await db.User.create({
      name,
      email,
      password, // Password will be hashed by the beforeCreate hook
      role: role || 'team_member', // Use provided role or default to team_member
    });

    console.log('Created user:', { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      hashedPassword: user.password 
    });

    // Create token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email });

    // Check if user exists
    const user = await db.User.findOne({ where: { email } });
    if (!user) {
      console.log('User not found:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('Found user:', { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    });

    // Verify password using the model's method
    console.log('Attempting password validation...');
    const isMatch = await user.validatePassword(password);
    console.log('Password validation result:', isMatch);

    if (!isMatch) {
      console.log('Password mismatch for user:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Login successful, generated token');

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new user (admin only)
router.post('/users', auth, authorize(['admin']), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    console.log('Create user attempt:', { name, email, role });

    // Validate role
    const validRoles = ['project_manager', 'team_member'];
    if (!validRoles.includes(role)) {
      console.log('Invalid role:', role);
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    // Check if user already exists
    const existingUser = await db.User.findOne({ where: { email } });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    console.log('Creating new user...');
    const user = await db.User.create({
      name,
      email,
      password,
      role,
    });

    console.log('Created user:', { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    });

    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await db.User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// List all users (admin only)
router.get('/users', auth, authorize(['admin']), async (req, res) => {
  try {
    const users = await db.User.findAll({
      attributes: { exclude: ['password'] }
    });
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 