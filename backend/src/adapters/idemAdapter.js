/**
 * Idem API Adapter
 * Handles all interactions with Idem API for trailer telematics
 * READY FOR INTEGRATION: Waiting for API endpoint, auth details, and data structure
 */

const axios = require('axios');
const logger = require('../utils/logger');
const { sessionSet, sessionGet } = require('../config/database');

class IdemAdapter {
  constructor() {
    this.endpoint = process.env.IDEM_API_ENDPOINT;
    this.authType = process.env.IDEM_AUTHENTICATION_TYPE;
    this.apiKey = process.env.IDEM_API_KEY;
    this.accountId = process.env.IDEM_ACCOUNT_ID;
    this.token = null;
    this.lastAuth = null;
  }

  /**
   * Check if Idem credentials are configured
   */
  isConfigured() {
    return !!(this.endpoint && this.authType && this.apiKey);
  }

  /**
   * Authenticate with Idem API
   */
  async authenticate() {
    try {
      if (!this.isConfigured()) {
        logger.warn('Idem credentials not configured');
        return false;
      }

      logger.info('Authenticating with Idem API...');

      const cacheKey = 'idem_session';
      const cachedToken = await sessionGet(cacheKey);

      if (cachedToken) {
        this.token = cachedToken;
        logger.debug('Using cached Idem token');
        return true;
      }

      // TODO: Implement authentication based on authType
      // Supported: API_KEY, OAUTH, BASIC_AUTH, TOKEN

      if (this.authType === 'API_KEY') {
        // Direct API key authentication
        this.token = this.apiKey;
      } else if (this.authType === 'OAUTH') {
        // OAuth flow (needs client_id, client_secret)
        // this.token = await this.authenticateOAuth();
      } else if (this.authType === 'BASIC_AUTH') {
        // Basic authentication
        // const encoded = Buffer.from(`${user}:${pass}`).toString('base64');
        // this.token = `Basic ${encoded}`;
      }

      // Cache token
      await sessionSet(cacheKey, this.token, 3600);

      logger.info('✓ Authenticated with Idem');
      this.lastAuth = new Date();
      return true;

    } catch (error) {
      logger.error('Idem authentication failed:', error.message);
      return false;
    }
  }

  /**
   * Get trailer data from Idem
   */
  async getTrailerData(trailerId) {
    try {
      if (!this.token) {
        await this.authenticate();
      }

      if (!this.isConfigured()) {
        throw new Error('Idem not configured');
      }

      logger.info(`Fetching trailer data from Idem: ${trailerId}`);

      const response = await axios.get(
        `${this.endpoint}/trailers/${trailerId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info(`✓ Retrieved trailer data: ${trailerId}`);
      return response.data;

    } catch (error) {
      logger.error(`Error fetching trailer data: ${trailerId}`, error.message);
      throw error;
    }
  }

  /**
   * Get EBPMS brake data
   */
  async getBrakeData(trailerId) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Idem not configured');
      }

      const response = await axios.get(
        `${this.endpoint}/trailers/${trailerId}/brake-data`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
          },
        }
      );

      return response.data;

    } catch (error) {
      logger.error(`Error fetching brake data: ${trailerId}`, error.message);
      throw error;
    }
  }

  /**
   * Get refrigeration unit data
   */
  async getRefrigerationData(trailerId) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Idem not configured');
      }

      const response = await axios.get(
        `${this.endpoint}/trailers/${trailerId}/refrigeration`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
          },
        }
      );

      return response.data;

    } catch (error) {
      logger.error(`Error fetching refrigeration data: ${trailerId}`, error.message);
      throw error;
    }
  }

  /**
   * Get trailer GPS location
   */
  async getTrailerLocation(trailerId) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Idem not configured');
      }

      const response = await axios.get(
        `${this.endpoint}/trailers/${trailerId}/location`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
          },
        }
      );

      return {
        trailerId,
        latitude: response.data.latitude,
        longitude: response.data.longitude,
        accuracy: response.data.accuracy,
        timestamp: response.data.timestamp,
      };

    } catch (error) {
      logger.error(`Error fetching trailer location: ${trailerId}`, error.message);
      throw error;
    }
  }

  /**
   * Get all trailers
   */
  async getAllTrailers() {
    try {
      if (!this.isConfigured()) {
        throw new Error('Idem not configured');
      }

      const response = await axios.get(
        `${this.endpoint}/trailers`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
          },
        }
      );

      logger.info(`✓ Retrieved ${response.data.length} trailers from Idem`);
      return response.data;

    } catch (error) {
      logger.error('Error fetching trailers from Idem:', error.message);
      throw error;
    }
  }

  /**
   * Batch get data for multiple trailers
   */
  async getMultipleTrailersData(trailerIds) {
    try {
      const results = [];

      for (const trailerId of trailerIds) {
        try {
          const data = await this.getTrailerData(trailerId);
          results.push({
            trailerId,
            status: 'success',
            data,
          });
        } catch (error) {
          logger.error(`Failed to fetch trailer ${trailerId}:`, error.message);
          results.push({
            trailerId,
            status: 'error',
            error: error.message,
          });
        }
      }

      return results;

    } catch (error) {
      logger.error('Batch fetch error:', error.message);
      throw error;
    }
  }

  /**
   * Refresh token if needed
   */
  async refreshTokenIfNeeded() {
    try {
      if (!this.token) {
        return await this.authenticate();
      }

      // Check if token is older than 55 minutes (for 1-hour expiry)
      if (this.lastAuth && Date.now() - this.lastAuth.getTime() > 3300000) {
        logger.warn('Idem token may be expired, refreshing...');
        return await this.authenticate();
      }

      return true;

    } catch (error) {
      logger.error('Token refresh error:', error.message);
      return false;
    }
  }

  /**
   * Get adapter status
   */
  getStatus() {
    return {
      configured: this.isConfigured(),
      authenticated: !!this.token,
      endpoint: this.endpoint,
      authType: this.authType,
      lastAuth: this.lastAuth,
    };
  }
}

module.exports = new IdemAdapter();
