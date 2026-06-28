/**
 * Database Connection Test WITH SSL
 * Shows detailed error messages
 */

require('dotenv').config({ path: '.env.local' });

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // SSL Configuration - REQUIRED for AWS RDS
  ssl: {
    rejectUnauthorized: false
  }
});

console.log('Testing database connection...\n');
console.log('Connection Details:');
console.log(`Host: ${process.env.DB_HOST}`);
console.log(`Port: ${process.env.DB_PORT}`);
console.log(`Database: ${process.env.DB_NAME}`);
console.log(`User: ${process.env.DB_USER}`);
console.log(`SSL: ENABLED`);
console.log('');

pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.log('❌ CONNECTION FAILED!\n');
    console.log('Error Details:');
    console.log('Code:', err.code);
    console.log('Message:', err.message);
    console.log('');
    console.log('Full Error:');
    console.log(err);
  } else {
    console.log('✅ CONNECTION SUCCESSFUL!');
    console.log('Database is reachable!');
    console.log('Current time from database:', result.rows[0].now);
  }

  pool.end();
  process.exit(err ? 1 : 0);
});

setTimeout(() => {
  console.log('❌ Connection timeout - no response from database');
  pool.end();
  process.exit(1);
}, 10000);
