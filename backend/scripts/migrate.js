/**
 * Database Migration Script
 * Creates all necessary tables for the Fleet Telematics Platform
 */

require('dotenv').config({ path: '.env.local' });

const { pool } = require('../src/config/database');

const query = (text, params) => pool.query(text, params);
const logger = require('../src/utils/logger');

const migrate = async () => {
  try {
    logger.info('Starting database migrations...');

    // Create customers table
    await query(`
      CREATE TABLE IF NOT EXISTS customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        status VARCHAR(50) DEFAULT 'active',
        subscription_plan VARCHAR(50) DEFAULT 'basic',
        max_vehicles INTEGER DEFAULT 10,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    logger.info('✓ Create customers table');

    // Create users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(20),
        role VARCHAR(50) DEFAULT 'driver',
        status VARCHAR(50) DEFAULT 'active',
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(customer_id, email)
      )
    `);
    logger.info('✓ Create users table');

    // Create vehicles table
    await query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        license_plate VARCHAR(50) UNIQUE NOT NULL,
        vin VARCHAR(100),
        make VARCHAR(100),
        model VARCHAR(100),
        year INTEGER,
        vehicle_type VARCHAR(50),
        status VARCHAR(50) DEFAULT 'active',
        geotab_id VARCHAR(255),
        idem_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(customer_id, license_plate)
      )
    `);
    logger.info('✓ Create vehicles table');

    // Create drivers table
    await query(`
      CREATE TABLE IF NOT EXISTS drivers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        license_number VARCHAR(50) UNIQUE,
        license_expiry DATE,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    logger.info('✓ Create drivers table');

    // Create trailers table
    await query(`
      CREATE TABLE IF NOT EXISTS trailers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        license_plate VARCHAR(50) UNIQUE NOT NULL,
        trailer_type VARCHAR(50),
        has_refrigeration BOOLEAN DEFAULT false,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(customer_id, license_plate)
      )
    `);
    logger.info('✓ Create trailers table');

    // Create telematics_data table
    await query(`
      CREATE TABLE IF NOT EXISTS telematics_data (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        speed DECIMAL(5, 2),
        fuel_level DECIMAL(5, 2),
        odometer DECIMAL(10, 2),
        engine_status BOOLEAN,
        rpm INTEGER,
        data_source VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    logger.info('✓ Create telematics_data table');

    // Create indexes for telematics_data (PostgreSQL syntax)
    await query(`CREATE INDEX IF NOT EXISTS idx_telematics_vehicle_id ON telematics_data(vehicle_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_telematics_customer_id ON telematics_data(customer_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_telematics_created_at ON telematics_data(created_at)`);
    logger.info('✓ Create telematics_data indexes');

    // Create vehicle_assignments table
    await query(`
      CREATE TABLE IF NOT EXISTS vehicle_assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
        driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
        trailer_id UUID REFERENCES trailers(id) ON DELETE SET NULL,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        unassigned_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    logger.info('✓ Create vehicle_assignments table');

    // Create alerts table
    await query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
        alert_type VARCHAR(100) NOT NULL,
        severity VARCHAR(50),
        message TEXT,
        status VARCHAR(50) DEFAULT 'open',
        acknowledged_at TIMESTAMP,
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    logger.info('✓ Create alerts table');

    // Create indexes for alerts (PostgreSQL syntax)
    await query(`CREATE INDEX IF NOT EXISTS idx_alerts_vehicle_id ON alerts(vehicle_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status)`);
    logger.info('✓ Create alerts indexes');

    // Enable Row Level Security
    await query(`ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY`);
    await query(`ALTER TABLE drivers ENABLE ROW LEVEL SECURITY`);
    await query(`ALTER TABLE trailers ENABLE ROW LEVEL SECURITY`);
    await query(`ALTER TABLE telematics_data ENABLE ROW LEVEL SECURITY`);
    logger.info('✓ Enable Row Level Security');

    logger.info('\n✅ All migrations completed successfully!\n');
    process.exit(0);

  } catch (error) {
    logger.error('Migration error:', error);
    logger.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
    });
    process.exit(1);
  }
};

migrate();
