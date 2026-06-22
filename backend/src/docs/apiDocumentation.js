/**
 * API Documentation
 * Complete endpoint mapping with request/response examples
 * Auto-generated documentation for all routes
 */

const apiDocumentation = {
  version: '1.0.0',
  title: 'Fleet Telematics & Compliance Platform API',
  description: 'Production-ready API for fleet management, telematics, and compliance',
  baseUrl: 'http://localhost:5000/api/v1',
  authentication: 'JWT Bearer Token',

  endpoints: {
    // ============================================
    // AUTHENTICATION ENDPOINTS
    // ============================================
    auth: {
      signup: {
        method: 'POST',
        path: '/auth/signup',
        description: 'Register a new user',
        auth: false,
        request: {
          body: {
            customerId: 'uuid',
            email: 'string (email)',
            password: 'string (min 8 chars)',
            firstName: 'string',
            lastName: 'string',
          },
        },
        response: {
          success: true,
          data: {
            userId: 'uuid',
            email: 'string',
            firstName: 'string',
            lastName: 'string',
          },
        },
        status: 201,
      },

      login: {
        method: 'POST',
        path: '/auth/login',
        description: 'Login and get access token',
        auth: false,
        request: {
          body: {
            email: 'string (email)',
            password: 'string',
          },
        },
        response: {
          success: true,
          data: {
            userId: 'uuid',
            email: 'string',
            firstName: 'string',
            lastName: 'string',
            role: 'admin|manager|driver|user',
            accessToken: 'string (JWT)',
            refreshToken: 'string (JWT)',
          },
        },
        status: 200,
      },

      refresh: {
        method: 'POST',
        path: '/auth/refresh',
        description: 'Refresh access token',
        auth: false,
        request: {
          body: {
            refreshToken: 'string',
          },
        },
        response: {
          success: true,
          data: {
            accessToken: 'string (JWT)',
          },
        },
        status: 200,
      },

      logout: {
        method: 'POST',
        path: '/auth/logout',
        description: 'Logout user',
        auth: true,
        response: {
          success: true,
          message: 'Logged out successfully',
        },
        status: 200,
      },

      changePassword: {
        method: 'POST',
        path: '/auth/change-password',
        description: 'Change user password',
        auth: true,
        request: {
          body: {
            currentPassword: 'string',
            newPassword: 'string (min 8 chars)',
          },
        },
        response: {
          success: true,
          message: 'Password changed successfully',
        },
        status: 200,
      },
    },

    // ============================================
    // VEHICLE ENDPOINTS
    // ============================================
    vehicles: {
      listAll: {
        method: 'GET',
        path: '/vehicles',
        description: 'Get all vehicles for customer',
        auth: true,
        query: {
          customerId: 'uuid (optional)',
        },
        response: {
          success: true,
          data: [
            {
              id: 'uuid',
              customerId: 'uuid',
              name: 'string',
              licensePlate: 'string',
              status: 'active|inactive|maintenance|decommissioned',
              gpsLatitude: 'number',
              gpsLongitude: 'number',
              currentLocationAddress: 'string',
              fuelLevel: 'number',
              mileage: 'number',
            },
          ],
          count: 'number',
        },
        status: 200,
      },

      getOne: {
        method: 'GET',
        path: '/vehicles/:id',
        description: 'Get vehicle by ID',
        auth: true,
        params: {
          id: 'uuid',
        },
        response: {
          success: true,
          data: {
            id: 'uuid',
            customerId: 'uuid',
            name: 'string',
            licensePlate: 'string',
            vin: 'string',
            make: 'string',
            model: 'string',
            year: 'number',
            vehicleType: 'truck|van|car|trailer',
            geotabId: 'string',
            status: 'active|inactive|maintenance|decommissioned',
            gpsLatitude: 'number',
            gpsLongitude: 'number',
            gpsAccuracy: 'number',
            gpsLastUpdate: 'timestamp',
            currentLocationAddress: 'string',
            fuelLevel: 'number',
            mileage: 'number',
            currentDriverId: 'uuid',
          },
        },
        status: 200,
      },

      create: {
        method: 'POST',
        path: '/vehicles',
        description: 'Create new vehicle',
        auth: true,
        request: {
          body: {
            customerId: 'uuid',
            name: 'string',
            licensePlate: 'string',
            vin: 'string (optional)',
            make: 'string (optional)',
            model: 'string (optional)',
            year: 'number (optional)',
            vehicleType: 'truck|van|car|trailer',
            geotabId: 'string (optional)',
          },
        },
        response: {
          success: true,
          data: {
            id: 'uuid',
            name: 'string',
            licensePlate: 'string',
            status: 'active',
          },
        },
        status: 201,
      },

      update: {
        method: 'PUT',
        path: '/vehicles/:id',
        description: 'Update vehicle',
        auth: true,
        params: {
          id: 'uuid',
        },
        request: {
          body: {
            name: 'string (optional)',
            status: 'active|inactive|maintenance|decommissioned (optional)',
            fuelLevel: 'number (optional)',
            mileage: 'number (optional)',
          },
        },
        response: {
          success: true,
          data: {
            id: 'uuid',
            name: 'string',
            status: 'string',
            updatedAt: 'timestamp',
          },
        },
        status: 200,
      },

      delete: {
        method: 'DELETE',
        path: '/vehicles/:id',
        description: 'Delete vehicle',
        auth: true,
        roles: ['admin', 'manager'],
        params: {
          id: 'uuid',
        },
        response: {
          success: true,
          message: 'Vehicle deleted',
        },
        status: 200,
      },

      getLocation: {
        method: 'GET',
        path: '/vehicles/:id/location',
        description: 'Get vehicle current location',
        auth: true,
        params: {
          id: 'uuid',
        },
        response: {
          success: true,
          data: {
            vehicleId: 'uuid',
            latitude: 'number',
            longitude: 'number',
            accuracy: 'number',
            lastUpdate: 'timestamp',
            address: 'string',
          },
        },
        status: 200,
      },

      getTelematics: {
        method: 'GET',
        path: '/vehicles/:id/telematics',
        description: 'Get vehicle telematics data',
        auth: true,
        params: {
          id: 'uuid',
        },
        query: {
          limit: 'number (default: 100)',
        },
        response: {
          success: true,
          data: [
            {
              id: 'uuid',
              latitude: 'number',
              longitude: 'number',
              speed: 'number',
              fuelLevel: 'number',
              odometer: 'number',
              engineStatus: 'boolean',
              rpm: 'number',
              receivedAt: 'timestamp',
            },
          ],
          count: 'number',
        },
        status: 200,
      },

      getStats: {
        method: 'GET',
        path: '/vehicles/:id/stats',
        description: 'Get vehicle statistics',
        auth: true,
        params: {
          id: 'uuid',
        },
        query: {
          days: 'number (default: 7)',
        },
        response: {
          success: true,
          data: {
            vehicleId: 'uuid',
            dataPoints: 'number',
            totalDistance: 'number',
            avgRuntime: 'number',
            maxFuel: 'number',
            minFuel: 'number',
            avgTemp: 'number',
            totalHarshAcceleration: 'number',
            totalHarshBraking: 'number',
            totalHarshCornering: 'number',
          },
        },
        status: 200,
      },

      syncGeotab: {
        method: 'POST',
        path: '/vehicles/sync-geotab',
        description: 'Sync all vehicles from Geotab',
        auth: true,
        roles: ['admin', 'manager'],
        query: {
          customerId: 'uuid',
        },
        response: {
          success: true,
          data: [
            {
              status: 'success|error',
              deviceId: 'string',
              vehicleId: 'uuid',
            },
          ],
          message: 'Sync completed',
        },
        status: 200,
      },
    },

    // ============================================
    // TELEMATICS ENDPOINTS
    // ============================================
    telematics: {
      getFleetStats: {
        method: 'GET',
        path: '/telematics/fleet',
        description: 'Get fleet-wide statistics',
        auth: true,
        query: {
          customerId: 'uuid',
          days: 'number (default: 7)',
        },
        response: {
          success: true,
          data: {
            customerId: 'uuid',
            activeVehicles: 'number',
            totalDataPoints: 'number',
            avgFleetSpeed: 'number',
            fleetTotalDistance: 'number',
          },
          period: '7 days',
        },
        status: 200,
      },

      getVehicleTelematics: {
        method: 'GET',
        path: '/telematics/vehicle/:id',
        description: 'Get vehicle telematics',
        auth: true,
        params: {
          id: 'uuid',
        },
        query: {
          limit: 'number (default: 100)',
        },
        response: {
          success: true,
          data: '[array of telematics records]',
          count: 'number',
          period: 'Last 24 hours',
        },
        status: 200,
      },

      getHistory: {
        method: 'GET',
        path: '/telematics/vehicle/:id/history',
        description: 'Get historical telematics data',
        auth: true,
        params: {
          id: 'uuid',
        },
        query: {
          startTime: 'ISO timestamp (required)',
          endTime: 'ISO timestamp (required)',
        },
        response: {
          success: true,
          data: '[array of telematics records]',
          count: 'number',
          period: {
            start: 'timestamp',
            end: 'timestamp',
          },
        },
        status: 200,
      },

      getBehavior: {
        method: 'GET',
        path: '/telematics/vehicle/:id/behavior',
        description: 'Analyze driver behavior',
        auth: true,
        params: {
          id: 'uuid',
        },
        query: {
          days: 'number (default: 7)',
        },
        response: {
          success: true,
          data: {
            vehicleId: 'uuid',
            days: 'number',
            totalRecords: 'number',
            harshAccelerations: 'number',
            harshBrakings: 'number',
            harshCorners: 'number',
            riskScore: 'number (0-100)',
          },
          riskLevel: 'HIGH|MEDIUM|LOW',
        },
        status: 200,
      },
    },

    // ============================================
    // TRAILER ENDPOINTS
    // ============================================
    trailers: {
      list: {
        method: 'GET',
        path: '/trailers',
        description: 'Get all trailers',
        auth: true,
        query: {
          customerId: 'uuid',
        },
        response: {
          success: true,
          data: '[array of trailers]',
          count: 'number',
        },
        status: 200,
      },

      getLocation: {
        method: 'GET',
        path: '/trailers/:id/location',
        description: 'Get trailer GPS location (from Idem)',
        auth: true,
        params: {
          id: 'uuid',
        },
        response: {
          success: true,
          data: {
            trailerId: 'uuid',
            latitude: 'number',
            longitude: 'number',
            lastUpdate: 'timestamp',
            source: 'idem',
          },
        },
        status: 200,
      },

      getRefrigeration: {
        method: 'GET',
        path: '/trailers/:id/refrigeration',
        description: 'Get refrigeration unit data (from Idem)',
        auth: true,
        params: {
          id: 'uuid',
        },
        response: {
          success: true,
          data: {
            trailerId: 'uuid',
            hasRefrigeration: 'boolean',
            currentTemp: 'number',
            targetTemp: 'number',
            status: 'string',
            lastUpdate: 'timestamp',
            source: 'idem',
          },
        },
        status: 200,
      },

      getBrakeData: {
        method: 'GET',
        path: '/trailers/:id/brake',
        description: 'Get brake system data (EBPMS from Idem)',
        auth: true,
        params: {
          id: 'uuid',
        },
        response: {
          success: true,
          data: {
            trailerId: 'uuid',
            brakeSystemType: 'string',
            ebpmsEnabled: 'boolean',
            pressure: 'number',
            temperature: 'number',
            lastUpdate: 'timestamp',
            source: 'idem',
          },
        },
        status: 200,
      },
    },

    // ============================================
    // DRIVER ENDPOINTS
    // ============================================
    drivers: {
      list: {
        method: 'GET',
        path: '/drivers',
        description: 'Get all drivers',
        auth: true,
        query: {
          customerId: 'uuid',
        },
        response: {
          success: true,
          data: '[array of drivers]',
          count: 'number',
        },
        status: 200,
      },

      create: {
        method: 'POST',
        path: '/drivers',
        description: 'Create new driver',
        auth: true,
        request: {
          body: {
            customerId: 'uuid',
            firstName: 'string',
            lastName: 'string',
            email: 'string (optional)',
            phone: 'string (optional)',
            licenseNumber: 'string',
            licenseExpiry: 'date (optional)',
            dateOfBirth: 'date (optional)',
          },
        },
        response: {
          success: true,
          data: {
            id: 'uuid',
            firstName: 'string',
            lastName: 'string',
            licenseNumber: 'string',
          },
        },
        status: 201,
      },
    },
  },

  errorCodes: {
    200: 'OK',
    201: 'Created',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
  },

  authentication: {
    type: 'Bearer Token',
    header: 'Authorization: Bearer <accessToken>',
    example: 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  },

  rateLimits: {
    windowMs: '15 minutes',
    maxRequests: '100 requests',
    resetTime: '900000 milliseconds',
  },

  pagination: {
    default: 'limit=100',
    max: 'limit=1000',
    queryParam: 'limit',
  },
};

module.exports = apiDocumentation;
