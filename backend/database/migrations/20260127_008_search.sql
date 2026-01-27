-- Search configuration table
CREATE TABLE IF NOT EXISTS search_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    index_name VARCHAR(100) NOT NULL UNIQUE,
    provider VARCHAR(20) DEFAULT 'meilisearch', -- 'algolia' or 'meilisearch'
    searchable_attributes JSONB, -- ['title', 'description', 'content']
    ranking_rules JSONB, -- ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness']
    faceted_attributes JSONB, -- ['status', 'type', 'created_at']
    synonyms JSONB, -- {'payment': ['transaction', 'charge'], ...}
    stop_words JSONB, -- ['the', 'a', 'is', ...]
    last_indexed_at TIMESTAMPTZ,
    document_count BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default configs
INSERT INTO search_configs (index_name, searchable_attributes, ranking_rules, faceted_attributes) VALUES
('users', '["name", "email", "phone"]'::jsonb, '["words", "typo", "proximity"]'::jsonb, '["status", "role"]'::jsonb),
('transactions', '["description", "reference_id", "amount"]'::jsonb, '["words", "typo", "attribute"]'::jsonb, '["status", "type", "payment_method"]'::jsonb),
('audit', '["action", "resource_type", "details"]'::jsonb, '["words", "attribute"]'::jsonb, '["action", "resource_type", "user_id"]'::jsonb)
ON CONFLICT (index_name) DO NOTHING;

-- Search query logs (analytics)
CREATE TABLE IF NOT EXISTS search_query_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query TEXT NOT NULL,
    indexes TEXT[], -- ['users', 'transactions']
    filters JSONB,
    results_count INT,
    query_time_ms INT,
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_logs_query ON search_query_logs (query);
CREATE INDEX IF NOT EXISTS idx_search_logs_user ON search_query_logs (user_id);
