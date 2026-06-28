╔════════════════════════════════════════════════════════════════════════════╗
║        MULTI-TENANT CONNECTOR CREDENTIALS SYSTEM                           ║
║     Each Customer Uses Their Own API Keys & Database Names                ║
╚════════════════════════════════════════════════════════════════════════════╝

🎯 THE CHALLENGE:
═════════════════════════════════════════════════════════════════════════════

YOUR SYSTEM:
  Geotab username: harry_api
  Geotab database: levl_demo
  
CUSTOMER 1 (Paul Matthews Fleet):
  Geotab username: paul_fleet_user
  Geotab database: paul_fleet_db
  
CUSTOMER 2 (John's Logistics):
  Geotab username: john_logistics
  Geotab database: john_logistics_db
  
CUSTOMER 3 (SafeHaul Inc):
  Geotab username: safehault_user
  Geotab database: safehault_prod

Problem:
  ✗ You can't use your credentials for all customers
  ✗ Each customer has their own Geotab account
  ✗ Connector must use customer's credentials
  ✗ Need secure storage per customer
  ✗ Need to switch credentials based on which customer

Solution:
  ✓ Store encrypted credentials per customer
  ✓ Switch credentials at runtime based on customer
  ✓ Validate credentials on setup
  ✓ Support credential rotation
  ✓ Audit all credential usage

═════════════════════════════════════════════════════════════════════════════

💾 DATABASE SCHEMA - CUSTOMER CONNECTOR CREDENTIALS:
═════════════════════════════════════════════════════════════════════════════

-- In MASTER DATABASE (stores all customers)
CREATE TABLE IF NOT EXISTS customer_connector_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL, -- Which customer
    connector_type VARCHAR(100) NOT NULL, -- geotab, slack, quickbooks, etc
    
    -- Encrypted Credential Storage
    encrypted_credentials BYTEA NOT NULL, -- AES-256 encrypted JSON
    encryption_key_version INT NOT NULL, -- For key rotation
    
    -- Connector-specific metadata
    display_name VARCHAR(255), -- "Paul's Geotab" or "Main QB Account"
    
    -- For Geotab specifically
    geotab_username VARCHAR(255),
    geotab_database_name VARCHAR(255), -- THIS IS THE KEY!
    geotab_server VARCHAR(255) DEFAULT 'my.geotab.com',
    
    -- For other integrations
    connector_config JSONB, -- Dynamic config per connector type
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false, -- Tested successfully?
    last_verified_at TIMESTAMP,
    verification_error TEXT,
    
    -- Audit
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- For credential rotation
    expires_at TIMESTAMP, -- If using temporary credentials
    rotation_schedule VARCHAR(50), -- never, monthly, quarterly
    last_rotated_at TIMESTAMP,
    
    UNIQUE(customer_id, connector_type, geotab_database_name)
);

-- Audit log for all credential access
CREATE TABLE IF NOT EXISTS credential_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credentials_id UUID NOT NULL REFERENCES customer_connector_credentials(id),
    
    accessed_by VARCHAR(100), -- Which service accessed it
    action VARCHAR(50), -- read, refresh, rotate
    
    success BOOLEAN,
    error_message TEXT,
    
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Credential encryption keys (rotate periodically)
CREATE TABLE IF NOT EXISTS encryption_keys (
    id INT PRIMARY KEY,
    key_data BYTEA NOT NULL, -- Never select this unless decrypting!
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    rotated_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

═════════════════════════════════════════════════════════════════════════════

🔐 HOW CREDENTIAL STORAGE WORKS:
═════════════════════════════════════════════════════════════════════════════

EXAMPLE: Customer Paul Sets Up Geotab

Step 1: Customer provides credentials in UI
  Paul goes to: Settings → Connectors → Geotab
  Enters:
    Username: paul_fleet_user
    Password: [password]
    Database: paul_fleet_db
    Server: my.geotab.com

Step 2: System encrypts credentials
  plaintext = {
    username: "paul_fleet_user",
    password: "secret123",
    database: "paul_fleet_db",
    server: "my.geotab.com"
  }
  
  encrypted = AES256.encrypt(plaintext, encryption_key)

Step 3: Store encrypted + metadata
  INSERT INTO customer_connector_credentials
  (customer_id, connector_type, encrypted_credentials, geotab_database_name, ...)
  VALUES
  ('paul-uuid', 'geotab', [encrypted_data], 'paul_fleet_db', ...)

Step 4: Test connection
  Decrypt credentials
  Call Geotab API with paul's credentials
  If success → Set is_verified = true
  If fail → Store error, ask Paul to fix it

Step 5: Store in system
  System now knows: When Paul logs in, use paul_fleet_db credentials
  Not your credentials!

═════════════════════════════════════════════════════════════════════════════

💻 CODE IMPLEMENTATION:
═════════════════════════════════════════════════════════════════════════════

// File: src/services/credential-manager.service.js

import crypto from 'crypto';
import logger from '../config/logger.js';

class CredentialManager {
  /**
   * Store encrypted credentials for a customer's connector
   */
  async storeCredentials(customerId, connectorType, credentialsData) {
    try {
      // Encrypt the credentials
      const encrypted = this.encryptCredentials(credentialsData);
      
      // Get current encryption key version
      const keyVersion = await this.getCurrentKeyVersion();
      
      // Store in database
      const result = await masterDb.query(
        `INSERT INTO customer_connector_credentials
         (customer_id, connector_type, encrypted_credentials, 
          encryption_key_version, geotab_database_name, connector_config)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          customerId,
          connectorType,
          encrypted,
          keyVersion,
          credentialsData.database_name || null,
          JSON.stringify(credentialsData.metadata || {})
        ]
      );
      
      const credId = result.rows[0].id;
      logger.info(`Credentials stored for customer ${customerId} connector ${connectorType}`);
      
      return credId;
    } catch (error) {
      logger.error('Failed to store credentials:', error.message);
      throw new Error('Failed to store credentials securely');
    }
  }

  /**
   * Retrieve and decrypt credentials for a customer
   * CRITICAL: Only decrypt when actually using!
   */
  async getCredentials(customerId, connectorType, databaseName = null) {
    try {
      // Find credentials in database
      let query = `
        SELECT id, encrypted_credentials, encryption_key_version, 
               geotab_database_name, connector_config
        FROM customer_connector_credentials
        WHERE customer_id = $1 
        AND connector_type = $2
        AND is_active = true
        AND is_verified = true
      `;
      
      const params = [customerId, connectorType];
      
      // If specific database name provided, filter by it
      if (databaseName) {
        query += ` AND geotab_database_name = $3`;
        params.push(databaseName);
      }
      
      // If no database name provided, use the primary (first) one
      query += ` ORDER BY created_at ASC LIMIT 1`;
      
      const result = await masterDb.query(query, params);
      
      if (result.rows.length === 0) {
        throw new Error(`No verified credentials found for ${connectorType}`);
      }
      
      const credRecord = result.rows[0];
      
      // Decrypt credentials
      const credentials = this.decryptCredentials(
        credRecord.encrypted_credentials,
        credRecord.encryption_key_version
      );
      
      // Log access for audit
      await this.logAccess(credRecord.id, 'read', true);
      
      return {
        id: credRecord.id,
        ...credentials,
        metadata: credRecord.connector_config
      };
    } catch (error) {
      logger.error('Failed to retrieve credentials:', error.message);
      await this.logAccess(null, 'read', false, error.message);
      throw error;
    }
  }

  /**
   * Get ALL credentials for a customer
   * (e.g., multiple Geotab databases, multiple Slack workspaces)
   */
  async getAllCredentials(customerId, connectorType) {
    try {
      const result = await masterDb.query(
        `SELECT id, connector_type, geotab_database_name, 
                display_name, is_verified, last_verified_at
         FROM customer_connector_credentials
         WHERE customer_id = $1 
         AND connector_type = $2
         AND is_active = true
         ORDER BY created_at ASC`,
        [customerId, connectorType]
      );
      
      return result.rows;
    } catch (error) {
      logger.error('Failed to retrieve credentials list:', error.message);
      throw error;
    }
  }

  /**
   * Verify credentials work before storing
   */
  async verifyCredentials(customerId, connectorType, credentials) {
    try {
      switch (connectorType) {
        case 'geotab':
          return await this.verifyGeotabCredentials(credentials);
        case 'slack':
          return await this.verifySlackCredentials(credentials);
        case 'quickbooks':
          return await this.verifyQuickBooksCredentials(credentials);
        default:
          throw new Error(`Unknown connector type: ${connectorType}`);
      }
    } catch (error) {
      logger.error(`Credential verification failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verify Geotab credentials work
   */
  async verifyGeotabCredentials(creds) {
    try {
      // Import the Geotab connector
      const geotabConnector = require('./connectors/geotab.connector.js');
      
      // Try to authenticate with provided credentials
      const api = geotabConnector.createGeotabAPI(
        creds.username,
        creds.password,
        creds.database,
        creds.server || 'my.geotab.com'
      );
      
      // Test connection by making simple API call
      const result = await api.call('Get', {
        typeName: 'User',
        search: { name: creds.username }
      });
      
      if (!result || result.length === 0) {
        throw new Error('User not found in Geotab database');
      }
      
      logger.info(`Geotab credentials verified for ${creds.database}`);
      return true;
    } catch (error) {
      logger.error(`Geotab verification failed: ${error.message}`);
      throw new Error(`Invalid Geotab credentials: ${error.message}`);
    }
  }

  /**
   * ENCRYPTION: Encrypt sensitive data
   */
  encryptCredentials(credentialsData) {
    try {
      // Get active encryption key
      const encryptionKey = this.getActiveEncryptionKey();
      
      // Generate random IV (Initialization Vector)
      const iv = crypto.randomBytes(16);
      
      // Create cipher
      const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
      
      // Stringify and encrypt
      const plaintext = JSON.stringify(credentialsData);
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Return IV + encrypted data (IV is not secret, needed for decryption)
      return Buffer.concat([iv, Buffer.from(encrypted, 'hex')]);
    } catch (error) {
      logger.error('Encryption failed:', error.message);
      throw new Error('Failed to encrypt credentials');
    }
  }

  /**
   * DECRYPTION: Decrypt sensitive data
   */
  decryptCredentials(encryptedData, keyVersion) {
    try {
      // Get encryption key for this version
      const encryptionKey = this.getEncryptionKey(keyVersion);
      
      // Extract IV (first 16 bytes)
      const iv = encryptedData.slice(0, 16);
      
      // Extract encrypted content
      const encrypted = encryptedData.slice(16);
      
      // Create decipher
      const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv);
      
      // Decrypt
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      // Parse JSON
      return JSON.parse(decrypted);
    } catch (error) {
      logger.error('Decryption failed:', error.message);
      throw new Error('Failed to decrypt credentials');
    }
  }

  /**
   * Audit logging
   */
  async logAccess(credentialId, action, success, errorMsg = null) {
    try {
      await masterDb.query(
        `INSERT INTO credential_access_log
         (credentials_id, accessed_by, action, success, error_message)
         VALUES ($1, $2, $3, $4, $5)`,
        [credentialId, 'connector-service', action, success, errorMsg]
      );
    } catch (error) {
      logger.error('Failed to log credential access:', error.message);
      // Don't throw - logging failure shouldn't break functionality
    }
  }

  /**
   * Support multiple databases per customer
   * Paul might have paul_fleet_db and paul_test_db
   */
  async getAllCustomerDatabases(customerId) {
    try {
      const result = await masterDb.query(
        `SELECT geotab_database_name, display_name, is_verified
         FROM customer_connector_credentials
         WHERE customer_id = $1 
         AND connector_type = 'geotab'
         AND is_active = true
         ORDER BY created_at ASC`,
        [customerId]
      );
      
      return result.rows;
    } catch (error) {
      logger.error('Failed to get customer databases:', error.message);
      throw error;
    }
  }
}

export default new CredentialManager();

═════════════════════════════════════════════════════════════════════════════

🔄 HOW IT WORKS AT RUNTIME:
═════════════════════════════════════════════════════════════════════════════

REQUEST: "Sync vehicle data for customer Paul"
  ↓
1. Identify customer: Paul (customer_id = paul-uuid)
  ↓
2. Get Paul's credentials
  credentialManager.getCredentials('paul-uuid', 'geotab')
  ↓
3. Decrypt and retrieve
  Lookup: customer_connector_credentials WHERE customer_id = paul-uuid
  Result: encrypted credentials for paul_fleet_db
  Decrypt: paul_fleet_user, password, paul_fleet_db
  ↓
4. Use Paul's credentials
  geotabConnector.login('paul_fleet_user', 'password', 'paul_fleet_db')
  ↓
5. Fetch Paul's vehicle data
  API call returns: Only Paul's vehicles (paul_fleet_db scope)
  ↓
6. Store in Paul's tenant database
  INSERT INTO paul_tenant_db.vehicles
  ↓
7. Log access (audit trail)
  INSERT INTO credential_access_log (paul's cred accessed at 14:32)
  ↓
DONE: Paul's vehicle data synced with Paul's Geotab credentials

═════════════════════════════════════════════════════════════════════════════

📋 CREDENTIAL SETUP FLOW:
═════════════════════════════════════════════════════════════════════════════

STEP 1: Customer navigates to Settings → Connectors → Geotab

STEP 2: System shows form:
  □ Display Name (e.g., "Main Fleet Database")
  □ Geotab Username
  □ Geotab Password
  □ Geotab Database Name
  □ Geotab Server (defaults to my.geotab.com)

STEP 3: Customer enters their credentials
  Display Name: "Main Fleet Database"
  Username: paul_fleet_user
  Password: [hidden]
  Database: paul_fleet_db
  Server: my.geotab.com

STEP 4: System tests connection
  credentialManager.verifyCredentials(
    customer_id, 
    'geotab', 
    {username, password, database, server}
  )
  
  If fails → Show error "Username/password incorrect"
  If succeeds → Continue

STEP 5: Encrypt and store
  Encrypt credentials with AES-256
  Store in customer_connector_credentials table
  Mark as verified

STEP 6: Enable real-time sync
  geotabConnector.startSync(customerId, 'paul_fleet_db')
  
  Every 5 minutes:
    1. Get Paul's credentials
    2. Connect to paul_fleet_db
    3. Fetch new/updated vehicles
    4. Sync to Paul's tenant database
    5. Update dashboard in real-time

═════════════════════════════════════════════════════════════════════════════

🎯 SUPPORT MULTIPLE DATABASES PER CUSTOMER:
═════════════════════════════════════════════════════════════════════════════

Paul's Company has TWO Geotab databases:
  1. paul_fleet_db (Production vehicles)
  2. paul_fleet_test (Test vehicles)

System supports this:

Setup:
  Paul creates first connector: paul_fleet_db
  Paul creates second connector: paul_fleet_test
  Both stored with different credentials

Sync:
  Connector 1 syncs paul_fleet_db → Paul's tenant DB
  Connector 2 syncs paul_fleet_test → Paul's tenant DB
  Tag vehicles by source database for tracking

UI:
  Settings shows list:
    ☑ Main Fleet Database (paul_fleet_db) - Active
    ☑ Test Database (paul_fleet_test) - Active

═════════════════════════════════════════════════════════════════════════════

🔒 SECURITY BEST PRACTICES:
═════════════════════════════════════════════════════════════════════════════

✓ Encryption:
  • All credentials encrypted at rest (AES-256)
  • Never store passwords in plain text
  • Encryption key stored separately (vault/KMS)

✓ Access Control:
  • Only decrypt when actively syncing
  • Log every credential access
  • Restrict who can view stored credentials
  • Customers can only access their own credentials

✓ Credential Rotation:
  • Support key rotation (encryption_key_version)
  • Customers can rotate credentials anytime
  • Support temporary tokens that expire
  • Audit trail of all rotations

✓ Error Handling:
  • Never log credentials (even in errors)
  • Never expose decrypted data in API responses
  • Return only "credential test failed" message
  • Log errors for debugging (without credentials)

✓ Compliance:
  • GDPR: Customer can request credential deletion
  • SOC2: All access logged with audit trail
  • HIPAA: Credentials encrypted in transit and at rest
  • PCI: Proper credential management practices

═════════════════════════════════════════════════════════════════════════════

🚀 IMPLEMENTATION CHECKLIST:
═════════════════════════════════════════════════════════════════════════════

Database:
  ☐ Create customer_connector_credentials table
  ☐ Create credential_access_log table
  ☐ Create encryption_keys table
  ☐ Add indexes for performance
  ☐ Set up key rotation schedule

Code:
  ☐ Create CredentialManager service
  ☐ Implement encryption/decryption
  ☐ Create verify methods per connector
  ☐ Create getCredentials method (core)
  ☐ Add audit logging

API:
  ☐ POST /api/customer/connectors/credentials (store)
  ☐ POST /api/customer/connectors/verify (test)
  ☐ GET /api/customer/connectors/credentials (list)
  ☐ DELETE /api/customer/connectors/credentials/:id (remove)
  ☐ PUT /api/customer/connectors/credentials/:id (update)

UI:
  ☐ Create connector setup form
  ☐ Show credential setup instructions
  ☐ Test connection button
  ☐ List configured connectors
  ☐ Delete/revoke credentials

Testing:
  ☐ Test encryption/decryption
  ☐ Test credential storage
  ☐ Test credential retrieval
  ☐ Test multiple credentials per customer
  ☐ Test access logging
  ☐ Test error cases

═════════════════════════════════════════════════════════════════════════════

✨ WHY THIS MATTERS:
═════════════════════════════════════════════════════════════════════════════

Without this system:
  ✗ You'd use your Geotab credentials for all customers
  ✗ All customers would see all data
  ✗ Security disaster (GDPR violation!)
  ✗ Scaling nightmare (can't handle 1000+ customers)

With this system:
  ✓ Each customer uses their own credentials
  ✓ Complete data isolation
  ✓ Scales to unlimited customers
  ✓ Enterprise-grade security
  ✓ Full audit trail
  ✓ GDPR/SOC2 compliant

This is the foundation for a real multi-tenant SaaS platform! 🚀

═════════════════════════════════════════════════════════════════════════════
