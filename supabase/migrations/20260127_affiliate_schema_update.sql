-- Update Affiliate Schema: Link Conversions to Payouts
-- Created: 2026-01-27

BEGIN;

-- Add payout_id to conversions table
ALTER TABLE public.conversions
ADD COLUMN payout_id UUID REFERENCES public.payouts(id) ON DELETE SET NULL;

-- Index for faster lookup of unpaid conversions
CREATE INDEX idx_conversions_payout_id ON public.conversions(payout_id);

COMMIT;
