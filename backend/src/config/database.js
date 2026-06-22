/**
 * PostgreSQL Database Configuration
 * Handles database connection, pooling, and initialization
 * WITH SSL support for AWS RDS
 */

const { Pool } = require('pg');
const logger = require('../utils/logger');

// Create connection pool with SSL for AWS RDS
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: parseInt(process.env.DB_POOL_MAX || 10),
  min: parseInt(process.env.DB_POOL_MIN || 2),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  // SSL Configuration for AWS RDS
  ssl: process.env.DB_HOST && process.env.DB_HOST.includes('rds.amazonaws.com') ? {
    rejectUnauthorized: false
  } : false,
});

// Handle pool errors
pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Initialize database - test connection
const initializeDatabase = async () => {
  try {
    const client = await pool.connect();
    logger.info('Testing database connection...');
    
    // Test query
    const result = await client.query('SELECT NOW()');
    logger.info(`Database connected. Current time: ${result.rows[0].now}`);
    
    client.release();
    return true;
  } catch (error) {
    logger.error('Failed to connect to database:', error.message);
    throw error;
  }
};

// Execute query
const query = async (text, params = []) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (duration > 1000) {
      logger.warn(`Slow query (${duration}ms): ${text}`);
    }
    
    return result;
  } catch (error) {
    logger.error('Database query error:', {
      query: text,
      params,
      error: error.message,
    });
    throw error;
  }
};

// Get client from pool (for transactions)
const getClient = async () => {
  const client = await pool.connect();
  return client;
};

// Close all connections
const closeConnections = async () => {
  await pool.end();
  logger.info('Database connections closed');
};

module.exports = {
  pool,
  query,
  getClient,
  initializeDatabase,
  closeConnections,
};
