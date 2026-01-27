-- Affiliate Tracking System Schema
-- Created: 2026-01-27
-- Description: Schema for affiliate management, tracking, and payouts

BEGIN;

-- ============================================
-- AFFILIATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE, -- Support multi-tenancy
  code VARCHAR(50) NOT NULL, -- Unique referral code
  commission_rate DECIMAL(5,4) DEFAULT 0.2000, -- 0.20 = 20%
  payment_email VARCHAR(255),
  tax_id VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active', -- active, suspended
  settings JSONB DEFAULT '{}'::jsonb, -- Extra settings
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT uq_affiliate_code UNIQUE (code),
  CONSTRAINT uq_affiliate_user_agency UNIQUE (user_id, agency_id)
);

-- RLS
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own affiliate profile" ON public.affiliates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage affiliates" ON public.affiliates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.agencies
      WHERE id = public.affiliates.agency_id AND user_id = auth.uid()
    )
  );

-- ============================================
-- AFFILIATE LINKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE,
  slug VARCHAR(100), -- Optional campaign slug
  destination_url TEXT NOT NULL,
  clicks INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT uq_affiliate_slug UNIQUE (slug)
);

-- RLS
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view own links" ON public.affiliate_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.affiliates
      WHERE id = public.affiliate_links.affiliate_id AND user_id = auth.uid()
    )
  );

-- ============================================
-- CONVERSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE SET NULL,
  external_id VARCHAR(255), -- Gumroad Sale ID or Stripe Charge ID
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  commission_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, paid, refunded
  metadata JSONB, -- Product info, etc.
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view own conversions" ON public.conversions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.affiliates
      WHERE id = public.conversions.affiliate_id AND user_id = auth.uid()
    )
  );

-- ============================================
-- PAYOUTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  tax_amount DECIMAL(10,2) DEFAULT 0,
  tax_rate DECIMAL(5,4) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, paid, failed
  method VARCHAR(50), -- stripe_connect, paypal, manual
  reference_id VARCHAR(255), -- Stripe Transfer ID
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view own payouts" ON public.payouts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.affiliates
      WHERE id = public.payouts.affiliate_id AND user_id = auth.uid()
    )
  );

-- ============================================
-- INDEXES & TRIGGERS
-- ============================================
CREATE INDEX idx_affiliates_code ON public.affiliates(code);
CREATE INDEX idx_affiliates_user_id ON public.affiliates(user_id);
CREATE INDEX idx_affiliates_agency_id ON public.affiliates(agency_id);
CREATE INDEX idx_conversions_affiliate_id ON public.conversions(affiliate_id);
CREATE INDEX idx_conversions_external_id ON public.conversions(external_id);
CREATE INDEX idx_payouts_affiliate_id ON public.payouts(affiliate_id);
CREATE INDEX idx_payouts_status ON public.payouts(status);

-- Update triggers
CREATE TRIGGER update_affiliates_updated_at
  BEFORE UPDATE ON public.affiliates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliate_links_updated_at
  BEFORE UPDATE ON public.affiliate_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversions_updated_at
  BEFORE UPDATE ON public.conversions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payouts_updated_at
  BEFORE UPDATE ON public.payouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
