/**
 * Database Seeding Script
 * Populate database with test data for development and testing
 * Run with: npm run seed
 */

require('dotenv').config({ path: '.env.local' });

const { query } = require('./src/config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const logger = require('./src/utils/logger');

const seed = async () => {
  try {
    logger.info('Starting database seeding...');

    // Create demo customer
    const customerId = uuidv4();
    await query(
      `INSERT INTO customers (id, name, email, status, subscription_plan, max_vehicles)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT DO NOTHING`,
      [customerId, 'Demo Fleet Company', 'demo@fleetco.com', 'active', 'professional', 50]
    );

    logger.info(`✓ Customer created: ${customerId}`);

    // Create demo admin user
    const adminId = uuidv4();
    const adminPasswordHash = await bcrypt.hash('AdminPassword123!', 10);
    await query(
      `INSERT INTO users (id, customer_id, email, password_hash, role, first_name, last_name, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT DO NOTHING`,
      [
        adminId,
        customerId,
        'admin@demo.com',
        adminPasswordHash,
        'admin',
        'Admin',
        'User',
        'active',
      ]
    );

    logger.info(`✓ Admin user created: admin@demo.com`);

    // Create demo manager user
    const managerId = uuidv4();
    const managerPasswordHash = await bcrypt.hash('ManagerPassword123!', 10);
    await query(
      `INSERT INTO users (id, customer_id, email, password_hash, role, first_name, last_name, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT DO NOTHING`,
      [
        managerId,
        customerId,
        'manager@demo.com',
        managerPasswordHash,
        'manager',
        'Manager',
        'User',
        'active',
      ]
    );

    logger.info(`✓ Manager user created: manager@demo.com`);

    // Create demo driver user
    const driverId = uuidv4();
    const driverPasswordHash = await bcrypt.hash('DriverPassword123!', 10);
    await query(
      `INSERT INTO users (id, customer_id, email, password_hash, role, first_name, last_name, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT DO NOTHING`,
      [
        driverId,
        customerId,
        'driver@demo.com',
        driverPasswordHash,
        'driver',
        'Driver',
        'User',
        'active',
      ]
    );

    logger.info(`✓ Driver user created: driver@demo.com`);

    // Create demo vehicles
    const vehicleIds = [];
    const vehicles = [
      {
        name: 'Volvo FH16 - Unit 001',
        licensePlate: 'VLV-FH16-001',
        vin: 'YV1XZ58D0D2246137',
        make: 'Volvo',
        model: 'FH16',
        year: 2023,
        vehicleType: 'truck',
      },
      {
        name: 'Scania R450 - Unit 002',
        licensePlate: 'SCA-R450-002',
        vin: '1Z0DA1D1004S0A002',
        make: 'Scania',
        model: 'R450',
        year: 2022,
        vehicleType: 'truck',
      },
      {
        name: 'MAN TGX - Unit 003',
        licensePlate: 'MAN-TGX-003',
        vin: 'WME4D5CD4H0000001',
        make: 'MAN',
        model: 'TGX',
        year: 2023,
        vehicleType: 'truck',
      },
      {
        name: 'Mercedes Sprinter - Unit 004',
        licensePlate: 'MBZ-SPR-004',
        vin: 'WVWZZZ3CZ9E123456',
        make: 'Mercedes',
        model: 'Sprinter',
        year: 2022,
        vehicleType: 'van',
      },
    ];

    for (const vehicle of vehicles) {
      const vehicleId = uuidv4();
      vehicleIds.push(vehicleId);

      await query(
        `INSERT INTO vehicles (id, customer_id, name, license_plate, vin, make, model, year, vehicle_type, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT DO NOTHING`,
        [
          vehicleId,
          customerId,
          vehicle.name,
          vehicle.licensePlate,
          vehicle.vin,
          vehicle.make,
          vehicle.model,
          vehicle.year,
          vehicle.vehicleType,
          'active',
        ]
      );

      logger.info(`✓ Vehicle created: ${vehicle.name}`);
    }

    // Create demo drivers
    const drivers = [
      {
        firstName: 'John',
        lastName: 'Anderson',
        email: 'john.anderson@demo.com',
        phone: '+1234567890',
        licenseNumber: 'DL123456789',
      },
      {
        firstName: 'Sarah',
        lastName: 'Martinez',
        email: 'sarah.martinez@demo.com',
        phone: '+1234567891',
        licenseNumber: 'DL987654321',
      },
      {
        firstName: 'Michael',
        lastName: 'Thompson',
        email: 'michael.thompson@demo.com',
        phone: '+1234567892',
        licenseNumber: 'DL555555555',
      },
    ];

    for (const driver of drivers) {
      await query(
        `INSERT INTO drivers (customer_id, first_name, last_name, email, phone, license_number, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING`,
        [
          customerId,
          driver.firstName,
          driver.lastName,
          driver.email,
          driver.phone,
          driver.licenseNumber,
          'active',
        ]
      );

      logger.info(`✓ Driver created: ${driver.firstName} ${driver.lastName}`);
    }

    // Create demo trailers
    const trailers = [
      {
        name: 'Refrigerated Trailer 001',
        licensePlate: 'REF-TR-001',
        trailerType: 'refrigerated',
        hasRefrigeration: true,
      },
      {
        name: 'Box Trailer 002',
        licensePlate: 'BOX-TR-002',
        trailerType: 'box',
        hasRefrigeration: false,
      },
      {
        name: 'Flatbed Trailer 003',
        licensePlate: 'FLT-TR-003',
        trailerType: 'flatbed',
        hasRefrigeration: false,
      },
    ];

    for (const trailer of trailers) {
      const trailerId = uuidv4();

      await query(
        `INSERT INTO trailers (id, customer_id, name, license_plate, trailer_type, has_refrigeration, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING`,
        [
          trailerId,
          customerId,
          trailer.name,
          trailer.licensePlate,
          trailer.trailerType,
          trailer.hasRefrigeration,
          'active',
        ]
      );

      logger.info(`✓ Trailer created: ${trailer.name}`);
    }

    // Create some sample telematics data
    for (const vehicleId of vehicleIds) {
      for (let i = 0; i < 10; i++) {
        const timestamp = new Date(Date.now() - i * 3600000); // Last 10 hours

        await query(
          `INSERT INTO telematics_data (customer_id, vehicle_id, latitude, longitude, speed, fuel_level, odometer, engine_status, rpm, data_source)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            customerId,
            vehicleId,
            40.7128 + Math.random() * 0.1,
            -74.006 + Math.random() * 0.1,
            Math.floor(Math.random() * 100),
            50 + Math.floor(Math.random() * 40),
            100000 + Math.random() * 5000,
            true,
            Math.floor(Math.random() * 3000),
            'geotab',
          ]
        );
      }

      logger.info(`✓ Telematics data created for vehicle ${vehicleId}`);
    }

    logger.info(`\n✅ Database seeding completed successfully!\n`);

    logger.info('Demo Credentials:');
    logger.info('================');
    logger.info('Admin: admin@demo.com / AdminPassword123!');
    logger.info('Manager: manager@demo.com / ManagerPassword123!');
    logger.info('Driver: driver@demo.com / DriverPassword123!');
    logger.info('Customer ID:', customerId);
    logger.info('\n✓ Ready for testing!');

    process.exit(0);

  } catch (error) {
    logger.error('Seeding error:', error.message);
    process.exit(1);
  }
};

seed();
