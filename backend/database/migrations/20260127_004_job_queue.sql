-- Migration: Create jobs and job_results tables for background worker system
-- Description: Stores job history, status, and results for the queue system

CREATE TYPE job_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled', 'scheduled');
CREATE TYPE job_priority AS ENUM ('high', 'normal', 'low');

CREATE TABLE IF NOT EXISTS jobs (
    job_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    priority job_priority NOT NULL DEFAULT 'normal',
    status job_status NOT NULL DEFAULT 'pending',
    attempts INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    retry_delay_seconds JSONB, -- Array of seconds for backoff
    run_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    worker_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    tenant_id TEXT -- Multi-tenancy support
);

CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_type ON jobs(type);
CREATE INDEX idx_jobs_run_at ON jobs(run_at) WHERE status = 'pending' OR status = 'scheduled';
CREATE INDEX idx_jobs_created_at ON jobs(created_at);

CREATE TABLE IF NOT EXISTS job_results (
    result_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
    result_data JSONB,
    error TEXT,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duration_ms INTEGER,
    worker_id TEXT
);

CREATE INDEX idx_job_results_job_id ON job_results(job_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_jobs_updated_at
BEFORE UPDATE ON jobs
FOR EACH ROW
EXECUTE FUNCTION update_jobs_updated_at();
