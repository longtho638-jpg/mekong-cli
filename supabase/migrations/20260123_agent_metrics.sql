-- Agent Performance Metrics Table
-- Phase 18: Performance & Observability

CREATE TABLE IF NOT EXISTS agent_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id TEXT NOT NULL,
    agent_role TEXT,
    operation TEXT NOT NULL,
    status TEXT NOT NULL, -- success, failed
    execution_time_ms FLOAT NOT NULL,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    error_message TEXT,
    context_id TEXT, -- Trace correlation ID
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indices for faster querying
CREATE INDEX IF NOT EXISTS idx_agent_metrics_agent_id ON agent_metrics(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_created_at ON agent_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_status ON agent_metrics(status);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_context_id ON agent_metrics(context_id);

-- Enable Row Level Security
ALTER TABLE agent_metrics ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role has full access to agent_metrics"
    ON agent_metrics
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to read metrics (for dashboard)
CREATE POLICY "Authenticated users can read agent_metrics"
    ON agent_metrics
    FOR SELECT
    TO authenticated
    USING (true);
