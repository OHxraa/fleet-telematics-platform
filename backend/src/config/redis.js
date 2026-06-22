/**
 * Redis Cache Configuration
 * Handles Redis connection for caching and real-time data
 */

const redis = require('redis');
const logger = require('../utils/logger');

// Create Redis client
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || 0),
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error('Max Redis reconnection attempts reached');
        return new Error('Max retries reached');
      }
      return retries * 50;
    },
  },
});

// Handle Redis events
redisClient.on('error', (err) => {
  logger.error('Redis Client Error', err);
});

redisClient.on('connect', () => {
  logger.info('Redis client connected');
});

redisClient.on('ready', () => {
  logger.info('Redis client ready');
});

redisClient.on('reconnecting', () => {
  logger.warn('Redis client reconnecting');
});

// Initialize Redis connection
const initializeRedis = async () => {
  try {
    await redisClient.connect();
    
    // Test connection
    const pong = await redisClient.ping();
    logger.info(`Redis ping response: ${pong}`);
    
    return true;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error.message);
    throw error;
  }
};

// Cache operations
const cacheSet = async (key, value, expirationSeconds = 3600) => {
  try {
    if (typeof value === 'object') {
      value = JSON.stringify(value);
    }
    
    await redisClient.setEx(key, expirationSeconds, value);
    logger.debug(`Cache set: ${key}`);
    
    return true;
  } catch (error) {
    logger.error('Cache set error:', error.message);
    return false;
  }
};

const cacheGet = async (key) => {
  try {
    const value = await redisClient.get(key);
    
    if (value) {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    
    return null;
  } catch (error) {
    logger.error('Cache get error:', error.message);
    return null;
  }
};

const cacheDel = async (key) => {
  try {
    await redisClient.del(key);
    logger.debug(`Cache deleted: ${key}`);
    return true;
  } catch (error) {
    logger.error('Cache delete error:', error.message);
    return false;
  }
};

const cacheFlush = async () => {
  try {
    await redisClient.flushDb();
    logger.info('Cache flushed');
    return true;
  } catch (error) {
    logger.error('Cache flush error:', error.message);
    return false;
  }
};

// Session operations for storing user sessions
const sessionSet = async (sessionId, sessionData, expirationSeconds = 86400) => {
  try {
    const sessionKey = `session:${sessionId}`;
    await cacheSet(sessionKey, sessionData, expirationSeconds);
    return true;
  } catch (error) {
    logger.error('Session set error:', error.message);
    return false;
  }
};

const sessionGet = async (sessionId) => {
  try {
    const sessionKey = `session:${sessionId}`;
    return await cacheGet(sessionKey);
  } catch (error) {
    logger.error('Session get error:', error.message);
    return null;
  }
};

const sessionDel = async (sessionId) => {
  try {
    const sessionKey = `session:${sessionId}`;
    return await cacheDel(sessionKey);
  } catch (error) {
    logger.error('Session delete error:', error.message);
    return false;
  }
};

// Close Redis connection
const closeRedis = async () => {
  try {
    await redisClient.quit();
    logger.info('Redis connection closed');
  } catch (error) {
    logger.error('Error closing Redis connection:', error.message);
  }
};

module.exports = {
  redisClient,
  initializeRedis,
  cacheSet,
  cacheGet,
  cacheDel,
  cacheFlush,
  sessionSet,
  sessionGet,
  sessionDel,
  closeRedis,
};
