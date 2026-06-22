/**
 * Authentication Middleware
 * Protects routes and verifies JWT tokens
 */

const { extractToken, verifyAccessToken } = require('../utils/jwtUtils');
const { AppError } = require('./errorHandler');
const logger = require('../utils/logger');

// Verify JWT token middleware
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractToken(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'No authentication token provided',
        },
      });
    }

    const decoded = verifyAccessToken(token);
    
    // Attach user to request object
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    logger.debug(`User authenticated: ${decoded.email}`);
    next();

  } catch (error) {
    logger.error('Authentication error:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Authentication token has expired',
        },
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid authentication token',
        },
      });
    }

    res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication failed',
      },
    });
  }
};

// Role-based access control
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'User not authenticated',
        },
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Unauthorized access attempt by ${req.user.email} to ${req.path}`);
      
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this resource',
        },
      });
    }

    next();
  };
};

// Optional authentication (user is logged in but not required)
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractToken(authHeader);

    if (token) {
      const decoded = verifyAccessToken(token);
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
    }

  } catch (error) {
    logger.debug('Optional authentication skipped:', error.message);
  }

  next();
};

// Verify 2FA if enabled
const verify2FA = (req, res, next) => {
  if (process.env.ENABLE_2FA !== 'true') {
    return next();
  }

  const twoFACode = req.body.twoFACode || req.headers['x-2fa-code'];

  if (!twoFACode) {
    return res.status(403).json({
      success: false,
      error: {
        code: '2FA_REQUIRED',
        message: '2FA code required',
      },
    });
  }

  // TODO: Verify 2FA code against user's 2FA settings
  next();
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
  verify2FA,
};
