/**
 * Driver Routes
 * GET /api/v1/drivers - Get all drivers
 * GET /api/v1/drivers/:id - Get driver by ID
 * POST /api/v1/drivers - Create driver
 * PUT /api/v1/drivers/:id - Update driver
 * DELETE /api/v1/drivers/:id - Delete driver
 * POST /api/v1/drivers/:id/assign-vehicle - Assign to vehicle
 */

const express = require('express');
const Joi = require('joi');
const logger = require('../utils/logger');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, authorize } = require('../middleware/authenticate');
const { query } = require('../config/database');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/drivers
 * Get all drivers for customer
 */
router.get('/', asyncHandler(async (req, res) => {
  try {
    const customerId = req.query.customerId || 'demo-customer';

    const result = await query(
      `SELECT * FROM drivers WHERE customer_id = $1 AND deleted_at IS NULL ORDER BY first_name ASC`,
      [customerId]
    );

    res.status(200).json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });

  } catch (error) {
    logger.error('Error fetching drivers:', error.message);

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
 * GET /api/v1/drivers/:id
 * Get driver by ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM drivers WHERE id = $1 AND deleted_at IS NULL`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Driver not found',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });

  } catch (error) {
    logger.error('Error fetching driver:', error.message);

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
 * POST /api/v1/drivers
 * Create new driver
 */
router.post('/', asyncHandler(async (req, res) => {
  try {
    const schema = Joi.object({
      customerId: Joi.string().uuid().required(),
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      email: Joi.string().email(),
      phone: Joi.string(),
      licenseNumber: Joi.string().required(),
      licenseExpiry: Joi.date(),
      dateOfBirth: Joi.date(),
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

    const result = await query(
      `INSERT INTO drivers (customer_id, first_name, last_name, email, phone, license_number, license_expiry, date_of_birth)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        value.customerId,
        value.firstName,
        value.lastName,
        value.email,
        value.phone,
        value.licenseNumber,
        value.licenseExpiry,
        value.dateOfBirth,
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });

  } catch (error) {
    logger.error('Driver creation error:', error.message);

    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE',
          message: 'Driver with this license number already exists',
        },
      });
    }

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
 * PUT /api/v1/drivers/:id
 * Update driver
 */
router.put('/:id', asyncHandler(async (req, res) => {
  try {
    const schema = Joi.object({
      firstName: Joi.string(),
      lastName: Joi.string(),
      email: Joi.string().email(),
      phone: Joi.string(),
      licenseExpiry: Joi.date(),
      status: Joi.string().valid('active', 'inactive', 'suspended'),
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

    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, val] of Object.entries(value)) {
      if (val !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(val);
        paramCount++;
      }
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(req.params.id);

    const result = await query(
      `UPDATE drivers SET ${fields.join(', ')} WHERE id = $${paramCount} AND deleted_at IS NULL RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Driver not found',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });

  } catch (error) {
    logger.error('Driver update error:', error.message);

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
 * DELETE /api/v1/drivers/:id
 * Delete driver (soft delete)
 */
router.delete('/:id', authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  try {
    const result = await query(
      `UPDATE drivers SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Driver not found',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
      message: 'Driver deleted',
    });

  } catch (error) {
    logger.error('Driver deletion error:', error.message);

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
 * POST /api/v1/drivers/:id/assign-vehicle
 * Assign driver to vehicle
 */
router.post('/:id/assign-vehicle', authorize('admin', 'manager'), asyncHandler(async (req, res) => {
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

    // Update vehicle with driver assignment
    const result = await query(
      `UPDATE vehicles SET current_driver_id = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 RETURNING *`,
      [req.params.id, value.vehicleId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Vehicle not found',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
      message: 'Driver assigned to vehicle',
    });

  } catch (error) {
    logger.error('Assignment error:', error.message);

    res.status(500).json({
      success: false,
      error: {
        code: 'ASSIGNMENT_FAILED',
        message: error.message,
      },
    });
  }
}));

module.exports = router;
