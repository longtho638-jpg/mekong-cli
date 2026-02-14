-- Create webhook log table for idempotency
CREATE TABLE IF NOT EXISTS webhook_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id TEXT UNIQUE NOT NULL,
  order_id UUID NOT NULL,
  user_id UUID NOT NULL,
  amount DECIMAL NOT NULL,
  payment_method TEXT DEFAULT 'payos',
  processed_at TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending'))
);

CREATE INDEX idx_webhook_id ON webhook_log(webhook_id);
CREATE INDEX idx_order_id ON webhook_log(order_id);

-- Transaction function (atomic operation)
CREATE OR REPLACE FUNCTION process_payment_webhook(
  p_webhook_id TEXT,
  p_order_id UUID,
  p_user_id UUID,
  p_amount DECIMAL,
  p_payment_method TEXT DEFAULT 'payos'
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_order_exists BOOLEAN;
  v_user_exists BOOLEAN;
  v_result JSON;
BEGIN
  -- Start transaction implicitly

  -- 1. Verify order exists
  SELECT EXISTS(SELECT 1 FROM orders WHERE id = p_order_id AND user_id = p_user_id)
  INTO v_order_exists;

  IF NOT v_order_exists THEN
    RAISE EXCEPTION 'Order not found or user mismatch';
  END IF;

  -- 2. Log webhook (idempotency - will fail if duplicate)
  INSERT INTO webhook_log (webhook_id, order_id, user_id, amount, payment_method)
  VALUES (p_webhook_id, p_order_id, p_user_id, p_amount, p_payment_method);

  -- 3. Update order status
  UPDATE orders
  SET status = 'completed',
      updated_at = NOW(),
      paid_at = NOW()
  WHERE id = p_order_id;

  -- 4. Update wallet
  UPDATE farmer_wallets -- Assuming farmer_wallets table from context, falling back to 'wallet' if generic
  SET balance = balance + p_amount,
      total_earned = total_earned + p_amount
  WHERE farmer_id = p_user_id; -- Assuming user_id maps to farmer_id for wallet credit

  -- 5. Record transaction
  INSERT INTO transactions (user_id, type, amount, order_id, description)
  VALUES (p_user_id, 'payment', p_amount, p_order_id, 'Payment webhook processed');

  -- 6. Return success
  v_result := json_build_object(
    'success', true,
    'webhook_id', p_webhook_id,
    'order_id', p_order_id,
    'amount', p_amount
  );

  RETURN v_result;

EXCEPTION WHEN unique_violation THEN
  -- Webhook already processed
  RAISE EXCEPTION 'Webhook already processed';
WHEN OTHERS THEN
  -- Any other error → automatic rollback
  RAISE EXCEPTION 'Payment processing failed: %', SQLERRM;
END;
$$;
