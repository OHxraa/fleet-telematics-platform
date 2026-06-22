/**
 * Global Error Handler Middleware
 * Catches all errors and returns standardized error responses
 */

const logger = require('../utils/logger');

// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  // Log error
  logger.error({
    message: err.message,
    status: err.statusCode,
    path: req.path,
    method: req.method,
    stack: err.stack,
  });

  // Wrong MongoDB ID error
  if (err.name === 'CastError') {
    const message = `Resource not found. Invalid: ${err.path}`;
    err.statusCode = 400;
    err.message = message;
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    err.statusCode = 401;
    err.message = message;
  }

  // JWT expired error
  if (err.name === 'TokenExpiredError') {
    const message = 'Token has expired';
    err.statusCode = 401;
    err.message = message;
  }

  // Database errors
  if (err.code === '23505') {
    // Unique constraint violation
    const field = Object.keys(err.constraint || {})[0];
    err.statusCode = 409;
    err.message = `${field} already exists`;
  }

  if (err.code === '23503') {
    // Foreign key constraint violation
    err.statusCode = 400;
    err.message = 'Invalid reference to related resource';
  }

  // Validation errors
  if (err.isJoi) {
    err.statusCode = 400;
    err.message = err.details?.map(d => d.message).join(', ');
  }

  // Return error response
  res.status(err.statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message,
      statusCode: err.statusCode,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  AppError,
  errorHandler,
  asyncHandler,
};
