/**
 * Report Generation Service
 * Generate comprehensive fleet reports and analytics
 */

const logger = require('../utils/logger');
const { query } = require('../config/database');

class ReportService {
  /**
   * Generate fleet performance report
   */
  static async generateFleetReport(customerId, startDate, endDate) {
    try {
      logger.info(`Generating fleet report for ${customerId}`);

      const report = {
        customerId,
        reportType: 'Fleet Performance',
        generatedAt: new Date(),
        period: {
          start: startDate,
          end: endDate,
        },
        summary: await this.getFleetSummary(customerId, startDate, endDate),
        vehicles: await this.getVehicleReports(customerId, startDate, endDate),
        drivers: await this.getDriverReports(customerId, startDate, endDate),
        alerts: await this.getAlertsSummary(customerId, startDate, endDate),
        compliance: await this.getComplianceSummary(customerId, startDate, endDate),
      };

      logger.info(`✓ Fleet report generated`);
      return report;

    } catch (error) {
      logger.error('Report generation error:', error.message);
      throw error;
    }
  }

  /**
   * Get fleet summary metrics
   */
  static async getFleetSummary(customerId, startDate, endDate) {
    try {
      const result = await query(
        `SELECT 
          COUNT(DISTINCT vehicle_id) as total_vehicles,
          COUNT(*) as total_data_points,
          AVG(EXTRACT(EPOCH FROM (created_at - LAG(created_at) OVER (ORDER BY created_at))) / 3600)::int as avg_distance_km,
          AVG(fuel_level) as avg_fuel_level,
          MAX(external_temperature) as max_temperature,
          MIN(external_temperature) as min_temperature
        FROM telematics_data
        WHERE customer_id = $1 AND created_at BETWEEN $2 AND $3`,
        [customerId, startDate, endDate]
      );

      return result.rows[0];

    } catch (error) {
      logger.error('Error getting fleet summary:', error.message);
      return {};
    }
  }

  /**
   * Get individual vehicle reports
   */
  static async getVehicleReports(customerId, startDate, endDate) {
    try {
      const result = await query(
        `SELECT 
          v.id,
          v.name,
          v.license_plate,
          COUNT(td.id) as data_points,
          AVG(td.speed) as avg_speed,
          MAX(td.speed) as max_speed,
          AVG(td.fuel_level) as avg_fuel_level,
          SUM(EXTRACT(EPOCH FROM (td.created_at - LAG(td.created_at) OVER (PARTITION BY td.vehicle_id ORDER BY td.created_at))) / 3600)::int as total_hours,
          COUNT(CASE WHEN td.harsh_acceleration > 0 THEN 1 END) as harsh_accelerations,
          COUNT(CASE WHEN td.harsh_braking > 0 THEN 1 END) as harsh_brakings,
          COUNT(CASE WHEN td.harsh_cornering > 0 THEN 1 END) as harsh_corners
        FROM vehicles v
        LEFT JOIN telematics_data td ON v.id = td.vehicle_id AND td.created_at BETWEEN $2 AND $3
        WHERE v.customer_id = $1
        GROUP BY v.id, v.name, v.license_plate`,
        [customerId, startDate, endDate]
      );

      return result.rows;

    } catch (error) {
      logger.error('Error getting vehicle reports:', error.message);
      return [];
    }
  }

  /**
   * Get driver reports
   */
  static async getDriverReports(customerId, startDate, endDate) {
    try {
      const result = await query(
        `SELECT 
          d.id,
          d.first_name,
          d.last_name,
          d.license_number,
          v.name as vehicle_name,
          COUNT(td.id) as data_points,
          COUNT(CASE WHEN td.harsh_acceleration > 0 THEN 1 END) as harsh_accelerations,
          COUNT(CASE WHEN td.harsh_braking > 0 THEN 1 END) as harsh_brakings,
          COUNT(CASE WHEN td.harsh_cornering > 0 THEN 1 END) as harsh_corners,
          ROUND(100.0 * (
            COUNT(CASE WHEN td.harsh_acceleration > 0 OR td.harsh_braking > 0 OR td.harsh_cornering > 0 THEN 1 END) /
            NULLIF(COUNT(td.id), 0)
          ), 2) as safety_score
        FROM drivers d
        LEFT JOIN vehicles v ON d.id = v.current_driver_id
        LEFT JOIN telematics_data td ON v.id = td.vehicle_id AND td.created_at BETWEEN $2 AND $3
        WHERE d.customer_id = $1
        GROUP BY d.id, d.first_name, d.last_name, d.license_number, v.name`,
        [customerId, startDate, endDate]
      );

      return result.rows;

    } catch (error) {
      logger.error('Error getting driver reports:', error.message);
      return [];
    }
  }

  /**
   * Get alerts summary
   */
  static async getAlertsSummary(customerId, startDate, endDate) {
    try {
      const result = await query(
        `SELECT 
          severity,
          COUNT(*) as count,
          COUNT(*) FILTER (WHERE status = 'active') as active,
          COUNT(*) FILTER (WHERE status = 'acknowledged') as acknowledged,
          COUNT(*) FILTER (WHERE status = 'resolved') as resolved
        FROM alerts
        WHERE customer_id = $1 AND created_at BETWEEN $2 AND $3
        GROUP BY severity`,
        [customerId, startDate, endDate]
      );

      return result.rows;

    } catch (error) {
      logger.error('Error getting alerts summary:', error.message);
      return [];
    }
  }

  /**
   * Get compliance summary
   */
  static async getComplianceSummary(customerId, startDate, endDate) {
    try {
      const driverLicenses = await query(
        `SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN license_expiry > NOW() THEN 1 END) as valid,
          COUNT(CASE WHEN license_expiry <= NOW() THEN 1 END) as expired
        FROM drivers
        WHERE customer_id = $1`,
        [customerId]
      );

      const maintenanceAlerts = await query(
        `SELECT 
          COUNT(*) as maintenance_alerts,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as pending
        FROM alerts
        WHERE customer_id = $1 AND rule_id = 'brake-wear' AND created_at BETWEEN $2 AND $3`,
        [customerId, startDate, endDate]
      );

      return {
        drivers: driverLicenses.rows[0],
        maintenance: maintenanceAlerts.rows[0],
      };

    } catch (error) {
      logger.error('Error getting compliance summary:', error.message);
      return {};
    }
  }

  /**
   * Generate fuel efficiency report
   */
  static async generateFuelReport(customerId, startDate, endDate) {
    try {
      const result = await query(
        `SELECT 
          v.id,
          v.name,
          v.license_plate,
          AVG(td.fuel_level) as avg_fuel_level,
          MIN(td.fuel_level) as min_fuel_level,
          COUNT(CASE WHEN td.fuel_level < 20 THEN 1 END) as low_fuel_alerts,
          COUNT(td.id) as data_points
        FROM vehicles v
        LEFT JOIN telematics_data td ON v.id = td.vehicle_id AND td.created_at BETWEEN $2 AND $3
        WHERE v.customer_id = $1
        GROUP BY v.id, v.name, v.license_plate
        ORDER BY avg_fuel_level ASC`,
        [customerId, startDate, endDate]
      );

      return {
        reportType: 'Fuel Efficiency',
        generatedAt: new Date(),
        period: { start: startDate, end: endDate },
        data: result.rows,
      };

    } catch (error) {
      logger.error('Error generating fuel report:', error.message);
      throw error;
    }
  }

  /**
   * Generate safety report
   */
  static async generateSafetyReport(customerId, startDate, endDate) {
    try {
      const result = await query(
        `SELECT 
          d.first_name,
          d.last_name,
          v.name as vehicle_name,
          SUM(td.harsh_acceleration) as total_harsh_acceleration,
          SUM(td.harsh_braking) as total_harsh_braking,
          SUM(td.harsh_cornering) as total_harsh_corners,
          ROUND(
            100.0 * (1 - (
              (SUM(td.harsh_acceleration) + SUM(td.harsh_braking) + SUM(td.harsh_cornering))::float /
              NULLIF(COUNT(td.id), 0)
            )), 2
          ) as safety_score
        FROM drivers d
        LEFT JOIN vehicles v ON d.id = v.current_driver_id
        LEFT JOIN telematics_data td ON v.id = td.vehicle_id AND td.created_at BETWEEN $2 AND $3
        WHERE d.customer_id = $1
        GROUP BY d.id, d.first_name, d.last_name, v.name
        ORDER BY safety_score DESC`,
        [customerId, startDate, endDate]
      );

      return {
        reportType: 'Safety Analysis',
        generatedAt: new Date(),
        period: { start: startDate, end: endDate },
        data: result.rows,
      };

    } catch (error) {
      logger.error('Error generating safety report:', error.message);
      throw error;
    }
  }

  /**
   * Export report to format
   */
  static exportReport(report, format = 'json') {
    try {
      switch (format.toLowerCase()) {
        case 'json':
          return JSON.stringify(report, null, 2);

        case 'csv':
          return this.reportToCSV(report);

        default:
          return JSON.stringify(report);
      }

    } catch (error) {
      logger.error('Error exporting report:', error.message);
      throw error;
    }
  }

  /**
   * Convert report to CSV
   */
  static reportToCSV(report) {
    try {
      let csv = `Fleet Report\n`;
      csv += `Generated: ${report.generatedAt}\n`;
      csv += `Period: ${report.period.start} to ${report.period.end}\n\n`;

      // Summary section
      csv += `Fleet Summary\n`;
      csv += Object.entries(report.summary).map(([k, v]) => `${k},${v}`).join('\n');
      csv += '\n\n';

      // Vehicles section
      csv += `Vehicle Performance\n`;
      if (report.vehicles && report.vehicles.length > 0) {
        csv += Object.keys(report.vehicles[0]).join(',') + '\n';
        report.vehicles.forEach(v => {
          csv += Object.values(v).join(',') + '\n';
        });
      }

      return csv;

    } catch (error) {
      logger.error('Error converting to CSV:', error.message);
      throw error;
    }
  }
}

module.exports = ReportService;
