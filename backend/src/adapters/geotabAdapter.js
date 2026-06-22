/**
 * Geotab API Adapter
 * Handles all interactions with Geotab API for vehicle telematics
 */

const axios = require('axios');
const logger = require('../utils/logger');
const { sessionSet, sessionGet } = require('../config/redis');

class GeotabAdapter {
  constructor() {
    this.endpoint = process.env.GEOTAB_API_ENDPOINT;
    this.username = process.env.GEOTAB_USERNAME;
    this.password = process.env.GEOTAB_PASSWORD;
    this.database = process.env.GEOTAB_DATABASE;
    this.server = process.env.GEOTAB_SERVER;
    this.sessionId = null;
    this.lastAuth = null;
  }

  /**
   * Authenticate with Geotab API
   */
  async authenticate() {
    try {
      const cacheKey = 'geotab_session';
      const cachedSession = await sessionGet(cacheKey);

      if (cachedSession && cachedSession.sessionId) {
        this.sessionId = cachedSession.sessionId;
        logger.debug('Using cached Geotab session');
        return true;
      }

      logger.info('Authenticating with Geotab API...');

      const response = await axios.post(`${this.endpoint}`, {
        method: 'Authenticate',
        params: {
          userName: this.username,
          password: this.password,
          database: this.database,
          server: this.server,
        },
      });

      if (response.data?.result?.sessionId) {
        this.sessionId = response.data.result.sessionId;
        this.lastAuth = new Date();

        // Cache session for 8 hours
        await sessionSet(cacheKey, { sessionId: this.sessionId }, 28800);

        logger.info('✓ Successfully authenticated with Geotab');
        return true;
      }

      throw new Error('No session ID returned from Geotab');

    } catch (error) {
      logger.error('Geotab authentication failed:', error.message);
      throw error;
    }
  }

  /**
   * Get all devices from Geotab
   */
  async getDevices() {
    try {
      if (!this.sessionId) {
        await this.authenticate();
      }

      logger.info('Fetching devices from Geotab...');

      const response = await axios.post(`${this.endpoint}`, {
        method: 'Get',
        params: {
          typeName: 'Device',
          search: {
            isActiveDevice: true,
          },
        },
        sessionId: this.sessionId,
      });

      const devices = response.data?.result || [];
      logger.info(`✓ Fetched ${devices.length} devices from Geotab`);

      return devices;

    } catch (error) {
      logger.error('Error fetching devices from Geotab:', error.message);
      throw error;
    }
  }

  /**
   * Get real-time location for a device
   */
  async getDeviceLocation(deviceId) {
    try {
      if (!this.sessionId) {
        await this.authenticate();
      }

      const response = await axios.post(`${this.endpoint}`, {
        method: 'Get',
        params: {
          typeName: 'LogRecord',
          search: {
            deviceSearch: { id: deviceId },
          },
          resultsLimit: 1,
        },
        sessionId: this.sessionId,
      });

      const records = response.data?.result || [];
      return records[0] || null;

    } catch (error) {
      logger.error(`Error fetching location for device ${deviceId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get vehicle diagnostic data
   */
  async getDeviceDiagnostics(deviceId) {
    try {
      if (!this.sessionId) {
        await this.authenticate();
      }

      const response = await axios.post(`${this.endpoint}`, {
        method: 'Get',
        params: {
          typeName: 'Diagnostic',
          search: {
            id: {
              'like': '%Speed%',
            },
          },
        },
        sessionId: this.sessionId,
      });

      return response.data?.result || [];

    } catch (error) {
      logger.error('Error fetching diagnostics from Geotab:', error.message);
      throw error;
    }
  }

  /**
   * Get status data for a device
   */
  async getDeviceStatus(deviceId) {
    try {
      if (!this.sessionId) {
        await this.authenticate();
      }

      const response = await axios.post(`${this.endpoint}`, {
        method: 'Get',
        params: {
          typeName: 'StatusData',
          search: {
            deviceSearch: { id: deviceId },
          },
          resultsLimit: 100,
        },
        sessionId: this.sessionId,
      });

      return response.data?.result || [];

    } catch (error) {
      logger.error(`Error fetching status for device ${deviceId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get fault codes for a device
   */
  async getDeviceFaults(deviceId, days = 7) {
    try {
      if (!this.sessionId) {
        await this.authenticate();
      }

      const sinceTime = new Date();
      sinceTime.setDate(sinceTime.getDate() - days);

      const response = await axios.post(`${this.endpoint}`, {
        method: 'Get',
        params: {
          typeName: 'Fault',
          search: {
            deviceSearch: { id: deviceId },
            dateTime: {
              'after': sinceTime.toISOString(),
            },
          },
          resultsLimit: 1000,
        },
        sessionId: this.sessionId,
      });

      return response.data?.result || [];

    } catch (error) {
      logger.error(`Error fetching faults for device ${deviceId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get trip data
   */
  async getTrips(deviceId, startTime, endTime) {
    try {
      if (!this.sessionId) {
        await this.authenticate();
      }

      const response = await axios.post(`${this.endpoint}`, {
        method: 'Get',
        params: {
          typeName: 'Trip',
          search: {
            deviceSearch: { id: deviceId },
            dateTime: {
              'after': startTime.toISOString(),
              'before': endTime.toISOString(),
            },
          },
          resultsLimit: 10000,
        },
        sessionId: this.sessionId,
      });

      return response.data?.result || [];

    } catch (error) {
      logger.error(`Error fetching trips for device ${deviceId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get driver information
   */
  async getDrivers() {
    try {
      if (!this.sessionId) {
        await this.authenticate();
      }

      const response = await axios.post(`${this.endpoint}`, {
        method: 'Get',
        params: {
          typeName: 'Driver',
          search: {
            isActiveDriver: true,
          },
        },
        sessionId: this.sessionId,
      });

      return response.data?.result || [];

    } catch (error) {
      logger.error('Error fetching drivers from Geotab:', error.message);
      throw error;
    }
  }

  /**
   * Batch get latest locations for multiple devices
   */
  async getMultipleDeviceLocations(deviceIds) {
    try {
      const locations = [];

      for (const deviceId of deviceIds) {
        const location = await this.getDeviceLocation(deviceId);
        if (location) {
          locations.push({
            deviceId,
            ...location,
          });
        }
      }

      return locations;

    } catch (error) {
      logger.error('Error fetching multiple device locations:', error.message);
      throw error;
    }
  }

  /**
   * Check if session is still valid
   */
  async isSessionValid() {
    try {
      if (!this.sessionId) {
        return false;
      }

      const response = await axios.post(`${this.endpoint}`, {
        method: 'GetVersion',
        sessionId: this.sessionId,
      });

      return !!response.data?.result;

    } catch (error) {
      logger.warn('Geotab session validation failed:', error.message);
      return false;
    }
  }

  /**
   * Refresh session if needed
   */
  async refreshSessionIfNeeded() {
    const isValid = await this.isSessionValid();

    if (!isValid) {
      logger.warn('Geotab session expired, re-authenticating...');
      await this.authenticate();
    }

    return this.sessionId;
  }
}

module.exports = new GeotabAdapter();
