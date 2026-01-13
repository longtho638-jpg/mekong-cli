-- AgencyOS Franchise System Schema
-- Version: 1.0.0
-- Created: 2025-12-31
-- Purpose: Global franchise network for $1M revenue

-- ============================================
-- TERRITORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.territories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country VARCHAR(100) NOT NULL,
  region VARCHAR(100) NOT NULL,
  city VARCHAR(100),
  population INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'available', -- available, claimed, exclusive
  franchisee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  claimed_at TIMESTAMPTZ,
  monthly_fee DECIMAL(10,2) DEFAULT 299.00,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Territories RLS
ALTER TABLE public.territories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available territories" ON public.territories
  FOR SELECT USING (status = 'available' OR franchisee_id = auth.uid());

CREATE POLICY "Franchisees can update own territories" ON public.territories
  FOR UPDATE USING (franchisee_id = auth.uid());

CREATE POLICY "Service role can manage territories" ON public.territories
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- FRANCHISEES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.franchisees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  tier VARCHAR(50) DEFAULT 'franchise', -- starter, franchise, enterprise
  status VARCHAR(50) DEFAULT 'pending', -- pending, active, suspended, churned
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  monthly_fee DECIMAL(10,2) DEFAULT 299.00,
  revenue_share_rate DECIMAL(5,4) DEFAULT 0.70, -- 70% to franchisee, 30% to HQ
  total_revenue DECIMAL(12,2) DEFAULT 0,
  total_clients INT DEFAULT 0,
  territories_count INT DEFAULT 0,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Franchisees RLS
ALTER TABLE public.franchisees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own franchisee profile" ON public.franchisees
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own franchisee profile" ON public.franchisees
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Service role can manage franchisees" ON public.franchisees
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- FRANCHISE REVENUE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.franchise_revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchisee_id UUID REFERENCES public.franchisees(id) ON DELETE CASCADE,
  period VARCHAR(7) NOT NULL, -- YYYY-MM format
  local_revenue DECIMAL(12,2) DEFAULT 0, -- Revenue from local services
  saas_revenue DECIMAL(12,2) DEFAULT 0,  -- Revenue from SaaS reselling
  total_revenue DECIMAL(12,2) DEFAULT 0,
  franchisee_share DECIMAL(12,2) DEFAULT 0, -- Amount kept by franchisee
  hq_share DECIMAL(12,2) DEFAULT 0,          -- Amount sent to HQ
  platform_fee DECIMAL(10,2) DEFAULT 299.00, -- Monthly platform fee
  clients_count INT DEFAULT 0,
  new_clients INT DEFAULT 0,
  churned_clients INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending', -- pending, verified, paid
  paid_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(franchisee_id, period)
);

-- Franchise Revenue RLS
ALTER TABLE public.franchise_revenue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Franchisees can view own revenue" ON public.franchise_revenue
  FOR SELECT USING (
    franchisee_id IN (SELECT id FROM public.franchisees WHERE user_id = auth.uid())
  );

CREATE POLICY "Service role can manage franchise revenue" ON public.franchise_revenue
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- FRANCHISE ONBOARDING STEPS
-- ============================================
CREATE TABLE IF NOT EXISTS public.franchise_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchisee_id UUID REFERENCES public.franchisees(id) ON DELETE CASCADE,
  step_number INT NOT NULL,
  step_name VARCHAR(100) NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Onboarding RLS
ALTER TABLE public.franchise_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Franchisees can view own onboarding" ON public.franchise_onboarding
  FOR SELECT USING (
    franchisee_id IN (SELECT id FROM public.franchisees WHERE user_id = auth.uid())
  );

CREATE POLICY "Franchisees can update own onboarding" ON public.franchise_onboarding
  FOR UPDATE USING (
    franchisee_id IN (SELECT id FROM public.franchisees WHERE user_id = auth.uid())
  );

-- ============================================
-- HQ REVENUE VIEW
-- ============================================
CREATE OR REPLACE VIEW public.hq_revenue_summary AS
SELECT
  DATE_TRUNC('month', fr.created_at) as month,
  COUNT(DISTINCT fr.franchisee_id) as active_franchisees,
  SUM(fr.total_revenue) as total_network_revenue,
  SUM(fr.hq_share) as hq_revenue_share,
  SUM(fr.platform_fee) as platform_fees,
  SUM(fr.hq_share) + SUM(fr.platform_fee) as total_hq_revenue,
  SUM(fr.clients_count) as total_network_clients
FROM public.franchise_revenue fr
GROUP BY DATE_TRUNC('month', fr.created_at)
ORDER BY month DESC;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Get network stats
CREATE OR REPLACE FUNCTION get_franchise_network_stats()
RETURNS TABLE (
  total_franchisees BIGINT,
  active_franchisees BIGINT,
  total_territories BIGINT,
  claimed_territories BIGINT,
  total_network_revenue DECIMAL,
  total_hq_revenue DECIMAL,
  avg_revenue_per_franchisee DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.franchisees)::BIGINT as total_franchisees,
    (SELECT COUNT(*) FROM public.franchisees WHERE status = 'active')::BIGINT as active_franchisees,
    (SELECT COUNT(*) FROM public.territories)::BIGINT as total_territories,
    (SELECT COUNT(*) FROM public.territories WHERE status IN ('claimed', 'exclusive'))::BIGINT as claimed_territories,
    COALESCE((SELECT SUM(total_revenue) FROM public.franchise_revenue), 0) as total_network_revenue,
    COALESCE((SELECT SUM(hq_share + platform_fee) FROM public.franchise_revenue), 0) as total_hq_revenue,
    COALESCE((SELECT AVG(total_revenue) FROM public.franchise_revenue), 0) as avg_revenue_per_franchisee;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Claim a territory
CREATE OR REPLACE FUNCTION claim_territory(
  p_territory_id UUID,
  p_franchisee_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_territory RECORD;
  v_franchisee RECORD;
BEGIN
  -- Get territory
  SELECT * INTO v_territory FROM public.territories WHERE id = p_territory_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Territory not found');
  END IF;
  
  IF v_territory.status != 'available' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Territory not available');
  END IF;
  
  -- Get franchisee
  SELECT * INTO v_franchisee FROM public.franchisees WHERE id = p_franchisee_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Franchisee not found');
  END IF;
  
  -- Claim territory
  UPDATE public.territories SET
    status = 'claimed',
    franchisee_id = v_franchisee.user_id,
    claimed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_territory_id;
  
  -- Update franchisee territories count
  UPDATE public.franchisees SET
    territories_count = territories_count + 1,
    updated_at = NOW()
  WHERE id = p_franchisee_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'territory_id', p_territory_id,
    'franchisee_id', p_franchisee_id,
    'claimed_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Record monthly revenue
CREATE OR REPLACE FUNCTION record_franchise_revenue(
  p_franchisee_id UUID,
  p_local_revenue DECIMAL,
  p_saas_revenue DECIMAL,
  p_clients_count INT DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
  v_period VARCHAR(7);
  v_franchisee RECORD;
  v_total DECIMAL;
  v_franchisee_share DECIMAL;
  v_hq_share DECIMAL;
BEGIN
  v_period := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
  
  -- Get franchisee
  SELECT * INTO v_franchisee FROM public.franchisees WHERE id = p_franchisee_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Franchisee not found');
  END IF;
  
  -- Calculate shares
  v_total := p_local_revenue + p_saas_revenue;
  v_franchisee_share := v_total * v_franchisee.revenue_share_rate;
  v_hq_share := v_total - v_franchisee_share;
  
  -- Upsert revenue record
  INSERT INTO public.franchise_revenue (
    franchisee_id, period, local_revenue, saas_revenue,
    total_revenue, franchisee_share, hq_share,
    platform_fee, clients_count
  ) VALUES (
    p_franchisee_id, v_period, p_local_revenue, p_saas_revenue,
    v_total, v_franchisee_share, v_hq_share,
    v_franchisee.monthly_fee, p_clients_count
  )
  ON CONFLICT (franchisee_id, period) DO UPDATE SET
    local_revenue = EXCLUDED.local_revenue,
    saas_revenue = EXCLUDED.saas_revenue,
    total_revenue = EXCLUDED.total_revenue,
    franchisee_share = EXCLUDED.franchisee_share,
    hq_share = EXCLUDED.hq_share,
    clients_count = EXCLUDED.clients_count,
    updated_at = NOW();
  
  -- Update franchisee totals
  UPDATE public.franchisees SET
    total_revenue = total_revenue + v_total,
    total_clients = p_clients_count,
    updated_at = NOW()
  WHERE id = p_franchisee_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'period', v_period,
    'total_revenue', v_total,
    'franchisee_share', v_franchisee_share,
    'hq_share', v_hq_share
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SEED DATA - VIETNAM TERRITORIES
-- ============================================
INSERT INTO public.territories (country, region, city, population, status) VALUES
('Vietnam', 'Ho Chi Minh City', 'District 1', 200000, 'available'),
('Vietnam', 'Ho Chi Minh City', 'District 7', 350000, 'available'),
('Vietnam', 'Ho Chi Minh City', 'Thu Duc City', 1000000, 'available'),
('Vietnam', 'Hanoi', 'Hoan Kiem', 150000, 'available'),
('Vietnam', 'Hanoi', 'Cau Giay', 300000, 'available'),
('Vietnam', 'Da Nang', 'Hai Chau', 200000, 'available'),
('Vietnam', 'Can Tho', 'Ninh Kieu', 250000, 'available'),
('Vietnam', 'Binh Duong', 'Thu Dau Mot', 500000, 'available'),
('Vietnam', 'Dong Nai', 'Bien Hoa', 600000, 'available'),
('Thailand', 'Bangkok', 'Sukhumvit', 500000, 'available'),
('Thailand', 'Bangkok', 'Silom', 300000, 'available'),
('Thailand', 'Chiang Mai', 'Old City', 200000, 'available'),
('Singapore', 'Central', 'CBD', 300000, 'available'),
('Singapore', 'East', 'Changi', 400000, 'available'),
('Malaysia', 'Kuala Lumpur', 'KLCC', 400000, 'available'),
('Philippines', 'Metro Manila', 'Makati', 600000, 'available'),
('Indonesia', 'Jakarta', 'South Jakarta', 2000000, 'available')
ON CONFLICT DO NOTHING;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_territories_status ON public.territories(status);
CREATE INDEX IF NOT EXISTS idx_territories_country ON public.territories(country);
CREATE INDEX IF NOT EXISTS idx_territories_franchisee ON public.territories(franchisee_id);
CREATE INDEX IF NOT EXISTS idx_franchisees_status ON public.franchisees(status);
CREATE INDEX IF NOT EXISTS idx_franchisees_user_id ON public.franchisees(user_id);
CREATE INDEX IF NOT EXISTS idx_franchise_revenue_period ON public.franchise_revenue(period);
CREATE INDEX IF NOT EXISTS idx_franchise_revenue_franchisee ON public.franchise_revenue(franchisee_id);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_territories_updated_at
  BEFORE UPDATE ON public.territories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_franchisees_updated_at
  BEFORE UPDATE ON public.franchisees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_franchise_revenue_updated_at
  BEFORE UPDATE ON public.franchise_revenue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
