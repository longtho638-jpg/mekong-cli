-- Migration: 005_landing_pages
-- Description: Add tables for Landing Pages, A/B Testing, and Analytics

-- Landing Pages Table
CREATE TABLE IF NOT EXISTS landing_pages (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    content_json JSONB NOT NULL DEFAULT '{}',
    seo_metadata JSONB DEFAULT '{}',
    is_published BOOLEAN DEFAULT FALSE,
    template_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_landing_pages_uuid ON landing_pages(uuid);
CREATE INDEX idx_landing_pages_slug ON landing_pages(slug);

-- A/B Tests Table
CREATE TABLE IF NOT EXISTS ab_tests (
    id SERIAL PRIMARY KEY,
    landing_page_id INTEGER NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
    variants_json JSONB NOT NULL,
    traffic_split JSONB NOT NULL,
    winner_variant_id VARCHAR(100),
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_ab_tests_landing_page_id ON ab_tests(landing_page_id);

-- Analytics Events Table
CREATE TABLE IF NOT EXISTS landing_analytics_events (
    id SERIAL PRIMARY KEY,
    landing_page_id INTEGER NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
    variant_id VARCHAR(100),
    event_type VARCHAR(50) NOT NULL,
    user_id VARCHAR(255),
    session_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_landing_analytics_events_landing_page_id ON landing_analytics_events(landing_page_id);
CREATE INDEX idx_landing_analytics_events_event_type ON landing_analytics_events(event_type);
CREATE INDEX idx_landing_analytics_events_variant_id ON landing_analytics_events(variant_id);
