/**
 * Database Migration: Users Table
 * Creates the users table for authentication and multi-tenancy
 */

const { query } = require('./database');
const logger = require('../utils/logger');

const createUsersTable = async () => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_id UUID NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      phone VARCHAR(20),
      role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'driver', 'user')),
      status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
      
      -- 2FA
      two_fa_enabled BOOLEAN DEFAULT false,
      two_fa_secret VARCHAR(255),
      backup_codes TEXT[],
      
      -- Profile
      avatar_url TEXT,
      timezone VARCHAR(50) DEFAULT 'UTC',
      language VARCHAR(10) DEFAULT 'en',
      preferences JSONB DEFAULT '{}',
      
      -- Audit
      last_login TIMESTAMP,
      login_attempts INT DEFAULT 0,
      locked_until TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP,
      
      -- Constraints
      CONSTRAINT fk_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_customer_id ON users(customer_id);
    CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
  `;

  try {
    await query(createTableSQL);
    logger.info('✓ Users table created');
    return true;
  } catch (error) {
    logger.error('Error creating users table:', error.message);
    throw error;
  }
};

// User class for queries
class User {
  static async create(userData) {
    const {
      customerId,
      email,
      passwordHash,
      firstName,
      lastName,
      phone,
      role,
    } = userData;

    const result = await query(
      `INSERT INTO users (customer_id, email, password_hash, first_name, last_name, phone, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [customerId, email, passwordHash, firstName, lastName, phone, role]
    );

    return result.rows[0];
  }

  static async findById(userId) {
    const result = await query(
      `SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [userId]
    );
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await query(
      `SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL`,
      [email]
    );
    return result.rows[0];
  }

  static async findByCustomer(customerId) {
    const result = await query(
      `SELECT * FROM users WHERE customer_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC`,
      [customerId]
    );
    return result.rows;
  }

  static async update(userId, updateData) {
    const allowedFields = ['first_name', 'last_name', 'phone', 'avatar_url', 'timezone', 'language', 'preferences'];
    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const result = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} AND deleted_at IS NULL RETURNING *`,
      values
    );

    return result.rows[0];
  }

  static async delete(userId) {
    const result = await query(
      `UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [userId]
    );
    return result.rows[0];
  }

  static async updatePassword(userId, newPasswordHash) {
    const result = await query(
      `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email`,
      [newPasswordHash, userId]
    );
    return result.rows[0];
  }

  static async updateLoginAttempts(userId, attempts) {
    await query(
      `UPDATE users SET login_attempts = $1 WHERE id = $2`,
      [attempts, userId]
    );
  }

  static async lockAccount(userId, lockDuration = 3600000) {
    const lockedUntil = new Date(Date.now() + lockDuration);
    await query(
      `UPDATE users SET locked_until = $1 WHERE id = $2`,
      [lockedUntil, userId]
    );
  }

  static async recordLastLogin(userId) {
    await query(
      `UPDATE users SET last_login = CURRENT_TIMESTAMP, login_attempts = 0 WHERE id = $1`,
      [userId]
    );
  }
}

module.exports = {
  createUsersTable,
  User,
};
