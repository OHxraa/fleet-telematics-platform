/**
 * Trailer Routes
 * GET /api/v1/trailers - Get all trailers
 * GET /api/v1/trailers/:id - Get trailer by ID
 * POST /api/v1/trailers - Create trailer
 * PUT /api/v1/trailers/:id - Update trailer
 * DELETE /api/v1/trailers/:id - Delete trailer
 * POST /api/v1/trailers/:id/attach - Attach to vehicle
 * POST /api/v1/trailers/:id/detach - Detach from vehicle
 * GET /api/v1/trailers/:id/location - Get trailer location
 * GET /api/v1/trailers/:id/refrigeration - Get fridge data
 * GET /api/v1/trailers/:id/brake - Get brake data
 */

const express = require('express');
const Joi = require('joi');
const logger = require('../utils/logger');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, authorize } = require('../middleware/authenticate');
const { Trailer } = require('../models/Trailer');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/trailers
 * Get all trailers for customer
 */
router.get('/', asyncHandler(async (req, res) => {
  try {
    const customerId = req.query.customerId || 'demo-customer';

    const trailers = await Trailer.findByCustomer(customerId);

    res.status(200).json({
      success: true,
      data: trailers,
      count: trailers.length,
    });

  } catch (error) {
    logger.error('Error fetching trailers:', error.message);

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
 * GET /api/v1/trailers/:id
 * Get trailer by ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  try {
    const trailer = await Trailer.findById(req.params.id);

    if (!trailer) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Trailer not found',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: trailer,
    });

  } catch (error) {
    logger.error('Error fetching trailer:', error.message);

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
 * POST /api/v1/trailers
 * Create new trailer
 */
router.post('/', asyncHandler(async (req, res) => {
  try {
    const schema = Joi.object({
      customerId: Joi.string().uuid().required(),
      name: Joi.string().required(),
      licensePlate: Joi.string().required(),
      make: Joi.string(),
      model: Joi.string(),
      year: Joi.number().integer(),
      trailerType: Joi.string().valid('refrigerated', 'box', 'flatbed', 'tanker', 'other'),
      idemId: Joi.string(),
      hasRefrigeration: Joi.boolean(),
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

    const trailer = await Trailer.create(value);

    res.status(201).json({
      success: true,
      data: trailer,
    });

  } catch (error) {
    logger.error('Trailer creation error:', error.message);

    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_FAILED',
        message: error.message,
      },
    });
  }
}));

/**
 * PUT /api/v1/trailers/:id
 * Update trailer
 */
router.put('/:id', asyncHandler(async (req, res) => {
  try {
    const schema = Joi.object({
      name: Joi.string(),
      status: Joi.string().valid('active', 'inactive', 'maintenance', 'decommissioned'),
      trailerType: Joi.string(),
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

    const trailer = await Trailer.update(req.params.id, value);

    if (!trailer) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Trailer not found',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: trailer,
    });

  } catch (error) {
    logger.error('Trailer update error:', error.message);

    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_FAILED',
        message: error.message,
      },
    });
  }
}));

/**
 * DELETE /api/v1/trailers/:id
 * Delete trailer
 */
router.delete('/:id', authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  try {
    const trailer = await Trailer.delete(req.params.id);

    if (!trailer) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Trailer not found',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: trailer,
      message: 'Trailer deleted',
    });

  } catch (error) {
    logger.error('Trailer deletion error:', error.message);

    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_FAILED',
        message: error.message,
      },
    });
  }
}));

/**
 * POST /api/v1/trailers/:id/attach
 * Attach trailer to vehicle
 */
router.post('/:id/attach', authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  try {
    const schema = Joi.object({
      vehicleId: Joi.string().uuid().required(),
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

    const trailer = await Trailer.attachToVehicle(req.params.id, value.vehicleId);

    res.status(200).json({
      success: true,
      data: trailer,
      message: 'Trailer attached',
    });

  } catch (error) {
    logger.error('Attach error:', error.message);

    res.status(500).json({
      success: false,
      error: {
        code: 'ATTACH_FAILED',
        message: error.message,
      },
    });
  }
}));

/**
 * POST /api/v1/trailers/:id/detach
 * Detach trailer from vehicle
 */
router.post('/:id/detach', authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  try {
    const trailer = await Trailer.detachFromVehicle(req.params.id);

    if (!trailer) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Trailer not found',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: trailer,
      message: 'Trailer detached',
    });

  } catch (error) {
    logger.error('Detach error:', error.message);

    res.status(500).json({
      success: false,
      error: {
        code: 'DETACH_FAILED',
        message: error.message,
      },
    });
  }
}));

/**
 * GET /api/v1/trailers/:id/location
 * Get trailer GPS location (from Idem)
 */
router.get('/:id/location', asyncHandler(async (req, res) => {
  try {
    const trailer = await Trailer.findById(req.params.id);

    if (!trailer) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Trailer not found',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        trailerId: trailer.id,
        latitude: trailer.gps_latitude,
        longitude: trailer.gps_longitude,
        lastUpdate: trailer.gps_last_update,
        source: 'idem',
      },
    });

  } catch (error) {
    logger.error('Error fetching trailer location:', error.message);

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
 * GET /api/v1/trailers/:id/refrigeration
 * Get refrigeration unit data (from Idem)
 */
router.get('/:id/refrigeration', asyncHandler(async (req, res) => {
  try {
    const trailer = await Trailer.findById(req.params.id);

    if (!trailer || !trailer.has_refrigeration) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Trailer or refrigeration unit not found',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        trailerId: trailer.id,
        hasRefrigeration: trailer.has_refrigeration,
        currentTemp: trailer.fridge_current_temp,
        targetTemp: trailer.fridge_target_temp,
        status: trailer.fridge_status,
        lastUpdate: trailer.fridge_last_update,
        source: 'idem',
      },
    });

  } catch (error) {
    logger.error('Error fetching refrigeration data:', error.message);

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
 * GET /api/v1/trailers/:id/brake
 * Get brake system data (EBPMS from Idem)
 */
router.get('/:id/brake', asyncHandler(async (req, res) => {
  try {
    const trailer = await Trailer.findById(req.params.id);

    if (!trailer || !trailer.ebpms_enabled) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Trailer or brake system not found',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        trailerId: trailer.id,
        brakeSystemType: trailer.brake_system_type,
        ebpmsEnabled: trailer.ebpms_enabled,
        pressure: trailer.ebpms_pressure,
        temperature: trailer.ebpms_temperature,
        lastUpdate: trailer.ebpms_last_update,
        source: 'idem',
      },
    });

  } catch (error) {
    logger.error('Error fetching brake data:', error.message);

    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: error.message,
      },
    });
  }
}));

module.exports = router;
