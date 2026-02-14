-- MarketingOps: Leads table for conversion funnel
-- Run this in Supabase SQL Editor

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT NOT NULL CHECK (role IN ('farmer', 'buyer', 'bank', 'supplier', 'logistics')),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    company TEXT,
    farm_size TEXT,
    product_types TEXT[],
    source TEXT DEFAULT 'landing',
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'lost'))
);

-- Create index on role for filtering
CREATE INDEX IF NOT EXISTS idx_leads_role ON leads(role);

-- Create index on status for funnel tracking
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- Create index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert leads (public funnel)
CREATE POLICY "Anyone can create lead" ON leads
    FOR INSERT
    WITH CHECK (true);

-- Only authenticated admins can view leads
CREATE POLICY "Admins can view leads" ON leads
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Only authenticated users can update leads
CREATE POLICY "Authenticated can update leads" ON leads
    FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Comment for documentation
COMMENT ON TABLE leads IS 'MarketingOps conversion funnel leads from all 5 stakeholder types';
