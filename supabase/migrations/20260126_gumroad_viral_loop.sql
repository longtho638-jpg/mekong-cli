-- Migration: Gumroad Viral Loop
-- Date: 2026-01-26

BEGIN;

-- Create sales table
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gumroad_sale_id TEXT UNIQUE NOT NULL,
    buyer_email TEXT NOT NULL,
    product_id TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    referrer_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create referrals table
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_code TEXT UNIQUE NOT NULL,
    referrer_email TEXT NOT NULL,
    total_referrals INTEGER DEFAULT 0,
    tier TEXT DEFAULT 'bronze',
    rewards_claimed JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sales_gumroad_sale_id ON public.sales(gumroad_sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_referrer_code ON public.sales(referrer_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_code ON public.referrals(referrer_code);

-- RLS
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Policies (Service Role only for now as webhook handles data)
CREATE POLICY "Service role full access sales" ON public.sales
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access referrals" ON public.referrals
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Grant access to service_role (implicit usually, but good to be explicit for functions)
GRANT ALL ON public.sales TO service_role;
GRANT ALL ON public.referrals TO service_role;
COMMIT;
