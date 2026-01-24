-- Migration 002: Affiliate System
-- Description: Create tables for affiliate tracking and commission management
-- Author: System
-- Date: 2026-01-24

-- Affiliates table
CREATE TABLE IF NOT EXISTS affiliates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    affiliate_code VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'banned')),
    commission_rate DECIMAL(5,2) NOT NULL DEFAULT 20.00 CHECK (commission_rate >= 0 AND commission_rate <= 100),
    payment_method VARCHAR(50) CHECK (payment_method IN ('stripe', 'paypal', 'bank_transfer', 'crypto')),
    payment_details JSONB DEFAULT '{}'::jsonb,
    total_referrals INTEGER NOT NULL DEFAULT 0 CHECK (total_referrals >= 0),
    total_earnings_cents INTEGER NOT NULL DEFAULT 0 CHECK (total_earnings_cents >= 0),
    paid_out_cents INTEGER NOT NULL DEFAULT 0 CHECK (paid_out_cents >= 0),
    pending_payout_cents INTEGER NOT NULL DEFAULT 0 CHECK (pending_payout_cents >= 0),
    approved_at TIMESTAMP WITH TIME ZONE,
    suspended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT valid_payout_amounts CHECK (paid_out_cents + pending_payout_cents <= total_earnings_cents)
);

-- Create indexes for affiliates
CREATE INDEX idx_affiliates_user_id ON affiliates(user_id);
CREATE INDEX idx_affiliates_affiliate_code ON affiliates(affiliate_code);
CREATE INDEX idx_affiliates_status ON affiliates(status);
CREATE INDEX idx_affiliates_created_at ON affiliates(created_at DESC);

-- Affiliate referrals table
CREATE TABLE IF NOT EXISTS affiliate_referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    license_id UUID REFERENCES licenses(id) ON DELETE SET NULL,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    referral_source VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(255),
    utm_content VARCHAR(255),
    utm_term VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'qualified', 'converted', 'cancelled', 'refunded')),
    qualified_at TIMESTAMP WITH TIME ZONE,
    converted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(affiliate_id, referred_user_id)
);

-- Create indexes for affiliate_referrals
CREATE INDEX idx_affiliate_referrals_affiliate_id ON affiliate_referrals(affiliate_id);
CREATE INDEX idx_affiliate_referrals_referred_user_id ON affiliate_referrals(referred_user_id);
CREATE INDEX idx_affiliate_referrals_license_id ON affiliate_referrals(license_id);
CREATE INDEX idx_affiliate_referrals_status ON affiliate_referrals(status);
CREATE INDEX idx_affiliate_referrals_created_at ON affiliate_referrals(created_at DESC);
CREATE INDEX idx_affiliate_referrals_utm_campaign ON affiliate_referrals(utm_campaign);

-- Affiliate commissions table
CREATE TABLE IF NOT EXISTS affiliate_commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
    referral_id UUID NOT NULL REFERENCES affiliate_referrals(id) ON DELETE CASCADE,
    payment_transaction_id UUID REFERENCES payment_transactions(id) ON DELETE SET NULL,
    commission_type VARCHAR(50) NOT NULL CHECK (commission_type IN ('initial', 'recurring', 'bonus', 'adjustment')),
    amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
    commission_rate DECIMAL(5,2) NOT NULL CHECK (commission_rate >= 0 AND commission_rate <= 100),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled', 'disputed')),
    approved_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    payout_id UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for affiliate_commissions
CREATE INDEX idx_affiliate_commissions_affiliate_id ON affiliate_commissions(affiliate_id);
CREATE INDEX idx_affiliate_commissions_referral_id ON affiliate_commissions(referral_id);
CREATE INDEX idx_affiliate_commissions_payment_transaction_id ON affiliate_commissions(payment_transaction_id);
CREATE INDEX idx_affiliate_commissions_status ON affiliate_commissions(status);
CREATE INDEX idx_affiliate_commissions_commission_type ON affiliate_commissions(commission_type);
CREATE INDEX idx_affiliate_commissions_created_at ON affiliate_commissions(created_at DESC);
CREATE INDEX idx_affiliate_commissions_payout_id ON affiliate_commissions(payout_id);

-- Affiliate payouts table
CREATE TABLE IF NOT EXISTS affiliate_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('stripe', 'paypal', 'bank_transfer', 'crypto')),
    payment_reference VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    commission_count INTEGER NOT NULL DEFAULT 0 CHECK (commission_count >= 0),
    processed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    failed_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for affiliate_payouts
CREATE INDEX idx_affiliate_payouts_affiliate_id ON affiliate_payouts(affiliate_id);
CREATE INDEX idx_affiliate_payouts_status ON affiliate_payouts(status);
CREATE INDEX idx_affiliate_payouts_created_at ON affiliate_payouts(created_at DESC);
CREATE INDEX idx_affiliate_payouts_payment_reference ON affiliate_payouts(payment_reference);

-- Affiliate clicks table (for tracking click-through)
CREATE TABLE IF NOT EXISTS affiliate_clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    referrer_url TEXT,
    landing_page TEXT,
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(255),
    utm_content VARCHAR(255),
    utm_term VARCHAR(255),
    converted BOOLEAN NOT NULL DEFAULT false,
    referral_id UUID REFERENCES affiliate_referrals(id) ON DELETE SET NULL,
    clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for affiliate_clicks
CREATE INDEX idx_affiliate_clicks_affiliate_id ON affiliate_clicks(affiliate_id);
CREATE INDEX idx_affiliate_clicks_clicked_at ON affiliate_clicks(clicked_at DESC);
CREATE INDEX idx_affiliate_clicks_converted ON affiliate_clicks(converted);
CREATE INDEX idx_affiliate_clicks_referral_id ON affiliate_clicks(referral_id);
CREATE INDEX idx_affiliate_clicks_utm_campaign ON affiliate_clicks(utm_campaign);

-- Create triggers for updated_at
CREATE TRIGGER update_affiliates_updated_at BEFORE UPDATE ON affiliates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliate_referrals_updated_at BEFORE UPDATE ON affiliate_referrals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliate_commissions_updated_at BEFORE UPDATE ON affiliate_commissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliate_payouts_updated_at BEFORE UPDATE ON affiliate_payouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update affiliate stats when referral status changes
CREATE OR REPLACE FUNCTION update_affiliate_referral_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update total_referrals count
    UPDATE affiliates
    SET total_referrals = (
        SELECT COUNT(*)
        FROM affiliate_referrals
        WHERE affiliate_id = NEW.affiliate_id
        AND status IN ('qualified', 'converted')
    )
    WHERE id = NEW.affiliate_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_affiliate_stats_on_referral
    AFTER INSERT OR UPDATE ON affiliate_referrals
    FOR EACH ROW
    EXECUTE FUNCTION update_affiliate_referral_stats();

-- Function to update affiliate earnings when commission changes
CREATE OR REPLACE FUNCTION update_affiliate_earnings()
RETURNS TRIGGER AS $$
BEGIN
    -- Update total_earnings and paid_out amounts
    UPDATE affiliates a
    SET
        total_earnings_cents = (
            SELECT COALESCE(SUM(amount_cents), 0)
            FROM affiliate_commissions
            WHERE affiliate_id = a.id
            AND status IN ('approved', 'paid')
        ),
        paid_out_cents = (
            SELECT COALESCE(SUM(amount_cents), 0)
            FROM affiliate_commissions
            WHERE affiliate_id = a.id
            AND status = 'paid'
        ),
        pending_payout_cents = (
            SELECT COALESCE(SUM(amount_cents), 0)
            FROM affiliate_commissions
            WHERE affiliate_id = a.id
            AND status = 'approved'
        )
    WHERE id = NEW.affiliate_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_affiliate_earnings_on_commission
    AFTER INSERT OR UPDATE ON affiliate_commissions
    FOR EACH ROW
    EXECUTE FUNCTION update_affiliate_earnings();

-- Comments for documentation
COMMENT ON TABLE affiliates IS 'Affiliate partner accounts and settings';
COMMENT ON TABLE affiliate_referrals IS 'Tracked referrals from affiliates';
COMMENT ON TABLE affiliate_commissions IS 'Commission records for affiliate referrals';
COMMENT ON TABLE affiliate_payouts IS 'Payout batches to affiliates';
COMMENT ON TABLE affiliate_clicks IS 'Click tracking for affiliate links';
