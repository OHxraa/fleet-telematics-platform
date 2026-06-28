/**
 * PostgreSQL Database Configuration
 */

const { Pool } = require('pg');
const logger = require('../utils/logger');

console.log('DATABASE_URL:', process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Pool error:', err.message);
  logger.error('Pool error:', err.message);
});

const initializeDatabase = async () => {
  try {
    logger.info('Attempting to connect to database...');
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    logger.info(`Database connected at ${result.rows[0].now}`);
    client.release();
    return pool;
  } catch (error) {
    console.error('Database error:', error);
    logger.error('Database connection failed:', error.message);
    throw error;
  }
};

module.exports = {
  pool,
  initializeDatabase,
};
