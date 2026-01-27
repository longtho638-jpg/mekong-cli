-- Admin System Schema
-- For global platform administration

BEGIN;

-- 1. Feature Flags
CREATE TABLE IF NOT EXISTS public.feature_flags (
    key TEXT PRIMARY KEY,
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT,
    environment TEXT NOT NULL DEFAULT 'production', -- 'development', 'staging', 'production', 'all'
    rules JSONB DEFAULT '{}'::jsonb, -- Targeting rules (e.g. specific tenants, users)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. System Settings (Global Config)
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID -- reference to auth.users
);

-- 3. Admin Permissions (Granular)
CREATE TABLE IF NOT EXISTS public.admin_permissions (
    role TEXT NOT NULL, -- 'owner', 'admin', 'moderator'
    resource TEXT NOT NULL, -- 'users', 'revenue', 'system', 'audit'
    action TEXT NOT NULL, -- 'read', 'write', 'delete', '*'
    PRIMARY KEY (role, resource, action)
);

-- Seed default permissions
INSERT INTO public.admin_permissions (role, resource, action) VALUES
('owner', '*', '*'),
('admin', 'users', '*'),
('admin', 'revenue', 'read'),
('admin', 'system', 'read'),
('admin', 'audit', 'read'),
('developer', 'feature_flags', '*'),
('viewer', 'users', 'read'),
('viewer', 'revenue', 'read')
ON CONFLICT DO NOTHING;

-- RLS Policies
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

-- Feature Flags Policies
CREATE POLICY "Admins and Developers can view feature flags" ON public.feature_flags
    FOR SELECT TO authenticated USING (
        auth.jwt() ->> 'role' IN ('owner', 'admin', 'developer')
    );

CREATE POLICY "Owners and Developers can manage feature flags" ON public.feature_flags
    FOR ALL TO authenticated USING (
        auth.jwt() ->> 'role' IN ('owner', 'developer')
    );

-- System Settings Policies
CREATE POLICY "Admins can view system settings" ON public.system_settings
    FOR SELECT TO authenticated USING (
        auth.jwt() ->> 'role' IN ('owner', 'admin')
    );

CREATE POLICY "Owners can manage system settings" ON public.system_settings
    FOR ALL TO authenticated USING (
        auth.jwt() ->> 'role' = 'owner'
    );

-- Admin Permissions Policies
CREATE POLICY "Everyone can read permissions" ON public.admin_permissions
    FOR SELECT TO authenticated USING (true); -- Needed for UI to check what they can do

CREATE POLICY "Only Owners can modify permissions" ON public.admin_permissions
    FOR ALL TO authenticated USING (
        auth.jwt() ->> 'role' = 'owner'
    );

COMMIT;
