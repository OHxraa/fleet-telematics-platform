/**
 * Health Check Routes
 * System status monitoring and diagnostics
 * GET /health - Basic health check
 * GET /health/detailed - Detailed system status
 * GET /health/metrics - Performance metrics
 */

const express = require('express');
const logger = require('../utils/logger');
const { query } = require('../config/database');
const { sessionGet } = require('../config/redis');
const geotabAdapter = require('../adapters/geotabAdapter');
const idemAdapter = require('../adapters/idemAdapter');
const { MemoryMonitor } = require('../utils/performanceOptimization');

const router = express.Router();

/**
 * GET /health
 * Basic health check
 */
router.get('/', async (req, res) => {
  try {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    });

  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
});

/**
 * GET /health/detailed
 * Detailed system status
 */
router.get('/detailed', async (req, res) => {
  try {
    const health = {
      timestamp: new Date(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      services: {},
    };

    // Check database
    try {
      const result = await query('SELECT NOW()');
      health.services.database = {
        status: 'connected',
        responseTime: `${result.duration}ms`,
      };
    } catch (error) {
      health.services.database = {
        status: 'disconnected',
        error: error.message,
      };
    }

    // Check Redis
    try {
      const result = await sessionGet('health_check');
      health.services.redis = {
        status: 'connected',
      };
    } catch (error) {
      health.services.redis = {
        status: 'disconnected',
        error: error.message,
      };
    }

    // Check Geotab
    const geotabStatus = geotabAdapter.getStatus();
    health.services.geotab = {
      status: geotabStatus.authenticated ? 'authenticated' : 'not authenticated',
      configured: geotabStatus.configured,
      lastAuth: geotabStatus.lastAuth,
    };

    // Check Idem
    const idemStatus = idemAdapter.getStatus();
    health.services.idem = {
      status: idemStatus.authenticated ? 'authenticated' : 'not authenticated',
      configured: idemStatus.configured,
      lastAuth: idemStatus.lastAuth,
    };

    // Memory usage
    health.memory = MemoryMonitor.getUsage();

    const allHealthy = Object.values(health.services)
      .every(s => !s.error && s.status !== 'disconnected');

    res.status(allHealthy ? 200 : 503).json(health);

  } catch (error) {
    logger.error('Health check error:', error.message);

    res.status(500).json({
      status: 'error',
      error: error.message,
    });
  }
});

/**
 * GET /health/metrics
 * Performance metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    const metrics = {
      timestamp: new Date(),
      process: {
        uptime: process.uptime(),
        pid: process.pid,
        memory: MemoryMonitor.getUsage(),
      },
      nodejs: {
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      api: {
        // These would come from your performance monitor
        totalRequests: 'tracking required',
        avgResponseTime: 'tracking required',
        slowEndpoints: 'tracking required',
      },
    };

    res.status(200).json(metrics);

  } catch (error) {
    logger.error('Metrics error:', error.message);

    res.status(500).json({
      status: 'error',
      error: error.message,
    });
  }
});

/**
 * GET /health/ready
 * Readiness probe (for Kubernetes)
 */
router.get('/ready', async (req, res) => {
  try {
    // Check critical services
    const dbCheck = await query('SELECT 1');
    const redisCheck = await sessionGet('health_check');

    if (dbCheck && redisCheck !== undefined) {
      return res.status(200).json({
        ready: true,
        timestamp: new Date(),
      });
    }

    res.status(503).json({
      ready: false,
      error: 'Required services not available',
    });

  } catch (error) {
    res.status(503).json({
      ready: false,
      error: error.message,
    });
  }
});

/**
 * GET /health/live
 * Liveness probe (for Kubernetes)
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    alive: true,
    timestamp: new Date(),
  });
});

/**
 * GET /health/diagnostics
 * Full system diagnostics
 */
router.get('/diagnostics', async (req, res) => {
  try {
    const diagnostics = {
      timestamp: new Date(),
      systemInfo: {
        uptime: process.uptime(),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV,
      },
      services: {
        database: await checkDatabase(),
        cache: await checkCache(),
        geotab: await checkGeotab(),
        idem: await checkIdem(),
      },
      performance: {
        memory: MemoryMonitor.getUsage(),
        cpuUsage: process.cpuUsage(),
      },
    };

    const healthy = Object.values(diagnostics.services)
      .every(s => s.status === 'healthy' || s.status === 'ok');

    res.status(healthy ? 200 : 503).json(diagnostics);

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

/**
 * Helper: Check database
 */
async function checkDatabase() {
  try {
    const start = Date.now();
    await query('SELECT NOW()');
    const duration = Date.now() - start;

    return {
      status: 'ok',
      responseTime: `${duration}ms`,
    };

  } catch (error) {
    return {
      status: 'error',
      message: error.message,
    };
  }
}

/**
 * Helper: Check cache
 */
async function checkCache() {
  try {
    const start = Date.now();
    await sessionGet('health_check');
    const duration = Date.now() - start;

    return {
      status: 'ok',
      responseTime: `${duration}ms`,
    };

  } catch (error) {
    return {
      status: 'error',
      message: error.message,
    };
  }
}

/**
 * Helper: Check Geotab
 */
async function checkGeotab() {
  try {
    const status = geotabAdapter.getStatus();

    return {
      status: status.authenticated ? 'healthy' : 'not authenticated',
      configured: status.configured,
      lastAuth: status.lastAuth,
    };

  } catch (error) {
    return {
      status: 'error',
      message: error.message,
    };
  }
}

/**
 * Helper: Check Idem
 */
async function checkIdem() {
  try {
    const status = idemAdapter.getStatus();

    return {
      status: status.authenticated ? 'healthy' : 'not authenticated',
      configured: status.configured,
      lastAuth: status.lastAuth,
    };

  } catch (error) {
    return {
      status: 'error',
      message: error.message,
    };
  }
}

module.exports = router;
