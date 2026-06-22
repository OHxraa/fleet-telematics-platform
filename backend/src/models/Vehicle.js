/**
 * Database Migration: Vehicles Table
 * Creates vehicles table for fleet tracking
 */

const { query } = require('./database');
const logger = require('../utils/logger');

const createVehiclesTable = async () => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS vehicles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_id UUID NOT NULL,
      name VARCHAR(100) NOT NULL,
      license_plate VARCHAR(20) UNIQUE NOT NULL,
      vin VARCHAR(17),
      
      -- Vehicle Information
      make VARCHAR(100),
      model VARCHAR(100),
      year INT,
      vehicle_type VARCHAR(50) CHECK (vehicle_type IN ('truck', 'van', 'car', 'trailer')),
      color VARCHAR(50),
      
      -- Telematics
      geotab_id VARCHAR(255),
      idem_id VARCHAR(255),
      gps_latitude DECIMAL(10, 8),
      gps_longitude DECIMAL(11, 8),
      gps_accuracy DECIMAL(10, 2),
      gps_last_update TIMESTAMP,
      
      -- Status
      status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'decommissioned')),
      current_driver_id UUID,
      current_location_address VARCHAR(255),
      
      -- Fuel & Maintenance
      fuel_level DECIMAL(5, 2),
      mileage INT,
      next_service_date DATE,
      next_service_mileage INT,
      
      -- Geofence
      geofence_id UUID,
      
      -- Audit
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP,
      
      -- Constraints
      CONSTRAINT fk_vehicle_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
      CONSTRAINT fk_vehicle_driver FOREIGN KEY (current_driver_id) REFERENCES drivers(id)
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_vehicles_customer_id ON vehicles(customer_id);
    CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate ON vehicles(license_plate);
    CREATE INDEX IF NOT EXISTS idx_vehicles_geotab_id ON vehicles(geotab_id);
    CREATE INDEX IF NOT EXISTS idx_vehicles_idem_id ON vehicles(idem_id);
    CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
    CREATE INDEX IF NOT EXISTS idx_vehicles_gps ON vehicles(gps_latitude, gps_longitude);
  `;

  try {
    await query(createTableSQL);
    logger.info('✓ Vehicles table created');
    return true;
  } catch (error) {
    logger.error('Error creating vehicles table:', error.message);
    throw error;
  }
};

// Vehicle class for queries
class Vehicle {
  static async create(vehicleData) {
    const {
      customerId,
      name,
      licensePlate,
      vin,
      make,
      model,
      year,
      vehicleType,
      geotabId,
    } = vehicleData;

    const result = await query(
      `INSERT INTO vehicles (customer_id, name, license_plate, vin, make, model, year, vehicle_type, geotab_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [customerId, name, licensePlate, vin, make, model, year, vehicleType, geotabId]
    );

    return result.rows[0];
  }

  static async findById(vehicleId) {
    const result = await query(
      `SELECT * FROM vehicles WHERE id = $1 AND deleted_at IS NULL`,
      [vehicleId]
    );
    return result.rows[0];
  }

  static async findByGeotabId(geotabId) {
    const result = await query(
      `SELECT * FROM vehicles WHERE geotab_id = $1 AND deleted_at IS NULL`,
      [geotabId]
    );
    return result.rows[0];
  }

  static async findByCustomer(customerId) {
    const result = await query(
      `SELECT * FROM vehicles WHERE customer_id = $1 AND deleted_at IS NULL ORDER BY name ASC`,
      [customerId]
    );
    return result.rows;
  }

  static async findByLicensePlate(licensePlate) {
    const result = await query(
      `SELECT * FROM vehicles WHERE license_plate = $1 AND deleted_at IS NULL`,
      [licensePlate]
    );
    return result.rows[0];
  }

  static async updateLocation(vehicleId, latitude, longitude, address, accuracy) {
    const result = await query(
      `UPDATE vehicles 
       SET gps_latitude = $1, gps_longitude = $2, current_location_address = $3, 
           gps_accuracy = $4, gps_last_update = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND deleted_at IS NULL
       RETURNING *`,
      [latitude, longitude, address, accuracy, vehicleId]
    );
    return result.rows[0];
  }

  static async updateFuelLevel(vehicleId, fuelLevel) {
    const result = await query(
      `UPDATE vehicles SET fuel_level = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND deleted_at IS NULL RETURNING *`,
      [fuelLevel, vehicleId]
    );
    return result.rows[0];
  }

  static async updateMileage(vehicleId, mileage) {
    const result = await query(
      `UPDATE vehicles SET mileage = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND deleted_at IS NULL RETURNING *`,
      [mileage, vehicleId]
    );
    return result.rows[0];
  }

  static async assignDriver(vehicleId, driverId) {
    const result = await query(
      `UPDATE vehicles SET current_driver_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND deleted_at IS NULL RETURNING *`,
      [driverId, vehicleId]
    );
    return result.rows[0];
  }

  static async update(vehicleId, updateData) {
    const allowedFields = ['name', 'status', 'fuel_level', 'mileage', 'next_service_date', 'next_service_mileage'];
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
    values.push(vehicleId);

    const result = await query(
      `UPDATE vehicles SET ${fields.join(', ')} WHERE id = $${paramCount} AND deleted_at IS NULL RETURNING *`,
      values
    );

    return result.rows[0];
  }

  static async delete(vehicleId) {
    const result = await query(
      `UPDATE vehicles SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [vehicleId]
    );
    return result.rows[0];
  }
}

module.exports = {
  createVehiclesTable,
  Vehicle,
};
