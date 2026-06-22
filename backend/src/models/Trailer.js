/**
 * Database Migration: Trailers Table
 * Stores trailer information for Idem integration
 */

const { query } = require('./database');
const logger = require('../utils/logger');

const createTrailersTable = async () => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS trailers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_id UUID NOT NULL,
      name VARCHAR(100) NOT NULL,
      license_plate VARCHAR(20) UNIQUE NOT NULL,
      
      -- Trailer Information
      make VARCHAR(100),
      model VARCHAR(100),
      year INT,
      trailer_type VARCHAR(50) CHECK (trailer_type IN ('refrigerated', 'box', 'flatbed', 'tanker', 'other')),
      axles INT,
      capacity_weight INT,
      capacity_volume INT,
      
      -- Idem Integration
      idem_id VARCHAR(255) UNIQUE,
      idem_box_id VARCHAR(255),
      idem_box_serial VARCHAR(255),
      
      -- Current Status
      status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'decommissioned')),
      attached_to_vehicle_id UUID,
      attached_at TIMESTAMP,
      
      -- GPS Tracking (From Idem)
      gps_latitude DECIMAL(10, 8),
      gps_longitude DECIMAL(11, 8),
      gps_last_update TIMESTAMP,
      
      -- Refrigeration Unit (Idem specific)
      has_refrigeration BOOLEAN DEFAULT false,
      fridge_current_temp DECIMAL(8, 2),
      fridge_target_temp DECIMAL(8, 2),
      fridge_status VARCHAR(50),
      fridge_last_update TIMESTAMP,
      
      -- Brake System Data (EBPMS from Idem)
      brake_system_type VARCHAR(50),
      ebpms_enabled BOOLEAN DEFAULT false,
      ebpms_pressure DECIMAL(8, 2),
      ebpms_temperature DECIMAL(8, 2),
      ebpms_last_update TIMESTAMP,
      
      -- Maintenance
      last_service_date DATE,
      next_service_date DATE,
      last_inspection_date DATE,
      
      -- Audit
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP,
      
      -- Constraints
      CONSTRAINT fk_trailer_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
      CONSTRAINT fk_trailer_vehicle FOREIGN KEY (attached_to_vehicle_id) REFERENCES vehicles(id)
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_trailers_customer_id ON trailers(customer_id);
    CREATE INDEX IF NOT EXISTS idx_trailers_license_plate ON trailers(license_plate);
    CREATE INDEX IF NOT EXISTS idx_trailers_idem_id ON trailers(idem_id);
    CREATE INDEX IF NOT EXISTS idx_trailers_vehicle_id ON trailers(attached_to_vehicle_id);
    CREATE INDEX IF NOT EXISTS idx_trailers_status ON trailers(status);
    CREATE INDEX IF NOT EXISTS idx_trailers_gps ON trailers(gps_latitude, gps_longitude);
  `;

  try {
    await query(createTableSQL);
    logger.info('✓ Trailers table created');
    return true;
  } catch (error) {
    logger.error('Error creating trailers table:', error.message);
    throw error;
  }
};

// Trailer class for queries
class Trailer {
  static async create(trailerData) {
    const {
      customerId,
      name,
      licensePlate,
      make,
      model,
      year,
      trailerType,
      idemId,
    } = trailerData;

    const result = await query(
      `INSERT INTO trailers (customer_id, name, license_plate, make, model, year, trailer_type, idem_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [customerId, name, licensePlate, make, model, year, trailerType, idemId]
    );

    return result.rows[0];
  }

  static async findById(trailerId) {
    const result = await query(
      `SELECT * FROM trailers WHERE id = $1 AND deleted_at IS NULL`,
      [trailerId]
    );
    return result.rows[0];
  }

  static async findByIdemId(idemId) {
    const result = await query(
      `SELECT * FROM trailers WHERE idem_id = $1 AND deleted_at IS NULL`,
      [idemId]
    );
    return result.rows[0];
  }

  static async findByCustomer(customerId) {
    const result = await query(
      `SELECT * FROM trailers WHERE customer_id = $1 AND deleted_at IS NULL ORDER BY name ASC`,
      [customerId]
    );
    return result.rows;
  }

  static async findByLicensePlate(licensePlate) {
    const result = await query(
      `SELECT * FROM trailers WHERE license_plate = $1 AND deleted_at IS NULL`,
      [licensePlate]
    );
    return result.rows[0];
  }

  static async updateLocation(trailerId, latitude, longitude) {
    const result = await query(
      `UPDATE trailers 
       SET gps_latitude = $1, gps_longitude = $2, gps_last_update = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND deleted_at IS NULL
       RETURNING *`,
      [latitude, longitude, trailerId]
    );
    return result.rows[0];
  }

  static async updateRefrigeration(trailerId, currentTemp, targetTemp, status) {
    const result = await query(
      `UPDATE trailers 
       SET fridge_current_temp = $1, fridge_target_temp = $2, fridge_status = $3, fridge_last_update = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND deleted_at IS NULL
       RETURNING *`,
      [currentTemp, targetTemp, status, trailerId]
    );
    return result.rows[0];
  }

  static async updateBrakeData(trailerId, pressure, temperature) {
    const result = await query(
      `UPDATE trailers 
       SET ebpms_pressure = $1, ebpms_temperature = $2, ebpms_last_update = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND deleted_at IS NULL
       RETURNING *`,
      [pressure, temperature, trailerId]
    );
    return result.rows[0];
  }

  static async attachToVehicle(trailerId, vehicleId) {
    const result = await query(
      `UPDATE trailers 
       SET attached_to_vehicle_id = $1, attached_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING *`,
      [vehicleId, trailerId]
    );
    return result.rows[0];
  }

  static async detachFromVehicle(trailerId) {
    const result = await query(
      `UPDATE trailers 
       SET attached_to_vehicle_id = NULL, attached_at = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING *`,
      [trailerId]
    );
    return result.rows[0];
  }

  static async update(trailerId, updateData) {
    const allowedFields = ['name', 'status', 'trailer_type', 'capacity_weight', 'capacity_volume', 'next_service_date'];
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
    values.push(trailerId);

    const result = await query(
      `UPDATE trailers SET ${fields.join(', ')} WHERE id = $${paramCount} AND deleted_at IS NULL RETURNING *`,
      values
    );

    return result.rows[0];
  }

  static async delete(trailerId) {
    const result = await query(
      `UPDATE trailers SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [trailerId]
    );
    return result.rows[0];
  }
}

module.exports = {
  createTrailersTable,
  Trailer,
};
