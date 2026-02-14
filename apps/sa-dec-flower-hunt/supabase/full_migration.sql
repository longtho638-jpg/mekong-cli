-- 🚀 FULL MIGRATION SCRIPT (Unified "Deep Scan" Version)
-- Run this ENTIRE file in Supabase SQL Editor to set up the COMPLETE DB.
-- Idempotent: Can be re-run safely (Drops existing policies/triggers before creating).
-- Atomic: Uses Transaction (BEGIN/COMMIT) to ensure all-or-nothing success.

BEGIN;

-- ==========================================
-- PART 1: EXTENSIONS & CORE SECURITY
-- ==========================================

-- Enable Crypto (for password hashing/UUIDs)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==========================================
-- PART 2: CORE E-COMMERCE SCHEMA
-- ==========================================

-- 2.1 PROFILES (Extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  role VARCHAR(20) DEFAULT 'user', -- 'user', 'farmer', 'admin'
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 2.2 PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES profiles(id), -- If null, sold by Platform
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  price NUMERIC NOT NULL CHECK (price >= 0),
  images TEXT[], -- Array of URLs
  stock_level INTEGER DEFAULT 0 CHECK (stock_level >= 0),
  category TEXT, -- 'flower', 'gift', 'ticket'
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'draft', 'archived'
  metadata JSONB, -- store extra attributes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Farmers can update own products" ON products;
CREATE POLICY "Farmers can update own products" ON products FOR UPDATE USING (auth.uid() = farmer_id);

DROP POLICY IF EXISTS "Farmers can insert own products" ON products;
CREATE POLICY "Farmers can insert own products" ON products FOR INSERT WITH CHECK (auth.uid() = farmer_id);

-- 2.3 ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'shipping', 'completed', 'cancelled'
  total_amount NUMERIC NOT NULL,
  payment_method TEXT,
  shipping_address JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create orders" ON orders;
CREATE POLICY "Users can create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2.4 ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_at_purchase NUMERIC NOT NULL,
  seller_id UUID -- Denormalized for easier farmer queries
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
CREATE POLICY "Users can view own order items" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can insert order items" ON order_items;
CREATE POLICY "Users can insert order items" ON order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND user_id = auth.uid())
);

-- ==========================================
-- PART 3: GROWTH ENGINES (Partners, Referrals, Analytics)
-- ==========================================

-- 3.1 PARTNER LEADS (Optimized)
CREATE TABLE IF NOT EXISTS partner_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL CHECK (length(phone) >= 7),
  garden_name VARCHAR(200),
  address TEXT CHECK (length(address) < 1000),
  flower_types TEXT CHECK (length(flower_types) < 2000),
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partner Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_partner_leads_phone ON partner_leads(phone);
CREATE INDEX IF NOT EXISTS idx_partner_leads_status ON partner_leads(status);
CREATE INDEX IF NOT EXISTS idx_partner_leads_created_at ON partner_leads(created_at);

ALTER TABLE partner_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partner_leads_insert_public" ON partner_leads;
CREATE POLICY "partner_leads_insert_public" ON partner_leads FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "partner_leads_select_admin" ON partner_leads;
CREATE POLICY "partner_leads_select_admin" ON partner_leads FOR SELECT USING (
  auth.role() = 'service_role' OR (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
);

-- 3.2 REFERRALS
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL,
  referee_id UUID,
  code VARCHAR(20) NOT NULL, -- Many events can share a code
  reward_amount INT DEFAULT 30000,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "referrals_select" ON referrals;
CREATE POLICY "referrals_select" ON referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

-- 3.3 ANALYTICS EVENTS
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id UUID,
  stage VARCHAR(20) NOT NULL CHECK (stage IN ('acquisition', 'activation', 'retention', 'revenue', 'referral')),
  action VARCHAR(100) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_stage ON events(stage);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events_insert_anon" ON events;
CREATE POLICY "events_insert_anon" ON events FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "events_select_auth" ON events;
CREATE POLICY "events_select_auth" ON events FOR SELECT USING (auth.role() = 'authenticated');

-- 3.4 FESTIVAL LEADS (Added from leads_schema.sql)
CREATE TABLE IF NOT EXISTS festival_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT, -- Added for digital voucher
  location_lat FLOAT,
  location_lng FLOAT,
  device_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_phone ON festival_leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_email ON festival_leads(email);

ALTER TABLE festival_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "festival_leads_insert_public" ON festival_leads;
CREATE POLICY "festival_leads_insert_public" ON festival_leads FOR INSERT WITH CHECK (true);

-- ==========================================
-- PART 4: AUTONOMOUS ORGANIZATION (Admin Only)
-- ==========================================

-- 4.1 GOALS
CREATE TABLE IF NOT EXISTS autonomous_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_name TEXT NOT NULL,
  goal_type TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  current_value NUMERIC DEFAULT 0,
  unit TEXT,
  target_date DATE,
  status TEXT DEFAULT 'active',
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE autonomous_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "autonomous_goals_secure" ON autonomous_goals;
CREATE POLICY "autonomous_goals_secure" ON autonomous_goals
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- 4.2 EXECUTION LOG
CREATE TABLE IF NOT EXISTS execution_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ceo_directive TEXT NOT NULL,
  departments_activated TEXT[] NOT NULL,
  tasks_completed JSONB,
  metrics_snapshot JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE execution_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "execution_log_secure" ON execution_log;
CREATE POLICY "execution_log_secure" ON execution_log
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- 4.3 DEPARTMENT TASKS
CREATE TABLE IF NOT EXISTS department_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department TEXT NOT NULL,
  task_description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  assigned_by TEXT DEFAULT 'CEO',
  output JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE department_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "department_tasks_secure" ON department_tasks;
CREATE POLICY "department_tasks_secure" ON department_tasks
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- 4.4 TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_goals_updated_at ON autonomous_goals;
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON autonomous_goals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- PART 5: SECURE TRANSACTIONS (RPC)
-- ==========================================

-- 5.1 CREATE ORDER (Atomic)
CREATE OR REPLACE FUNCTION create_order(
  p_user_id UUID,
  p_total_amount NUMERIC,
  p_items JSONB,
  p_shipping_address JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;
  v_product_id UUID;
  v_quantity INTEGER;
  v_price NUMERIC;
  v_stock INTEGER;
  v_seller_id UUID;
BEGIN
  -- Insert Order
  INSERT INTO orders (user_id, total_amount, status, shipping_address)
  VALUES (p_user_id, p_total_amount, 'pending', p_shipping_address)
  RETURNING id INTO v_order_id;

  -- Process Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_quantity := (v_item->>'quantity')::INTEGER;

    IF v_quantity <= 0 THEN
       RAISE EXCEPTION 'Invalid quantity %', v_quantity;
    END IF;

    -- Lock & Fetch
    SELECT price, stock_level, farmer_id INTO v_price, v_stock, v_seller_id
    FROM products WHERE id = v_product_id FOR UPDATE;

    IF v_stock < v_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for product %', v_product_id;
    END IF;

    -- Update Stock
    UPDATE products SET stock_level = stock_level - v_quantity WHERE id = v_product_id;

    -- Insert Item
    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, seller_id)
    VALUES (v_order_id, v_product_id, v_quantity, v_price, v_seller_id);
  END LOOP;

  RETURN v_order_id;
END;
$$;

-- 5.2 ADMIN STATS (Secure)
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS TABLE (
  total_revenue NUMERIC,
  total_orders INTEGER,
  active_products INTEGER,
  low_stock_products INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role text;
BEGIN
  -- Security Check: Admin Role Required
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
  
  IF v_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Forbidden: Admin access required';
  END IF;

  RETURN QUERY
  SELECT
    (SELECT COALESCE(SUM(total_amount), 0) FROM orders),
    (SELECT COUNT(*)::INTEGER FROM orders),
    (SELECT COUNT(*)::INTEGER FROM products WHERE status = 'active'),
    (SELECT COUNT(*)::INTEGER FROM products WHERE stock_level < 10);
END;
$$;

-- 5.3 DAILY REVENUE (Admin)
CREATE OR REPLACE FUNCTION get_daily_revenue()
RETURNS TABLE (
  date DATE,
  revenue NUMERIC,
  order_count INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role text;
BEGIN
  -- Security Check: Admin Role Required
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
  
  IF v_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Forbidden: Admin access required';
  END IF;

  RETURN QUERY
  SELECT 
    DATE(created_at) as date,
    SUM(total_amount) as revenue,
    COUNT(id)::INTEGER as order_count
  FROM orders
  WHERE created_at > NOW() - INTERVAL '7 days'
  GROUP BY DATE(created_at)
  ORDER BY DATE(created_at) ASC;
END;
$$;

-- ==========================================
-- PART 6: SEED DATA
-- ==========================================

-- Insert Farmers
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, is_super_admin)
VALUES 
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '00000000-0000-0000-0000-000000000000', 'farmer1@sadec.local', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Chú Nguyễn Văn Thanh"}', NOW(), NOW(), 'authenticated', false),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', '00000000-0000-0000-0000-000000000000', 'farmer2@sadec.local', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Anh Hoàng Văn Nam"}', NOW(), NOW(), 'authenticated', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, role, full_name, address, avatar_url)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'farmer', 'Chú Nguyễn Văn Thanh', 'Ấp Tân Quy Đông, Sa Đéc', 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?q=80&w=200'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'farmer', 'Anh Hoàng Văn Nam', 'Phường 1, Sa Đéc', 'https://images.unsplash.com/photo-1542596594-649edbc13630?q=80&w=200')
ON CONFLICT (id) DO NOTHING;

-- Insert Products
INSERT INTO public.products (farmer_id, name, description, price, category, status, stock_level, images, metadata)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Cúc Mâm Xôi', 'Form to, chưng được 2 tuần. Giá sỉ!', 150000, 'flower', 'active', 100, ARRAY['https://images.unsplash.com/photo-1606041008023-472dfb5e530f?q=80&w=600'], '{"vibe": "Tiền Vô Như Nước 💰", "origin": "Sa Đéc"}'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Hoa Hồng Sa Đéc', 'Hồng cánh dày, thơm lâu. HOT!', 80000, 'flower', 'active', 50, ARRAY['https://images.unsplash.com/photo-1548586196-aa5803b77379?q=80&w=600'], '{"vibe": "Tình Duyên Phơi Phới 💕", "origin": "Sa Đéc"}');

COMMIT;

-- Done
SELECT 'Migration Complete' as status;
-- Fix RLS: Allow farmers to view items they sold
BEGIN;

DROP POLICY IF EXISTS "Farmers can view sold items" ON order_items;
CREATE POLICY "Farmers can view sold items" ON order_items 
FOR SELECT 
USING (auth.uid() = seller_id);

COMMIT;
