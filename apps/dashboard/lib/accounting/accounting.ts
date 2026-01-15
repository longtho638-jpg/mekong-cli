/**
 * Accounting Module for AgencyOS
 * ERPNext Parity: Chart of Accounts, Journal Entries, Ledgers
 */

import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type AccountType =
    | 'asset'
    | 'liability'
    | 'equity'
    | 'income'
    | 'expense';

export interface Account {
    id: string;
    tenantId: string;
    code: string;
    name: string;
    type: AccountType;
    parentId: string | null;
    isGroup: boolean;
    currency: string;
    balance: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface JournalEntry {
    id: string;
    tenantId: string;
    date: Date;
    reference: string;
    description: string;
    lines: JournalLine[];
    totalDebit: number;
    totalCredit: number;
    status: 'draft' | 'posted' | 'cancelled';
    createdBy: string;
    createdAt: Date;
}

export interface JournalLine {
    id: string;
    journalId: string;
    accountId: string;
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
    description?: string;
}

export interface TrialBalance {
    accounts: {
        id: string;
        code: string;
        name: string;
        type: AccountType;
        debit: number;
        credit: number;
    }[];
    totalDebit: number;
    totalCredit: number;
    asOfDate: Date;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 DEFAULT CHART OF ACCOUNTS (Agency Standard)
// ═══════════════════════════════════════════════════════════════════════════════

export const DEFAULT_CHART_OF_ACCOUNTS: Omit<Account, 'id' | 'tenantId' | 'balance' | 'createdAt' | 'updatedAt'>[] = [
    // ASSETS (1xxx)
    { code: '1000', name: 'Assets', type: 'asset', parentId: null, isGroup: true, currency: 'USD' },
    { code: '1100', name: 'Cash & Bank', type: 'asset', parentId: '1000', isGroup: true, currency: 'USD' },
    { code: '1110', name: 'Cash on Hand', type: 'asset', parentId: '1100', isGroup: false, currency: 'USD' },
    { code: '1120', name: 'Bank Account', type: 'asset', parentId: '1100', isGroup: false, currency: 'USD' },
    { code: '1200', name: 'Accounts Receivable', type: 'asset', parentId: '1000', isGroup: false, currency: 'USD' },
    { code: '1300', name: 'Fixed Assets', type: 'asset', parentId: '1000', isGroup: true, currency: 'USD' },
    { code: '1310', name: 'Equipment', type: 'asset', parentId: '1300', isGroup: false, currency: 'USD' },
    { code: '1320', name: 'Software Licenses', type: 'asset', parentId: '1300', isGroup: false, currency: 'USD' },

    // LIABILITIES (2xxx)
    { code: '2000', name: 'Liabilities', type: 'liability', parentId: null, isGroup: true, currency: 'USD' },
    { code: '2100', name: 'Accounts Payable', type: 'liability', parentId: '2000', isGroup: false, currency: 'USD' },
    { code: '2200', name: 'Credit Card Payable', type: 'liability', parentId: '2000', isGroup: false, currency: 'USD' },
    { code: '2300', name: 'Taxes Payable', type: 'liability', parentId: '2000', isGroup: false, currency: 'USD' },
    { code: '2400', name: 'Deferred Revenue', type: 'liability', parentId: '2000', isGroup: false, currency: 'USD' },

    // EQUITY (3xxx)
    { code: '3000', name: 'Equity', type: 'equity', parentId: null, isGroup: true, currency: 'USD' },
    { code: '3100', name: 'Owner Equity', type: 'equity', parentId: '3000', isGroup: false, currency: 'USD' },
    { code: '3200', name: 'Retained Earnings', type: 'equity', parentId: '3000', isGroup: false, currency: 'USD' },

    // INCOME (4xxx)
    { code: '4000', name: 'Income', type: 'income', parentId: null, isGroup: true, currency: 'USD' },
    { code: '4100', name: 'Service Revenue', type: 'income', parentId: '4000', isGroup: true, currency: 'USD' },
    { code: '4110', name: 'Retainer Revenue', type: 'income', parentId: '4100', isGroup: false, currency: 'USD' },
    { code: '4120', name: 'Project Revenue', type: 'income', parentId: '4100', isGroup: false, currency: 'USD' },
    { code: '4130', name: 'Consulting Revenue', type: 'income', parentId: '4100', isGroup: false, currency: 'USD' },
    { code: '4200', name: 'SaaS Revenue', type: 'income', parentId: '4000', isGroup: true, currency: 'USD' },
    { code: '4210', name: 'Subscription Revenue', type: 'income', parentId: '4200', isGroup: false, currency: 'USD' },
    { code: '4220', name: 'Usage Revenue', type: 'income', parentId: '4200', isGroup: false, currency: 'USD' },

    // EXPENSES (5xxx)
    { code: '5000', name: 'Expenses', type: 'expense', parentId: null, isGroup: true, currency: 'USD' },
    { code: '5100', name: 'Operating Expenses', type: 'expense', parentId: '5000', isGroup: true, currency: 'USD' },
    { code: '5110', name: 'Salaries & Wages', type: 'expense', parentId: '5100', isGroup: false, currency: 'USD' },
    { code: '5120', name: 'Contractor Fees', type: 'expense', parentId: '5100', isGroup: false, currency: 'USD' },
    { code: '5130', name: 'Software Subscriptions', type: 'expense', parentId: '5100', isGroup: false, currency: 'USD' },
    { code: '5140', name: 'Office Rent', type: 'expense', parentId: '5100', isGroup: false, currency: 'USD' },
    { code: '5200', name: 'Marketing Expenses', type: 'expense', parentId: '5000', isGroup: true, currency: 'USD' },
    { code: '5210', name: 'Advertising', type: 'expense', parentId: '5200', isGroup: false, currency: 'USD' },
    { code: '5220', name: 'Content Production', type: 'expense', parentId: '5200', isGroup: false, currency: 'USD' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 🏢 ACCOUNTING SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export class AccountingService {
    private supabase;

    constructor() {
        this.supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_KEY!
        );
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // CHART OF ACCOUNTS
    // ─────────────────────────────────────────────────────────────────────────────

    async getChartOfAccounts(tenantId: string): Promise<Account[]> {
        const { data, error } = await this.supabase
            .from('accounts')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('code');

        if (error) throw new Error(`Failed to get chart of accounts: ${error.message}`);
        return (data || []).map(this.mapToAccount);
    }

    async createAccount(tenantId: string, account: Omit<Account, 'id' | 'tenantId' | 'balance' | 'createdAt' | 'updatedAt'>): Promise<Account> {
        const { data, error } = await this.supabase
            .from('accounts')
            .insert({
                tenant_id: tenantId,
                code: account.code,
                name: account.name,
                type: account.type,
                parent_id: account.parentId,
                is_group: account.isGroup,
                currency: account.currency,
                balance: 0,
            })
            .select()
            .single();

        if (error) throw new Error(`Failed to create account: ${error.message}`);
        return this.mapToAccount(data);
    }

    async initializeChartOfAccounts(tenantId: string): Promise<void> {
        // Check if already initialized
        const existing = await this.getChartOfAccounts(tenantId);
        if (existing.length > 0) return;

        // Create default accounts
        for (const account of DEFAULT_CHART_OF_ACCOUNTS) {
            await this.createAccount(tenantId, account);
        }
    }

    async getAccountBalance(tenantId: string, accountId: string): Promise<number> {
        const { data } = await this.supabase
            .from('accounts')
            .select('balance')
            .eq('tenant_id', tenantId)
            .eq('id', accountId)
            .single();

        return data?.balance || 0;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // JOURNAL ENTRIES
    // ─────────────────────────────────────────────────────────────────────────────

    async createJournalEntry(
        tenantId: string,
        entry: {
            date: Date;
            reference: string;
            description: string;
            lines: { accountId: string; debit: number; credit: number; description?: string }[];
        },
        createdBy: string
    ): Promise<JournalEntry> {
        // Validate: debits must equal credits
        const totalDebit = entry.lines.reduce((sum, l) => sum + l.debit, 0);
        const totalCredit = entry.lines.reduce((sum, l) => sum + l.credit, 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new Error(`Journal entry must balance: Debit ${totalDebit} ≠ Credit ${totalCredit}`);
        }

        // Create journal entry
        const { data: journal, error } = await this.supabase
            .from('journal_entries')
            .insert({
                tenant_id: tenantId,
                date: entry.date.toISOString(),
                reference: entry.reference,
                description: entry.description,
                total_debit: totalDebit,
                total_credit: totalCredit,
                status: 'draft',
                created_by: createdBy,
            })
            .select()
            .single();

        if (error) throw new Error(`Failed to create journal entry: ${error.message}`);

        // Create lines
        const lines: JournalLine[] = [];
        for (const line of entry.lines) {
            const { data: lineData } = await this.supabase
                .from('journal_lines')
                .insert({
                    journal_id: journal.id,
                    account_id: line.accountId,
                    debit: line.debit,
                    credit: line.credit,
                    description: line.description,
                })
                .select('*, accounts(code, name)')
                .single();

            if (lineData) {
                lines.push({
                    id: lineData.id,
                    journalId: journal.id,
                    accountId: lineData.account_id,
                    accountCode: lineData.accounts?.code || '',
                    accountName: lineData.accounts?.name || '',
                    debit: lineData.debit,
                    credit: lineData.credit,
                    description: lineData.description,
                });
            }
        }

        return {
            id: journal.id,
            tenantId,
            date: new Date(journal.date),
            reference: journal.reference,
            description: journal.description,
            lines,
            totalDebit,
            totalCredit,
            status: journal.status,
            createdBy: journal.created_by,
            createdAt: new Date(journal.created_at),
        };
    }

    async postJournalEntry(tenantId: string, journalId: string): Promise<void> {
        // Get journal with lines
        const { data: journal } = await this.supabase
            .from('journal_entries')
            .select('*, journal_lines(*)')
            .eq('id', journalId)
            .eq('tenant_id', tenantId)
            .single();

        if (!journal) throw new Error('Journal entry not found');
        if (journal.status !== 'draft') throw new Error('Only draft entries can be posted');

        // Update account balances
        for (const line of journal.journal_lines || []) {
            const adjustment = line.debit - line.credit;
            await this.supabase.rpc('adjust_account_balance', {
                p_account_id: line.account_id,
                p_adjustment: adjustment,
            });
        }

        // Mark as posted
        await this.supabase
            .from('journal_entries')
            .update({ status: 'posted' })
            .eq('id', journalId);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // REPORTS
    // ─────────────────────────────────────────────────────────────────────────────

    async getTrialBalance(tenantId: string, asOfDate: Date): Promise<TrialBalance> {
        const { data: accounts } = await this.supabase
            .from('accounts')
            .select('id, code, name, type, balance')
            .eq('tenant_id', tenantId)
            .eq('is_group', false)
            .order('code');

        const balances = (accounts || []).map(acc => {
            const isDebitNormal = ['asset', 'expense'].includes(acc.type);
            return {
                id: acc.id,
                code: acc.code,
                name: acc.name,
                type: acc.type as AccountType,
                debit: isDebitNormal && acc.balance > 0 ? acc.balance : (!isDebitNormal && acc.balance < 0 ? -acc.balance : 0),
                credit: !isDebitNormal && acc.balance > 0 ? acc.balance : (isDebitNormal && acc.balance < 0 ? -acc.balance : 0),
            };
        });

        return {
            accounts: balances,
            totalDebit: balances.reduce((sum, a) => sum + a.debit, 0),
            totalCredit: balances.reduce((sum, a) => sum + a.credit, 0),
            asOfDate,
        };
    }

    async getProfitAndLoss(tenantId: string, fromDate: Date, toDate: Date) {
        // Get income accounts
        const { data: income } = await this.supabase
            .from('accounts')
            .select('id, code, name, balance')
            .eq('tenant_id', tenantId)
            .eq('type', 'income')
            .eq('is_group', false);

        // Get expense accounts
        const { data: expenses } = await this.supabase
            .from('accounts')
            .select('id, code, name, balance')
            .eq('tenant_id', tenantId)
            .eq('type', 'expense')
            .eq('is_group', false);

        const totalIncome = (income || []).reduce((sum, acc) => sum + Math.abs(acc.balance), 0);
        const totalExpenses = (expenses || []).reduce((sum, acc) => sum + Math.abs(acc.balance), 0);

        return {
            income: income || [],
            expenses: expenses || [],
            totalIncome,
            totalExpenses,
            netProfit: totalIncome - totalExpenses,
            fromDate,
            toDate,
        };
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────────

    private mapToAccount(data: any): Account {
        return {
            id: data.id,
            tenantId: data.tenant_id,
            code: data.code,
            name: data.name,
            type: data.type,
            parentId: data.parent_id,
            isGroup: data.is_group,
            currency: data.currency,
            balance: data.balance || 0,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
        };
    }
}

// Factory function for lazy initialization
export function getAccountingService() {
    return new AccountingService();
}
