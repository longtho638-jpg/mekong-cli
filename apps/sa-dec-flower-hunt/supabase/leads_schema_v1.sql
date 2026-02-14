-- Festival Leads Schema
-- For capturing offline check-ins at Sa Dec Flower Festival

CREATE TABLE IF NOT EXISTS festival_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  location_lat FLOAT, -- Captured from GPS
  location_lng FLOAT,
  device_info TEXT,   -- User Agent for fraud detection
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for phone lookups (prevent duplicate leads)
CREATE INDEX IF NOT EXISTS idx_leads_phone ON festival_leads(phone);
