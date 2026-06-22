/**
 * Telematics Routes
 * GET /api/v1/telematics/fleet - Get fleet stats
 * GET /api/v1/telematics/vehicle/:id - Get vehicle telematics
 * GET /api/v1/telematics/vehicle/:id/history - Get historical data
 * GET /api/v1/telematics/vehicle/:id/behavior - Get driver behavior
 * POST /api/v1/telematics/sync - Trigger manual sync
 */

const express = require('express');
const Joi = require('joi');
const logger = require('../utils/logger');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, authorize } = require('../middleware/authenticate');
const TelematicsService = require('../services/telematicsService');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/telematics/fleet
 * Get fleet-wide statistics
 */
router.get('/fleet', asyncHandler(async (req, res) => {
  try {
    const customerId = req.query.customerId || 'demo-customer';
    const days = req.query.days || 7;

    const stats = await TelematicsService.getFleetStats(customerId, days);

    res.status(200).json({
      success: true,
      data: stats,
      period: `${days} days`,
    });

  } catch (error) {
    logger.error('Error fetching fleet stats:', error.message);

    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: error.message,
      },
    });
  }
}));

/**
 * GET /api/v1/telematics/vehicle/:id
 * Get latest telematics for specific vehicle
 */
router.get('/vehicle/:id', asyncHandler(async (req, res) => {
  try {
    const limit = req.query.limit || 100;

    const telematics = await TelematicsService.getVehicleHistory(
      req.params.id,
      new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      new Date()
    );

    res.status(200).json({
      success: true,
      data: telematics,
      count: telematics.length,
      period: 'Last 24 hours',
    });

  } catch (error) {
    logger.error('Error fetching telematics:', error.message);

    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: error.message,
      },
    });
  }
}));

/**
 * GET /api/v1/telematics/vehicle/:id/history
 * Get historical telematics data for time range
 */
router.get('/vehicle/:id/history', asyncHandler(async (req, res) => {
  try {
    const schema = Joi.object({
      startTime: Joi.string().isoDate().required(),
      endTime: Joi.string().isoDate().required(),
    });

    const { error, value } = schema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message,
        },
      });
    }

    const history = await TelematicsService.getVehicleHistory(
      req.params.id,
      new Date(value.startTime),
      new Date(value.endTime)
    );

    res.status(200).json({
      success: true,
      data: history,
      count: history.length,
      period: {
        start: value.startTime,
        end: value.endTime,
      },
    });

  } catch (error) {
    logger.error('Error fetching history:', error.message);

    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: error.message,
      },
    });
  }
}));

/**
 * GET /api/v1/telematics/vehicle/:id/behavior
 * Analyze driver behavior
 */
router.get('/vehicle/:id/behavior', asyncHandler(async (req, res) => {
  try {
    const days = req.query.days || 7;

    const analysis = await TelematicsService.analyzeDriverBehavior(
      req.params.id,
      days
    );

    res.status(200).json({
      success: true,
      data: analysis,
      riskLevel: analysis.riskScore > 70 ? 'HIGH' : analysis.riskScore > 40 ? 'MEDIUM' : 'LOW',
    });

  } catch (error) {
    logger.error('Error analyzing behavior:', error.message);

    res.status(500).json({
      success: false,
      error: {
        code: 'ANALYSIS_FAILED',
        message: error.message,
      },
    });
  }
}));

/**
 * POST /api/v1/telematics/sync
 * Trigger manual sync from Geotab
 */
router.post('/sync', authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  try {
    const schema = Joi.object({
      customerId: Joi.string().uuid().required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message,
        },
      });
    }

    const result = await TelematicsService.syncAllVehicleTelematics(value.customerId);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Sync initiated',
    });

  } catch (error) {
    logger.error('Sync error:', error.message);

    res.status(500).json({
      success: false,
      error: {
        code: 'SYNC_FAILED',
        message: error.message,
      },
    });
  }
}));

/**
 * POST /api/v1/telematics/cleanup
 * Clean old telematics data (admin only)
 */
router.post('/cleanup', authorize('admin'), asyncHandler(async (req, res) => {
  try {
    const retentionDays = req.body.retentionDays || 90;

    const deleted = await TelematicsService.cleanOldData(retentionDays);

    res.status(200).json({
      success: true,
      data: {
        recordsDeleted: deleted,
        retentionDays,
      },
      message: 'Old data cleaned',
    });

  } catch (error) {
    logger.error('Cleanup error:', error.message);

    res.status(500).json({
      success: false,
      error: {
        code: 'CLEANUP_FAILED',
        message: error.message,
      },
    });
  }
}));

module.exports = router;
