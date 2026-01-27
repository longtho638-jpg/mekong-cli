-- Migration: Add user_preferences table
-- Date: 2026-01-27
-- Description: Stores user preferences for i18n and theming

CREATE TABLE IF NOT EXISTS user_preferences (
    user_id VARCHAR(255) PRIMARY KEY,
    preferred_language VARCHAR(10) DEFAULT 'en-US',
    preferred_currency VARCHAR(3) DEFAULT 'USD',
    theme VARCHAR(20) DEFAULT 'system',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_language ON user_preferences(preferred_language);
