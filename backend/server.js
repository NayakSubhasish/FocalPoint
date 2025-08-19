const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();

// IMMEDIATE TEST ROUTE - NO DEPENDENCIES
app.get('/api/simple-test', (req, res) => {
  res.json({ 
    message: 'SIMPLE TEST WORKING', 
    timestamp: new Date().toISOString(),
    url: req.url,
    method: req.method
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Backend server root', 
    timestamp: new Date().toISOString()
  });
});

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// Initialize database connection
console.log('Initializing database connection...');
const db = require('./models');
console.log('Database models loaded:', Object.keys(db));
console.log('Break model available:', !!db.Break);

// Debug route to check if server is working
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes with debugging
console.log('Loading routes...');
try {
  app.use('/api/auth', require('./routes/auth'));
  console.log('✓ Auth routes loaded');
} catch (error) {
  console.error('✗ Error loading auth routes:', error.message);
}

try {
  app.use('/api/dashboard', require('./routes/dashboard'));
  console.log('✓ Dashboard routes loaded');
} catch (error) {
  console.error('✗ Error loading dashboard routes:', error.message);
}

try {
  app.use('/api/projects', require('./routes/projects'));
  console.log('✓ Projects routes loaded');
} catch (error) {
  console.error('✗ Error loading projects routes:', error.message);
}

try {
  app.use('/api/users', require('./routes/users'));
  console.log('✓ Users routes loaded');
} catch (error) {
  console.error('✗ Error loading users routes:', error.message);
}

try {
  app.use('/api/tasks', require('./routes/tasks'));
  console.log('✓ Tasks routes loaded');
} catch (error) {
  console.error('✗ Error loading tasks routes:', error.message);
}

try {
  app.use('/api/time-transactions', require('./routes/timeTransactions'));
  console.log('✓ Time transactions routes loaded');
} catch (error) {
  console.error('✗ Error loading time transactions routes:', error.message);
}

try {
  const breaksRouter = require('./routes/breaks');
  console.log('Breaks router type:', typeof breaksRouter);
  console.log('Breaks router stack length:', breaksRouter.stack ? breaksRouter.stack.length : 'no stack');
  app.use('/api/breaks', breaksRouter);
  console.log('✓ Breaks routes loaded successfully');
} catch (error) {
  console.error('✗ Error loading breaks routes:', error.message);
  console.error('✗ Error stack:', error.stack);
}

console.log('All routes loading complete.');

// Test route to verify server is working
app.get('/api/test-server', (req, res) => {
  res.json({
    message: 'Server is working correctly',
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl
  });
});

// Direct test route to mimic breaks functionality
app.get('/api/test-breaks-direct', (req, res) => {
  res.json({
    message: 'Direct breaks test route working',
    timestamp: new Date().toISOString(),
    note: 'This bypasses the breaks router to test server functionality'
  });
});

// Test POST route to mimic breaks POST
app.post('/api/test-breaks-post', (req, res) => {
  res.json({
    message: 'Direct breaks POST test working',
    timestamp: new Date().toISOString(),
    body: req.body,
    note: 'This bypasses the breaks router to test POST functionality'
  });
});

// TEMPORARY WORKAROUND: Direct breaks routes implementation
const { auth } = require('./middleware/auth');

// Get all breaks for admins, project managers, and team leaders
app.get('/api/breaks/all', auth, async (req, res) => {
  try {
    console.log('=== DIRECT BREAKS /ALL ENDPOINT CALLED ===');
    console.log('User role:', req.user.role);
    console.log('User ID:', req.user.id);
    
    // Check if user has appropriate role
    if (!['admin', 'project_manager', 'team_leader'].includes(req.user.role)) {
      console.log('Access denied for role:', req.user.role);
      return res.status(403).json({ message: 'Access denied. Admin, Project Manager, or Team Leader only.' });
    }
    
    console.log('Fetching all breaks using direct implementation...');
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
    
    console.log('Found breaks (direct):', breaks.length);
    console.log('=== DIRECT BREAKS /ALL ENDPOINT SUCCESS ===');
    res.json(breaks);
  } catch (error) {
    console.error('=== DIRECT BREAKS /ALL ENDPOINT ERROR ===');
    console.error('Error fetching all breaks (direct):', error);
    console.error('Error stack (direct):', error.stack);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Get breaks for the authenticated user
app.get('/api/breaks', auth, async (req, res) => {
  try {
    console.log('=== DIRECT BREAKS GET ENDPOINT CALLED ===');
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
    console.log('Found user breaks:', breaks.length);
    res.json(breaks);
  } catch (error) {
    console.error('Error fetching user breaks (direct):', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create a new break
app.post('/api/breaks', auth, async (req, res) => {
  try {
    console.log('=== DIRECT BREAKS POST ENDPOINT CALLED ===');
    console.log('User role:', req.user.role);
    console.log('User ID:', req.user.id);
    console.log('Request body:', req.body);
    
    const { userId, type, description, startTime, endTime, durationHours } = req.body;
    
    // Determine target user ID based on role
    let targetUserId;
    if (['admin', 'project_manager', 'team_leader'].includes(req.user.role)) {
      targetUserId = userId || req.user.id;
    } else {
      targetUserId = req.user.id; // Team members can only create breaks for themselves
    }
    
    console.log('Target user ID:', targetUserId);
    
    const breakData = {
      userId: targetUserId,
      type: type || 'break',
      description: description || '',
      startTime: startTime || new Date(),
      endTime: endTime || null,
      durationHours: durationHours || null,
      isActive: !endTime
    };
    
    console.log('Creating break with data:', breakData);
    const newBreak = await db.Break.create(breakData);
    
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
    
    console.log('=== DIRECT BREAKS POST ENDPOINT SUCCESS ===');
    res.status(201).json(breakWithUser);
  } catch (error) {
    console.error('=== DIRECT BREAKS POST ENDPOINT ERROR ===');
    console.error('Error creating break (direct):', error);
    console.error('Error stack (direct):', error.stack);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Update a break
app.put('/api/breaks/:id', auth, async (req, res) => {
  try {
    console.log('=== DIRECT BREAKS PUT ENDPOINT CALLED ===');
    const breakId = req.params.id;
    const { type, description, startTime, endTime, durationHours } = req.body;
    
    // Check permissions
    if (!['admin', 'project_manager', 'team_leader'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Cannot edit breaks.' });
    }
    
    const breakItem = await db.Break.findByPk(breakId);
    if (!breakItem) {
      return res.status(404).json({ message: 'Break not found' });
    }
    
    const updateData = {
      type: type || breakItem.type,
      description: description !== undefined ? description : breakItem.description,
      startTime: startTime || breakItem.startTime,
      endTime: endTime !== undefined ? endTime : breakItem.endTime,
      durationHours: durationHours !== undefined ? durationHours : breakItem.durationHours,
      isActive: endTime ? false : breakItem.isActive
    };
    
    await breakItem.update(updateData);
    
    const updatedBreak = await db.Break.findOne({
      where: { id: breakId },
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });
    
    console.log('=== DIRECT BREAKS PUT ENDPOINT SUCCESS ===');
    res.json(updatedBreak);
  } catch (error) {
    console.error('=== DIRECT BREAKS PUT ENDPOINT ERROR ===');
    console.error('Error updating break (direct):', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Delete a break
app.delete('/api/breaks/:id', auth, async (req, res) => {
  try {
    console.log('=== DIRECT BREAKS DELETE ENDPOINT CALLED ===');
    const breakId = req.params.id;
    
    // Check permissions
    if (!['admin', 'project_manager', 'team_leader'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Cannot delete breaks.' });
    }
    
    const breakItem = await db.Break.findByPk(breakId);
    if (!breakItem) {
      return res.status(404).json({ message: 'Break not found' });
    }
    
    await breakItem.destroy();
    
    console.log('=== DIRECT BREAKS DELETE ENDPOINT SUCCESS ===');
    res.json({ message: 'Break deleted successfully' });
  } catch (error) {
    console.error('=== DIRECT BREAKS DELETE ENDPOINT ERROR ===');
    console.error('Error deleting break (direct):', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Debug route to list all available routes
app.get('/api/routes', (req, res) => {
  const routes = [];
  const routerInfo = [];
  
  app._router.stack.forEach((middleware, index) => {
    if (middleware.route) {
      routes.push({
        type: 'route',
        methods: Object.keys(middleware.route.methods),
        path: middleware.route.path,
        index: index
      });
    } else if (middleware.name === 'router') {
      const routerRoutes = [];
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routerRoutes.push({
            methods: Object.keys(handler.route.methods),
            path: handler.route.path
          });
        }
      });
      routerInfo.push({
        type: 'router',
        regexp: middleware.regexp.toString(),
        routes: routerRoutes,
        index: index
      });
    }
  });
  
  res.json({ 
    message: 'Available routes',
    timestamp: new Date().toISOString(),
    directRoutes: routes,
    routers: routerInfo,
    totalMiddleware: app._router.stack.length
  });
});

// Catch-all route for unmatched paths
app.use('*', (req, res) => {
  console.log('404 - Route not found:', req.originalUrl);
  res.status(404).json({ 
    message: 'Route not found', 
    path: req.originalUrl,
    availableRoutes: [
      '/api/health',
      '/api/routes',
      '/api/auth/*',
      '/api/dashboard/*',
      '/api/projects/*',
      '/api/users/*',
      '/api/tasks/*',
      '/api/time-transactions/*',
      '/api/breaks/*'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;

// For Vercel deployment
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('Environment:', process.env.NODE_ENV);
  });
} else {
  console.log('Running in production mode on Vercel');
  console.log('Environment:', process.env.NODE_ENV);
}

// Export for Vercel
module.exports = app; 