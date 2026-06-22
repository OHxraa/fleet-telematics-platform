/**
 * Enhanced Error Handling
 * Custom error classes and error handling utilities
 */

const logger = require('../utils/logger');

/**
 * Base application error class
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.timestamp = new Date();
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        timestamp: this.timestamp,
      },
    };
  }
}

/**
 * Validation error
 */
class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        details: this.details,
      },
    };
  }
}

/**
 * Authentication error
 */
class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTH_FAILED');
  }
}

/**
 * Authorization error
 */
class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTH_DENIED');
  }
}

/**
 * Not found error
 */
class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

/**
 * Conflict error
 */
class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

/**
 * Rate limit error
 */
class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT');
  }
}

/**
 * Database error
 */
class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', originalError = null) {
    super(message, 500, 'DATABASE_ERROR');
    this.originalError = originalError;
  }
}

/**
 * External API error
 */
class ExternalAPIError extends AppError {
  constructor(service = 'External Service', statusCode = 500) {
    super(`${service} request failed`, statusCode, 'EXTERNAL_API_ERROR');
    this.service = service;
  }
}

/**
 * Geotab specific error
 */
class GeotabError extends ExternalAPIError {
  constructor(message, statusCode = 500) {
    super(message, statusCode);
    this.code = 'GEOTAB_ERROR';
    this.service = 'Geotab';
  }
}

/**
 * Idem specific error
 */
class IdemError extends ExternalAPIError {
  constructor(message, statusCode = 500) {
    super(message, statusCode);
    this.code = 'IDEM_ERROR';
    this.service = 'Idem';
  }
}

/**
 * Error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  try {
    // Log error
    logger.error('Error occurred:', {
      message: err.message,
      code: err.code || 'UNKNOWN',
      statusCode: err.statusCode || 500,
      path: req.path,
      method: req.method,
      stack: err.stack,
    });

    // Handle operational errors
    if (err.isOperational) {
      return res.status(err.statusCode).json(err.toJSON());
    }

    // Handle validation errors (Joi)
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: err.message,
          details: err.details,
        },
      });
    }

    // Handle database errors
    if (err.code === '23505') {
      // Unique constraint violation
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_ENTRY',
          message: 'Record already exists',
        },
      });
    }

    if (err.code === '23503') {
      // Foreign key constraint violation
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REFERENCE',
          message: 'Invalid reference to related resource',
        },
      });
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid authentication token',
        },
      });
    }

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Authentication token has expired',
        },
      });
    }

    // Handle unknown errors
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        ...(process.env.NODE_ENV === 'development' && { debug: err.message }),
      },
    });

  } catch (error) {
    logger.error('Error handler failed:', error.message);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  }
};

/**
 * Async route wrapper
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Error tracking/reporting
 */
class ErrorTracker {
  constructor() {
    this.errors = [];
    this.maxErrors = 1000;
  }

  track(error, context = {}) {
    const errorLog = {
      timestamp: new Date(),
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      context,
      stack: error.stack,
    };

    this.errors.push(errorLog);

    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    logger.error('Error tracked:', errorLog);
  }

  getErrors(limit = 50) {
    return this.errors.slice(-limit);
  }

  getErrorStats() {
    const stats = {
      total: this.errors.length,
      byCode: {},
      byStatus: {},
    };

    for (const error of this.errors) {
      stats.byCode[error.code] = (stats.byCode[error.code] || 0) + 1;
      stats.byStatus[error.statusCode] = (stats.byStatus[error.statusCode] || 0) + 1;
    }

    return stats;
  }

  clear() {
    this.errors = [];
  }
}

module.exports = {
  // Error classes
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalAPIError,
  GeotabError,
  IdemError,

  // Middleware
  errorHandler,
  asyncHandler,

  // Utilities
  ErrorTracker,
};
