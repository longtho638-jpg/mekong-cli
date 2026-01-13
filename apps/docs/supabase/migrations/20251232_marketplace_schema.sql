-- AgencyOS Marketplace Schema
-- Version: 1.0.0
-- Created: 2025-12-31
-- Purpose: Skill, template, and agent marketplace for $1M revenue

-- ============================================
-- MARKETPLACE ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.marketplace_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL, -- skill, template, agent, workflow
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  short_description VARCHAR(500),
  icon VARCHAR(10) DEFAULT '📦',
  category VARCHAR(100),
  tags TEXT[],
  price DECIMAL(10,2) DEFAULT 0, -- 0 = free
  price_type VARCHAR(50) DEFAULT 'one_time', -- one_time, subscription, revenue_share
  revenue_share_rate DECIMAL(5,4) DEFAULT 0, -- For revenue share model
  status VARCHAR(50) DEFAULT 'draft', -- draft, pending_review, published, suspended
  downloads INT DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  reviews_count INT DEFAULT 0,
  version VARCHAR(20) DEFAULT '1.0.0',
  source_url TEXT,
  documentation_url TEXT,
  preview_images TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- Marketplace Items RLS
ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published items" ON public.marketplace_items
  FOR SELECT USING (status = 'published');

CREATE POLICY "Creators can view own items" ON public.marketplace_items
  FOR SELECT USING (creator_id = auth.uid());

CREATE POLICY "Creators can manage own items" ON public.marketplace_items
  FOR ALL USING (creator_id = auth.uid());

CREATE POLICY "Service role can manage all items" ON public.marketplace_items
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- MARKETPLACE PURCHASES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.marketplace_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  item_id UUID REFERENCES public.marketplace_items(id) ON DELETE SET NULL,
  price_paid DECIMAL(10,2) NOT NULL,
  creator_share DECIMAL(10,2) NOT NULL,
  platform_share DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'completed', -- completed, refunded
  payment_method VARCHAR(50),
  polar_order_id VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchases RLS
ALTER TABLE public.marketplace_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view own purchases" ON public.marketplace_purchases
  FOR SELECT USING (buyer_id = auth.uid());

CREATE POLICY "Creators can view sales" ON public.marketplace_purchases
  FOR SELECT USING (
    item_id IN (SELECT id FROM public.marketplace_items WHERE creator_id = auth.uid())
  );

-- ============================================
-- MARKETPLACE REVIEWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.marketplace_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.marketplace_items(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  purchase_id UUID REFERENCES public.marketplace_purchases(id),
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  content TEXT,
  helpful_count INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'published', -- published, hidden
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(item_id, reviewer_id)
);

-- Reviews RLS
ALTER TABLE public.marketplace_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published reviews" ON public.marketplace_reviews
  FOR SELECT USING (status = 'published');

CREATE POLICY "Reviewers can manage own reviews" ON public.marketplace_reviews
  FOR ALL USING (reviewer_id = auth.uid());

-- ============================================
-- CREATOR PAYOUTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.creator_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  period VARCHAR(7) NOT NULL, -- YYYY-MM
  total_sales DECIMAL(12,2) DEFAULT 0,
  total_earnings DECIMAL(12,2) DEFAULT 0,
  platform_fee DECIMAL(12,2) DEFAULT 0,
  payout_amount DECIMAL(12,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, paid
  payout_method VARCHAR(50),
  payout_reference VARCHAR(255),
  paid_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(creator_id, period)
);

-- Payouts RLS
ALTER TABLE public.creator_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view own payouts" ON public.creator_payouts
  FOR SELECT USING (creator_id = auth.uid());

-- ============================================
-- MARKETPLACE STATS VIEW
-- ============================================
CREATE OR REPLACE VIEW public.marketplace_stats AS
SELECT
  COUNT(*) as total_items,
  COUNT(*) FILTER (WHERE status = 'published') as published_items,
  COUNT(*) FILTER (WHERE type = 'skill') as skills_count,
  COUNT(*) FILTER (WHERE type = 'template') as templates_count,
  COUNT(*) FILTER (WHERE type = 'agent') as agents_count,
  COUNT(*) FILTER (WHERE type = 'workflow') as workflows_count,
  SUM(downloads) as total_downloads,
  COUNT(DISTINCT creator_id) as total_creators
FROM public.marketplace_items;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Record a purchase
CREATE OR REPLACE FUNCTION record_marketplace_purchase(
  p_buyer_id UUID,
  p_item_id UUID,
  p_price DECIMAL,
  p_polar_order_id VARCHAR DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_item RECORD;
  v_creator_share DECIMAL;
  v_platform_share DECIMAL;
BEGIN
  -- Get item
  SELECT * INTO v_item FROM public.marketplace_items WHERE id = p_item_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item not found');
  END IF;
  
  -- Calculate shares (70% to creator, 30% to platform)
  v_creator_share := p_price * 0.70;
  v_platform_share := p_price * 0.30;
  
  -- Insert purchase
  INSERT INTO public.marketplace_purchases (
    buyer_id, item_id, price_paid, creator_share, platform_share, polar_order_id
  ) VALUES (
    p_buyer_id, p_item_id, p_price, v_creator_share, v_platform_share, p_polar_order_id
  );
  
  -- Update item stats
  UPDATE public.marketplace_items SET
    downloads = downloads + 1,
    updated_at = NOW()
  WHERE id = p_item_id;
  
  -- Update creator earnings
  INSERT INTO public.creator_payouts (creator_id, period, total_sales, total_earnings, payout_amount)
  VALUES (v_item.creator_id, TO_CHAR(CURRENT_DATE, 'YYYY-MM'), v_creator_share, v_creator_share, v_creator_share)
  ON CONFLICT (creator_id, period) DO UPDATE SET
    total_sales = public.creator_payouts.total_sales + v_creator_share,
    total_earnings = public.creator_payouts.total_earnings + v_creator_share,
    payout_amount = public.creator_payouts.payout_amount + v_creator_share;
  
  RETURN jsonb_build_object(
    'success', true,
    'item_id', p_item_id,
    'creator_share', v_creator_share,
    'platform_share', v_platform_share
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update item rating
CREATE OR REPLACE FUNCTION update_item_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.marketplace_items SET
    rating = (SELECT AVG(rating) FROM public.marketplace_reviews WHERE item_id = NEW.item_id),
    reviews_count = (SELECT COUNT(*) FROM public.marketplace_reviews WHERE item_id = NEW.item_id),
    updated_at = NOW()
  WHERE id = NEW.item_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rating_on_review
  AFTER INSERT OR UPDATE ON public.marketplace_reviews
  FOR EACH ROW EXECUTE FUNCTION update_item_rating();

-- ============================================
-- SEED DATA - SAMPLE MARKETPLACE ITEMS
-- ============================================
INSERT INTO public.marketplace_items (type, name, slug, description, short_description, icon, category, tags, price, status, downloads, rating) VALUES
('skill', 'SEO Audit Skill', 'seo-audit', 'Complete SEO audit automation for any website', 'Automated SEO audits with actionable insights', '🔍', 'Marketing', ARRAY['seo', 'audit', 'marketing'], 49.00, 'published', 245, 4.8),
('skill', 'Invoice Generator', 'invoice-generator', 'Generate professional invoices in seconds', 'Quick invoice creation for agencies', '📄', 'Finance', ARRAY['invoice', 'billing', 'finance'], 29.00, 'published', 189, 4.6),
('template', 'Proposal Template Pack', 'proposal-templates', '10 professional proposal templates', 'Win more clients with stunning proposals', '📋', 'Sales', ARRAY['proposal', 'sales', 'templates'], 79.00, 'published', 156, 4.9),
('agent', 'Social Media Manager', 'social-media-agent', 'AI agent for social media management', 'Automate your social presence', '📱', 'Social', ARRAY['social', 'automation', 'agent'], 99.00, 'published', 98, 4.7),
('workflow', 'Client Onboarding Flow', 'client-onboarding', 'Complete client onboarding automation', 'Onboard clients in minutes not days', '🚀', 'Operations', ARRAY['onboarding', 'workflow', 'automation'], 149.00, 'published', 67, 4.8),
('skill', 'Content Calendar', 'content-calendar', 'AI-powered content calendar generation', 'Plan months of content in minutes', '📅', 'Content', ARRAY['content', 'calendar', 'planning'], 0.00, 'published', 512, 4.5)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_marketplace_items_status ON public.marketplace_items(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_type ON public.marketplace_items(type);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_category ON public.marketplace_items(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_creator ON public.marketplace_items(creator_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_buyer ON public.marketplace_purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_item ON public.marketplace_purchases(item_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_item ON public.marketplace_reviews(item_id);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_marketplace_items_updated_at
  BEFORE UPDATE ON public.marketplace_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_reviews_updated_at
  BEFORE UPDATE ON public.marketplace_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
