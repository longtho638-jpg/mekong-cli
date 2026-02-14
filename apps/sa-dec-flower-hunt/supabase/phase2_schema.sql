-- Phase 2: Orders & Partners Schema
-- Run this in Supabase SQL Editor

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  flower_id INT NOT NULL,
  flower_name VARCHAR(255) NOT NULL,
  quantity INT DEFAULT 1,
  size VARCHAR(10) NOT NULL, -- S/M/L/XL
  price INT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, shipped, delivered, cancelled
  customer_name VARCHAR(255),
  customer_phone VARCHAR(15) NOT NULL,
  address TEXT NOT NULL,
  notes TEXT,
  garden_id UUID REFERENCES gardens(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gardens (Partners) table
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

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE gardens ENABLE ROW LEVEL SECURITY;

-- Policies for orders
CREATE POLICY "Allow insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow read orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Allow update orders" ON orders FOR UPDATE USING (true);

-- Policies for gardens
CREATE POLICY "Allow read gardens" ON gardens FOR SELECT USING (true);
CREATE POLICY "Allow insert gardens" ON gardens FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update gardens" ON gardens FOR UPDATE USING (true);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_garden ON orders(garden_id);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(customer_phone);
