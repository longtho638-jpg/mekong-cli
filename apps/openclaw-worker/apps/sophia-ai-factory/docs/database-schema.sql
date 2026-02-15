-- Enable the vector extension for semantic search capabilities
CREATE EXTENSION IF NOT EXISTS vector;

-- Table for AGI Memory (Semantic Storage with vector embeddings)
CREATE TABLE IF NOT EXISTS agi_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    agent_id TEXT NOT NULL, -- ID of the agent that created this memory
    memory_type TEXT NOT NULL, -- e.g., 'observation', 'thought', 'plan', 'skill', 'long_term'
    content TEXT NOT NULL,
    embedding VECTOR(1536), -- Vector embedding of the content (e.g., OpenAI's text-embedding-ada-002 is 1536 dimensions)
    metadata JSONB, -- Additional metadata (e.g., source, timestamp, relevance score)
    -- RLS policies
    CONSTRAINT rls_agi_memory_insert CHECK (auth.uid() IS NOT NULL),
    CONSTRAINT rls_agi_memory_select CHECK (auth.uid() IS NOT NULL)
);

-- Table for AGI Events (Telemetry and system events)
CREATE TABLE IF NOT EXISTS agi_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    event_type TEXT NOT NULL, -- e.g., 'agent_spawned', 'tool_called', 'mission_completed', 'error'
    agent_id TEXT, -- ID of the agent involved, if any
    mission_id TEXT, -- ID of the mission involved, if any
    payload JSONB, -- Event-specific data
    -- RLS policies
    CONSTRAINT rls_agi_events_insert CHECK (auth.uid() IS NOT NULL),
    CONSTRAINT rls_agi_events_select CHECK (auth.uid() IS NOT NULL)
);

-- Table for AGI Agents (Manage state and configuration of agents)
CREATE TABLE IF NOT EXISTS agi_agents (
    id TEXT PRIMARY KEY, -- Unique ID for the agent (e.g., 'scriptwriter-agent', 'meta-agent')
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    description TEXT,
    config JSONB, -- Agent configuration (e.g., LLM model, tools available)
    state JSONB, -- Current operational state (e.g., 'idle', 'running', 'paused')
    last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
    -- RLS policies
    CONSTRAINT rls_agi_agents_insert CHECK (auth.uid() IS NOT NULL),
    CONSTRAINT rls_agi_agents_select CHECK (auth.uid() IS NOT NULL)
);

-- Update trigger for updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_agi_memory_updated_at
BEFORE UPDATE ON agi_memory
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_agi_agents_updated_at
BEFORE UPDATE ON agi_agents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
