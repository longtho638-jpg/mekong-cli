-- Migration 004: Workspace Isolation (Session 14)
-- Adds multi-tenant workspace support with isolated execution environments

-- Workspaces table (extends tenants)
CREATE TABLE IF NOT EXISTS workspaces (
    id              TEXT PRIMARY KEY,
    tenant_id       TEXT NOT NULL REFERENCES tenants(id),
    name            TEXT NOT NULL,
    slug            TEXT UNIQUE NOT NULL,
    config          JSONB DEFAULT '{}',
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Workspace members (team access)
CREATE TABLE IF NOT EXISTS workspace_members (
    workspace_id    TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
    user_email      TEXT NOT NULL,
    role            TEXT NOT NULL,  -- owner/admin/member
    joined_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (workspace_id, user_email)
);

-- Per-workspace state
CREATE TABLE IF NOT EXISTS workspace_state (
    workspace_id    TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
    state_key       TEXT NOT NULL,
    state_value     JSONB NOT NULL,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (workspace_id, state_key)
);

-- Workspace credit accounts
CREATE TABLE IF NOT EXISTS credit_accounts (
    id              TEXT PRIMARY KEY,
    workspace_id    TEXT UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
    balance         DECIMAL(12,2) DEFAULT 0,
    monthly_quota   DECIMAL(12,2) DEFAULT 0,
    used_this_month DECIMAL(12,2) DEFAULT 0,
    currency        TEXT DEFAULT 'USD',
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Credit transactions
CREATE TABLE IF NOT EXISTS credit_transactions (
    id              TEXT PRIMARY KEY,
    account_id      TEXT REFERENCES credit_accounts(id) ON DELETE CASCADE,
    type            TEXT NOT NULL,  -- purchase, consumption, refund, adjustment
    amount          DECIMAL(12,2) NOT NULL,
    balance_after   DECIMAL(12,2) NOT NULL,
    description     TEXT,
    metadata        JSONB,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Usage quotas by tier
CREATE TABLE IF NOT EXISTS usage_quotas (
    tier            TEXT PRIMARY KEY,
    daily_credits   INTEGER DEFAULT 100,
    monthly_credits INTEGER DEFAULT 3000,
    daily_api_calls INTEGER DEFAULT 500,
    monthly_api_calls INTEGER DEFAULT 15000,
    max_agents      INTEGER DEFAULT 5
);

-- Billing alerts configuration
CREATE TABLE IF NOT EXISTS billing_alerts (
    id              TEXT PRIMARY KEY,
    workspace_id    TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
    threshold_percent INTEGER DEFAULT 80,
    alert_email     TEXT,
    is_enabled      BOOLEAN DEFAULT TRUE,
    last_alert_at   TIMESTAMP
);

-- Polar subscription mapping
CREATE TABLE IF NOT EXISTS polar_subscriptions (
    workspace_id    TEXT PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
    polar_subscription_id TEXT UNIQUE,
    polar_order_id  TEXT,
    status          TEXT,  -- active, cancelled, past_due
    tier            TEXT,
    renews_at       TIMESTAMP,
    cancelled_at    TIMESTAMP,
    metadata        JSONB
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workspaces_tenant ON workspaces(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON workspaces(slug);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_email);
CREATE INDEX IF NOT EXISTS idx_workspace_state_key ON workspace_state(workspace_id, state_key);
CREATE INDEX IF NOT EXISTS idx_credit_accounts_workspace ON credit_accounts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_account ON credit_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_billing_alerts_workspace ON billing_alerts(workspace_id);

-- Seed default usage quotas
INSERT INTO usage_quotas (tier, daily_credits, monthly_credits, daily_api_calls, monthly_api_calls, max_agents)
VALUES
    ('free', 20, 500, 100, 3000, 2),
    ('trial', 50, 1000, 250, 7500, 3),
    ('pro', 200, 5000, 1000, 30000, 10),
    ('enterprise', 1000, 30000, 5000, 150000, 50)
ON CONFLICT (tier) DO NOTHING;
