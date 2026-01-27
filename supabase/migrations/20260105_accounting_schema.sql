-- Accounting Schema for AgencyOS
-- ERPNext Parity: Chart of Accounts, Journal Entries, Ledgers

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ACCOUNTS (Chart of Accounts)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'income', 'expense')),
    parent_id UUID REFERENCES accounts(id),
    is_group BOOLEAN DEFAULT false,
    currency VARCHAR(3) DEFAULT 'USD',
    balance DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, code)
);

-- Enable RLS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "accounts_tenant_isolation" ON accounts
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "accounts_service_role" ON accounts
    FOR ALL USING (current_setting('role') = 'service_role');

-- Indexes
CREATE INDEX idx_accounts_tenant ON accounts(tenant_id);
CREATE INDEX idx_accounts_type ON accounts(tenant_id, type);
CREATE INDEX idx_accounts_parent ON accounts(parent_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- JOURNAL ENTRIES
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    reference VARCHAR(50),
    description TEXT,
    total_debit DECIMAL(15, 2) NOT NULL,
    total_credit DECIMAL(15, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'cancelled')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT journal_must_balance CHECK (ABS(total_debit - total_credit) < 0.01)
);

-- Enable RLS
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "journal_entries_tenant_isolation" ON journal_entries
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "journal_entries_service_role" ON journal_entries
    FOR ALL USING (current_setting('role') = 'service_role');

-- Indexes
CREATE INDEX idx_journal_tenant ON journal_entries(tenant_id);
CREATE INDEX idx_journal_date ON journal_entries(tenant_id, date);
CREATE INDEX idx_journal_status ON journal_entries(tenant_id, status);

-- ═══════════════════════════════════════════════════════════════════════════════
-- JOURNAL LINES
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS journal_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id),
    debit DECIMAL(15, 2) DEFAULT 0,
    credit DECIMAL(15, 2) DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT line_has_amount CHECK (debit > 0 OR credit > 0),
    CONSTRAINT line_single_side CHECK (NOT (debit > 0 AND credit > 0))
);

-- Enable RLS (inherits from journal_entries)
ALTER TABLE journal_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "journal_lines_via_journal" ON journal_lines
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM journal_entries je 
            WHERE je.id = journal_lines.journal_id 
            AND je.tenant_id = current_setting('app.current_tenant_id')::UUID
        )
    );

CREATE POLICY "journal_lines_service_role" ON journal_lines
    FOR ALL USING (current_setting('role') = 'service_role');

-- Indexes
CREATE INDEX idx_journal_lines_journal ON journal_lines(journal_id);
CREATE INDEX idx_journal_lines_account ON journal_lines(account_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- ACCOUNT BALANCE ADJUSTMENT FUNCTION
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION adjust_account_balance(
    p_account_id UUID,
    p_adjustment DECIMAL(15, 2)
) RETURNS VOID AS $$
BEGIN
    UPDATE accounts 
    SET balance = balance + p_adjustment,
        updated_at = NOW()
    WHERE id = p_account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════════
-- UPDATED_AT TRIGGER
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER accounts_updated_at
    BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER journal_entries_updated_at
    BEFORE UPDATE ON journal_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════════
-- VIEWS FOR REPORTING
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW trial_balance_view WITH (security_invoker = true) AS
SELECT 
    a.id,
    a.tenant_id,
    a.code,
    a.name,
    a.type,
    CASE WHEN a.type IN ('asset', 'expense') AND a.balance > 0 THEN a.balance
         WHEN a.type IN ('liability', 'income', 'equity') AND a.balance < 0 THEN -a.balance
         ELSE 0 END AS debit,
    CASE WHEN a.type IN ('liability', 'income', 'equity') AND a.balance > 0 THEN a.balance
         WHEN a.type IN ('asset', 'expense') AND a.balance < 0 THEN -a.balance
         ELSE 0 END AS credit
FROM accounts a
WHERE a.is_group = false;

CREATE OR REPLACE VIEW income_statement_view WITH (security_invoker = true) AS
SELECT 
    a.tenant_id,
    a.type,
    a.code,
    a.name,
    ABS(a.balance) AS amount
FROM accounts a
WHERE a.type IN ('income', 'expense')
AND a.is_group = false;
COMMIT;
