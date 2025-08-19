const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();

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
}

// Export for Vercel
module.exports = app; 