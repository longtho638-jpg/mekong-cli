-- Phase 2: Marketing Tools - QR CODES ONLY
-- Simplest possible version - just get QR working first

-- Clean slate
DROP TABLE IF EXISTS qr_scans CASCADE;
DROP TABLE IF EXISTS qr_codes CASCADE;

-- ============================================
-- 1. QR CODES TABLE
-- ============================================

CREATE TABLE qr_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID,
  code TEXT UNIQUE NOT NULL,
  url TEXT NOT NULL,
  scan_count INT DEFAULT 0,
  last_scanned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================
-- 2. QR SCANS TABLE  
-- ============================================

CREATE TABLE qr_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  qr_code_id UUID NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip_address TEXT,
  converted_to_order BOOLEAN DEFAULT FALSE,
  order_id UUID
);

-- ============================================
-- 3. INDEXES
-- ============================================

CREATE INDEX idx_qr_codes_farmer_id ON qr_codes(farmer_id);
CREATE INDEX idx_qr_codes_code ON qr_codes(code);
CREATE INDEX idx_qr_scans_qr_code_id ON qr_scans(qr_code_id);
CREATE INDEX idx_qr_scans_scanned_at ON qr_scans(scanned_at DESC);

-- ============================================
-- 4. QR CODE GENERATOR FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION generate_farmer_qr_code(p_farmer_id UUID)
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  farmer_number INT;
BEGIN
  SELECT COALESCE(COUNT(*), 0) + 1 INTO farmer_number
  FROM qr_codes;
  
  code := 'F' || LPAD(farmer_number::TEXT, 4, '0');
  
  WHILE EXISTS (SELECT 1 FROM qr_codes WHERE code = code) LOOP
    farmer_number := farmer_number + 1;
    code := 'F' || LPAD(farmer_number::TEXT, 4, '0');
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. COMMENTS
-- ============================================

COMMENT ON TABLE qr_codes IS 'QR codes for farmers to print and distribute';
COMMENT ON TABLE qr_scans IS 'Track all QR code scans';

-- ============================================
-- DONE!
-- ============================================

SELECT 
  'QR codes system ready!' as status,
  (SELECT COUNT(*) FROM qr_codes) as qr_codes_count,
  (SELECT COUNT(*) FROM qr_scans) as scans_count;
