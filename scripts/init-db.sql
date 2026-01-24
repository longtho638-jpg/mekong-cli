-- Mekong-CLI Database Initialization
-- ====================================
-- PostgreSQL 15 initialization script

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- Create schemas
CREATE SCHEMA IF NOT EXISTS mekong;

-- Set search path
SET search_path TO mekong, public;

-- Sample table: Users (optional - remove if not needed)
CREATE TABLE IF NOT EXISTS mekong.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sample table: API Keys (optional)
CREATE TABLE IF NOT EXISTS mekong.api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES mekong.users(id) ON DELETE CASCADE,
    key_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON mekong.users(email);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON mekong.api_keys(user_id);

-- Insert default data (optional)
-- INSERT INTO mekong.users (email, username) VALUES ('admin@mekong.dev', 'admin')
--   ON CONFLICT (email) DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA mekong TO mekong;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA mekong TO mekong;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA mekong TO mekong;
