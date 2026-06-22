/**
 * Request Validation Schemas
 * Joi schemas for all API request validation
 */

const Joi = require('joi');

const schemas = {
  // ============================================
  // AUTHENTICATION SCHEMAS
  // ============================================
  auth: {
    signup: Joi.object({
      customerId: Joi.string().uuid().required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(8).max(128).required(),
      firstName: Joi.string().max(100).required(),
      lastName: Joi.string().max(100).required(),
    }),

    login: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    }),

    refresh: Joi.object({
      refreshToken: Joi.string().required(),
    }),

    changePassword: Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: Joi.string().min(8).max(128).required(),
    }),

    forgotPassword: Joi.object({
      email: Joi.string().email().required(),
    }),

    resetPassword: Joi.object({
      resetToken: Joi.string().required(),
      newPassword: Joi.string().min(8).max(128).required(),
    }),
  },

  // ============================================
  // VEHICLE SCHEMAS
  // ============================================
  vehicles: {
    create: Joi.object({
      customerId: Joi.string().uuid().required(),
      name: Joi.string().max(255).required(),
      licensePlate: Joi.string().max(50).required(),
      vin: Joi.string().max(17),
      make: Joi.string().max(100),
      model: Joi.string().max(100),
      year: Joi.number().integer().min(1900).max(2100),
      vehicleType: Joi.string().valid('truck', 'van', 'car', 'trailer'),
      geotabId: Joi.string(),
    }),

    update: Joi.object({
      name: Joi.string().max(255),
      status: Joi.string().valid('active', 'inactive', 'maintenance', 'decommissioned'),
      fuelLevel: Joi.number().min(0).max(100),
      mileage: Joi.number().min(0),
    }),

    query: Joi.object({
      customerId: Joi.string().uuid(),
      status: Joi.string().valid('active', 'inactive', 'maintenance', 'decommissioned'),
      limit: Joi.number().integer().min(1).max(1000).default(100),
      offset: Joi.number().integer().min(0).default(0),
    }),
  },

  // ============================================
  // DRIVER SCHEMAS
  // ============================================
  drivers: {
    create: Joi.object({
      customerId: Joi.string().uuid().required(),
      firstName: Joi.string().max(100).required(),
      lastName: Joi.string().max(100).required(),
      email: Joi.string().email(),
      phone: Joi.string().max(20),
      licenseNumber: Joi.string().max(50).required(),
      licenseExpiry: Joi.date(),
      dateOfBirth: Joi.date(),
    }),

    update: Joi.object({
      firstName: Joi.string().max(100),
      lastName: Joi.string().max(100),
      email: Joi.string().email(),
      phone: Joi.string().max(20),
      licenseExpiry: Joi.date(),
      status: Joi.string().valid('active', 'inactive', 'suspended'),
    }),

    assignVehicle: Joi.object({
      vehicleId: Joi.string().uuid().required(),
    }),
  },

  // ============================================
  // TRAILER SCHEMAS
  // ============================================
  trailers: {
    create: Joi.object({
      customerId: Joi.string().uuid().required(),
      name: Joi.string().max(255).required(),
      licensePlate: Joi.string().max(50).required(),
      make: Joi.string().max(100),
      model: Joi.string().max(100),
      year: Joi.number().integer().min(1900).max(2100),
      trailerType: Joi.string().valid('refrigerated', 'box', 'flatbed', 'tanker', 'other'),
      idemId: Joi.string(),
      hasRefrigeration: Joi.boolean(),
    }),

    update: Joi.object({
      name: Joi.string().max(255),
      status: Joi.string().valid('active', 'inactive', 'maintenance', 'decommissioned'),
      trailerType: Joi.string().valid('refrigerated', 'box', 'flatbed', 'tanker', 'other'),
    }),

    attach: Joi.object({
      vehicleId: Joi.string().uuid().required(),
    }),
  },

  // ============================================
  // TELEMATICS SCHEMAS
  // ============================================
  telematics: {
    query: Joi.object({
      customerId: Joi.string().uuid(),
      days: Joi.number().integer().min(1).max(365).default(7),
      limit: Joi.number().integer().min(1).max(1000).default(100),
    }),

    history: Joi.object({
      startTime: Joi.string().isoDate().required(),
      endTime: Joi.string().isoDate().required(),
    }),

    behavior: Joi.object({
      days: Joi.number().integer().min(1).max(365).default(7),
    }),

    sync: Joi.object({
      customerId: Joi.string().uuid().required(),
    }),

    cleanup: Joi.object({
      retentionDays: Joi.number().integer().min(1).default(90),
    }),
  },

  // ============================================
  // ALERT SCHEMAS
  // ============================================
  alerts: {
    acknowledge: Joi.object({
      alertId: Joi.string().uuid().required(),
    }),

    resolve: Joi.object({
      alertId: Joi.string().uuid().required(),
    }),

    customRule: Joi.object({
      name: Joi.string().max(255).required(),
      condition: Joi.object().required(),
      severity: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
    }),
  },

  // ============================================
  // PAGINATION SCHEMAS
  // ============================================
  pagination: {
    query: Joi.object({
      limit: Joi.number().integer().min(1).max(1000).default(100),
      offset: Joi.number().integer().min(0).default(0),
      sortBy: Joi.string().default('createdAt'),
      sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    }),
  },

  // ============================================
  // COMMON VALIDATION
  // ============================================
  common: {
    uuid: Joi.string().uuid().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^[\d\s\-\+\(\)]+$/).max(20),
    date: Joi.date().iso(),
    timestamp: Joi.string().isoDate(),
  },
};

/**
 * Validation middleware factory
 */
const createValidator = (schema, location = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[location]);

    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message,
          details: error.details,
        },
      });
    }

    req[location] = value;
    next();
  };
};

module.exports = {
  schemas,
  createValidator,
};
