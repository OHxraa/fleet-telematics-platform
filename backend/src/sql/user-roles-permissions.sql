// ================================================
// ROLE-BASED ACCESS CONTROL (RBAC) SYSTEM
// ================================================
// For Fleet Telematics Multi-Tenant Platform
//
// Users per customer will have different roles:
// - Admin: Full access
// - Manager: Can edit, approve, pull reports
// - Supervisor: Can edit vehicles, view all
// - Driver: View own vehicle, pull own reports
// - Viewer: Read-only access to everything
// ================================================

// ================================================
// 1. DATABASE SCHEMA (Add to customer database)
// ================================================

-- USERS TABLE (Extended)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(20),
    
    -- Role Assignment
    role VARCHAR(50) NOT NULL DEFAULT 'viewer', -- admin, manager, supervisor, driver, viewer
    
    -- Driver-specific fields
    license_number VARCHAR(50),
    license_expiry_date DATE,
    cpc_expiry_date DATE,
    assigned_vehicle_id UUID,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active', -- active, inactive, pending
    last_login_at TIMESTAMP,
    
    -- Metadata
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_assigned_vehicle ON users(assigned_vehicle_id);

-- ================================================
-- ROLES & PERMISSIONS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE, -- admin, manager, supervisor, driver, viewer
    description TEXT,
    is_system_role BOOLEAN DEFAULT true, -- Can't delete system roles
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255),
    description TEXT,
    category VARCHAR(50), -- vehicles, drivers, maintenance, reports, settings, etc
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- ================================================
-- INSERT DEFAULT ROLES
-- ================================================

INSERT INTO roles (id, name, description, is_system_role) VALUES
    ('11111111-1111-1111-1111-111111111111', 'admin', 'Full access to all features', true),
    ('22222222-2222-2222-2222-222222222222', 'manager', 'Can edit, approve, view reports', true),
    ('33333333-3333-3333-3333-333333333333', 'supervisor', 'Can edit vehicles, view all data', true),
    ('44444444-4444-4444-4444-444444444444', 'driver', 'Can view own vehicle and data', true),
    ('55555555-5555-5555-5555-555555555555', 'viewer', 'Read-only access', true);

-- ================================================
-- INSERT PERMISSIONS
-- ================================================

INSERT INTO permissions (code, name, description, category) VALUES
    -- VEHICLES
    ('vehicle.view', 'View Vehicles', 'Can view vehicle list', 'vehicles'),
    ('vehicle.view_own', 'View Own Vehicle', 'Can only view assigned vehicle', 'vehicles'),
    ('vehicle.create', 'Create Vehicle', 'Can add new vehicles', 'vehicles'),
    ('vehicle.edit', 'Edit Vehicle', 'Can edit vehicle details', 'vehicles'),
    ('vehicle.edit_name', 'Edit Vehicle Name', 'Can edit vehicle registration/name', 'vehicles'),
    ('vehicle.delete', 'Delete Vehicle', 'Can delete vehicles', 'vehicles'),
    ('vehicle.assign_driver', 'Assign Driver', 'Can assign drivers to vehicles', 'vehicles'),
    
    -- DRIVERS
    ('driver.view', 'View Drivers', 'Can view driver list', 'drivers'),
    ('driver.create', 'Create Driver', 'Can add new drivers', 'drivers'),
    ('driver.edit', 'Edit Driver', 'Can edit driver details', 'drivers'),
    ('driver.view_behaviour', 'View Driver Behaviour', 'Can view driving scores', 'drivers'),
    ('driver.manage_training', 'Manage Training', 'Can assign/track training', 'drivers'),
    
    -- MAINTENANCE
    ('maintenance.view', 'View Maintenance', 'Can view maintenance schedule', 'maintenance'),
    ('maintenance.create', 'Create Maintenance', 'Can schedule maintenance', 'maintenance'),
    ('maintenance.edit', 'Edit Maintenance', 'Can edit maintenance records', 'maintenance'),
    ('maintenance.approve', 'Approve Maintenance', 'Can approve maintenance requests', 'maintenance'),
    
    -- REPORTS
    ('reports.view', 'View Reports', 'Can access reports', 'reports'),
    ('reports.driver_behaviour', 'Driver Behaviour Reports', 'Can view driver behaviour reports', 'reports'),
    ('reports.maintenance', 'Maintenance Reports', 'Can view maintenance reports', 'reports'),
    ('reports.fuel', 'Fuel Reports', 'Can view fuel efficiency reports', 'reports'),
    ('reports.compliance', 'Compliance Reports', 'Can view compliance reports', 'reports'),
    ('reports.export', 'Export Reports', 'Can export reports as PDF/CSV', 'reports'),
    
    -- ALERTS
    ('alerts.view', 'View Alerts', 'Can view alerts', 'alerts'),
    ('alerts.acknowledge', 'Acknowledge Alerts', 'Can acknowledge alerts', 'alerts'),
    
    -- SETTINGS
    ('settings.view', 'View Settings', 'Can view system settings', 'settings'),
    ('settings.edit', 'Edit Settings', 'Can edit system settings', 'settings'),
    ('users.manage', 'Manage Users', 'Can manage users and permissions', 'users'),
    ('billing.view', 'View Billing', 'Can view billing information', 'billing'),
    
    -- GEOFENCING
    ('geofence.view', 'View Geofences', 'Can view geofencing zones', 'geofence'),
    ('geofence.create', 'Create Geofence', 'Can create geofencing zones', 'geofence'),
    ('geofence.edit', 'Edit Geofence', 'Can edit geofencing zones', 'geofence');

-- ================================================
-- ASSIGN PERMISSIONS TO ROLES
-- ================================================

-- ADMIN: Full access to everything
INSERT INTO role_permissions (role_id, permission_id)
SELECT '11111111-1111-1111-1111-111111111111', id FROM permissions;

-- MANAGER: Can do most things except delete and manage users
INSERT INTO role_permissions (role_id, permission_id)
SELECT '22222222-2222-2222-2222-222222222222', id FROM permissions
WHERE code NOT IN ('vehicle.delete', 'users.manage', 'settings.edit', 'billing.view');

-- SUPERVISOR: Can view and edit vehicles/drivers, view reports
INSERT INTO role_permissions (role_id, permission_id)
SELECT '33333333-3333-3333-3333-333333333333', id FROM permissions
WHERE code IN (
    'vehicle.view', 'vehicle.edit', 'vehicle.edit_name',
    'driver.view', 'driver.edit', 'driver.view_behaviour',
    'maintenance.view', 'maintenance.create', 'maintenance.edit',
    'reports.view', 'reports.driver_behaviour', 'reports.maintenance', 'reports.fuel', 'reports.export',
    'alerts.view', 'geofence.view'
);

-- DRIVER: Can only view own vehicle and data
INSERT INTO role_permissions (role_id, permission_id)
SELECT '44444444-4444-4444-4444-444444444444', id FROM permissions
WHERE code IN (
    'vehicle.view_own',
    'reports.view', 'reports.driver_behaviour', 'reports.export',
    'alerts.view'
);

-- VIEWER: Read-only access to everything
INSERT INTO role_permissions (role_id, permission_id)
SELECT '55555555-5555-5555-5555-555555555555', id FROM permissions
WHERE code LIKE '%.view%' OR code LIKE '%.view_%';

-- ================================================
-- 2. MIDDLEWARE FOR PERMISSION CHECKING
-- ================================================
// File: src/middleware/permissions.middleware.js

import { masterPool } from '../config/database.js';
import logger from '../config/logger.js';

/**
 * Check if user has specific permission
 * Returns middleware function
 */
export const requirePermission = (permissionCode) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Not authenticated' });
            }

            // Get user's role
            const userResult = await req.db.query(
                'SELECT role FROM users WHERE id = $1',
                [req.user.id]
            );

            if (userResult.rows.length === 0) {
                return res.status(401).json({ error: 'User not found' });
            }

            const userRole = userResult.rows[0].role;

            // Get role's permissions
            const permResult = await req.db.query(
                `SELECT p.code FROM permissions p
                 JOIN role_permissions rp ON p.id = rp.permission_id
                 JOIN roles r ON rp.role_id = r.id
                 WHERE r.name = $1 AND p.code = $2`,
                [userRole, permissionCode]
            );

            if (permResult.rows.length === 0) {
                logger.warn(`Permission denied: ${req.user.id} trying to access ${permissionCode}`);
                return res.status(403).json({
                    error: 'Permission denied',
                    required: permissionCode
                });
            }

            next();
        } catch (error) {
            logger.error('Permission check failed:', error.message);
            return res.status(500).json({ error: 'Permission check failed' });
        }
    };
};

/**
 * Check if user can view specific resource
 * For drivers: can only see own vehicle
 * For others: based on permissions
 */
export const requireResourceAccess = (resourceType) => {
    return async (req, res, next) => {
        try {
            const user = req.user;
            const resourceId = req.params.id || req.params.vehicleId;

            if (!resourceId) {
                return next();
            }

            // Get user role
            const userResult = await req.db.query(
                'SELECT role, assigned_vehicle_id FROM users WHERE id = $1',
                [user.id]
            );

            if (userResult.rows.length === 0) {
                return res.status(401).json({ error: 'User not found' });
            }

            const { role, assigned_vehicle_id } = userResult.rows[0];

            // Drivers can only see their own vehicle
            if (role === 'driver' && resourceType === 'vehicle') {
                if (assigned_vehicle_id !== resourceId) {
                    return res.status(403).json({
                        error: 'You can only access your assigned vehicle'
                    });
                }
            }

            // Viewers can only view (handled by requirePermission)
            if (role === 'viewer' && ['POST', 'PUT', 'DELETE'].includes(req.method)) {
                return res.status(403).json({
                    error: 'Viewers cannot modify data'
                });
            }

            next();
        } catch (error) {
            logger.error('Resource access check failed:', error.message);
            return res.status(500).json({ error: 'Resource access check failed' });
        }
    };
};

/**
 * Get user's role
 */
export const getUserRole = async (req, res, next) => {
    try {
        const result = await req.db.query(
            'SELECT role FROM users WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length > 0) {
            req.user.role = result.rows[0].role;
        }

        next();
    } catch (error) {
        logger.error('Failed to get user role:', error.message);
        next();
    }
};

export default {
    requirePermission,
    requireResourceAccess,
    getUserRole
};

-- ================================================
-- 3. USER MANAGEMENT CONTROLLER
-- ================================================
// File: src/controllers/user.controller.js

import { masterPool } from '../config/database.js';
import logger from '../config/logger.js';
import bcrypt from 'bcryptjs';

/**
 * GET /api/users
 * List all users for current customer
 */
export const listUsers = async (req, res) => {
    try {
        const result = await req.db.query(
            `SELECT 
                id, email, full_name, role, status, 
                assigned_vehicle_id, last_login_at, created_at
             FROM users 
             ORDER BY created_at DESC`
        );

        return res.json({
            success: true,
            data: result.rows,
            total: result.rows.length
        });
    } catch (error) {
        logger.error('Failed to list users:', error.message);
        return res.status(500).json({ error: 'Failed to list users' });
    }
};

/**
 * GET /api/users/roles
 * List all available roles
 */
export const listRoles = async (req, res) => {
    try {
        const result = await req.db.query(
            'SELECT id, name, description FROM roles ORDER BY name'
        );

        return res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        logger.error('Failed to list roles:', error.message);
        return res.status(500).json({ error: 'Failed to list roles' });
    }
};

/**
 * POST /api/users
 * Create new user
 */
export const createUser = async (req, res) => {
    try {
        const { email, full_name, role, phone, assigned_vehicle_id } = req.body;

        if (!email || !role) {
            return res.status(400).json({
                error: 'Email and role are required'
            });
        }

        // Check role exists
        const roleResult = await req.db.query(
            'SELECT id FROM roles WHERE name = $1',
            [role]
        );

        if (roleResult.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        // Generate temporary password
        const tempPassword = Math.random().toString(36).substring(2, 15);
        const passwordHash = await bcrypt.hash(tempPassword, 10);

        // Create user
        const result = await req.db.query(
            `INSERT INTO users 
             (email, password_hash, full_name, role, phone, assigned_vehicle_id, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, email, full_name, role`,
            [email, passwordHash, full_name, role, phone, assigned_vehicle_id, req.user.id]
        );

        const newUser = result.rows[0];

        logger.info(`New user created: ${email} (${role})`);

        return res.status(201).json({
            success: true,
            data: newUser,
            temporary_password: tempPassword,
            message: 'User created. Send temporary password securely to user.'
        });

    } catch (error) {
        logger.error('Failed to create user:', error.message);
        return res.status(500).json({ error: 'Failed to create user' });
    }
};

/**
 * PUT /api/users/:id
 * Update user
 */
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, role, phone, assigned_vehicle_id, status } = req.body;

        const updates = [];
        const params = [id];
        let paramCount = 2;

        if (full_name !== undefined) {
            updates.push(`full_name = $${paramCount++}`);
            params.push(full_name);
        }

        if (role !== undefined) {
            updates.push(`role = $${paramCount++}`);
            params.push(role);
        }

        if (phone !== undefined) {
            updates.push(`phone = $${paramCount++}`);
            params.push(phone);
        }

        if (assigned_vehicle_id !== undefined) {
            updates.push(`assigned_vehicle_id = $${paramCount++}`);
            params.push(assigned_vehicle_id);
        }

        if (status !== undefined) {
            updates.push(`status = $${paramCount++}`);
            params.push(status);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');

        const result = await req.db.query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
            params
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        logger.info(`User updated: ${id}`);

        return res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        logger.error('Failed to update user:', error.message);
        return res.status(500).json({ error: 'Failed to update user' });
    }
};

/**
 * DELETE /api/users/:id
 * Deactivate user (soft delete)
 */
export const deactivateUser = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await req.db.query(
            `UPDATE users SET status = 'inactive', updated_at = CURRENT_TIMESTAMP 
             WHERE id = $1 RETURNING id, email, status`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        logger.info(`User deactivated: ${id}`);

        return res.json({
            success: true,
            data: result.rows[0],
            message: 'User deactivated'
        });

    } catch (error) {
        logger.error('Failed to deactivate user:', error.message);
        return res.status(500).json({ error: 'Failed to deactivate user' });
    }
};

/**
 * GET /api/users/:id/permissions
 * Get user's permissions
 */
export const getUserPermissions = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await req.db.query(
            `SELECT p.code, p.name, p.category
             FROM permissions p
             JOIN role_permissions rp ON p.id = rp.permission_id
             JOIN roles r ON rp.role_id = r.id
             JOIN users u ON u.role = r.name
             WHERE u.id = $1
             ORDER BY p.category, p.name`,
            [id]
        );

        return res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        logger.error('Failed to get user permissions:', error.message);
        return res.status(500).json({ error: 'Failed to get permissions' });
    }
};

export default {
    listUsers,
    listRoles,
    createUser,
    updateUser,
    deactivateUser,
    getUserPermissions
};

-- ================================================
-- 4. USER MANAGEMENT ROUTES
-- ================================================
// File: src/routes/user.routes.js

import express from 'express';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';
import { 
    requirePermission, 
    requireResourceAccess, 
    getUserRole 
} from '../middleware/permissions.middleware.js';
import {
    listUsers,
    listRoles,
    createUser,
    updateUser,
    deactivateUser,
    getUserPermissions
} from '../controllers/user.controller.js';

const router = express.Router();

// Apply tenant middleware to all routes
router.use(tenantMiddleware);
router.use(getUserRole);

/**
 * GET /api/users
 * List all users
 */
router.get('/', requirePermission('users.manage'), listUsers);

/**
 * GET /api/users/roles
 * List available roles
 */
router.get('/roles', listRoles);

/**
 * POST /api/users
 * Create new user
 */
router.post('/', requirePermission('users.manage'), createUser);

/**
 * GET /api/users/:id/permissions
 * Get user's permissions
 */
router.get('/:id/permissions', getUserPermissions);

/**
 * PUT /api/users/:id
 * Update user
 */
router.put('/:id', requirePermission('users.manage'), updateUser);

/**
 * DELETE /api/users/:id
 * Deactivate user
 */
router.delete('/:id', requirePermission('users.manage'), deactivateUser);

export default router;

-- ================================================
-- 5. ROLE DEFINITIONS & PERMISSIONS MATRIX
-- ================================================

ADMIN (Full Access)
├─ Can manage everything
├─ Can create/edit/delete users
├─ Can access all settings
├─ Can view all reports
└─ Can manage billing

MANAGER (Operational Lead)
├─ Can create/edit vehicles & drivers
├─ Can schedule & approve maintenance
├─ Can view all reports & export
├─ Can manage users (except admins)
├─ Can view compliance data
└─ Cannot: Delete data, edit billing

SUPERVISOR (Fleet Manager)
├─ Can edit vehicle names & assignments
├─ Can view all vehicle & driver data
├─ Can create/edit maintenance
├─ Can view & export reports
├─ Can manage geofences
└─ Cannot: Delete, change settings, manage users

DRIVER (Vehicle Operator)
├─ Can view only assigned vehicle
├─ Can view own driving behaviour
├─ Can pull own performance reports
├─ Can export own data
└─ Cannot: Edit anything, see other vehicles/drivers

VIEWER (Read-Only)
├─ Can view all vehicle & driver data
├─ Can view all reports
├─ Can export reports
└─ Cannot: Edit anything

-- ================================================
-- 6. USAGE EXAMPLES
-- ================================================

// Example 1: Create Manager User
POST /api/users
{
  "email": "manager@fleet.com",
  "full_name": "John Manager",
  "role": "manager",
  "phone": "+44 123 456 7890"
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "manager@fleet.com",
    "full_name": "John Manager",
    "role": "manager"
  },
  "temporary_password": "abc123xyz789"
}

// Example 2: Assign Driver to Vehicle
PUT /api/users/:id
{
  "assigned_vehicle_id": "vehicle-uuid",
  "role": "driver"
}

// Example 3: Get User's Permissions
GET /api/users/:id/permissions

Response:
{
  "success": true,
  "data": [
    {
      "code": "vehicle.view_own",
      "name": "View Own Vehicle",
      "category": "vehicles"
    },
    {
      "code": "reports.view",
      "name": "View Reports",
      "category": "reports"
    }
  ]
}

-- ================================================
-- IMPLEMENTATION CHECKLIST
-- ================================================

☐ Add users table to customer database schema
☐ Add roles & permissions tables
☐ Insert system roles (admin, manager, supervisor, driver, viewer)
☐ Insert permissions for all features
☐ Assign permissions to roles
☐ Create permissions middleware
☐ Create user management controller
☐ Create user management routes
☐ Add user middleware to all protected routes
☐ Update vehicle routes with requireResourceAccess
☐ Test role-based access
☐ Test permission checking
☐ Test read-only vs edit permissions

-- ================================================
