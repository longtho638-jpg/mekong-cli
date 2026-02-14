-- Fix RLS: Allow farmers to view items they sold
BEGIN;

DROP POLICY IF EXISTS "Farmers can view sold items" ON order_items;
CREATE POLICY "Farmers can view sold items" ON order_items 
FOR SELECT 
USING (auth.uid() = seller_id);

COMMIT;
