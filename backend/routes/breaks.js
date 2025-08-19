const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const db = require('../models');

// Debug route to check if breaks router is loaded
router.get('/debug', (req, res) => {
  res.json({ 
    message: 'Breaks router is working', 
    timestamp: new Date().toISOString(),
    availableRoutes: ['/', '/all', '/:id', '/start', '/end', '/debug']
  });
});

// Get all breaks for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const breaks = await db.Break.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(breaks);
  } catch (error) {
    console.error('Error fetching breaks:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all breaks for admins, project managers, and team leaders
router.get('/all', auth, async (req, res) => {
  try {
    console.log('User role:', req.user.role);
    console.log('User ID:', req.user.id);
    
    // Check if user has appropriate role
    if (!['admin', 'project_manager', 'team_leader'].includes(req.user.role)) {
      console.log('Access denied for role:', req.user.role);
      return res.status(403).json({ message: 'Access denied. Admin, Project Manager, or Team Leader only.' });
    }
    
    console.log('Fetching all breaks...');
    const breaks = await db.Break.findAll({
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
    
    console.log('Found breaks:', breaks.length);
    res.json(breaks);
  } catch (error) {
    console.error('Error fetching all breaks:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Get a specific break by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const breakItem = await db.Break.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      },
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });
    
    if (!breakItem) {
      return res.status(404).json({ message: 'Break not found' });
    }
    
    res.json(breakItem);
  } catch (error) {
    console.error('Error fetching break:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Start a new break
router.post('/start', auth, async (req, res) => {
  try {
    const { userId, type, description } = req.body;
    
    // Determine which user ID to use
    let targetUserId = req.user.id;
    if (userId && ['admin', 'project_manager', 'team_leader'].includes(req.user.role)) {
      // Admin, project managers, and team leaders can start breaks for other users
      targetUserId = userId;
    } else if (userId && !['admin', 'project_manager', 'team_leader'].includes(req.user.role)) {
      // Other users can only start breaks for themselves
      return res.status(403).json({ message: 'You can only start breaks for yourself' });
    }
    
    // Check if user already has an active break
    const activeBreak = await db.Break.findOne({
      where: { 
        userId: targetUserId,
        isActive: true 
      },
    });
    
    if (activeBreak) {
      return res.status(400).json({ message: 'This user already has an active break' });
    }
    
    const newBreak = await db.Break.create({
      userId: targetUserId,
      type: type || 'other',
      description: description || '',
      startTime: new Date(),
      isActive: true,
    });
    
    const breakWithUser = await db.Break.findOne({
      where: { id: newBreak.id },
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });
    
    res.status(201).json(breakWithUser);
  } catch (error) {
    console.error('Error starting break:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// End an active break
router.put('/:id/end', auth, async (req, res) => {
  try {
    const breakItem = await db.Break.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id,
        isActive: true 
      },
    });
    
    if (!breakItem) {
      return res.status(404).json({ message: 'Active break not found' });
    }
    
    const endTime = new Date();
    const startTime = new Date(breakItem.startTime);
    const duration = Math.round((endTime - startTime) / (1000 * 60)); // Duration in minutes
    
    await breakItem.update({
      endTime: endTime,
      duration: duration,
      isActive: false,
    });
    
    const updatedBreak = await db.Break.findOne({
      where: { id: breakItem.id },
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });
    
    res.json(updatedBreak);
  } catch (error) {
    console.error('Error ending break:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create a new break (manual entry)
router.post('/', auth, async (req, res) => {
  try {
    const { userId, type, description, startTime, endTime } = req.body;
    
    console.log('Creating break - User role:', req.user.role);
    console.log('Creating break - User ID:', req.user.id);
    console.log('Creating break - Request userId:', userId);
    console.log('Creating break - Request body:', req.body);
    
    // Validate required fields
    if (!type || !startTime) {
      return res.status(400).json({ message: 'Type and start time are required' });
    }
    
    // Determine which user ID to use
    let targetUserId = req.user.id;
    console.log('Target user ID before logic:', targetUserId);
    console.log('Request userId:', userId);
    console.log('Request userId type:', typeof userId);
    console.log('Current user ID:', req.user.id);
    console.log('Current user ID type:', typeof req.user.id);
    
    // Convert userId to number if it's a string
    const numericUserId = userId ? parseInt(userId) : null;
    console.log('Numeric userId:', numericUserId);
    
    if (userId && ['admin', 'project_manager', 'team_leader'].includes(req.user.role)) {
      // Admin, project managers, and team leaders can create breaks for other users
      targetUserId = userId;
      console.log('Admin/PM/TL creating break for user:', targetUserId);
    } else if (!['admin', 'project_manager', 'team_leader'].includes(req.user.role)) {
      // Team members can only create breaks for themselves - always use their own ID
      targetUserId = req.user.id;
      console.log('Team member creating break for themselves:', targetUserId);
    } else {
      console.log('No userId provided, using current user ID:', targetUserId);
    }
    
    // Calculate duration if end time is provided
    let duration = null;
    let isActive = true;
    
    if (endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      duration = Math.round((end - start) / (1000 * 60));
      isActive = false;
    }
    
    const newBreak = await db.Break.create({
      userId: targetUserId,
      type,
      description: description || '',
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : null,
      duration,
      isActive,
    });
    
    const breakWithUser = await db.Break.findOne({
      where: { id: newBreak.id },
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });
    
    res.status(201).json(breakWithUser);
  } catch (error) {
    console.error('Error creating break:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update a break
router.put('/:id', auth, async (req, res) => {
  try {
    const { userId, type, description, startTime, endTime } = req.body;
    
    // Team members cannot edit breaks
    if (req.user.role === 'team_member') {
      return res.status(403).json({ message: 'Team members cannot edit breaks. Please contact your manager.' });
    }
    
    // Find the break item
    let breakItem;
    if (['admin', 'project_manager', 'team_leader'].includes(req.user.role)) {
      // Admin, project managers, and team leaders can edit any break
      breakItem = await db.Break.findByPk(req.params.id);
    } else {
      // Other users can only edit their own breaks
      breakItem = await db.Break.findOne({
        where: { 
          id: req.params.id,
          userId: req.user.id 
        },
      });
    }
    
    if (!breakItem) {
      return res.status(404).json({ message: 'Break not found' });
    }
    
    // Determine which user ID to use for updates
    let targetUserId = breakItem.userId;
    if (userId && ['admin', 'project_manager', 'team_leader'].includes(req.user.role)) {
      // Admin, project managers, and team leaders can change the user for the break
      targetUserId = userId;
    } else if (userId && !['admin', 'project_manager', 'team_leader'].includes(req.user.role)) {
      // Other users cannot change the user
      return res.status(403).json({ message: 'You cannot change the employee for this break' });
    }
    
    // Calculate duration if both start and end times are provided
    let duration = breakItem.duration;
    let isActive = breakItem.isActive;
    
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      duration = Math.round((end - start) / (1000 * 60));
      isActive = false;
    } else if (startTime && !endTime) {
      isActive = true;
    }
    
    await breakItem.update({
      userId: targetUserId,
      type: type || breakItem.type,
      description: description !== undefined ? description : breakItem.description,
      startTime: startTime ? new Date(startTime) : breakItem.startTime,
      endTime: endTime ? new Date(endTime) : breakItem.endTime,
      duration,
      isActive,
    });
    
    const updatedBreak = await db.Break.findOne({
      where: { id: breakItem.id },
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });
    
    res.json(updatedBreak);
  } catch (error) {
    console.error('Error updating break:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete a break
router.delete('/:id', auth, async (req, res) => {
  try {
    // Team members cannot delete breaks
    if (req.user.role === 'team_member') {
      return res.status(403).json({ message: 'Team members cannot delete breaks. Please contact your manager.' });
    }
    
    let breakItem;
    if (['admin', 'project_manager', 'team_leader'].includes(req.user.role)) {
      // Admin, project managers, and team leaders can delete any break
      breakItem = await db.Break.findByPk(req.params.id);
    } else {
      // Other users can only delete their own breaks
      breakItem = await db.Break.findOne({
        where: { 
          id: req.params.id,
          userId: req.user.id 
        },
      });
    }
    
    if (!breakItem) {
      return res.status(404).json({ message: 'Break not found' });
    }
    
    await breakItem.destroy();
    res.json({ message: 'Break deleted successfully' });
  } catch (error) {
    console.error('Error deleting break:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get break statistics for the user
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let whereClause = { userId: req.user.id };
    
    if (startDate && endDate) {
      whereClause.createdAt = {
        [db.Sequelize.Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }
    
    const breaks = await db.Break.findAll({
      where: whereClause,
      attributes: ['type', 'duration', 'createdAt'],
    });
    
    // Calculate statistics
    const totalBreaks = breaks.length;
    const totalDuration = breaks.reduce((sum, breakItem) => sum + (breakItem.duration || 0), 0);
    const averageDuration = totalBreaks > 0 ? Math.round(totalDuration / totalBreaks) : 0;
    
    // Group by type
    const breaksByType = breaks.reduce((acc, breakItem) => {
      const type = breakItem.type;
      if (!acc[type]) {
        acc[type] = { count: 0, duration: 0 };
      }
      acc[type].count++;
      acc[type].duration += breakItem.duration || 0;
      return acc;
    }, {});
    
    res.json({
      totalBreaks,
      totalDuration,
      averageDuration,
      breaksByType,
    });
  } catch (error) {
    console.error('Error fetching break statistics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
