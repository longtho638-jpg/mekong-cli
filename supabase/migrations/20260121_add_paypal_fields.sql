-- ─────────────────────────────────────────────────────────────────────────────────
-- Migration: Add PayPal Support to Billing Schema
-- Date: 2026-01-21
-- Description: Adds PayPal specific columns to subscriptions and payments tables.
--              Updates plan check constraints to support unified ecosystem tiers.
-- ─────────────────────────────────────────────────────────────────────────────────

-- 1. Update SUBSCRIPTIONS table
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS paypal_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS paypal_order_id TEXT,
ADD COLUMN IF NOT EXISTS paypal_payer_email TEXT;

-- Create index for PayPal lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_paypal_sub ON subscriptions(paypal_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paypal_order ON subscriptions(paypal_order_id);

-- 2. Update PAYMENTS table
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS paypal_capture_id TEXT;

CREATE INDEX IF NOT EXISTS idx_payments_paypal_capture ON payments(paypal_capture_id);

-- 3. Update Plan Constraint
-- Drop existing constraint
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;

-- Add new constraint with broader support
ALTER TABLE subscriptions
ADD CONSTRAINT subscriptions_plan_check
CHECK (plan IN ('FREE', 'STARTER', 'PRO', 'AGENCY', 'FRANCHISE', 'ENTERPRISE'));

-- 4. Comment on columns
COMMENT ON COLUMN subscriptions.paypal_subscription_id IS 'PayPal Subscription ID (I-...)';
COMMENT ON COLUMN subscriptions.paypal_order_id IS 'PayPal Order ID for one-time or initial setup';
COMMENT ON COLUMN payments.paypal_capture_id IS 'PayPal Capture ID for successful transactions';
