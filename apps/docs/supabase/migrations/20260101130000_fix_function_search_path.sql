-- ==============================================================
-- Migration: Fix Function Search Path Warnings
-- Date: 2026-01-01
-- Fixes: 23 functions with mutable search_path
-- ==============================================================

-- Fix: Set search_path to empty string for all functions
-- This prevents search_path injection attacks

-- 1. generate_referral_code
ALTER FUNCTION public.generate_referral_code SET search_path = '';

-- 2. queue_onboarding_emails
ALTER FUNCTION public.queue_onboarding_emails SET search_path = '';

-- 3. update_affiliate_stats
ALTER FUNCTION public.update_affiliate_stats SET search_path = '';

-- 4. check_achievements
ALTER FUNCTION public.check_achievements SET search_path = '';

-- 5. get_affiliate_dashboard
ALTER FUNCTION public.get_affiliate_dashboard SET search_path = '';

-- 6. update_user_rank
ALTER FUNCTION public.update_user_rank SET search_path = '';

-- 7. spend_ag_credits
ALTER FUNCTION public.spend_ag_credits SET search_path = '';

-- 8. add_ag_credits
ALTER FUNCTION public.add_ag_credits SET search_path = '';

-- 9. transfer_ag_credits
ALTER FUNCTION public.transfer_ag_credits SET search_path = '';

-- 10. get_wallet_summary
ALTER FUNCTION public.get_wallet_summary SET search_path = '';

-- 11. update_updated_at_column
ALTER FUNCTION public.update_updated_at_column SET search_path = '';

-- 12. get_franchise_network_stats
ALTER FUNCTION public.get_franchise_network_stats SET search_path = '';

-- 13. claim_territory
ALTER FUNCTION public.claim_territory SET search_path = '';

-- 14. record_franchise_revenue
ALTER FUNCTION public.record_franchise_revenue SET search_path = '';

-- 15. record_marketplace_purchase
ALTER FUNCTION public.record_marketplace_purchase SET search_path = '';

-- 16. update_item_rating
ALTER FUNCTION public.update_item_rating SET search_path = '';

-- 17. get_monthly_usage
ALTER FUNCTION public.get_monthly_usage SET search_path = '';

-- 18. calculate_trust_score
ALTER FUNCTION public.calculate_trust_score SET search_path = '';

-- 19. update_member_tier
ALTER FUNCTION public.update_member_tier SET search_path = '';

-- 20. recalculate_pricing_benchmark
ALTER FUNCTION public.recalculate_pricing_benchmark SET search_path = '';

-- 21. process_defense_vote
ALTER FUNCTION public.process_defense_vote SET search_path = '';

-- 22. update_newsletter_subscriber_count
ALTER FUNCTION public.update_newsletter_subscriber_count SET search_path = '';

-- 23. calculate_issue_stats
ALTER FUNCTION public.calculate_issue_stats SET search_path = '';
