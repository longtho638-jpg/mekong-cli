-- Migration 004: Business Metrics Snapshots
-- Description: Create table for daily aggregated business metrics
-- Author: System
-- Date: 2026-01-27

CREATE TABLE IF NOT EXISTS metrics_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC(15, 4) NOT NULL,
    dimensions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(date, metric_name, dimensions)
);

-- Create indexes
CREATE INDEX idx_metrics_snapshots_date ON metrics_snapshots(date DESC);
CREATE INDEX idx_metrics_snapshots_name ON metrics_snapshots(metric_name);
CREATE INDEX idx_metrics_snapshots_dimensions ON metrics_snapshots USING gin(dimensions);

-- Comments
COMMENT ON TABLE metrics_snapshots IS 'Daily snapshots of key business metrics (MRR, Churn, etc.)';
