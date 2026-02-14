-- ============================================================================
-- GARDEN OS: PARASITIC ARCHITECTURE - DATABASE MIGRATION v2.0
-- ============================================================================
-- Date: 2025-12-10
-- Purpose: Create Digital Twin tables for Sa Đéc Flower Village
-- Architecture: Dual-App (Garden OS + Hunter Guide) sharing Supabase Brain
-- Requires: PostGIS extension for GPS coordinates
-- ============================================================================

BEGIN;

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- For fuzzy text search

-- ============================================================================
-- 1. GARDENS TABLE - Nhà Vườn Digital Twin
-- ============================================================================
CREATE TABLE IF NOT EXISTS gardens (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- External identifiers
    zalo_id TEXT UNIQUE,
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Basic info
    name TEXT NOT NULL,
    owner_name TEXT,
    owner_phone TEXT,
    
    -- Location (PostGIS)
    coordinates GEOGRAPHY(POINT, 4326),
    address TEXT,
    ward TEXT,
    district TEXT DEFAULT 'Sa Đéc',
    province TEXT DEFAULT 'Đồng Tháp',
    
    -- Status
    status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'FULL', 'CLOSED', 'VACATION')),
    is_verified BOOLEAN DEFAULT false,
    verification_date TIMESTAMPTZ,
    
    -- Profile & media
    avatar_url TEXT,
    cover_image_url TEXT,
    description TEXT,
    specialties TEXT[] DEFAULT '{}',
    
    -- Aggregated stats (denormalized)
    rating DECIMAL(2,1) DEFAULT 5.0 CHECK (rating BETWEEN 0 AND 5),
    total_reviews INT DEFAULT 0 CHECK (total_reviews >= 0),
    total_sales INT DEFAULT 0 CHECK (total_sales >= 0),
    total_revenue DECIMAL(15,0) DEFAULT 0 CHECK (total_revenue >= 0),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE gardens IS 'Core table for flower gardens in Sa Đéc - Digital Twin';
COMMENT ON COLUMN gardens.coordinates IS 'GPS point in WGS84 (4326) for map display';
COMMENT ON COLUMN gardens.specialties IS 'Array of flower types this garden specializes in';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gardens_zalo ON gardens(zalo_id) WHERE zalo_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gardens_status ON gardens(status);
CREATE INDEX IF NOT EXISTS idx_gardens_geo ON gardens USING GIST(coordinates);
CREATE INDEX IF NOT EXISTS idx_gardens_name ON gardens USING gin(name gin_trgm_ops);  -- Fuzzy search

-- ============================================================================
-- 2. INVENTORY TABLE - Kho Hoa Thời Gian Thực
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    garden_id UUID NOT NULL REFERENCES gardens(id) ON DELETE CASCADE,
    
    -- Flower info
    flower_type TEXT NOT NULL,
    flower_name TEXT,
    variety TEXT,
    
    -- Stock
    quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    unit TEXT DEFAULT 'chậu',
    min_order INT DEFAULT 1 CHECK (min_order >= 1),
    
    -- Pricing
    unit_price DECIMAL(12,0) CHECK (unit_price >= 0),
    wholesale_price DECIMAL(12,0) CHECK (wholesale_price >= 0),
    
    -- AI Vision
    ai_confidence FLOAT DEFAULT 1.0 CHECK (ai_confidence BETWEEN 0 AND 1),
    ai_scan_image TEXT,
    last_ai_scan TIMESTAMPTZ,
    
    -- Availability
    is_available BOOLEAN DEFAULT true,
    available_from DATE,
    available_until DATE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(garden_id, flower_type)
);

COMMENT ON TABLE inventory IS 'Real-time flower inventory per garden with AI vision support';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inventory_garden ON inventory(garden_id);
CREATE INDEX IF NOT EXISTS idx_inventory_flower ON inventory(flower_type);
CREATE INDEX IF NOT EXISTS idx_inventory_avail ON inventory(garden_id, is_available) WHERE is_available = true;
CREATE INDEX IF NOT EXISTS idx_inventory_qty ON inventory(quantity) WHERE quantity > 0;

-- ============================================================================
-- 3. LOOT_BOXES TABLE - Hộp Quà Ảo (Gamification)
-- ============================================================================
CREATE TABLE IF NOT EXISTS loot_boxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    garden_id UUID REFERENCES gardens(id) ON DELETE CASCADE,
    
    -- Type
    rarity TEXT DEFAULT 'COMMON' CHECK (rarity IN ('COMMON', 'RARE', 'EPIC', 'LEGENDARY')),
    trigger_type TEXT DEFAULT 'INVENTORY' CHECK (trigger_type IN ('INVENTORY', 'TIME', 'PROXIMITY', 'MANUAL')),
    trigger_quantity INT,
    
    -- Reward
    reward_type TEXT CHECK (reward_type IN ('VOUCHER', 'MISSION', 'BADGE', 'POINTS', 'FREE_FLOWER')),
    reward_value TEXT,
    reward_amount DECIMAL(12,0),
    
    -- GPS (for proximity loot)
    coordinates GEOGRAPHY(POINT, 4326),
    radius_meters INT DEFAULT 50 CHECK (radius_meters > 0),
    
    -- State
    is_active BOOLEAN DEFAULT true,
    is_claimed BOOLEAN DEFAULT false,
    claimed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    claimed_at TIMESTAMPTZ,
    
    -- Lifecycle
    spawned_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    
    -- Extensible
    metadata JSONB DEFAULT '{}'
);

COMMENT ON TABLE loot_boxes IS 'Gamification layer - virtual loot boxes for user engagement';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_loot_garden ON loot_boxes(garden_id);
CREATE INDEX IF NOT EXISTS idx_loot_active ON loot_boxes(is_active, is_claimed) WHERE is_active AND NOT is_claimed;
CREATE INDEX IF NOT EXISTS idx_loot_geo ON loot_boxes USING GIST(coordinates);
CREATE INDEX IF NOT EXISTS idx_loot_expiry ON loot_boxes(expires_at) WHERE is_active AND expires_at IS NOT NULL;

-- ============================================================================
-- 4. INVENTORY_HISTORY - Audit Trail
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id UUID REFERENCES inventory(id) ON DELETE CASCADE,
    garden_id UUID REFERENCES gardens(id) ON DELETE CASCADE,
    
    -- Change data
    old_quantity INT,
    new_quantity INT,
    change_type TEXT CHECK (change_type IN ('AI_SCAN', 'MANUAL', 'SALE', 'RESTOCK', 'DAMAGE', 'EXPIRED')),
    change_reason TEXT,
    
    -- AI data
    ai_confidence FLOAT,
    ai_scan_image TEXT,
    
    -- Timestamp
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE inventory_history IS 'Audit trail for inventory changes - analytics and debugging';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_history_garden ON inventory_history(garden_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_history_time ON inventory_history(recorded_at DESC);

-- ============================================================================
-- 5. RLS POLICIES
-- ============================================================================
ALTER TABLE gardens ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE loot_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (idempotent)
DO $$ BEGIN
    DROP POLICY IF EXISTS "Public read gardens" ON gardens;
    DROP POLICY IF EXISTS "Service role full access gardens" ON gardens;
    DROP POLICY IF EXISTS "Public read inventory" ON inventory;
    DROP POLICY IF EXISTS "Service role full access inventory" ON inventory;
    DROP POLICY IF EXISTS "Public read active loot boxes" ON loot_boxes;
    DROP POLICY IF EXISTS "Service role full access loot boxes" ON loot_boxes;
    DROP POLICY IF EXISTS "Service role only inventory history" ON inventory_history;
END $$;

-- Gardens: Public read, Service write
CREATE POLICY "Public read gardens" ON gardens FOR SELECT USING (true);
CREATE POLICY "Service role full access gardens" ON gardens FOR ALL USING (auth.role() = 'service_role');

-- Inventory: Public read, Service write
CREATE POLICY "Public read inventory" ON inventory FOR SELECT USING (true);
CREATE POLICY "Service role full access inventory" ON inventory FOR ALL USING (auth.role() = 'service_role');

-- Loot boxes: Public read active only, Service write
CREATE POLICY "Public read active loot boxes" ON loot_boxes FOR SELECT USING (is_active = true);
CREATE POLICY "Service role full access loot boxes" ON loot_boxes FOR ALL USING (auth.role() = 'service_role');

-- History: Service role only
CREATE POLICY "Service role only inventory history" ON inventory_history FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 6. REALTIME SUBSCRIPTIONS
-- ============================================================================
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE gardens;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE inventory;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE loot_boxes;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- 7. TRIGGERS: Auto-update timestamps
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS gardens_updated_at ON gardens;
CREATE TRIGGER gardens_updated_at
    BEFORE UPDATE ON gardens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS inventory_updated_at ON inventory;
CREATE TRIGGER inventory_updated_at
    BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 8. TRIGGER: Auto-spawn Loot Box on high inventory
-- ============================================================================
CREATE OR REPLACE FUNCTION spawn_loot_box_on_inventory()
RETURNS TRIGGER AS $$
DECLARE
    v_rarity TEXT;
    v_reward TEXT;
BEGIN
    -- Only spawn if quantity crosses threshold upward
    IF NEW.quantity >= 50 AND (OLD.quantity IS NULL OR OLD.quantity < 50) THEN
        -- Determine rarity based on quantity
        IF NEW.quantity >= 100 THEN
            v_rarity := 'RARE';
            v_reward := '30% OFF';
        ELSE
            v_rarity := 'COMMON';
            v_reward := '15% OFF';
        END IF;

        INSERT INTO loot_boxes (
            garden_id, rarity, trigger_type, trigger_quantity,
            reward_type, reward_value, expires_at
        ) VALUES (
            NEW.garden_id, v_rarity, 'INVENTORY', NEW.quantity,
            'VOUCHER', v_reward, NOW() + INTERVAL '24 hours'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_spawn_loot_box ON inventory;
CREATE TRIGGER auto_spawn_loot_box
    AFTER INSERT OR UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION spawn_loot_box_on_inventory();

-- ============================================================================
-- 9. SEED DATA
-- ============================================================================
INSERT INTO gardens (name, owner_name, address, ward, status, specialties, description)
VALUES
    ('Vườn Hồng Tư Tôn', 'Nguyễn Văn Tôn', 'Ấp Tân Quy Đông', 'Tân Quy Đông', 'OPEN', 
     ARRAY['Hồng Sa Đéc', 'Cúc Mâm Xôi'], 'Vườn hồng truyền thống 30 năm'),
    ('Vườn Mai Út Hiền', 'Trần Thị Hiền', 'Ấp Tân Khánh Đông', 'Tân Khánh Đông', 'OPEN',
     ARRAY['Mai Vàng', 'Cúc Đại Đóa'], 'Chuyên mai vàng Bình Định'),
    ('Vườn Cúc Ba Tèo', 'Lê Văn Tèo', 'Làng Hoa Sa Đéc', 'Tân Quy Đông', 'OPEN',
     ARRAY['Cúc Mâm Xôi', 'Vạn Thọ'], 'Cúc mâm xôi giống F1 cao cấp')
ON CONFLICT DO NOTHING;

-- Seed inventory using CTE
WITH garden_ids AS (SELECT id FROM gardens LIMIT 3)
INSERT INTO inventory (garden_id, flower_type, flower_name, quantity, unit_price, is_available)
SELECT 
    g.id,
    f.flower_type,
    f.flower_name,
    floor(random() * 80 + 20)::int,
    f.price,
    true
FROM garden_ids g
CROSS JOIN (VALUES 
    ('Cuc_Mam_Xoi', 'Cúc Mâm Xôi', 150000::decimal),
    ('Hong_Sa_Dec', 'Hồng Sa Đéc', 80000::decimal),
    ('Mai_Vang', 'Mai Vàng', 500000::decimal)
) AS f(flower_type, flower_name, price)
ON CONFLICT (garden_id, flower_type) DO NOTHING;

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE! ✅
-- ============================================================================
SELECT 
    'Migration v2.0 complete!' AS status,
    (SELECT COUNT(*) FROM gardens) AS gardens,
    (SELECT COUNT(*) FROM inventory) AS inventory_items,
    (SELECT COUNT(*) FROM loot_boxes) AS loot_boxes;
