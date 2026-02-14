-- SA DEC FLOWER HUNT - COMPLETE DATABASE SCHEMA
-- Run this ONCE in Supabase SQL Editor
-- Last updated: Dec 5, 2025

-- ============================================
-- PHASE 1: Core Tables (Users, Wishlist, QR)
-- ============================================

-- Users table (stores leads)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(15) UNIQUE NOT NULL,
  email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wishlist table (flower preferences)
CREATE TABLE IF NOT EXISTS wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  flower_id INT NOT NULL,
  flower_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, flower_id)
);

-- QR Scans table (gamification tracking)
CREATE TABLE IF NOT EXISTS qr_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  flower_id INT NOT NULL,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  location VARCHAR(255),
  UNIQUE(user_id, flower_id)
);

-- ============================================
-- PHASE 2: Ordering & Partners Tables
-- ============================================

-- Gardens (Partners) table - CREATE FIRST
CREATE TABLE IF NOT EXISTS gardens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  owner_name VARCHAR(255),
  phone VARCHAR(15) NOT NULL UNIQUE,
  address TEXT,
  flowers_available INT[],
  commission_rate DECIMAL(5,2) DEFAULT 15.00,
  is_active BOOLEAN DEFAULT true,
  total_orders INT DEFAULT 0,
  total_revenue INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  flower_id INT NOT NULL,
  flower_name VARCHAR(255) NOT NULL,
  quantity INT DEFAULT 1,
  size VARCHAR(10) NOT NULL,
  price INT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  customer_name VARCHAR(255),
  customer_phone VARCHAR(15) NOT NULL,
  address TEXT NOT NULL,
  notes TEXT,
  garden_id UUID REFERENCES gardens(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE gardens ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_select" ON users FOR SELECT USING (true);

-- Wishlist policies
CREATE POLICY "wishlist_insert" ON wishlist FOR INSERT WITH CHECK (true);
CREATE POLICY "wishlist_select" ON wishlist FOR SELECT USING (true);

-- QR Scans policies
CREATE POLICY "qr_scans_insert" ON qr_scans FOR INSERT WITH CHECK (true);
CREATE POLICY "qr_scans_select" ON qr_scans FOR SELECT USING (true);

-- Gardens policies
CREATE POLICY "gardens_select" ON gardens FOR SELECT USING (true);
CREATE POLICY "gardens_insert" ON gardens FOR INSERT WITH CHECK (true);
CREATE POLICY "gardens_update" ON gardens FOR UPDATE USING (true);

-- Orders policies
CREATE POLICY "orders_insert" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_select" ON orders FOR SELECT USING (true);
CREATE POLICY "orders_update" ON orders FOR UPDATE USING (true);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_garden ON orders(garden_id);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_scans_user ON qr_scans(user_id);

-- ============================================
-- DONE! All tables created successfully.
-- ============================================
