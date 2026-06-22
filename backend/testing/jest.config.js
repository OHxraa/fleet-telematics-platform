/**
 * Jest Test Setup Configuration
 * Unit and integration tests for API endpoints
 */

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
  coverageDirectory: './coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/index.js',
    '!src/**/*.config.js',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testTimeout: 10000,
  verbose: true,
};

/**
 * Example: Authentication Tests
 */
const authTests = `
const request = require('supertest');
const app = require('../src/index');
const { query } = require('../src/config/database');

describe('Authentication Endpoints', () => {
  beforeAll(async () => {
    // Setup test database
  });

  afterAll(async () => {
    // Cleanup test database
  });

  describe('POST /api/v1/auth/signup', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          customerId: 'test-customer-id',
          email: 'test@example.com',
          password: 'TestPassword123',
          firstName: 'Test',
          lastName: 'User',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@example.com');
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          customerId: 'test-customer-id',
          email: 'invalid-email',
          password: 'TestPassword123',
          firstName: 'Test',
          lastName: 'User',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 409 for duplicate email', async () => {
      // First signup
      await request(app)
        .post('/api/v1/auth/signup')
        .send({
          customerId: 'test-customer-id',
          email: 'duplicate@example.com',
          password: 'TestPassword123',
          firstName: 'Test',
          lastName: 'User',
        });

      // Duplicate signup
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          customerId: 'test-customer-id',
          email: 'duplicate@example.com',
          password: 'TestPassword123',
          firstName: 'Test',
          lastName: 'User',
        });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('EMAIL_EXISTS');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Create test user
      await request(app)
        .post('/api/v1/auth/signup')
        .send({
          customerId: 'test-customer-id',
          email: 'login-test@example.com',
          password: 'TestPassword123',
          firstName: 'Test',
          lastName: 'User',
        });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login-test@example.com',
          password: 'TestPassword123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should return 401 for invalid password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login-test@example.com',
          password: 'WrongPassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('AUTH_FAILED');
    });

    it('should return 401 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'TestPassword123',
        });

      expect(response.status).toBe(401);
    });
  });
});
`;

/**
 * Example: Vehicle Endpoints Tests
 */
const vehicleTests = `
describe('Vehicle Endpoints', () => {
  let authToken;
  let vehicleId;
  const customerId = 'test-customer-id';

  beforeAll(async () => {
    // Login and get token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'TestPassword123',
      });

    authToken = loginResponse.body.data.accessToken;
  });

  describe('POST /api/v1/vehicles', () => {
    it('should create a new vehicle', async () => {
      const response = await request(app)
        .post('/api/v1/vehicles')
        .set('Authorization', \`Bearer \${authToken}\`)
        .send({
          customerId,
          name: 'Test Vehicle',
          licensePlate: 'TEST123',
          make: 'Ford',
          model: 'F-150',
          year: 2023,
          vehicleType: 'truck',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.licensePlate).toBe('TEST123');
      vehicleId = response.body.data.id;
    });
  });

  describe('GET /api/v1/vehicles', () => {
    it('should get all vehicles', async () => {
      const response = await request(app)
        .get('/api/v1/vehicles')
        .set('Authorization', \`Bearer \${authToken}\`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/vehicles/:id', () => {
    it('should get vehicle by ID', async () => {
      const response = await request(app)
        .get(\`/api/v1/vehicles/\${vehicleId}\`)
        .set('Authorization', \`Bearer \${authToken}\`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(vehicleId);
    });

    it('should return 404 for non-existent vehicle', async () => {
      const response = await request(app)
        .get('/api/v1/vehicles/invalid-id')
        .set('Authorization', \`Bearer \${authToken}\`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/v1/vehicles/:id', () => {
    it('should update vehicle', async () => {
      const response = await request(app)
        .put(\`/api/v1/vehicles/\${vehicleId}\`)
        .set('Authorization', \`Bearer \${authToken}\`)
        .send({
          name: 'Updated Vehicle',
          status: 'maintenance',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Updated Vehicle');
    });
  });

  describe('DELETE /api/v1/vehicles/:id', () => {
    it('should delete vehicle (admin/manager only)', async () => {
      const response = await request(app)
        .delete(\`/api/v1/vehicles/\${vehicleId}\`)
        .set('Authorization', \`Bearer \${authToken}\`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
`;

/**
 * Example: Health Check Tests
 */
const healthTests = `
describe('Health Check Endpoints', () => {
  describe('GET /health', () => {
    it('should return 200 OK', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.uptime).toBeGreaterThan(0);
    });
  });

  describe('GET /health/detailed', () => {
    it('should return detailed health info', async () => {
      const response = await request(app).get('/health/detailed');

      expect(response.status).toBe(200);
      expect(response.body.services).toBeDefined();
      expect(response.body.services.database).toBeDefined();
      expect(response.body.services.redis).toBeDefined();
      expect(response.body.memory).toBeDefined();
    });
  });

  describe('GET /health/ready', () => {
    it('should return readiness status', async () => {
      const response = await request(app).get('/health/ready');

      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.body.ready).toBeDefined();
    });
  });

  describe('GET /health/live', () => {
    it('should return liveness status', async () => {
      const response = await request(app).get('/health/live');

      expect(response.status).toBe(200);
      expect(response.body.alive).toBe(true);
    });
  });
});
`;

module.exports = {
  authTests,
  vehicleTests,
  healthTests,
};
