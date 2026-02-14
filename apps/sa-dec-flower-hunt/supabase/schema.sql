-- Sa Dec Flower Hunt Database Schema
-- Run this in Supabase SQL Editor

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

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_scans ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow anonymous inserts for lead capture)
CREATE POLICY "Allow anonymous insert" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous insert" ON wishlist FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous insert" ON qr_scans FOR INSERT WITH CHECK (true);

-- Allow read for authenticated users
CREATE POLICY "Allow read for all" ON users FOR SELECT USING (true);
CREATE POLICY "Allow read for all" ON wishlist FOR SELECT USING (true);
CREATE POLICY "Allow read for all" ON qr_scans FOR SELECT USING (true);
