-- 🚑 EMERGENCY FIX: Add missing columns to existing tables
-- Run this to sync your existing DB with the new code.

-- 1. Fix Orders Table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS shipping_address JSONB DEFAULT '{}'::jsonb;

-- 2. Validate
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'shipping_address'
    ) THEN
        RAISE EXCEPTION 'Column shipping_address was NOT created!';
    END IF;
END $$;

SELECT 'Fix Complete: shipping_address added' as status;
