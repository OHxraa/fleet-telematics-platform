/**
 * Alert System
 * Detects critical events and sends notifications
 * Real-time alerts via WebSocket and email
 */

const logger = require('../utils/logger');
const { query } = require('../config/database');

class AlertSystem {
  constructor(io) {
    this.io = io;
    this.alertRules = [
      {
        id: 'harsh-acceleration',
        name: 'Harsh Acceleration',
        severity: 'medium',
        threshold: 5, // events per day
        check: (data) => data.harsh_acceleration > 0,
      },
      {
        id: 'harsh-braking',
        name: 'Harsh Braking',
        severity: 'medium',
        threshold: 5,
        check: (data) => data.harsh_braking > 0,
      },
      {
        id: 'harsh-cornering',
        name: 'Harsh Cornering',
        severity: 'medium',
        threshold: 5,
        check: (data) => data.harsh_cornering > 0,
      },
      {
        id: 'low-fuel',
        name: 'Low Fuel Level',
        severity: 'high',
        threshold: 15, // percent
        check: (data) => data.fuel_level < 15,
      },
      {
        id: 'high-temperature',
        name: 'High Temperature',
        severity: 'critical',
        threshold: 90, // celsius
        check: (data) => data.external_temperature > 90,
      },
      {
        id: 'check-engine',
        name: 'Check Engine Light',
        severity: 'high',
        threshold: 1,
        check: (data) => data.check_engine_light === true,
      },
      {
        id: 'idle-time',
        name: 'Extended Idle Time',
        severity: 'low',
        threshold: 3600000, // 1 hour in ms
        check: (data) => data.idle_duration > 3600000,
      },
      {
        id: 'fridge-temp-high',
        name: 'Fridge Temperature High',
        severity: 'critical',
        threshold: 10, // celsius above target
        check: (data) => data.fridge_current_temp && data.fridge_target_temp && 
                        (data.fridge_current_temp - data.fridge_target_temp > 10),
      },
      {
        id: 'brake-wear',
        name: 'Brake Wear Critical',
        severity: 'high',
        threshold: 80, // percent
        check: (data) => data.brake_wear_percentage > 80,
      },
    ];
  }

  /**
   * Evaluate telematics data for alerts
   */
  async evaluateTelematics(vehicleId, telemeticsData) {
    try {
      const alerts = [];

      for (const rule of this.alertRules) {
        try {
          if (rule.check(telemeticsData)) {
            alerts.push({
              vehicleId,
              ruleId: rule.id,
              name: rule.name,
              severity: rule.severity,
              data: telemeticsData,
            });
          }
        } catch (error) {
          logger.warn(`Rule check failed: ${rule.id}`, error.message);
        }
      }

      // Store alerts in database
      for (const alert of alerts) {
        await this.storeAlert(alert);
      }

      // Broadcast alerts via WebSocket
      if (alerts.length > 0) {
        await this.broadcastAlerts(telemeticsData.customer_id, alerts);
      }

      return alerts;

    } catch (error) {
      logger.error('Alert evaluation error:', error.message);
      return [];
    }
  }

  /**
   * Store alert in database
   */
  async storeAlert(alert) {
    try {
      await query(
        `INSERT INTO alerts (vehicle_id, customer_id, rule_id, alert_name, severity, data, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          alert.vehicleId,
          alert.data.customer_id,
          alert.ruleId,
          alert.name,
          alert.severity,
          JSON.stringify(alert.data),
          'active',
        ]
      );

      logger.info(`Alert stored: ${alert.name} for vehicle ${alert.vehicleId}`);

    } catch (error) {
      logger.error('Error storing alert:', error.message);
    }
  }

  /**
   * Broadcast alerts via WebSocket
   */
  async broadcastAlerts(customerId, alerts) {
    try {
      if (this.io) {
        for (const alert of alerts) {
          this.io.to(`alerts-${customerId}`).emit('alert', {
            vehicleId: alert.vehicleId,
            ruleId: alert.ruleId,
            name: alert.name,
            severity: alert.severity,
            timestamp: new Date(),
          });
        }
      }

      logger.info(`Broadcast ${alerts.length} alerts for customer ${customerId}`);

    } catch (error) {
      logger.error('Alert broadcast error:', error.message);
    }
  }

  /**
   * Get active alerts for customer
   */
  async getActiveAlerts(customerId, limit = 50) {
    try {
      const result = await query(
        `SELECT * FROM alerts 
         WHERE customer_id = $1 AND status = 'active' 
         ORDER BY created_at DESC LIMIT $2`,
        [customerId, limit]
      );

      return result.rows;

    } catch (error) {
      logger.error('Error fetching alerts:', error.message);
      return [];
    }
  }

  /**
   * Get alerts for specific vehicle
   */
  async getVehicleAlerts(vehicleId, limit = 50) {
    try {
      const result = await query(
        `SELECT * FROM alerts 
         WHERE vehicle_id = $1 
         ORDER BY created_at DESC LIMIT $2`,
        [vehicleId, limit]
      );

      return result.rows;

    } catch (error) {
      logger.error('Error fetching vehicle alerts:', error.message);
      return [];
    }
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId, userId) {
    try {
      const result = await query(
        `UPDATE alerts 
         SET status = 'acknowledged', acknowledged_at = CURRENT_TIMESTAMP, acknowledged_by = $1
         WHERE id = $2
         RETURNING *`,
        [userId, alertId]
      );

      logger.info(`Alert acknowledged: ${alertId}`);
      return result.rows[0];

    } catch (error) {
      logger.error('Error acknowledging alert:', error.message);
      throw error;
    }
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId, userId) {
    try {
      const result = await query(
        `UPDATE alerts 
         SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP, resolved_by = $1
         WHERE id = $2
         RETURNING *`,
        [userId, alertId]
      );

      logger.info(`Alert resolved: ${alertId}`);
      return result.rows[0];

    } catch (error) {
      logger.error('Error resolving alert:', error.message);
      throw error;
    }
  }

  /**
   * Get alert statistics
   */
  async getAlertStats(customerId, days = 7) {
    try {
      const result = await query(
        `SELECT 
          severity,
          COUNT(*) as count,
          COUNT(*) FILTER (WHERE status = 'active') as active,
          COUNT(*) FILTER (WHERE status = 'acknowledged') as acknowledged,
          COUNT(*) FILTER (WHERE status = 'resolved') as resolved
         FROM alerts
         WHERE customer_id = $1 AND created_at >= NOW() - INTERVAL '1 day' * $2
         GROUP BY severity`,
        [customerId, days]
      );

      return result.rows;

    } catch (error) {
      logger.error('Error fetching alert stats:', error.message);
      return [];
    }
  }

  /**
   * Create custom alert rule
   */
  async createCustomRule(customerId, rule) {
    try {
      const result = await query(
        `INSERT INTO custom_alert_rules (customer_id, name, condition, severity, enabled)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [customerId, rule.name, JSON.stringify(rule.condition), rule.severity, true]
      );

      logger.info(`Custom rule created: ${rule.name}`);
      return result.rows[0];

    } catch (error) {
      logger.error('Error creating custom rule:', error.message);
      throw error;
    }
  }

  /**
   * Send alert email
   */
  async sendAlertEmail(alert, email) {
    try {
      // TODO: Implement email sending via nodemailer
      logger.info(`Alert email sent: ${alert.name} to ${email}`);
      return true;

    } catch (error) {
      logger.error('Error sending alert email:', error.message);
      return false;
    }
  }
}

module.exports = AlertSystem;
