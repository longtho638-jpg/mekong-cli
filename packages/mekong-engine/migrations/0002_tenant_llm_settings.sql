-- BYOK: Per-tenant LLM API key settings
-- Separate table from tenants for clean separation

CREATE TABLE IF NOT EXISTS tenant_settings (
  tenant_id TEXT PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  llm_provider TEXT NOT NULL DEFAULT 'workers-ai',
  llm_api_key_encrypted TEXT,
  llm_base_url TEXT,
  llm_model TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
