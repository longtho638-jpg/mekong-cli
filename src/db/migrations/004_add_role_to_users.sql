-- Migration 004: Add role column to users table
-- Created: 2026-03-07
-- Description: Adds RBAC role column for Stripe subscription-based role provisioning

-- Add role column with default value
ALTER TABLE users
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'member'
CHECK (role IN ('viewer', 'member', 'admin', 'owner'));

-- Add index for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Add stripe_customer_id for linking to Stripe customers
ALTER TABLE users
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);

-- Add index for Stripe customer lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);

-- Comment for documentation
COMMENT ON COLUMN users.role IS 'RBAC role synced from Stripe subscription tier';
COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe Customer ID for billing integration';
