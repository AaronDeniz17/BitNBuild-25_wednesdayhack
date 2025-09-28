// GigCampus Backend Server
// Main entry point for the API server

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const requestTracing = require('./middleware/request-tracing');
require('dotenv').config();

const { db } = require('./config/firebase');

// Import route handlers
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const bidRoutes = require('./routes/bids');
const contractRoutes = require('./routes/contracts');
const milestoneRoutes = require('./routes/milestones');
const teamRoutes = require('./routes/teams');
const transactionRoutes = require('./routes/transactions');
const reviewRoutes = require('./routes/reviews');
const adminRoutes = require('./routes/admin');
const chatRoutes = require('./routes/chat');
const leaderboardRoutes = require('./routes/leaderboard');
const notificationRoutes = require('./routes/notifications');
<<<<<<< Updated upstream
const analyticsRoutes = require('./routes/analytics');
=======
const analysisRoutes = require('./routes/analysis');
>>>>>>> Stashed changes

const app = express();
const DEFAULT_PORT = 5000;
const MAX_PORT_ATTEMPTS = 10;

// Try to get port from environment or use default
let currentPort = parseInt(process.env.PORT) || DEFAULT_PORT;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration
const corsOrigin = process.env.NODE_ENV === 'production'
  ? process.env.CLIENT_URL
  : [
      'http://localhost:3000', 
      'http://127.0.0.1:3000',
      'http://localhost:3001', 
      'http://127.0.0.1:3001',
      'http://localhost:3002', 
      'http://127.0.0.1:3002'
    ];

console.log('CORS Origin:', corsOrigin);

app.use(cors({
  origin: corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
}));

// Request tracing middleware
app.use(requestTracing);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'GigCampus API'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/notifications', notificationRoutes);
<<<<<<< Updated upstream
app.use('/api/analytics', analyticsRoutes);
=======
app.use('/api/analysis', analysisRoutes);
>>>>>>> Stashed changes

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.url}`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Function to find an available port
const findAvailablePort = async (startPort) => {
  const net = require('net');
  
  const isPortAvailable = (port) => {
    return new Promise((resolve) => {
      const server = net.createServer()
        .once('error', () => resolve(false))
        .once('listening', () => {
          server.close();
          resolve(true);
        });
      server.listen(port);
    });
  };

  let port = startPort;
  while (!(await isPortAvailable(port))) {
    port++;
  }
  return port;
};

// Start server
// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.url}`
  });
});

// Start server with retries
const startServer = (port = DEFAULT_PORT, attempt = 1) => {
  console.log(`Attempting to start server on port ${port} (attempt ${attempt}/${MAX_PORT_ATTEMPTS})`);
  
  const server = app.listen(port)
    .on('listening', () => {
      console.log('🚀 GigCampus API server running!');
      console.log(`🌐 Server URL: http://localhost:${port}`);
      console.log(`📊 Health check: http://localhost:${port}/health`);
      console.log('🔧 Environment:', process.env.NODE_ENV || 'development');
      console.log('🔗 Client URL:', process.env.CLIENT_URL || 'http://localhost:3000');
    })
    .on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`⚠️ Port ${port} is busy...`);
        if (attempt < MAX_PORT_ATTEMPTS) {
          setTimeout(() => {
            server.close();
            startServer(port + 1, attempt + 1);
          }, 1000);
        } else {
          console.error('❌ Could not find an available port. Please free up some ports or specify a different port.');
          process.exit(1);
        }
      } else {
        console.error('❌ Server error:', err);
        process.exit(1);
      }
    });
};

// Initialize server
startServer();

module.exports = app;
