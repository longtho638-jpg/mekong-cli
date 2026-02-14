-- Phase 3: WOW Features Database Schema
-- Live Dashboard & Analytics

-- ============================================
-- 1. DASHBOARD METRICS VIEW
-- ============================================

-- Real-time dashboard metrics (materialized for performance)
CREATE OR REPLACE VIEW dashboard_live_metrics AS
SELECT 
  -- Orders
  (SELECT COUNT(*) FROM orders WHERE created_at > NOW() - INTERVAL '24 hours') as orders_today,
  (SELECT COUNT(*) FROM orders WHERE created_at > NOW() - INTERVAL '7 days') as orders_week,
  (SELECT COUNT(*) FROM orders WHERE status = 'completed') as orders_completed,
  
  -- Revenue
  (SELECT COALESCE(SUM(final_price), 0) FROM orders WHERE status = 'completed') as total_revenue,
  (SELECT COALESCE(SUM(final_price), 0) FROM orders WHERE status = 'completed' AND created_at > NOW() - INTERVAL '24 hours') as revenue_today,
  (SELECT COALESCE(SUM(final_price), 0) FROM orders WHERE status = 'completed' AND created_at > NOW() - INTERVAL '7 days') as revenue_week,
  
  -- Farmers
  (SELECT COUNT(*) FROM profiles WHERE role = 'farmer') as total_farmers,
  (SELECT COUNT(DISTINCT farmer_id) FROM orders WHERE created_at > NOW() - INTERVAL '7 days') as active_farmers_week,
  
  -- Ratings
  (SELECT COALESCE(AVG(average_rating), 0) FROM farmer_ratings) as platform_avg_rating,
  (SELECT COUNT(*) FROM reviews) as total_reviews,
  
  -- Marketing
  (SELECT COUNT(*) FROM qr_scans WHERE scanned_at > NOW() - INTERVAL '7 days') as qr_scans_week,
  (SELECT COUNT(*) FROM qr_codes WHERE is_active = true) as active_qr_codes,
  
  -- Current timestamp
  NOW() as updated_at;

-- ============================================
-- 2. REVENUE TIME SERIES
-- ============================================

-- Daily revenue for last 30 days
CREATE OR REPLACE VIEW revenue_daily AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as order_count,
  SUM(final_price) as revenue,
  AVG(final_price) as avg_order_value
FROM orders
WHERE status = 'completed'
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ============================================
-- 3. TOP PERFORMERS
-- ============================================

-- Top farmers by revenue (last 30 days)
CREATE OR REPLACE VIEW top_farmers AS
SELECT 
  p.id,
  p.name,
  p.email,
  COUNT(DISTINCT o.id) as total_orders,
  SUM(o.final_price) as total_revenue,
  AVG(fr.average_rating) as rating
FROM profiles p
JOIN order_items oi ON p.id = oi.farmer_id
JOIN orders o ON oi.order_id = o.id
LEFT JOIN farmer_ratings fr ON p.id = fr.farmer_id
WHERE o.status = 'completed'
  AND o.created_at > NOW() - INTERVAL '30 days'
GROUP BY p.id, p.name, p.email, fr.average_rating
ORDER BY total_revenue DESC
LIMIT 10;

-- ============================================
-- 4. GAMIFICATION TABLES
-- ============================================

-- Farmer XP and levels
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'xp'
  ) THEN
    ALTER TABLE profiles ADD COLUMN xp INT DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'level'
  ) THEN
    ALTER TABLE profiles ADD COLUMN level INT DEFAULT 1;
  END IF;
END $$;

-- Achievements table
CREATE TABLE IF NOT EXISTS farmer_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  xp_reward INT DEFAULT 0,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  seen BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_achievements_farmer_id ON farmer_achievements(farmer_id);
CREATE INDEX IF NOT EXISTS idx_achievements_unlocked_at ON farmer_achievements(unlocked_at DESC);

-- ============================================
-- 5. HELPER FUNCTIONS
-- ============================================

-- Calculate level from XP
CREATE OR REPLACE FUNCTION get_level_from_xp(xp_amount INT)
RETURNS INT AS $$
BEGIN
  IF xp_amount < 100 THEN RETURN 1;
  ELSIF xp_amount < 500 THEN RETURN 2;
  ELSIF xp_amount < 2000 THEN RETURN 3;
  ELSIF xp_amount < 10000 THEN RETURN 4;
  ELSE RETURN 5;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Award achievement to farmer
CREATE OR REPLACE FUNCTION award_achievement(
  p_farmer_id UUID,
  p_achievement_type TEXT,
  p_achievement_name TEXT,
  p_xp_reward INT
)
RETURNS VOID AS $$
DECLARE
  existing_achievement UUID;
  new_xp INT;
  new_level INT;
BEGIN
  -- Check if already awarded
  SELECT id INTO existing_achievement
  FROM farmer_achievements
  WHERE farmer_id = p_farmer_id AND achievement_type = p_achievement_type;
  
  IF existing_achievement IS NULL THEN
    -- Insert achievement
    INSERT INTO farmer_achievements (farmer_id, achievement_type, achievement_name, xp_reward)
    VALUES (p_farmer_id, p_achievement_type, p_achievement_name, p_xp_reward);
    
    -- Update farmer XP and level
    UPDATE profiles
    SET xp = xp + p_xp_reward,
        level = get_level_from_xp(xp + p_xp_reward)
    WHERE id = p_farmer_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. TRIGGERS FOR AUTO-ACHIEVEMENTS
-- ============================================

-- Award achievements on order completion
CREATE OR REPLACE FUNCTION check_order_achievements()
RETURNS TRIGGER AS $$
DECLARE
  farmer_id_var UUID;
  order_count INT;
BEGIN
  -- Get farmer from order items
  SELECT oi.farmer_id INTO farmer_id_var
  FROM order_items oi
  WHERE oi.order_id = NEW.id
  LIMIT 1;
  
  IF farmer_id_var IS NOT NULL THEN
    -- Count completed orders for this farmer
    SELECT COUNT(*) INTO order_count
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    WHERE oi.farmer_id = farmer_id_var AND o.status = 'completed';
    
    -- Award achievements based on milestones
    IF order_count = 1 THEN
      PERFORM award_achievement(farmer_id_var, 'first_sale', 'First Sale! 🎉', 10);
    ELSIF order_count = 10 THEN
      PERFORM award_achievement(farmer_id_var, 'ten_orders', 'Rising Star ⭐', 50);
    ELSIF order_count = 100 THEN
      PERFORM award_achievement(farmer_id_var, 'hundred_orders', 'Century Club 💯', 500);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_order_achievements ON orders;
CREATE TRIGGER trigger_order_achievements
AFTER UPDATE ON orders
FOR EACH ROW
WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
EXECUTE FUNCTION check_order_achievements();

-- ============================================
-- DONE
-- ============================================

COMMENT ON VIEW dashboard_live_metrics IS 'Real-time dashboard metrics for command center';
COMMENT ON VIEW revenue_daily IS 'Daily revenue trends for charts';
COMMENT ON VIEW top_farmers IS 'Top performing farmers leaderboard';
COMMENT ON TABLE farmer_achievements IS 'Gamification achievements for farmers';
