/**
 * WebSocket Handlers
 * Real-time vehicle tracking, telematics, and alerts
 * Socket.io integration for live data streaming
 */

const logger = require('../utils/logger');

class WebSocketHandlers {
  constructor(io) {
    this.io = io;
    this.userConnections = new Map(); // userId -> [socketIds]
    this.vehicleSubscriptions = new Map(); // vehicleId -> [userIds]
  }

  /**
   * Initialize WebSocket event handlers
   */
  initialize() {
    this.io.on('connection', (socket) => {
      logger.info(`WebSocket connected: ${socket.id}`);

      // Authentication
      socket.on('authenticate', (data) => this.handleAuthenticate(socket, data));

      // Vehicle subscriptions
      socket.on('subscribe-vehicle', (data) => this.handleSubscribeVehicle(socket, data));
      socket.on('unsubscribe-vehicle', (data) => this.handleUnsubscribeVehicle(socket, data));

      // Fleet subscriptions
      socket.on('subscribe-fleet', (data) => this.handleSubscribeFleet(socket, data));
      socket.on('unsubscribe-fleet', (data) => this.handleUnsubscribeFleet(socket, data));

      // Alerts
      socket.on('subscribe-alerts', (data) => this.handleSubscribeAlerts(socket, data));

      // Keep-alive
      socket.on('ping', () => socket.emit('pong'));

      // Disconnect
      socket.on('disconnect', () => this.handleDisconnect(socket));
    });

    logger.info('✓ WebSocket handlers initialized');
  }

  /**
   * Handle user authentication
   */
  handleAuthenticate(socket, data) {
    try {
      const { userId, token } = data;

      if (!userId || !token) {
        socket.emit('auth-error', { message: 'Missing credentials' });
        socket.disconnect();
        return;
      }

      // TODO: Verify token
      socket.userId = userId;
      socket.authenticated = true;

      // Track user connection
      if (!this.userConnections.has(userId)) {
        this.userConnections.set(userId, []);
      }
      this.userConnections.get(userId).push(socket.id);

      socket.emit('authenticated', { userId, message: 'Connected' });
      logger.info(`User authenticated: ${userId} (${socket.id})`);

    } catch (error) {
      logger.error('Authentication error:', error.message);
      socket.emit('auth-error', { message: error.message });
    }
  }

  /**
   * Subscribe to specific vehicle real-time data
   */
  handleSubscribeVehicle(socket, data) {
    try {
      const { vehicleId } = data;

      if (!socket.authenticated) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      // Join room for this vehicle
      socket.join(`vehicle-${vehicleId}`);

      // Track subscription
      if (!this.vehicleSubscriptions.has(vehicleId)) {
        this.vehicleSubscriptions.set(vehicleId, []);
      }
      this.vehicleSubscriptions.get(vehicleId).push(socket.userId);

      socket.emit('subscribed', { vehicleId, message: `Subscribed to vehicle ${vehicleId}` });
      logger.info(`User ${socket.userId} subscribed to vehicle ${vehicleId}`);

    } catch (error) {
      logger.error('Subscribe error:', error.message);
      socket.emit('error', { message: error.message });
    }
  }

  /**
   * Unsubscribe from vehicle
   */
  handleUnsubscribeVehicle(socket, data) {
    try {
      const { vehicleId } = data;

      socket.leave(`vehicle-${vehicleId}`);

      if (this.vehicleSubscriptions.has(vehicleId)) {
        const users = this.vehicleSubscriptions.get(vehicleId);
        const index = users.indexOf(socket.userId);
        if (index > -1) {
          users.splice(index, 1);
        }
      }

      socket.emit('unsubscribed', { vehicleId });
      logger.info(`User ${socket.userId} unsubscribed from vehicle ${vehicleId}`);

    } catch (error) {
      logger.error('Unsubscribe error:', error.message);
    }
  }

  /**
   * Subscribe to fleet-wide updates
   */
  handleSubscribeFleet(socket, data) {
    try {
      const { customerId } = data;

      if (!socket.authenticated) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      socket.join(`fleet-${customerId}`);
      socket.emit('subscribed-fleet', { customerId, message: 'Subscribed to fleet updates' });
      logger.info(`User ${socket.userId} subscribed to fleet ${customerId}`);

    } catch (error) {
      logger.error('Fleet subscription error:', error.message);
      socket.emit('error', { message: error.message });
    }
  }

  /**
   * Unsubscribe from fleet updates
   */
  handleUnsubscribeFleet(socket, data) {
    try {
      const { customerId } = data;
      socket.leave(`fleet-${customerId}`);
      logger.info(`User ${socket.userId} unsubscribed from fleet ${customerId}`);

    } catch (error) {
      logger.error('Fleet unsubscribe error:', error.message);
    }
  }

  /**
   * Subscribe to alert notifications
   */
  handleSubscribeAlerts(socket, data) {
    try {
      const { customerId } = data;

      if (!socket.authenticated) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      socket.join(`alerts-${customerId}`);
      socket.emit('subscribed-alerts', { customerId, message: 'Subscribed to alerts' });
      logger.info(`User ${socket.userId} subscribed to alerts ${customerId}`);

    } catch (error) {
      logger.error('Alert subscription error:', error.message);
      socket.emit('error', { message: error.message });
    }
  }

  /**
   * Handle disconnect
   */
  handleDisconnect(socket) {
    try {
      if (socket.userId) {
        const connections = this.userConnections.get(socket.userId);
        if (connections) {
          const index = connections.indexOf(socket.id);
          if (index > -1) {
            connections.splice(index, 1);
          }
        }
      }

      logger.info(`WebSocket disconnected: ${socket.id}`);

    } catch (error) {
      logger.error('Disconnect error:', error.message);
    }
  }

  /**
   * Broadcast vehicle telematics update
   */
  broadcastVehicleUpdate(vehicleId, telematicsData) {
    try {
      this.io.to(`vehicle-${vehicleId}`).emit('vehicle-update', {
        vehicleId,
        data: telematicsData,
        timestamp: new Date(),
      });

    } catch (error) {
      logger.error('Broadcast error:', error.message);
    }
  }

  /**
   * Broadcast fleet-wide update
   */
  broadcastFleetUpdate(customerId, update) {
    try {
      this.io.to(`fleet-${customerId}`).emit('fleet-update', {
        customerId,
        ...update,
        timestamp: new Date(),
      });

    } catch (error) {
      logger.error('Fleet broadcast error:', error.message);
    }
  }

  /**
   * Broadcast alert to users
   */
  broadcastAlert(customerId, alert) {
    try {
      this.io.to(`alerts-${customerId}`).emit('alert', {
        customerId,
        ...alert,
        timestamp: new Date(),
      });

    } catch (error) {
      logger.error('Alert broadcast error:', error.message);
    }
  }

  /**
   * Send real-time location update
   */
  broadcastLocationUpdate(vehicleId, location) {
    try {
      this.io.to(`vehicle-${vehicleId}`).emit('location-update', {
        vehicleId,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        timestamp: location.timestamp || new Date(),
      });

    } catch (error) {
      logger.error('Location broadcast error:', error.message);
    }
  }

  /**
   * Send trailer data update
   */
  broadcastTrailerUpdate(trailerId, trailerData) {
    try {
      this.io.to(`trailer-${trailerId}`).emit('trailer-update', {
        trailerId,
        data: trailerData,
        timestamp: new Date(),
      });

    } catch (error) {
      logger.error('Trailer broadcast error:', error.message);
    }
  }

  /**
   * Get connected users count
   */
  getConnectionCount() {
    return this.userConnections.size;
  }

  /**
   * Get vehicle subscribers count
   */
  getVehicleSubscribers(vehicleId) {
    return this.vehicleSubscriptions.get(vehicleId)?.length || 0;
  }
}

module.exports = WebSocketHandlers;
