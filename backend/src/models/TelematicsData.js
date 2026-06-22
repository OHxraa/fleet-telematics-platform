/**
 * Database Migration: Telematics Data Table
 * Stores real-time telematics data from vehicles
 */

const { query } = require('./database');
const logger = require('../utils/logger');

const createTelematicsDataTable = async () => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS telematics_data (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_id UUID NOT NULL,
      vehicle_id UUID NOT NULL,
      
      -- Location Data (Geotab)
      latitude DECIMAL(10, 8),
      longitude DECIMAL(11, 8),
      location_accuracy DECIMAL(10, 2),
      location_heading INT,
      location_speed DECIMAL(8, 2),
      
      -- Vehicle Status
      engine_status BOOLEAN,
      engine_runtime BIGINT,
      rpm INT,
      
      -- Fuel Data
      fuel_level DECIMAL(5, 2),
      fuel_used DECIMAL(10, 2),
      
      -- Odometer & Distance
      odometer INT,
      trip_distance DECIMAL(10, 2),
      trip_start_time TIMESTAMP,
      trip_end_time TIMESTAMP,
      
      -- EBPMS (Electronic Brake Performance Monitoring System) - From Idem
      ebpms_pressure DECIMAL(8, 2),
      ebpms_temperature DECIMAL(8, 2),
      ebpms_status VARCHAR(50),
      
      -- Brake Data (BPW/Idem)
      brake_pressure DECIMAL(8, 2),
      brake_wear_percentage DECIMAL(5, 2),
      brake_fluid_level DECIMAL(5, 2),
      
      -- Refrigerated Unit Data (Idem) - For temperature-controlled trailers
      fridge_current_temp DECIMAL(8, 2),
      fridge_target_temp DECIMAL(8, 2),
      fridge_door_open BOOLEAN,
      fridge_compressor_status VARCHAR(50),
      
      -- Trailer Data (Idem)
      trailer_id UUID,
      trailer_latitude DECIMAL(10, 8),
      trailer_longitude DECIMAL(11, 8),
      trailer_location_last_update TIMESTAMP,
      
      -- Driver Behavior
      harsh_acceleration INT DEFAULT 0,
      harsh_braking INT DEFAULT 0,
      harsh_cornering INT DEFAULT 0,
      
      -- Environmental
      external_temperature DECIMAL(8, 2),
      humidity_percentage DECIMAL(5, 2),
      
      -- Diagnostics
      dtc_codes TEXT[],
      check_engine_light BOOLEAN,
      
      -- Metadata
      data_source VARCHAR(50) CHECK (data_source IN ('geotab', 'idem', 'merged')),
      geotab_timestamp TIMESTAMP,
      idem_timestamp TIMESTAMP,
      received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      -- Constraints
      CONSTRAINT fk_telematics_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
      CONSTRAINT fk_telematics_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
      CONSTRAINT fk_telematics_trailer FOREIGN KEY (trailer_id) REFERENCES trailers(id)
    );

    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_telematics_vehicle_id ON telematics_data(vehicle_id);
    CREATE INDEX IF NOT EXISTS idx_telematics_customer_id ON telematics_data(customer_id);
    CREATE INDEX IF NOT EXISTS idx_telematics_timestamp ON telematics_data(received_at DESC);
    CREATE INDEX IF NOT EXISTS idx_telematics_location ON telematics_data(latitude, longitude);
    CREATE INDEX IF NOT EXISTS idx_telematics_trailer_id ON telematics_data(trailer_id);
    
    -- Partition by date for better performance (optional - commented out)
    -- CREATE TABLE telematics_data_2024_01 PARTITION OF telematics_data
    -- FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
  `;

  try {
    await query(createTableSQL);
    logger.info('✓ Telematics Data table created');
    return true;
  } catch (error) {
    logger.error('Error creating telematics_data table:', error.message);
    throw error;
  }
};

// TelematicsData class for queries
class TelematicsData {
  static async create(telematicsData) {
    const keys = Object.keys(telematicsData);
    const values = Object.values(telematicsData);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

    const result = await query(
      `INSERT INTO telematics_data (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`,
      values
    );

    return result.rows[0];
  }

  static async findLatestByVehicle(vehicleId, limit = 100) {
    const result = await query(
      `SELECT * FROM telematics_data WHERE vehicle_id = $1 ORDER BY received_at DESC LIMIT $2`,
      [vehicleId, limit]
    );
    return result.rows;
  }

  static async findByVehicleAndTimeRange(vehicleId, startTime, endTime) {
    const result = await query(
      `SELECT * FROM telematics_data 
       WHERE vehicle_id = $1 AND received_at BETWEEN $2 AND $3
       ORDER BY received_at DESC`,
      [vehicleId, startTime, endTime]
    );
    return result.rows;
  }

  static async findLatestByCustomer(customerId, limit = 50) {
    const result = await query(
      `SELECT * FROM telematics_data 
       WHERE customer_id = $1 
       ORDER BY received_at DESC 
       LIMIT $2`,
      [customerId, limit]
    );
    return result.rows;
  }

  static async getVehicleStats(vehicleId, days = 7) {
    const result = await query(
      `SELECT 
        vehicle_id,
        COUNT(*) as data_points,
        MAX(odometer) as total_distance,
        AVG(engine_runtime) as avg_runtime,
        MAX(fuel_level) as max_fuel,
        MIN(fuel_level) as min_fuel,
        AVG(external_temperature) as avg_temp,
        SUM(harsh_acceleration) as total_harsh_acceleration,
        SUM(harsh_braking) as total_harsh_braking,
        SUM(harsh_cornering) as total_harsh_cornering
       FROM telematics_data
       WHERE vehicle_id = $1 AND received_at >= NOW() - INTERVAL '1 day' * $2
       GROUP BY vehicle_id`,
      [vehicleId, days]
    );
    return result.rows[0];
  }

  static async getCustomerFleetStats(customerId, days = 7) {
    const result = await query(
      `SELECT 
        customer_id,
        COUNT(DISTINCT vehicle_id) as active_vehicles,
        COUNT(*) as total_data_points,
        AVG(speed) as avg_fleet_speed,
        MAX(odometer) as fleet_total_distance
       FROM telematics_data
       WHERE customer_id = $1 AND received_at >= NOW() - INTERVAL '1 day' * $2
       GROUP BY customer_id`,
      [customerId, days]
    );
    return result.rows[0];
  }

  static async cleanOldData(retentionDays = 90) {
    const result = await query(
      `DELETE FROM telematics_data WHERE received_at < NOW() - INTERVAL '1 day' * $1`,
      [retentionDays]
    );
    logger.info(`Cleaned ${result.rowCount} old telematics records`);
    return result.rowCount;
  }
}

module.exports = {
  createTelematicsDataTable,
  TelematicsData,
};
