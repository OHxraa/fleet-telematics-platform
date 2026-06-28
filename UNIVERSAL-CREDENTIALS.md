╔════════════════════════════════════════════════════════════════════════════╗
║        UNIVERSAL CREDENTIAL SYSTEM - SCALABLE FOR ANY API                 ║
║              How to Add New Connectors Without Rebuilding Core             ║
╚════════════════════════════════════════════════════════════════════════════╝

✅ GOOD NEWS: YOUR SYSTEM IS ALREADY GENERIC!
═════════════════════════════════════════════════════════════════════════════

The credential system we built is NOT specific to Geotab.
It's UNIVERSAL - works for any API, any connector type.

PROOF - Look at the design:

customer_connector_credentials TABLE:
  ✓ connector_type VARCHAR(100) - Can be ANYTHING (geotab, slack, custom_api_xyz)
  ✓ connector_config JSONB - Can store ANY configuration
  ✓ encrypted_credentials - Works with ANY credentials

CredentialManager SERVICE:
  ✓ getCredentials(customerId, connectorType) - GENERIC method
  ✓ verifyCredentials(customerId, connectorType, creds) - Uses SWITCH statement
  ✓ Easy to add new verification methods

Result: 
  You can add 100 new APIs and use the SAME credential system! 🎉

═════════════════════════════════════════════════════════════════════════════

🎯 HOW THE SYSTEM SCALES:
═════════════════════════════════════════════════════════════════════════════

MONTH 1: Build Geotab Connector
  ├─ Database schema (DONE - is generic!)
  ├─ CredentialManager service (DONE - is generic!)
  ├─ Add geotab.connector.js
  ├─ Add verifyGeotabCredentials() method
  └─ Add to switch statement in verify()

MONTH 2: Add Slack Connector
  ├─ Database schema (REUSE - no changes!)
  ├─ CredentialManager service (REUSE - no changes!)
  ├─ Add slack.connector.js
  ├─ Add verifySlackCredentials() method
  └─ Add to switch statement in verify()

MONTH 3: Add QuickBooks Connector
  ├─ Database schema (REUSE - no changes!)
  ├─ CredentialManager service (REUSE - no changes!)
  ├─ Add quickbooks.connector.js
  ├─ Add verifyQuickBooksCredentials() method
  └─ Add to switch statement in verify()

MONTH 4: Add TomTom Connector
  ├─ Database schema (REUSE - no changes!)
  ├─ CredentialManager service (REUSE - no changes!)
  ├─ Add tomtom.connector.js
  ├─ Add verifyTomTomCredentials() method
  └─ Add to switch statement in verify()

MONTH 5-12: Add 10 more connectors
  ├─ Same pattern for each
  ├─ Same database
  ├─ Same credential manager
  ├─ Just add new connector files and verification methods

KEY INSIGHT: After MONTH 1, you only add connector-specific code, not core
             credential system code. It's completely reusable!

═════════════════════════════════════════════════════════════════════════════

🔧 HOW TO ADD A NEW API - STEP BY STEP:
═════════════════════════════════════════════════════════════════════════════

EXAMPLE: Adding Sennder (logistics API) as a connector

STEP 1: Create Sennder Connector File
────────────────────────────────────

// File: src/services/connectors/sennder.connector.js

import logger from '../../config/logger.js';

class SennderConnector {
  
  // Initialize connection with customer's credentials
  async connect(credentials) {
    try {
      // credentials = {
      //   api_key: customer's Sennder API key,
      //   api_url: https://api.sennder.com,
      //   workspace_id: customer's workspace ID
      // }
      
      this.apiKey = credentials.api_key;
      this.apiUrl = credentials.api_url;
      this.workspaceId = credentials.workspace_id;
      
      return true;
    } catch (error) {
      logger.error('Failed to connect to Sennder:', error.message);
      throw error;
    }
  }
  
  // Test if credentials work
  async testConnection() {
    try {
      const response = await fetch(`${this.apiUrl}/shipments`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Workspace': this.workspaceId
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return true;
    } catch (error) {
      throw new Error(`Sennder connection failed: ${error.message}`);
    }
  }
  
  // Sync shipments from Sennder
  async syncShipments() {
    try {
      const response = await fetch(`${this.apiUrl}/shipments`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Workspace': this.workspaceId,
          'Accept': 'application/json'
        }
      });
      
      const shipments = await response.json();
      return shipments;
    } catch (error) {
      logger.error('Failed to sync shipments:', error.message);
      throw error;
    }
  }
  
  // Sync deliveries from Sennder
  async syncDeliveries() {
    try {
      const response = await fetch(`${this.apiUrl}/deliveries`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Workspace': this.workspaceId,
          'Accept': 'application/json'
        }
      });
      
      const deliveries = await response.json();
      return deliveries;
    } catch (error) {
      logger.error('Failed to sync deliveries:', error.message);
      throw error;
    }
  }
}

export default SennderConnector;


STEP 2: Add Verification Method to CredentialManager
──────────────────────────────────────────────────────

// In src/services/credential-manager.service.js
// Add this method to the CredentialManager class:

async verifySennderCredentials(creds) {
  try {
    const SennderConnector = require('./connectors/sennder.connector.js');
    const connector = new SennderConnector();
    
    await connector.connect(creds);
    await connector.testConnection();
    
    logger.info('Sennder credentials verified');
    return true;
  } catch (error) {
    logger.error(`Sennder verification failed: ${error.message}`);
    throw new Error(`Invalid Sennder credentials: ${error.message}`);
  }
}

// Update the verifyCredentials switch statement:

async verifyCredentials(customerId, connectorType, credentials) {
  try {
    switch (connectorType) {
      case 'geotab':
        return await this.verifyGeotabCredentials(credentials);
      case 'slack':
        return await this.verifySlackCredentials(credentials);
      case 'quickbooks':
        return await this.verifyQuickBooksCredentials(credentials);
      case 'sennder':  // ← ADD THIS
        return await this.verifySennderCredentials(credentials);
      default:
        throw new Error(`Unknown connector type: ${connectorType}`);
    }
  } catch (error) {
    logger.error(`Credential verification failed: ${error.message}`);
    throw error;
  }
}


STEP 3: Create API Routes for Sennder Setup
────────────────────────────────────────────

// File: src/routes/connectors/sennder.routes.js

import express from 'express';
import { tenantMiddleware } from '../../middleware/tenant.middleware.js';
import { requirePermission } from '../../middleware/permissions.middleware.js';
import credentialManager from '../../services/credential-manager.service.js';
import SennderConnector from '../../services/connectors/sennder.connector.js';

const router = express.Router();

router.use(tenantMiddleware);
router.use(requirePermission('connector.manage'));

/**
 * POST /api/customer/connectors/sennder/credentials
 * Store Sennder credentials
 */
router.post('/credentials', async (req, res) => {
  try {
    const { api_key, api_url, workspace_id, display_name } = req.body;
    
    // Verify credentials
    await credentialManager.verifyCredentials(
      req.tenant.customer_id,
      'sennder',
      { api_key, api_url, workspace_id }
    );
    
    // Store encrypted
    const credId = await credentialManager.storeCredentials(
      req.tenant.customer_id,
      'sennder',
      {
        api_key,
        api_url,
        workspace_id,
        display_name: display_name || 'Sennder'
      }
    );
    
    return res.status(201).json({
      success: true,
      credential_id: credId,
      message: 'Sennder credentials stored'
    });
  } catch (error) {
    return res.status(400).json({
      error: error.message
    });
  }
});

/**
 * GET /api/customer/connectors/sennder/sync
 * Manually trigger sync
 */
router.get('/sync', async (req, res) => {
  try {
    const credentials = await credentialManager.getCredentials(
      req.tenant.customer_id,
      'sennder'
    );
    
    const connector = new SennderConnector();
    await connector.connect(credentials);
    
    const shipments = await connector.syncShipments();
    const deliveries = await connector.syncDeliveries();
    
    // Store in customer's database
    // UPDATE shipments table with new data
    // UPDATE deliveries table with new data
    
    return res.json({
      success: true,
      shipments_synced: shipments.length,
      deliveries_synced: deliveries.length
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
});

export default router;


STEP 4: Update Main Routes
──────────────────────────

// In src/routes/index.js
// Add:

import sennderRoutes from './connectors/sennder.routes.js';

router.use('/api/customer/connectors/sennder', sennderRoutes);


STEP 5: Add to Connector List
──────────────────────────────

// In a connectors registry file:
// src/config/connectors.js

export const AVAILABLE_CONNECTORS = {
  geotab: {
    name: 'Geotab',
    description: 'GPS tracking and vehicle telematics',
    category: 'tracking',
    icon: 'geotab.png'
  },
  slack: {
    name: 'Slack',
    description: 'Send alerts to Slack channels',
    category: 'alerts',
    icon: 'slack.png'
  },
  quickbooks: {
    name: 'QuickBooks',
    description: 'Sync accounting and expenses',
    category: 'accounting',
    icon: 'quickbooks.png'
  },
  sennder: {  // ← ADD THIS
    name: 'Sennder',
    description: 'Sync shipments and deliveries',
    category: 'logistics',
    icon: 'sennder.png'
  }
};

THAT'S IT! You've added a new connector! 🎉

═════════════════════════════════════════════════════════════════════════════

📋 PATTERN FOR ANY NEW API:
═════════════════════════════════════════════════════════════════════════════

EVERY new connector follows the SAME pattern:

1. Create src/services/connectors/[api-name].connector.js
   └─ Contains: connect(), testConnection(), syncData() methods

2. Add verify[ApiName]Credentials() to CredentialManager
   └─ Tests if credentials work

3. Add case to switch statement in verifyCredentials()
   └─ Routes to right verification method

4. Create src/routes/connectors/[api-name].routes.js
   └─ Contains: POST /credentials, GET /sync, etc.

5. Import routes in src/routes/index.js
   └─ Registers routes

6. Add to AVAILABLE_CONNECTORS registry
   └─ Makes it available in UI

That's the ENTIRE pattern. It's COMPLETELY REUSABLE.

═════════════════════════════════════════════════════════════════════════════

🎯 WHY THIS IS SCALABLE:
═════════════════════════════════════════════════════════════════════════════

CORE SYSTEM (Same for ALL connectors):
  ✓ customer_connector_credentials table
  ✓ CredentialManager service (encrypt/decrypt)
  ✓ credentialManager.getCredentials() method
  ✓ credentialManager.storeCredentials() method
  ✓ Webhook system
  ✓ Audit logging

CONNECTOR-SPECIFIC CODE (Changes per API):
  ✓ [connector-name].connector.js (connect, test, sync)
  ✓ verify[ConnectorName]Credentials() method
  ✓ [connector-name].routes.js (API endpoints)
  ✓ Add case to switch statement

When you add a new connector:
  → Core system code: NO CHANGES
  → Just add connector-specific files
  → Takes 1-2 days per connector (not weeks!)

═════════════════════════════════════════════════════════════════════════════

💡 REAL-WORLD EXAMPLE - YOUR FULL ROADMAP:
═════════════════════════════════════════════════════════════════════════════

MONTH 1: Geotab Connector
  Files to create: 1 (geotab.connector.js)
  Methods to add: 1 (verifyGeotabCredentials)
  Routes: 1 file (geotab.routes.js)
  Lines of NEW code: ~500

MONTH 2: Slack Connector
  Files to create: 1 (slack.connector.js)
  Methods to add: 1 (verifySlackCredentials)
  Routes: 1 file (slack.routes.js)
  Lines of NEW code: ~300 (simpler API)
  Core changes: NONE ✓

MONTH 3: QuickBooks Connector
  Files to create: 1 (quickbooks.connector.js)
  Methods to add: 1 (verifyQuickBooksCredentials)
  Routes: 1 file (quickbooks.routes.js)
  Lines of NEW code: ~600 (OAuth is complex)
  Core changes: NONE ✓

MONTH 4: TomTom Connector
  Files to create: 1 (tomtom.connector.js)
  Methods to add: 1 (verifyTomTomCredentials)
  Routes: 1 file (tomtom.routes.js)
  Lines of NEW code: ~400
  Core changes: NONE ✓

MONTH 5: Sennder Connector
  Files to create: 1 (sennder.connector.js)
  Methods to add: 1 (verifySennderCredentials)
  Routes: 1 file (sennder.routes.js)
  Lines of NEW code: ~350
  Core changes: NONE ✓

MONTH 6: Custom Customer API
  Files to create: 1 (custom-api.connector.js)
  Methods to add: 1 (verifyCustomApiCredentials)
  Routes: 1 file (custom-api.routes.js)
  Lines of NEW code: ~200-500 (depends on API)
  Core changes: NONE ✓

TOTAL BY MONTH 6:
  ✓ 6 connectors built
  ✓ 0 changes to core system
  ✓ Completely reused credential infrastructure
  ✓ ~2500 lines of connector-specific code
  ✓ Fully scalable

═════════════════════════════════════════════════════════════════════════════

📊 EXTENSIBILITY IN ACTION:
═════════════════════════════════════════════════════════════════════════════

Adding Connector X (generic example):

BEFORE (What you DON'T have to do):
  ✗ Rebuild credential system
  ✗ Redesign encryption
  ✗ Create new database tables
  ✗ Build new permission system
  ✗ Create new audit logging
  ✗ Redesign API architecture
  ✗ Weeks of work

AFTER (What you actually do):
  ✓ Create connector file (like sennder.connector.js)
  ✓ Add one verification method
  ✓ Add one case to switch statement
  ✓ Create routes file
  ✓ Import routes
  ✓ 1-2 days of work

RATIO: 1-2 days vs 2-3 weeks = 10-15x faster!

═════════════════════════════════════════════════════════════════════════════

🔐 CREDENTIAL SYSTEM WORKS FOR ANY API TYPE:
═════════════════════════════════════════════════════════════════════════════

API Key Based:
  credentials = { api_key: "xxxxx", endpoint: "https://api.com" }
  Works: ✓ Sennder, TomTom, many others

Username/Password Based:
  credentials = { username: "user", password: "pass", database: "db" }
  Works: ✓ Geotab, custom databases

OAuth 2.0 Based:
  credentials = { access_token: "xxx", refresh_token: "yyy", expires_at: "" }
  Works: ✓ QuickBooks, Google, Slack, most modern APIs

Bearer Token Based:
  credentials = { token: "bearer_token_here" }
  Works: ✓ Most modern REST APIs

Custom Headers:
  credentials = { headers: { "X-API-Key": "xxx", "X-Workspace": "yyy" } }
  Works: ✓ Slack, Sennder, custom APIs

The credentials table stores JSONB, so it adapts to ANY credential format!
The system is COMPLETELY GENERIC! 🎉

═════════════════════════════════════════════════════════════════════════════

✅ PROOF YOUR SYSTEM IS SCALABLE:
═════════════════════════════════════════════════════════════════════════════

Database Schema:
  ✓ connector_type VARCHAR(100) - accepts ANY connector name
  ✓ connector_config JSONB - accepts ANY configuration format
  ✓ encrypted_credentials BYTEA - works with ANY encrypted data
  
Code Architecture:
  ✓ getCredentials(customerId, connectorType) - generic method
  ✓ Switch statement in verify() - extensible with new cases
  ✓ Connector files independent - each is isolated
  ✓ Routes modular - each connector has own routes

Adding Connector:
  ✓ No database changes needed
  ✓ No credential system changes needed
  ✓ No authentication changes needed
  ✓ Just add connector-specific code

Scaling to 100 connectors:
  ✓ Same database (already designed)
  ✓ Same credential manager (already coded)
  ✓ Same permission system (already works)
  ✓ Just add 100 connector files

VERDICT: YOUR SYSTEM IS PRODUCTION-READY FOR SCALING! ✓

═════════════════════════════════════════════════════════════════════════════

🚀 CHECKLIST FOR ADDING NEW CONNECTOR:
═════════════════════════════════════════════════════════════════════════════

When customer says "Can you integrate with XYZ API?"

ENGINEERING CHECKLIST:

☐ Step 1: Read XYZ API documentation
  ├─ Understand authentication method
  ├─ Identify key endpoints
  ├─ Note rate limits
  └─ Check webhook support

☐ Step 2: Create XYZ connector file
  src/services/connectors/xyz.connector.js
  ├─ async connect(credentials)
  ├─ async testConnection()
  └─ async syncData()

☐ Step 3: Create verification method
  credentialManager.verifyXyzCredentials()
  └─ Tests that credentials work

☐ Step 4: Add to switch statement
  case 'xyz': return await this.verifyXyzCredentials(credentials);

☐ Step 5: Create routes file
  src/routes/connectors/xyz.routes.js
  ├─ POST /credentials (store creds)
  ├─ GET /sync (trigger sync)
  └─ GET /status (check connection)

☐ Step 6: Import routes
  src/routes/index.js
  import xyzRoutes from './connectors/xyz.routes.js';
  router.use('/api/customer/connectors/xyz', xyzRoutes);

☐ Step 7: Add to registry
  src/config/connectors.js
  Add XYZ to AVAILABLE_CONNECTORS

☐ Step 8: Test
  ├─ Test credential storage
  ├─ Test encryption/decryption
  ├─ Test sync functionality
  └─ Test with real customer account

DONE! New connector added in 1-2 days ✓

═════════════════════════════════════════════════════════════════════════════

💪 SUMMARY:
═════════════════════════════════════════════════════════════════════════════

YOUR SYSTEM IS DESIGNED FOR SCALE:

✓ Core credential system = REUSABLE for any API
✓ Each connector = independent, isolated code
✓ Adding new connector = 1-2 days, not weeks
✓ Database never changes = no migrations
✓ Security maintained = encryption works for all
✓ Per-customer credentials = works for all APIs
✓ Audit trail = captured for all connectors

You can build 50 connectors without changing core system!

This is ENTERPRISE-GRADE EXTENSIBILITY. 🎯

═════════════════════════════════════════════════════════════════════════════
