-- Immutable Audit Logs Table
-- Phase 19: Enterprise Readiness & Security Hardening

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id TEXT NOT NULL,         -- User ID or Agent ID
    actor_type TEXT NOT NULL,       -- 'user' or 'agent'
    action TEXT NOT NULL,           -- e.g., 'git_commit', 'deploy_prod', 'access_revenue'
    resource TEXT,                  -- e.g., 'repo:mekong-cli', 'endpoint:/api/revenue'
    status TEXT NOT NULL,           -- 'success', 'failed', 'blocked'
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indices for security monitoring
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);

-- Enable Row Level Security (RLS)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 🛡️ IMMUTABILITY: No one, not even owners, can DELETE or UPDATE audit logs via the API.
-- Only INSERT and SELECT are permitted.

CREATE POLICY "Audit logs are append-only (Insert)"
    ON audit_logs
    FOR INSERT
    TO authenticated, service_role
    WITH CHECK (true);

CREATE POLICY "Owners and Admins can read all audit logs"
    ON audit_logs
    FOR SELECT
    TO authenticated
    USING (
        auth.jwt() ->> 'role' IN ('owner', 'admin')
    );

CREATE POLICY "Service role can read all audit logs"
    ON audit_logs
    FOR SELECT
    TO service_role
    USING (true);
