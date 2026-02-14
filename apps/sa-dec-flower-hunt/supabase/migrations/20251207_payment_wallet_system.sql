-- Payment & Wallet System Tables

-- Transactions table (payment records)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  payment_method TEXT NOT NULL, -- 'vnpay', 'momo', 'bank_transfer'
  vnpay_transaction_id TEXT,
  vnpay_response_code TEXT,
  vnpay_response_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Farmer wallets table
CREATE TABLE IF NOT EXISTS farmer_wallets (
  farmer_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  balance DECIMAL(12,2) DEFAULT 0 NOT NULL CHECK (balance >= 0),
  total_earned DECIMAL(12,2) DEFAULT 0 NOT NULL,
  total_withdrawn DECIMAL(12,2) DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wallet transactions table (ledger)
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'credit' (money in), 'debit' (money out)
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  order_id UUID REFERENCES orders(id),
  withdrawal_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Withdrawal requests table
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  bank_account_number TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_holder_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'completed', 'rejected'
  admin_note TEXT,
  processed_by UUID REFERENCES profiles(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_farmer_id ON wallet_transactions(farmer_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_farmer_id ON withdrawal_requests(farmer_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);

-- Add order_id column to wallet_transactions if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'wallet_transactions' AND column_name = 'order_id'
  ) THEN
    ALTER TABLE wallet_transactions ADD COLUMN order_id UUID REFERENCES orders(id);
  END IF;
END $$;

-- Add withdrawal_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'wallet_transactions' AND column_name = 'withdrawal_id'
  ) THEN
    ALTER TABLE wallet_transactions ADD COLUMN withdrawal_id UUID;
  END IF;
END $$;

-- Comments for documentation
COMMENT ON TABLE transactions IS 'Records all payment transactions processed through VNPay, Momo, etc.';
COMMENT ON TABLE farmer_wallets IS 'Tracks farmer earnings and available balance for withdrawal';
COMMENT ON TABLE wallet_transactions IS 'Ledger of all wallet credits (earnings) and debits (withdrawals)';
COMMENT ON TABLE withdrawal_requests IS 'Farmer requests to withdraw balance to their bank account';
