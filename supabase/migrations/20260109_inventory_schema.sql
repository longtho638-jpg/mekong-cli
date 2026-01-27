-- Inventory & Asset Schema for AgencyOS
-- ERPNext Parity: Asset Registry, Stock Ledger, License Tracking

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ASSETS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('hardware', 'software', 'subscription', 'digital', 'other')),
    category VARCHAR(100),
    code VARCHAR(20) NOT NULL,
    serial_number VARCHAR(100),
    purchase_date DATE,
    purchase_price DECIMAL(15, 2),
    current_value DECIMAL(15, 2),
    depreciation_rate DECIMAL(5, 2),
    vendor VARCHAR(200),
    assigned_to UUID REFERENCES auth.users(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'in_use', 'maintenance', 'retired', 'disposed')),
    location VARCHAR(200),
    notes TEXT,
    expiry_date DATE,
    renewal_date DATE,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, code)
);

-- Enable RLS
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assets_tenant_isolation" ON assets
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "assets_service_role" ON assets
    FOR ALL USING (current_setting('role') = 'service_role');

-- Indexes
CREATE INDEX idx_assets_tenant ON assets(tenant_id);
CREATE INDEX idx_assets_type ON assets(tenant_id, type);
CREATE INDEX idx_assets_status ON assets(tenant_id, status);
CREATE INDEX idx_assets_assigned ON assets(assigned_to);
CREATE INDEX idx_assets_expiry ON assets(expiry_date);

-- ═══════════════════════════════════════════════════════════════════════════════
-- ASSET MOVEMENTS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS asset_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    from_location VARCHAR(200),
    to_location VARCHAR(200),
    from_assignee UUID REFERENCES auth.users(id),
    to_assignee UUID REFERENCES auth.users(id),
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('assignment', 'transfer', 'return', 'maintenance', 'disposal')),
    date TIMESTAMPTZ NOT NULL,
    notes TEXT,
    performed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE asset_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "asset_movements_via_asset" ON asset_movements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM assets a 
            WHERE a.id = asset_movements.asset_id 
            AND a.tenant_id = current_setting('app.current_tenant_id')::UUID
        )
    );

CREATE POLICY "asset_movements_service_role" ON asset_movements
    FOR ALL USING (current_setting('role') = 'service_role');

-- Indexes
CREATE INDEX idx_asset_movements_asset ON asset_movements(asset_id);
CREATE INDEX idx_asset_movements_date ON asset_movements(date);

-- ═══════════════════════════════════════════════════════════════════════════════
-- LICENSES
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets(id),
    name VARCHAR(200) NOT NULL,
    vendor VARCHAR(200),
    license_key TEXT, -- Encrypted in application layer
    seats INTEGER DEFAULT 1,
    used_seats INTEGER DEFAULT 0,
    purchase_date DATE NOT NULL,
    expiry_date DATE,
    cost DECIMAL(15, 2),
    billing_cycle VARCHAR(20) CHECK (billing_cycle IN ('monthly', 'yearly', 'perpetual')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "licenses_tenant_isolation" ON licenses
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "licenses_service_role" ON licenses
    FOR ALL USING (current_setting('role') = 'service_role');

-- Indexes
CREATE INDEX idx_licenses_tenant ON licenses(tenant_id);
CREATE INDEX idx_licenses_expiry ON licenses(expiry_date);
CREATE INDEX idx_licenses_status ON licenses(status);

-- ═══════════════════════════════════════════════════════════════════════════════
-- UPDATED_AT TRIGGER
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TRIGGER assets_updated_at
    BEFORE UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER licenses_updated_at
    BEFORE UPDATE ON licenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════════
-- VIEWS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW asset_summary_view WITH (security_invoker = true) AS
SELECT 
    a.tenant_id,
    a.type,
    COUNT(*) AS count,
    SUM(COALESCE(a.current_value, a.purchase_price, 0)) AS total_value
FROM assets a
WHERE a.status NOT IN ('disposed')
GROUP BY a.tenant_id, a.type;

CREATE OR REPLACE VIEW expiring_licenses_view WITH (security_invoker = true) AS
SELECT 
    l.*,
    (l.expiry_date - CURRENT_DATE) AS days_until_expiry
FROM licenses l
WHERE l.status = 'active'
AND l.expiry_date IS NOT NULL
AND l.expiry_date <= (CURRENT_DATE + INTERVAL '30 days');
COMMIT;
