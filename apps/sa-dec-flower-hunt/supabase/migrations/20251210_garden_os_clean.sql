-- ============================================================================
-- GARDEN OS: CLEAN INSTALL v2.0 (Drop existing + Recreate)
-- ============================================================================
-- ⚠️  WARNING: This will DELETE all existing data in these tables!
-- Use only for fresh installations or complete resets
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: DROP EXISTING OBJECTS
-- ============================================================================
-- Drop in reverse dependency order (children first)
DROP TABLE IF EXISTS inventory_history CASCADE;
DROP TABLE IF EXISTS loot_boxes CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS gardens CASCADE;

-- Drop triggers and functions
DROP FUNCTION IF EXISTS update_timestamp CASCADE;

-- ============================================================================
-- STEP 2: CREATE GARDENS TABLE
-- ============================================================================
CREATE TABLE gardens (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- External identifiers
    zalo_id TEXT UNIQUE,
    profile_id UUID,
    
    -- Basic info
    name TEXT NOT NULL,
    owner_name TEXT,
    owner_phone TEXT,
    
    -- Location
    address TEXT,
    ward TEXT,
    district TEXT DEFAULT 'Sa Đéc',
    province TEXT DEFAULT 'Đồng Tháp',
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    
    -- Status
    status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED', 'MAINTENANCE')),
    is_verified BOOLEAN DEFAULT false,
    
    -- Profile
    avatar_url TEXT,
    description TEXT,
    specialties TEXT[],
    
    -- Stats (denormalized for performance)
    rating DECIMAL(2,1) DEFAULT 5.0 CHECK (rating BETWEEN 0 AND 5),
    total_sales INT DEFAULT 0 CHECK (total_sales >= 0),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE gardens IS 'Core table for flower gardens in Sa Đéc';

-- ============================================================================
-- STEP 3: CREATE INVENTORY TABLE
-- ============================================================================
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    garden_id UUID NOT NULL REFERENCES gardens(id) ON DELETE CASCADE,
    
    -- Product info
    flower_type TEXT NOT NULL,
    flower_name TEXT,
    quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    unit TEXT DEFAULT 'chậu',
    unit_price DECIMAL(12,0) CHECK (unit_price >= 0),
    
    -- AI scan metadata
    ai_confidence FLOAT DEFAULT 1.0 CHECK (ai_confidence BETWEEN 0 AND 1),
    ai_scan_image TEXT,
    
    -- Availability
    is_available BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(garden_id, flower_type)
);

COMMENT ON TABLE inventory IS 'Flower inventory per garden, supports AI vision scanning';

-- ============================================================================
-- STEP 4: CREATE LOOT_BOXES TABLE
-- ============================================================================
CREATE TABLE loot_boxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    garden_id UUID REFERENCES gardens(id) ON DELETE CASCADE,
    
    -- Type & rarity
    rarity TEXT DEFAULT 'COMMON' CHECK (rarity IN ('COMMON', 'RARE', 'EPIC', 'LEGENDARY')),
    trigger_type TEXT DEFAULT 'INVENTORY' CHECK (trigger_type IN ('INVENTORY', 'VISIT', 'ORDER', 'MANUAL')),
    trigger_quantity INT,
    
    -- Reward
    reward_type TEXT,
    reward_value TEXT,
    reward_amount DECIMAL(12,0),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_claimed BOOLEAN DEFAULT false,
    claimed_by UUID,
    claimed_at TIMESTAMPTZ,
    
    -- Lifecycle
    spawned_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    
    -- Extensible data
    metadata JSONB DEFAULT '{}'
);

COMMENT ON TABLE loot_boxes IS 'Gamification: Virtual loot boxes for engagement';

-- ============================================================================
-- STEP 5: CREATE INVENTORY_HISTORY TABLE
-- ============================================================================
CREATE TABLE inventory_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id UUID REFERENCES inventory(id) ON DELETE CASCADE,
    garden_id UUID REFERENCES gardens(id) ON DELETE CASCADE,
    
    -- Change tracking
    old_quantity INT,
    new_quantity INT,
    change_type TEXT CHECK (change_type IN ('SCAN', 'SALE', 'RESTOCK', 'ADJUSTMENT', 'EXPIRED')),
    change_reason TEXT,
    
    -- AI data
    ai_confidence FLOAT,
    ai_scan_image TEXT,
    
    -- Timestamp
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE inventory_history IS 'Audit trail for inventory changes';

-- ============================================================================
-- STEP 6: CREATE INDEXES
-- ============================================================================
-- Gardens
CREATE INDEX idx_gardens_zalo ON gardens(zalo_id) WHERE zalo_id IS NOT NULL;
CREATE INDEX idx_gardens_status ON gardens(status);
CREATE INDEX idx_gardens_ward ON gardens(ward);

-- Inventory
CREATE INDEX idx_inventory_garden ON inventory(garden_id);
CREATE INDEX idx_inventory_flower ON inventory(flower_type);
CREATE INDEX idx_inventory_available ON inventory(garden_id) WHERE is_available = true;

-- Loot boxes
CREATE INDEX idx_loot_garden ON loot_boxes(garden_id);
CREATE INDEX idx_loot_active ON loot_boxes(is_active, is_claimed) WHERE is_active = true AND is_claimed = false;
CREATE INDEX idx_loot_expiry ON loot_boxes(expires_at) WHERE expires_at IS NOT NULL;

-- History
CREATE INDEX idx_history_garden ON inventory_history(garden_id, recorded_at DESC);

-- ============================================================================
-- STEP 7: CREATE AUTO-UPDATE TRIGGER
-- ============================================================================
CREATE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gardens_updated BEFORE UPDATE ON gardens
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER inventory_updated BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================
-- STEP 8: ENABLE RLS
-- ============================================================================
ALTER TABLE gardens ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE loot_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_history ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 9: CREATE RLS POLICIES
-- ============================================================================
-- Public read access
CREATE POLICY "gardens_select" ON gardens FOR SELECT USING (true);
CREATE POLICY "inventory_select" ON inventory FOR SELECT USING (true);
CREATE POLICY "loot_boxes_select" ON loot_boxes FOR SELECT USING (true);

-- Authenticated write access
CREATE POLICY "gardens_all" ON gardens FOR ALL TO authenticated USING (true);
CREATE POLICY "inventory_all" ON inventory FOR ALL TO authenticated USING (true);
CREATE POLICY "loot_boxes_all" ON loot_boxes FOR ALL TO authenticated USING (true);
CREATE POLICY "history_all" ON inventory_history FOR ALL TO authenticated USING (true);

-- ============================================================================
-- STEP 10: ENABLE REALTIME
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
-- STEP 11: SEED DATA
-- ============================================================================
INSERT INTO gardens (name, owner_name, address, ward, status, specialties, description)
VALUES
    ('Vườn Hồng Tư Tôn', 'Nguyễn Văn Tôn', 'Ấp Tân Quy Đông', 'Tân Quy Đông', 'OPEN', 
     ARRAY['Hồng Sa Đéc', 'Cúc Mâm Xôi'], 'Vườn hồng truyền thống 30 năm'),
    ('Vườn Mai Út Hiền', 'Trần Thị Hiền', 'Ấp Tân Khánh Đông', 'Tân Khánh Đông', 'OPEN',
     ARRAY['Mai Vàng', 'Cúc Đại Đóa'], 'Chuyên mai vàng Bình Định'),
    ('Vườn Cúc Ba Tèo', 'Lê Văn Tèo', 'Làng Hoa Sa Đéc', 'Tân Quy Đông', 'OPEN',
     ARRAY['Cúc Mâm Xôi', 'Vạn Thọ'], 'Cúc mâm xôi giống F1 cao cấp');

-- Add inventory using subquery (cleaner than separate INSERT)
WITH garden AS (SELECT id FROM gardens WHERE name = 'Vườn Hồng Tư Tôn' LIMIT 1)
INSERT INTO inventory (garden_id, flower_type, flower_name, quantity, unit_price, is_available)
SELECT 
    garden.id,
    unnest(ARRAY['Cuc_Mam_Xoi', 'Hong_Sa_Dec']),
    unnest(ARRAY['Cúc Mâm Xôi', 'Hồng Sa Đéc']),
    unnest(ARRAY[75, 50]),
    unnest(ARRAY[150000, 80000]),
    true
FROM garden;

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE! ✅
-- ============================================================================
SELECT 
    'Migration complete!' AS status,
    (SELECT COUNT(*) FROM gardens) AS gardens_count,
    (SELECT COUNT(*) FROM inventory) AS inventory_count;
