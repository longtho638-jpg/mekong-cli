-- =====================================================
-- AG CREDITS SYSTEM (TÍCH SẢN)
-- Version: 2.0 (Refactored)
-- Created: 2024-12-26
-- Description: Internal credit system for affiliate commissions
-- Exchange Rate: 1 AGC = $1 USD
-- =====================================================

-- ===================
-- TABLE: ag_credits
-- User credit balances
-- ===================
CREATE TABLE IF NOT EXISTS ag_credits (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Balance
    balance DECIMAL(12,2) DEFAULT 0 NOT NULL,
    
    -- Lifetime stats
    lifetime_earned DECIMAL(12,2) DEFAULT 0 NOT NULL,
    lifetime_spent DECIMAL(12,2) DEFAULT 0 NOT NULL,
    lifetime_transferred_out DECIMAL(12,2) DEFAULT 0 NOT NULL,
    lifetime_transferred_in DECIMAL(12,2) DEFAULT 0 NOT NULL,
    
    -- Rank
    rank TEXT DEFAULT 'chien_binh' NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT positive_balance CHECK (balance >= 0),
    CONSTRAINT positive_stats CHECK (
        lifetime_earned >= 0 AND 
        lifetime_spent >= 0 AND 
        lifetime_transferred_out >= 0 AND 
        lifetime_transferred_in >= 0
    ),
    CONSTRAINT valid_rank CHECK (rank IN ('chien_binh', 'tuong_quan', 'thong_soai', 'nguyen_soai'))
);

COMMENT ON TABLE ag_credits IS 'User credit balances (1 AGC = $1 USD)';
COMMENT ON COLUMN ag_credits.rank IS 'User tier: chien_binh → tuong_quan → thong_soai → nguyen_soai';

-- ===================
-- TABLE: ag_transactions
-- All credit movements
-- ===================
CREATE TABLE IF NOT EXISTS ag_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Parties
    from_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    to_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Amount
    amount DECIMAL(12,2) NOT NULL,
    
    -- Type and status
    type TEXT NOT NULL,
    status TEXT DEFAULT 'completed' NOT NULL,
    
    -- Metadata
    description TEXT,
    reference_id TEXT,
    metadata JSONB DEFAULT '{}' NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT positive_amount CHECK (amount > 0),
    CONSTRAINT valid_type CHECK (type IN ('earn', 'spend', 'transfer', 'bonus', 'refund', 'cashout')),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    CONSTRAINT has_party CHECK (from_user_id IS NOT NULL OR to_user_id IS NOT NULL)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_from ON ag_transactions(from_user_id) WHERE from_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_to ON ag_transactions(to_user_id) WHERE to_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_type ON ag_transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON ag_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_ref ON ag_transactions(reference_id) WHERE reference_id IS NOT NULL;

COMMENT ON TABLE ag_transactions IS 'Immutable ledger of all credit movements';

-- ===================
-- TABLE: ag_payouts
-- Cash-out requests
-- ===================
CREATE TABLE IF NOT EXISTS ag_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Amounts
    amount DECIMAL(12,2) NOT NULL,
    fee DECIMAL(12,2) DEFAULT 0 NOT NULL,
    net_amount DECIMAL(12,2) NOT NULL,
    
    -- Payment details
    method TEXT NOT NULL,
    payout_details JSONB NOT NULL,
    
    -- Status
    status TEXT DEFAULT 'pending' NOT NULL,
    transaction_ref TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    processed_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT min_payout CHECK (amount >= 100),  -- $100 minimum
    CONSTRAINT valid_fee CHECK (fee >= 0),
    CONSTRAINT valid_net CHECK (net_amount = amount - fee AND net_amount > 0),
    CONSTRAINT valid_method CHECK (method IN ('paypal', 'wise', 'bank', 'crypto')),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_payouts_user ON ag_payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON ag_payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_pending ON ag_payouts(created_at) WHERE status IN ('pending', 'processing');

COMMENT ON TABLE ag_payouts IS 'Cash-out requests ($100 min, 5% fee)';

-- ===================
-- TABLE: ag_ranks
-- Rank definitions
-- ===================
CREATE TABLE IF NOT EXISTS ag_ranks (
    rank TEXT PRIMARY KEY,
    min_lifetime_earned DECIMAL(12,2) NOT NULL,
    bonus_percentage DECIMAL(5,2) DEFAULT 0 NOT NULL,
    display_name TEXT NOT NULL,
    emoji TEXT NOT NULL,
    perks JSONB DEFAULT '[]' NOT NULL
);

COMMENT ON TABLE ag_ranks IS 'Rank tier definitions with bonus percentages';

-- Insert/update rank definitions
INSERT INTO ag_ranks (rank, min_lifetime_earned, bonus_percentage, display_name, emoji, perks) VALUES
    ('chien_binh', 0, 0, 'Chiến Binh', '🥉', '["Basic access"]'),
    ('tuong_quan', 500, 5, 'Tướng Quân', '🥈', '["5% bonus on earn", "Priority support"]'),
    ('thong_soai', 2000, 10, 'Thống Soái', '🥇', '["10% bonus on earn", "Badge", "Early access"]'),
    ('nguyen_soai', 10000, 15, 'Nguyên Soái', '👑', '["15% bonus", "Custom page", "VIP support", "Exclusive events"]')
ON CONFLICT (rank) DO UPDATE SET
    min_lifetime_earned = EXCLUDED.min_lifetime_earned,
    bonus_percentage = EXCLUDED.bonus_percentage,
    display_name = EXCLUDED.display_name,
    emoji = EXCLUDED.emoji,
    perks = EXCLUDED.perks;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Auto-update rank based on earnings (TRIGGER)
CREATE OR REPLACE FUNCTION update_user_rank()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Find highest qualifying rank
    NEW.rank := COALESCE(
        (SELECT rank FROM ag_ranks 
         WHERE min_lifetime_earned <= NEW.lifetime_earned 
         ORDER BY min_lifetime_earned DESC 
         LIMIT 1),
        'chien_binh'
    );
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_rank ON ag_credits;
CREATE TRIGGER trigger_update_rank
    BEFORE UPDATE ON ag_credits
    FOR EACH ROW
    WHEN (OLD.lifetime_earned IS DISTINCT FROM NEW.lifetime_earned)
    EXECUTE FUNCTION update_user_rank();

-- Add credits with bonus calculation
CREATE OR REPLACE FUNCTION add_ag_credits(
    p_user_id UUID,
    p_amount DECIMAL,
    p_type TEXT,
    p_description TEXT DEFAULT NULL,
    p_reference_id TEXT DEFAULT NULL
)
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_bonus_pct DECIMAL;
    v_total_amount DECIMAL;
BEGIN
    -- Validate type
    IF p_type NOT IN ('earn', 'bonus', 'refund') THEN
        RAISE EXCEPTION 'Invalid type for adding credits: %', p_type;
    END IF;
    
    -- Get user's bonus percentage
    SELECT COALESCE(r.bonus_percentage, 0) INTO v_bonus_pct
    FROM ag_credits c
    LEFT JOIN ag_ranks r ON c.rank = r.rank
    WHERE c.user_id = p_user_id;
    
    -- Calculate total with bonus (only for 'earn' type)
    IF p_type = 'earn' THEN
        v_total_amount := p_amount * (1 + COALESCE(v_bonus_pct, 0) / 100);
    ELSE
        v_total_amount := p_amount;
    END IF;
    
    -- Upsert credits
    INSERT INTO ag_credits (user_id, balance, lifetime_earned)
    VALUES (p_user_id, v_total_amount, v_total_amount)
    ON CONFLICT (user_id) DO UPDATE SET
        balance = ag_credits.balance + v_total_amount,
        lifetime_earned = ag_credits.lifetime_earned + v_total_amount,
        updated_at = NOW();
    
    -- Record transaction
    INSERT INTO ag_transactions (from_user_id, to_user_id, amount, type, description, reference_id)
    VALUES (NULL, p_user_id, v_total_amount, p_type, p_description, p_reference_id);
    
    RETURN v_total_amount;
END;
$$;

COMMENT ON FUNCTION add_ag_credits IS 'Add credits with automatic rank bonus calculation';

-- Transfer credits P2P
CREATE OR REPLACE FUNCTION transfer_ag_credits(
    p_from_user UUID,
    p_to_user UUID,
    p_amount DECIMAL,
    p_description TEXT DEFAULT 'P2P Transfer'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_from_balance DECIMAL;
BEGIN
    -- Validate different users
    IF p_from_user = p_to_user THEN
        RAISE EXCEPTION 'Cannot transfer to yourself';
    END IF;
    
    -- Check sender balance
    SELECT balance INTO v_from_balance
    FROM ag_credits WHERE user_id = p_from_user
    FOR UPDATE;  -- Lock row for transaction
    
    IF v_from_balance IS NULL THEN
        RAISE EXCEPTION 'Sender account not found';
    END IF;
    
    IF v_from_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance: % available, % requested', v_from_balance, p_amount;
    END IF;
    
    -- Deduct from sender
    UPDATE ag_credits SET
        balance = balance - p_amount,
        lifetime_transferred_out = lifetime_transferred_out + p_amount,
        updated_at = NOW()
    WHERE user_id = p_from_user;
    
    -- Add to receiver (upsert)
    INSERT INTO ag_credits (user_id, balance, lifetime_transferred_in)
    VALUES (p_to_user, p_amount, p_amount)
    ON CONFLICT (user_id) DO UPDATE SET
        balance = ag_credits.balance + p_amount,
        lifetime_transferred_in = ag_credits.lifetime_transferred_in + p_amount,
        updated_at = NOW();
    
    -- Record transaction
    INSERT INTO ag_transactions (from_user_id, to_user_id, amount, type, description)
    VALUES (p_from_user, p_to_user, p_amount, 'transfer', p_description);
    
    RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION transfer_ag_credits IS 'Transfer credits between users (atomic transaction)';

-- Spend credits (for purchases)
CREATE OR REPLACE FUNCTION spend_ag_credits(
    p_user_id UUID,
    p_amount DECIMAL,
    p_description TEXT,
    p_reference_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_balance DECIMAL;
BEGIN
    -- Check balance with lock
    SELECT balance INTO v_balance
    FROM ag_credits WHERE user_id = p_user_id
    FOR UPDATE;
    
    IF v_balance IS NULL THEN
        RAISE EXCEPTION 'Account not found';
    END IF;
    
    IF v_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance: % available, % requested', v_balance, p_amount;
    END IF;
    
    -- Deduct
    UPDATE ag_credits SET
        balance = balance - p_amount,
        lifetime_spent = lifetime_spent + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Record transaction
    INSERT INTO ag_transactions (from_user_id, to_user_id, amount, type, description, reference_id)
    VALUES (p_user_id, NULL, p_amount, 'spend', p_description, p_reference_id);
    
    RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION spend_ag_credits IS 'Spend credits on purchases (atomic transaction)';

-- Get user wallet summary
CREATE OR REPLACE FUNCTION get_wallet_summary(p_user_id UUID)
RETURNS TABLE (
    balance DECIMAL,
    lifetime_earned DECIMAL,
    lifetime_spent DECIMAL,
    rank TEXT,
    rank_display TEXT,
    rank_emoji TEXT,
    bonus_percentage DECIMAL,
    next_rank TEXT,
    next_rank_threshold DECIMAL,
    progress_to_next DECIMAL
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT 
        c.balance,
        c.lifetime_earned,
        c.lifetime_spent,
        c.rank,
        r.display_name,
        r.emoji,
        r.bonus_percentage,
        nr.rank,
        nr.min_lifetime_earned,
        CASE 
            WHEN nr.min_lifetime_earned IS NOT NULL 
            THEN LEAST(100, (c.lifetime_earned / nr.min_lifetime_earned) * 100)
            ELSE 100
        END
    FROM ag_credits c
    JOIN ag_ranks r ON c.rank = r.rank
    LEFT JOIN ag_ranks nr ON nr.min_lifetime_earned = (
        SELECT MIN(min_lifetime_earned) FROM ag_ranks 
        WHERE min_lifetime_earned > c.lifetime_earned
    )
    WHERE c.user_id = p_user_id;
$$;

COMMENT ON FUNCTION get_wallet_summary IS 'Get user wallet with rank progress info';

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE ag_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE ag_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ag_payouts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies safely
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users view own credits" ON ag_credits;
    DROP POLICY IF EXISTS "Users view own transactions" ON ag_transactions;
    DROP POLICY IF EXISTS "Users view own payouts" ON ag_payouts;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Users can view their own credits
CREATE POLICY "Users view own credits" ON ag_credits
    FOR SELECT USING (auth.uid() = user_id);

-- Users can view their own transactions (sent or received)
CREATE POLICY "Users view own transactions" ON ag_transactions
    FOR SELECT USING (
        auth.uid() = from_user_id OR 
        auth.uid() = to_user_id OR
        auth.role() = 'service_role'
    );

-- Users can view their own payouts
CREATE POLICY "Users view own payouts" ON ag_payouts
    FOR SELECT USING (auth.uid() = user_id);

-- Users can request payouts
CREATE POLICY "Users can request payouts" ON ag_payouts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- COMPLETE
-- =====================================================
