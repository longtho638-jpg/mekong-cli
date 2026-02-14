-- Cold Chain IoT Sensors Database Schema
-- Migration: 20251209_cold_chain_iot.sql

-- Table: iot_devices - Quản lý thiết bị cảm biến
CREATE TABLE IF NOT EXISTS iot_devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    device_id VARCHAR(100) UNIQUE NOT NULL,
    device_type VARCHAR(50) NOT NULL DEFAULT 'temperature_humidity',
    device_name VARCHAR(255),
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    firmware_version VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    last_seen_at TIMESTAMPTZ,
    battery_level INTEGER, -- 0-100%
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: cold_chain_shipments - Lô hàng vận chuyển
CREATE TABLE IF NOT EXISTS cold_chain_shipments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shipment_code VARCHAR(50) UNIQUE NOT NULL,
    order_id UUID REFERENCES orders(id),
    product_id UUID REFERENCES products(id),
    device_id UUID REFERENCES iot_devices(id),
    origin_location JSONB, -- {lat, lng, address}
    destination_location JSONB,
    min_temp DECIMAL(5,2) DEFAULT 2.0, -- Celsius
    max_temp DECIMAL(5,2) DEFAULT 8.0,
    min_humidity DECIMAL(5,2) DEFAULT 60,
    max_humidity DECIMAL(5,2) DEFAULT 90,
    status VARCHAR(50) DEFAULT 'pending', -- pending, in_transit, delivered, failed
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: cold_chain_readings - Dữ liệu đọc từ cảm biến
CREATE TABLE IF NOT EXISTS cold_chain_readings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    device_id UUID REFERENCES iot_devices(id) NOT NULL,
    shipment_id UUID REFERENCES cold_chain_shipments(id),
    temperature DECIMAL(5,2), -- Celsius
    humidity DECIMAL(5,2), -- %
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    altitude DECIMAL(8,2), -- meters
    battery_level INTEGER,
    signal_strength INTEGER, -- dBm
    is_alert BOOLEAN DEFAULT false,
    alert_type VARCHAR(50), -- temp_high, temp_low, humidity_high, etc.
    recorded_at TIMESTAMPTZ NOT NULL,
    received_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: cold_chain_alerts - Cảnh báo vi phạm điều kiện
CREATE TABLE IF NOT EXISTS cold_chain_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shipment_id UUID REFERENCES cold_chain_shipments(id) NOT NULL,
    reading_id UUID REFERENCES cold_chain_readings(id),
    alert_type VARCHAR(50) NOT NULL, -- temperature_high, temperature_low, humidity_high, humidity_low, device_offline
    severity VARCHAR(20) NOT NULL DEFAULT 'warning', -- warning, critical
    message TEXT,
    threshold_value DECIMAL(5,2),
    actual_value DECIMAL(5,2),
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_readings_device ON cold_chain_readings(device_id);
CREATE INDEX IF NOT EXISTS idx_readings_shipment ON cold_chain_readings(shipment_id);
CREATE INDEX IF NOT EXISTS idx_readings_recorded ON cold_chain_readings(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_readings_alert ON cold_chain_readings(is_alert) WHERE is_alert = true;
CREATE INDEX IF NOT EXISTS idx_shipments_status ON cold_chain_shipments(status);
CREATE INDEX IF NOT EXISTS idx_alerts_unresolved ON cold_chain_alerts(is_resolved) WHERE is_resolved = false;

-- RLS Policies
ALTER TABLE iot_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE cold_chain_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cold_chain_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cold_chain_alerts ENABLE ROW LEVEL SECURITY;

-- Public read for cold chain data (transparency)
CREATE POLICY "Public can view device info" ON iot_devices
    FOR SELECT USING (true);

CREATE POLICY "Public can view shipment tracking" ON cold_chain_shipments
    FOR SELECT USING (true);

CREATE POLICY "Public can view readings" ON cold_chain_readings
    FOR SELECT USING (true);

CREATE POLICY "Public can view alerts" ON cold_chain_alerts
    FOR SELECT USING (true);

-- Only service role can insert/update
CREATE POLICY "Service role can manage devices" ON iot_devices
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage shipments" ON cold_chain_shipments
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can insert readings" ON cold_chain_readings
    FOR INSERT WITH CHECK (true); -- Webhook can insert

CREATE POLICY "Service role can manage alerts" ON cold_chain_alerts
    FOR ALL USING (auth.role() = 'service_role');

-- Demo device and data
INSERT INTO iot_devices (device_id, device_type, device_name, manufacturer, model, is_active)
VALUES 
    ('DEMO_SENSOR_001', 'temperature_humidity', 'Demo Cold Chain Sensor', 'ESP32-DIY', 'DHT22+GPS', true),
    ('DEMO_SENSOR_002', 'temperature_humidity', 'Demo Truck Sensor', 'Tive', 'Solo 5G', true)
ON CONFLICT (device_id) DO NOTHING;
