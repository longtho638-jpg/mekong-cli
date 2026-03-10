-- Migration 007: Add License Enforcement Event Tracking
-- Created: 2026-03-07
-- Description: Add license status and enforcement action columns to rate_limit_events

-- Add license_status column to track license state during enforcement
ALTER TABLE rate_limit_events
ADD COLUMN IF NOT EXISTS license_status VARCHAR(50);

-- Add enforcement_action column to track action taken
ALTER TABLE rate_limit_events
ADD COLUMN IF NOT EXISTS enforcement_action VARCHAR(50);

-- Add required_tier column to track tier requirements for access
ALTER TABLE rate_limit_events
ADD COLUMN IF NOT EXISTS required_tier VARCHAR(50);

-- Update event_type CHECK constraint to include license enforcement events
-- First, drop the existing constraint if it exists
ALTER TABLE rate_limit_events
DROP CONSTRAINT IF EXISTS rate_limit_events_event_type_check;

-- Add new CHECK constraint with expanded event types
ALTER TABLE rate_limit_events
ADD CONSTRAINT rate_limit_events_event_type_check
CHECK (event_type IN (
    -- Original rate limit events
    'override_applied',
    'request_allowed',
    'rate_limited',
    -- License enforcement events
    'license_suspended',
    'license_revoked',
    'license_expired',
    'license_invalid',
    'license_blocked',
    'tier_insufficient'
));

-- Create index for enforcement queries (status + timestamp)
CREATE INDEX IF NOT EXISTS idx_rate_limit_events_enforcement
ON rate_limit_events(enforcement_action, created_at);

-- Create index for license status queries
CREATE INDEX IF NOT EXISTS idx_rate_limit_events_license_status
ON rate_limit_events(license_status, created_at);

-- Add comments for documentation
COMMENT ON COLUMN rate_limit_events.license_status IS 'License status: active, suspended, revoked, expired, invalid';
COMMENT ON COLUMN rate_limit_events.enforcement_action IS 'Action taken: allowed, blocked, rate_limited';
COMMENT ON COLUMN rate_limit_events.required_tier IS 'Tier required for endpoint access';

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Migration 007: License enforcement columns added to rate_limit_events';
END $$;
