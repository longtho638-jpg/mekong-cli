-- Add PayOS-specific columns to transactions table

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS payos_order_code BIGINT,
ADD COLUMN IF NOT EXISTS payos_payment_link_id TEXT,
ADD COLUMN IF NOT EXISTS payos_response_code TEXT,
ADD COLUMN IF NOT EXISTS payos_response_message TEXT,
ADD COLUMN IF NOT EXISTS payos_transaction_datetime TEXT,
ADD COLUMN IF NOT EXISTS payos_reference TEXT;

-- Create index for PayOS order code lookups
CREATE INDEX IF NOT EXISTS idx_transactions_payos_order_code ON transactions(payos_order_code);

-- Comments
COMMENT ON COLUMN transactions.payos_order_code IS 'PayOS unique order code (timestamp-based)';
COMMENT ON COLUMN transactions.payos_payment_link_id IS 'PayOS payment link identifier';
COMMENT ON COLUMN transactions.payos_reference IS 'PayOS transaction reference number';
