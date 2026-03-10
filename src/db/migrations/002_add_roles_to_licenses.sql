-- Migration 002: Add roles to licenses table for RBAC
-- Created: 2026-03-07
-- Description: Adds role column to licenses for role-based access control

-- Add role column with default value 'owner' for backward compatibility
ALTER TABLE licenses
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'owner';

-- Add check constraint for valid roles
ALTER TABLE licenses
ADD CONSTRAINT check_license_role
CHECK (role IN ('owner', 'admin', 'member', 'viewer'));

-- Index for role-based queries
CREATE INDEX IF NOT EXISTS idx_licenses_role ON licenses(role);

-- Index for combined license key and role lookups
CREATE INDEX IF NOT EXISTS idx_licenses_key_role ON licenses(license_key, role);
