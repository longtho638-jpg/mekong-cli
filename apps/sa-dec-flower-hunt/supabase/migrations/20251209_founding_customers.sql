-- Founding Customers Table
-- For the Founding 10 program

CREATE TABLE IF NOT EXISTS founding_customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT NOT NULL,
    why_interested TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'shipped', 'completed'
    flower_preference VARCHAR(100),
    notes TEXT,
    review TEXT,
    review_photo_url TEXT,
    shipped_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for status queries
CREATE INDEX IF NOT EXISTS idx_founding_customers_status ON founding_customers(status);

-- RLS
ALTER TABLE founding_customers ENABLE ROW LEVEL SECURITY;

-- Allow insert from anon (for form submission)
CREATE POLICY "Anyone can submit founding application" ON founding_customers
    FOR INSERT WITH CHECK (true);

-- Only service role can read/update
CREATE POLICY "Service role can manage founding customers" ON founding_customers
    FOR ALL USING (auth.role() = 'service_role');
