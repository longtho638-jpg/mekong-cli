-- Supply Chain Traceability Schema
-- Adds product journey tracking for QR-based traceability

-- ============================================
-- SUPPLY CHAIN EVENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS supply_chain_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID,
    qr_code_id UUID REFERENCES qr_codes(id) ON DELETE CASCADE,
    farmer_id UUID,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'planted',      -- Gieo trồng
        'growing',      -- Đang chăm sóc
        'harvested',    -- Thu hoạch
        'packed',       -- Đóng gói
        'quality_check', -- Kiểm tra chất lượng
        'shipped',      -- Xuất kho
        'in_transit',   -- Đang vận chuyển
        'delivered'     -- Giao thành công
    )),
    location TEXT,
    location_coordinates JSONB, -- { lat, lng }
    actor_name TEXT,            -- Tên người thực hiện
    actor_role TEXT,            -- farmer, packer, driver, etc.
    notes TEXT,
    photo_url TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_supply_chain_product ON supply_chain_events(product_id);
CREATE INDEX IF NOT EXISTS idx_supply_chain_qr_code ON supply_chain_events(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_supply_chain_farmer ON supply_chain_events(farmer_id);
CREATE INDEX IF NOT EXISTS idx_supply_chain_timestamp ON supply_chain_events(timestamp DESC);

-- Enable RLS
ALTER TABLE supply_chain_events ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for QR scanning)
CREATE POLICY "Public can view supply chain events" ON supply_chain_events
    FOR SELECT
    USING (true);

-- Only authenticated users can insert/update
CREATE POLICY "Authenticated can create events" ON supply_chain_events
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- SEED DEMO DATA
-- ============================================

-- Add demo supply chain events for existing QR codes
INSERT INTO supply_chain_events (qr_code_id, farmer_id, event_type, location, actor_name, actor_role, notes)
SELECT 
    qc.id,
    qc.farmer_id,
    'planted',
    'Vườn hoa Sa Đéc, Đồng Tháp',
    'Chú Ba',
    'farmer',
    'Gieo trồng giống hoa từ vườn ươm địa phương'
FROM qr_codes qc LIMIT 3;

INSERT INTO supply_chain_events (qr_code_id, farmer_id, event_type, location, actor_name, actor_role, notes, timestamp)
SELECT 
    qc.id,
    qc.farmer_id,
    'harvested',
    'Vườn hoa Sa Đéc, Đồng Tháp',
    'Chú Ba',
    'farmer',
    'Thu hoạch vào sáng sớm để giữ độ tươi',
    NOW() - INTERVAL '2 hours'
FROM qr_codes qc LIMIT 3;

INSERT INTO supply_chain_events (qr_code_id, farmer_id, event_type, location, actor_name, actor_role, notes, timestamp)
SELECT 
    qc.id,
    qc.farmer_id,
    'quality_check',
    'Trung tâm đóng gói Sa Đéc',
    'Cô Lan',
    'quality_inspector',
    'Kiểm tra độ tươi đạt 98%, đạt chuẩn A+',
    NOW() - INTERVAL '1 hour'
FROM qr_codes qc LIMIT 3;

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 
    'Supply chain schema ready!' as status,
    (SELECT COUNT(*) FROM supply_chain_events) as events_count;
