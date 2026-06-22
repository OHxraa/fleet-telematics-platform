/**
 * Redis Cache Configuration
 * Optional for development - server works without it
 */

const redis = require('redis');
const logger = require('../utils/logger');

let client = null;
let isConnected = false;

const initializeRedis = async () => {
  try {
    if (process.env.NODE_ENV === 'production') {
      // Redis REQUIRED in production
      client = redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || 0),
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.error('Max Redis reconnection attempts reached');
              return new Error('Max retries reached');
            }
            return retries * 50;
          }
        }
      });

      client.on('error', (err) => {
        logger.error('Redis Client Error', err);
      });

      client.on('connect', () => {
        logger.info('✓ Redis connected');
        isConnected = true;
      });

      await client.connect();
    } else {
      // Redis OPTIONAL in development
      try {
        client = redis.createClient({
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
          password: process.env.REDIS_PASSWORD,
          db: parseInt(process.env.REDIS_DB || 0),
          socket: {
            reconnectStrategy: () => false, // Don't retry in dev
          }
        });

        client.on('error', (err) => {
          logger.warn('Redis not available (optional in development):', err.message);
          isConnected = false;
        });

        client.on('connect', () => {
          logger.info('✓ Redis connected');
          isConnected = true;
        });

        await Promise.race([
          client.connect(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), 2000))
        ]);
      } catch (error) {
        logger.warn('⚠ Redis unavailable - caching disabled (development mode)');
        isConnected = false;
        client = null;
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      logger.error('Failed to connect to Redis:', error.message);
      throw error;
    } else {
      logger.warn('Redis connection failed - continuing without cache');
      isConnected = false;
      client = null;
    }
  }
};

// Get value from cache
const get = async (key) => {
  if (!client || !isConnected) return null;
  try {
    return await client.get(key);
  } catch (error) {
    logger.warn('Redis get error:', error.message);
    return null;
  }
};

// Set value in cache
const set = async (key, value, ttl = 3600) => {
  if (!client || !isConnected) return false;
  try {
    if (ttl) {
      await client.setEx(key, ttl, value);
    } else {
      await client.set(key, value);
    }
    return true;
  } catch (error) {
    logger.warn('Redis set error:', error.message);
    return false;
  }
};

// Delete from cache
const del = async (key) => {
  if (!client || !isConnected) return false;
  try {
    await client.del(key);
    return true;
  } catch (error) {
    logger.warn('Redis delete error:', error.message);
    return false;
  }
};

// Clear all cache
const flush = async () => {
  if (!client || !isConnected) return false;
  try {
    await client.flushDb();
    return true;
  } catch (error) {
    logger.warn('Redis flush error:', error.message);
    return false;
  }
};

// Check if Redis is available
const isAvailable = () => {
  return isConnected && client !== null;
};

// Close connection
const closeConnection = async () => {
  if (client) {
    try {
      await client.quit();
      logger.info('Redis connection closed');
    } catch (error) {
      logger.warn('Error closing Redis:', error.message);
    }
  }
};

module.exports = {
  initializeRedis,
  get,
  set,
  del,
  flush,
  isAvailable,
  closeConnection,
  client
};
