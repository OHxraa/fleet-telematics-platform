/**
 * Fleet Platform Backend - Main Server Entry Point
 * Initializes Express server, middleware, and database connections
 */

require('dotenv').config({ path: '.env.local' });
require('express-async-errors');

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Import configurations
const { initializeDatabase } = require('./config/database');
const { initializeRedis } = require('./config/redis');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Import routes (will be created next)
// const authRoutes = require('./routes/authRoutes');
// const vehicleRoutes = require('./routes/vehicleRoutes');
// const driverRoutes = require('./routes/driverRoutes');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },
});

// ============================================
// MIDDLEWARE SETUP
// ============================================

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: process.env.CORS_CREDENTIALS === 'true',
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// ============================================
// API DOCUMENTATION (Placeholder)
// ============================================

app.get('/api/docs', (req, res) => {
  res.json({
    message: 'Fleet Platform API v1.0',
    status: 'running',
    version: '1.0.0',
    features: {
      telematics: process.env.FEATURE_TELEMATICS === 'true',
      warehouse: process.env.FEATURE_WAREHOUSE === 'true',
      multiTenancy: process.env.FEATURE_MULTI_TENANCY === 'true',
    },
    endpoints: {
      auth: '/api/v1/auth',
      vehicles: '/api/v1/vehicles',
      drivers: '/api/v1/drivers',
      telematics: '/api/v1/telematics',
      trailers: '/api/v1/trailers',
      alerts: '/api/v1/alerts',
    },
  });
});

// ============================================
// ROUTES (Will be added as built)
// ============================================

// app.use('/api/v1/auth', authRoutes);
// app.use('/api/v1/vehicles', vehicleRoutes);
// app.use('/api/v1/drivers', driverRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// ============================================
// WEBSOCKET SETUP (Real-time Updates)
// ============================================

io.on('connection', (socket) => {
  logger.info(`New WebSocket connection: ${socket.id}`);

  socket.on('disconnect', () => {
    logger.info(`WebSocket disconnected: ${socket.id}`);
  });

  // Handlers for real-time telematics
  socket.on('subscribe-vehicle', (vehicleId) => {
    socket.join(`vehicle-${vehicleId}`);
    logger.info(`User subscribed to vehicle: ${vehicleId}`);
  });

  socket.on('unsubscribe-vehicle', (vehicleId) => {
    socket.leave(`vehicle-${vehicleId}`);
  });
});

// ============================================
// DATABASE & REDIS INITIALIZATION
// ============================================

const startServer = async () => {
  try {
    // Initialize PostgreSQL database
    logger.info('Initializing PostgreSQL database...');
    await initializeDatabase();
    logger.info('✓ PostgreSQL connected');

    // Initialize Redis cache
    logger.info('Initializing Redis cache...');
    await initializeRedis();
    logger.info('✓ Redis connected');

    // Start HTTP server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      logger.info(`✓ Server running on port ${PORT}`);
      logger.info(`✓ Environment: ${process.env.NODE_ENV}`);
      logger.info(`✓ API Documentation: http://localhost:${PORT}/api/docs`);
      logger.info(`✓ Health Check: http://localhost:${PORT}/health`);
      logger.info('Server started successfully!');
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// ============================================
// START SERVER
// ============================================

startServer();

module.exports = { app, server, io };
