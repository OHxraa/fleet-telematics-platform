/**
 * Security Utilities
 * CORS, rate limiting, helmet, and other security configurations
 */

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const logger = require('../utils/logger');

/**
 * CORS configuration
 */
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',');

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: process.env.CORS_CREDENTIALS === 'true',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 3600,
};

/**
 * General rate limiter
 */
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT',
        message: 'Too many requests, please try again later',
      },
    });
  },
});

/**
 * Strict rate limiter (for auth endpoints)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: {
        code: 'AUTH_RATE_LIMIT',
        message: 'Too many login attempts. Please try again in 15 minutes.',
      },
    });
  },
});

/**
 * API rate limiter
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Helmet configuration
 */
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
});

/**
 * Input sanitization middleware
 */
const sanitizeInput = (req, res, next) => {
  // Remove $ and . from body to prevent NoSQL injection
  if (req.body) {
    JSON.stringify(req.body).replace(/[\$\.]/g, '');
  }

  next();
};

/**
 * Security headers middleware
 */
const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  next();
};

/**
 * IP whitelisting middleware
 */
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;

    if (allowedIPs.length === 0 || allowedIPs.includes(clientIP)) {
      next();
    } else {
      logger.warn(`Unauthorized IP access attempt: ${clientIP}`);
      res.status(403).json({
        success: false,
        error: {
          code: 'IP_BLOCKED',
          message: 'Access denied',
        },
      });
    }
  };
};

/**
 * Request validation middleware
 */
const validateRequest = (req, res, next) => {
  // Check content type
  if (
    req.method !== 'GET' &&
    req.method !== 'DELETE' &&
    !req.is('application/json')
  ) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_CONTENT_TYPE',
        message: 'Content-Type must be application/json',
      },
    });
  }

  next();
};

/**
 * API key validation middleware
 */
const validateAPIKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  // This is a placeholder - implement your API key validation logic
  // For now, we're using JWT tokens via Authorization header

  next();
};

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'error' : 'info';

    logger[level]({
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  });

  next();
};

/**
 * Trust proxy configuration (for Docker/K8s)
 */
const trustProxy = (app) => {
  if (process.env.TRUST_PROXY === 'true') {
    app.set('trust proxy', 1);
  }
};

module.exports = {
  corsOptions,
  generalLimiter,
  authLimiter,
  apiLimiter,
  helmetConfig,
  sanitizeInput,
  securityHeaders,
  ipWhitelist,
  validateRequest,
  validateAPIKey,
  requestLogger,
  trustProxy,
};
