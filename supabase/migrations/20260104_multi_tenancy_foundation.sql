-- ═══════════════════════════════════════════════════════════════════════════════
-- 🏢 MULTI-TENANCY SCHEMA - AgencyOS Enterprise
-- Full tenant isolation with RLS
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────────
-- TENANTS TABLE (Core)
-- ─────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id),
    
    -- Plan & Status
    plan TEXT NOT NULL DEFAULT 'FREE' CHECK (plan IN ('FREE', 'PRO', 'ENTERPRISE')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
    
    -- Settings (JSONB for flexibility)
    settings JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_owner ON tenants(owner_id);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

-- ─────────────────────────────────────────────────────────────────────────────────
-- TENANT MEMBERS TABLE (Team)
-- ─────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tenant_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    
    -- Member Info
    email TEXT NOT NULL,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'manager', 'member', 'viewer')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'suspended')),
    
    -- Invitation
    invited_by UUID REFERENCES auth.users(id),
    joined_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant ON tenant_members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_user ON tenant_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_email ON tenant_members(email);

-- ─────────────────────────────────────────────────────────────────────────────────
-- INVITATIONS TABLE
-- ─────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES tenant_members(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);

-- ─────────────────────────────────────────────────────────────────────────────────
-- TENANT BRANDING TABLE (White-Label)
-- ─────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tenant_branding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID UNIQUE NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Basic Branding
    brand_name TEXT,
    tagline TEXT,
    logo_url TEXT,
    favicon_url TEXT,
    
    -- Colors
    primary_color TEXT DEFAULT '#6750A4',
    secondary_color TEXT DEFAULT '#625B71',
    accent_color TEXT DEFAULT '#7D5260',
    background_color TEXT DEFAULT '#FEF7FF',
    text_color TEXT DEFAULT '#1D1B20',
    
    -- Typography
    font_family TEXT,
    heading_font TEXT,
    
    -- Custom Domain
    custom_domain TEXT,
    domain_verified BOOLEAN DEFAULT FALSE,
    ssl_enabled BOOLEAN DEFAULT FALSE,
    
    -- Customization
    custom_css TEXT,
    show_powered_by BOOLEAN DEFAULT TRUE,
    powered_by_text TEXT,
    
    -- Login Page
    login_background_url TEXT,
    login_message TEXT,
    
    -- Email
    email_from_name TEXT,
    email_reply_to TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────────
-- CUSTOM DOMAINS TABLE
-- ─────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS custom_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    domain TEXT UNIQUE NOT NULL,
    
    -- Verification
    txt_record TEXT NOT NULL,
    cname_record TEXT NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    ssl_enabled BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_domains_tenant ON custom_domains(tenant_id);
CREATE INDEX IF NOT EXISTS idx_custom_domains_domain ON custom_domains(domain);

-- ─────────────────────────────────────────────────────────────────────────────────
-- AUDIT LOG TABLE
-- ─────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID,
    
    -- Action Details
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    
    -- Context
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────────

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Tenants: User can see tenants they are a member of
CREATE POLICY tenants_member_policy ON tenants
    FOR SELECT USING (
        id IN (
            SELECT tenant_id FROM tenant_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Tenant Members: Can see members of their tenants
CREATE POLICY tenant_members_view_policy ON tenant_members
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Tenant Members: Owners/Admins can insert/update/delete
CREATE POLICY tenant_members_manage_policy ON tenant_members
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_members 
            WHERE user_id = auth.uid() 
            AND status = 'active' 
            AND role IN ('owner', 'admin')
        )
    );

-- Branding: Members can view, owners/admins can modify
CREATE POLICY tenant_branding_view_policy ON tenant_branding
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY tenant_branding_manage_policy ON tenant_branding
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_members 
            WHERE user_id = auth.uid() 
            AND status = 'active' 
            AND role IN ('owner', 'admin')
        )
    );

-- Audit Logs: Members can view their tenant's logs
CREATE POLICY audit_logs_view_policy ON audit_logs
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Audit Logs: System can insert (service role)
CREATE POLICY audit_logs_insert_policy ON audit_logs
    FOR INSERT WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────────
-- HELPER FUNCTIONS
-- ─────────────────────────────────────────────────────────────────────────────────

-- Get current user's tenant IDs
CREATE OR REPLACE FUNCTION get_user_tenant_ids()
RETURNS UUID[] AS $$
BEGIN
    RETURN ARRAY(
        SELECT tenant_id 
        FROM tenant_members 
        WHERE user_id = auth.uid() AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has role in tenant
CREATE OR REPLACE FUNCTION check_tenant_role(
    p_tenant_id UUID,
    p_required_role TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
    role_level INT;
    required_level INT;
BEGIN
    -- Get user's role in tenant
    SELECT role INTO user_role
    FROM tenant_members
    WHERE tenant_id = p_tenant_id 
    AND user_id = auth.uid() 
    AND status = 'active';
    
    IF user_role IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Role hierarchy
    role_level := CASE user_role
        WHEN 'owner' THEN 100
        WHEN 'admin' THEN 80
        WHEN 'manager' THEN 60
        WHEN 'member' THEN 40
        WHEN 'viewer' THEN 20
        ELSE 0
    END;
    
    required_level := CASE p_required_role
        WHEN 'owner' THEN 100
        WHEN 'admin' THEN 80
        WHEN 'manager' THEN 60
        WHEN 'member' THEN 40
        WHEN 'viewer' THEN 20
        ELSE 0
    END;
    
    RETURN role_level >= required_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log audit event
CREATE OR REPLACE FUNCTION log_audit_event(
    p_tenant_id UUID,
    p_action TEXT,
    p_resource_type TEXT,
    p_resource_id TEXT DEFAULT NULL,
    p_details JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO audit_logs (tenant_id, user_id, action, resource_type, resource_id, details)
    VALUES (p_tenant_id, auth.uid(), p_action, p_resource_type, p_resource_id, p_details)
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
COMMIT;
