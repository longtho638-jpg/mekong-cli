-- AgencyOS Subscription Management Schema
-- Version: 1.0.0
-- Created: 2025-12-31
-- Purpose: Enable $1M revenue collection for 2026

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID, -- FK removed as agencies table may not exist
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  tier VARCHAR(50) NOT NULL DEFAULT 'starter', -- starter, pro, franchise, enterprise
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, cancelled, past_due, trialing
  polar_subscription_id VARCHAR(255),
  polar_customer_id VARCHAR(255),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions" ON public.subscriptions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- LICENSES TABLE (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS public.licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  plan VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'active', -- active, expired, canceled, refunded
  polar_order_id VARCHAR(255),
  polar_customer_id VARCHAR(255),
  subscription_id UUID REFERENCES public.subscriptions(id),
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Licenses RLS
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own licenses" ON public.licenses
  FOR SELECT USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Service role can manage licenses" ON public.licenses
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- USAGE TRACKING TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID, -- FK removed as agencies table may not exist
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL, -- api_call, command_exec, export
  command VARCHAR(100),
  endpoint VARCHAR(255),
  tokens_used INT DEFAULT 0,
  cost_cents INT DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage Logs RLS
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage" ON public.usage_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Agencies can view their usage" ON public.usage_logs
  FOR SELECT USING (
    agency_id IS NOT NULL
  );

-- ============================================
-- TIER LIMITS VIEW
-- ============================================
CREATE OR REPLACE VIEW public.tier_limits AS
SELECT 
  'starter' as tier,
  1000 as monthly_api_calls,
  50 as monthly_commands,
  1 as team_members,
  FALSE as white_label,
  FALSE as api_access
UNION ALL
SELECT 
  'pro' as tier,
  10000 as monthly_api_calls,
  500 as monthly_commands,
  5 as team_members,
  FALSE as white_label,
  TRUE as api_access
UNION ALL
SELECT 
  'franchise' as tier,
  100000 as monthly_api_calls,
  5000 as monthly_commands,
  25 as team_members,
  TRUE as white_label,
  TRUE as api_access
UNION ALL
SELECT 
  'enterprise' as tier,
  -1 as monthly_api_calls, -- unlimited
  -1 as monthly_commands,   -- unlimited
  -1 as team_members,        -- unlimited
  TRUE as white_label,
  TRUE as api_access;

-- ============================================
-- USAGE SUMMARY FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION get_monthly_usage(p_agency_id UUID)
RETURNS TABLE (
  api_calls BIGINT,
  commands BIGINT,
  tokens_used BIGINT,
  cost_cents BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE action = 'api_call') as api_calls,
    COUNT(*) FILTER (WHERE action = 'command_exec') as commands,
    COALESCE(SUM(u.tokens_used), 0) as tokens_used,
    COALESCE(SUM(u.cost_cents), 0) as cost_cents
  FROM public.usage_logs u
  WHERE u.agency_id = p_agency_id
    AND u.created_at >= date_trunc('month', CURRENT_TIMESTAMP);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_agency_id ON public.subscriptions(agency_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_licenses_email ON public.licenses(email);
CREATE INDEX IF NOT EXISTS idx_licenses_license_key ON public.licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_usage_logs_agency_id ON public.usage_logs(agency_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON public.usage_logs(created_at);

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_licenses_updated_at
  BEFORE UPDATE ON public.licenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
