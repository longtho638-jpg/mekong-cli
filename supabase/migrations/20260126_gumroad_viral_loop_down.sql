-- Migration: Gumroad Viral Loop DOWN
-- Date: 2026-01-26

BEGIN;

DROP TABLE IF EXISTS public.referrals;
DROP TABLE IF EXISTS public.sales;

COMMIT;
