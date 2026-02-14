-- Phase 2: Trust & Safety Database Schema
-- Part 1: Escrow & Order Tracking

-- ============================================
-- 1. ESCROW SYSTEM
-- ============================================

-- Add escrow columns to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS escrow_status TEXT DEFAULT 'held',
ADD COLUMN IF NOT EXISTS escrow_released_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS release_reason TEXT;

-- Add constraint for escrow_status
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transactions_escrow_status_check'
  ) THEN
    ALTER TABLE transactions 
    ADD CONSTRAINT transactions_escrow_status_check 
    CHECK (escrow_status IN ('held', 'released_to_farmer', 'refunded_to_buyer'));
  END IF;
END $$;

COMMENT ON COLUMN transactions.escrow_status IS 'Status of funds: held (in escrow), released_to_farmer (completed), refunded_to_buyer (cancelled)';
COMMENT ON COLUMN transactions.escrow_released_at IS 'Timestamp when funds were released from escrow';
COMMENT ON COLUMN transactions.release_reason IS 'Reason for release: auto_release, buyer_confirmed, admin_override, dispute_resolved';

-- ============================================
-- 2. ORDER STATUS TRACKING
-- ============================================

-- Order status history table (timeline)
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  previous_status TEXT,
  note TEXT,
  changed_by UUID REFERENCES profiles(id), -- Who made the change (farmer, buyer, or admin)
  changed_by_role TEXT, -- 'farmer', 'buyer', 'admin', 'system'
  metadata JSONB, -- Additional data (tracking number, delivery photo, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at ON order_status_history(created_at DESC);

-- Add status constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'order_status_history_status_check'
  ) THEN
    ALTER TABLE order_status_history 
    ADD CONSTRAINT order_status_history_status_check 
    CHECK (status IN ('pending', 'paid', 'confirmed', 'preparing', 'shipped', 'delivered', 'completed', 'cancelled', 'disputed'));
  END IF;
END $$;

COMMENT ON TABLE order_status_history IS 'Timeline of all order status changes for tracking and auditing';

-- ============================================
-- 3. REVIEWS & RATINGS
-- ============================================

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE, -- One review per order
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  farmer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  photos TEXT[], -- Array of image URLs uploaded with review
  response TEXT, -- Farmer's response to review
  response_at TIMESTAMP WITH TIME ZONE,
  helpful_count INT DEFAULT 0, -- How many users found this helpful
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for reviews
CREATE INDEX IF NOT EXISTS idx_reviews_farmer_id ON reviews(farmer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_buyer_id ON reviews(buyer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

COMMENT ON TABLE reviews IS 'Buyer reviews for completed orders';
COMMENT ON COLUMN reviews.helpful_count IS 'Number of users who marked this review as helpful';

-- ============================================
-- 4. FARMER RATING AGGREGATES
-- ============================================

-- Farmer ratings summary (computed/cached stats)
CREATE TABLE IF NOT EXISTS farmer_ratings (
  farmer_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  average_rating DECIMAL(3,2) CHECK (average_rating >= 1 AND average_rating <= 5),
  total_reviews INT DEFAULT 0,
  five_star INT DEFAULT 0,
  four_star INT DEFAULT 0,
  three_star INT DEFAULT 0,
  two_star INT DEFAULT 0,
  one_star INT DEFAULT 0,
  last_review_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE farmer_ratings IS 'Aggregated rating statistics per farmer for fast lookups';

-- ============================================
-- 5. HELPER FUNCTIONS
-- ============================================

-- Function to update farmer ratings when review is added/updated
CREATE OR REPLACE FUNCTION update_farmer_ratings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO farmer_ratings (farmer_id, average_rating, total_reviews, five_star, four_star, three_star, two_star, one_star, last_review_at, updated_at)
  VALUES (
    NEW.farmer_id,
    NEW.rating,
    1,
    CASE WHEN NEW.rating = 5 THEN 1 ELSE 0 END,
    CASE WHEN NEW.rating = 4 THEN 1 ELSE 0 END,
    CASE WHEN NEW.rating = 3 THEN 1 ELSE 0 END,
    CASE WHEN NEW.rating = 2 THEN 1 ELSE 0 END,
    CASE WHEN NEW.rating = 1 THEN 1 ELSE 0 END,
    NOW(),
    NOW()
  )
  ON CONFLICT (farmer_id) 
  DO UPDATE SET
    average_rating = (
      SELECT AVG(rating)::DECIMAL(3,2)
      FROM reviews
      WHERE farmer_id = NEW.farmer_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE farmer_id = NEW.farmer_id
    ),
    five_star = (
      SELECT COUNT(*)
      FROM reviews
      WHERE farmer_id = NEW.farmer_id AND rating = 5
    ),
    four_star = (
      SELECT COUNT(*)
      FROM reviews
      WHERE farmer_id = NEW.farmer_id AND rating = 4
    ),
    three_star = (
      SELECT COUNT(*)
      FROM reviews
      WHERE farmer_id = NEW.farmer_id AND rating = 3
    ),
    two_star = (
      SELECT COUNT(*)
      FROM reviews
      WHERE farmer_id = NEW.farmer_id AND rating = 2
    ),
    one_star = (
      SELECT COUNT(*)
      FROM reviews
      WHERE farmer_id = NEW.farmer_id AND rating = 1
    ),
    last_review_at = NOW(),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update farmer ratings
DROP TRIGGER IF EXISTS trigger_update_farmer_ratings ON reviews;
CREATE TRIGGER trigger_update_farmer_ratings
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_farmer_ratings();

-- ============================================
-- 6. INITIAL DATA POPULATION
-- ============================================

-- Add status history for existing orders (one-time migration)
-- This ensures existing orders have a baseline history entry
INSERT INTO order_status_history (order_id, status, previous_status, changed_by_role, note)
SELECT 
  id as order_id,
  status,
  NULL as previous_status,
  'system' as changed_by_role,
  'Initial status from migration' as note
FROM orders
WHERE id NOT IN (SELECT DISTINCT order_id FROM order_status_history)
ON CONFLICT DO NOTHING;

-- Comments for documentation
COMMENT ON DATABASE postgres IS 'SADEC.OS - Phase 2: Trust & Safety features deployed';

-- Grants (ensure proper permissions)
GRANT SELECT, INSERT, UPDATE ON order_status_history TO authenticated;
GRANT SELECT, INSERT, UPDATE ON reviews TO authenticated;
GRANT SELECT ON farmer_ratings TO authenticated;
