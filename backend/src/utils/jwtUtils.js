/**
 * JWT Utilities
 * Handles JWT token generation, verification, and refresh logic
 */

const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// Generate access token
const generateAccessToken = (userId, email, role = 'user') => {
  try {
    const token = jwt.sign(
      {
        userId,
        email,
        role,
        type: 'access',
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRY || '24h',
        issuer: 'fleet-platform',
        audience: 'fleet-platform-api',
      }
    );
    
    return token;
  } catch (error) {
    logger.error('Error generating access token:', error);
    throw error;
  }
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  try {
    const token = jwt.sign(
      {
        userId,
        type: 'refresh',
      },
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
        issuer: 'fleet-platform',
        audience: 'fleet-platform-api',
      }
    );
    
    return token;
  } catch (error) {
    logger.error('Error generating refresh token:', error);
    throw error;
  }
};

// Generate both tokens
const generateTokenPair = (userId, email, role = 'user') => {
  const accessToken = generateAccessToken(userId, email, role);
  const refreshToken = generateRefreshToken(userId);
  
  return {
    accessToken,
    refreshToken,
  };
};

// Verify access token
const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
      {
        issuer: 'fleet-platform',
        audience: 'fleet-platform-api',
      }
    );
    
    return decoded;
  } catch (error) {
    logger.error('Access token verification failed:', error.message);
    throw error;
  }
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET,
      {
        issuer: 'fleet-platform',
        audience: 'fleet-platform-api',
      }
    );
    
    return decoded;
  } catch (error) {
    logger.error('Refresh token verification failed:', error.message);
    throw error;
  }
};

// Decode token without verification (use carefully)
const decodeToken = (token) => {
  try {
    const decoded = jwt.decode(token);
    return decoded;
  } catch (error) {
    logger.error('Error decoding token:', error);
    return null;
  }
};

// Extract token from Authorization header
const extractToken = (authHeader) => {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  
  if (parts.length !== 2) return null;
  
  const [scheme, token] = parts;
  
  if (!/^Bearer$/i.test(scheme)) return null;
  
  return token;
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  extractToken,
};
