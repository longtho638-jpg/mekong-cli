-- =============================================
-- NEWSLETTER SAAS - ORGANIZATIONS & AUTH
-- Multi-tenant support for agencies
-- Created: 2024-12-31
-- =============================================

-- ===================
-- ORGANIZATIONS
-- ===================
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    
    -- Plan & Billing
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'agency')),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    
    -- Limits
    newsletters_limit INT DEFAULT 1,
    subscribers_limit INT DEFAULT 500,
    sends_limit INT DEFAULT 1000,
    
    -- Usage
    newsletters_count INT DEFAULT 0,
    subscribers_count INT DEFAULT 0,
    sends_this_month INT DEFAULT 0,
    
    -- Referral Program
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES organizations(id),
    referral_credits INT DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_plan ON organizations(plan);

-- ===================
-- ORGANIZATION MEMBERS
-- ===================
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    joined_at TIMESTAMPTZ,
    
    UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);

-- ===================
-- NEWSLETTER TEMPLATES
-- ===================
CREATE TABLE IF NOT EXISTS newsletter_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    description TEXT,
    html_content TEXT,
    json_content JSONB,
    
    -- Template settings
    is_public BOOLEAN DEFAULT FALSE,
    category TEXT DEFAULT 'custom',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================
-- NEWSLETTER AUTOMATIONS
-- ===================
CREATE TABLE IF NOT EXISTS newsletter_automations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    newsletter_id UUID REFERENCES newsletters(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('signup', 'tag_added', 'date_based', 'inactivity')),
    
    -- Automation config
    trigger_config JSONB DEFAULT '{}',
    sequence JSONB DEFAULT '[]', -- [{delay: '1d', issue_id: '...', subject: '...'}]
    
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'draft')),
    
    -- Stats
    total_sent INT DEFAULT 0,
    total_completed INT DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================
-- API KEYS
-- ===================
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    key_prefix TEXT NOT NULL, -- First 8 chars for identification
    key_hash TEXT UNIQUE NOT NULL,
    
    -- Permissions
    scopes TEXT[] DEFAULT ARRAY['read'],
    
    -- Usage
    last_used_at TIMESTAMPTZ,
    request_count INT DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================
-- PLAN LIMITS HELPER
-- ===================
CREATE OR REPLACE FUNCTION get_plan_limits(p_plan TEXT)
RETURNS TABLE(newsletters INT, subscribers INT, sends INT)
LANGUAGE plpgsql
AS $$
BEGIN
    CASE p_plan
        WHEN 'free' THEN
            RETURN QUERY SELECT 1, 500, 1000;
        WHEN 'pro' THEN
            RETURN QUERY SELECT 5, 10000, 50000;
        WHEN 'agency' THEN
            RETURN QUERY SELECT -1, -1, -1; -- Unlimited
        ELSE
            RETURN QUERY SELECT 1, 500, 1000;
    END CASE;
END;
$$;

-- ===================
-- AUTO-CREATE ORG ON SIGNUP
-- ===================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    v_org_id UUID;
    v_referral_code TEXT;
BEGIN
    -- Generate unique referral code
    v_referral_code := 'MM-' || SUBSTRING(gen_random_uuid()::TEXT, 1, 8);
    
    -- Create organization for new user
    INSERT INTO public.organizations (name, slug, referral_code)
    VALUES (
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        LOWER(REGEXP_REPLACE(COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)), '[^a-zA-Z0-9]', '-', 'g')),
        v_referral_code
    )
    RETURNING id INTO v_org_id;
    
    -- Add user as owner
    INSERT INTO public.organization_members (organization_id, user_id, role, joined_at)
    VALUES (v_org_id, NEW.id, 'owner', NOW());
    
    RETURN NEW;
END;
$$;

-- Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ===================
-- ROW LEVEL SECURITY
-- ===================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Organizations: Users can see their own orgs
CREATE POLICY "Users can view their organizations"
    ON organizations FOR SELECT
    USING (
        id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- Organization members: Users can see members of their orgs
CREATE POLICY "Users can view org members"
    ON organization_members FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- Templates: Users can manage their org templates
CREATE POLICY "Users can manage org templates"
    ON newsletter_templates FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- Service role access
CREATE POLICY "Service role full access organizations"
    ON organizations FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access members"
    ON organization_members FOR ALL
    USING (auth.role() = 'service_role');
