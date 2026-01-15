/**
 * React Hooks for Accounting Module
 * Wire UI to API endpoints
 */

import { useState, useEffect, useCallback } from 'react';
import type { Account, JournalEntry, TrialBalance } from '@/lib/accounting';

const API_BASE = '/api/accounting';

// ═══════════════════════════════════════════════════════════════════════════════
// useChartOfAccounts
// ═══════════════════════════════════════════════════════════════════════════════

export function useChartOfAccounts(tenantId: string | null) {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAccounts = useCallback(async () => {
        if (!tenantId) return;

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}?tenantId=${tenantId}&action=chart`);
            const data = await res.json();

            if (data.success) {
                setAccounts(data.data);
                setError(null);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to fetch chart of accounts');
        } finally {
            setLoading(false);
        }
    }, [tenantId]);

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    const initializeChart = async () => {
        if (!tenantId) return;

        try {
            const res = await fetch(API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId, action: 'initialize' }),
            });
            const data = await res.json();
            if (data.success) {
                await fetchAccounts();
            }
            return data;
        } catch (err) {
            return { success: false, error: 'Failed to initialize' };
        }
    };

    const createAccount = async (account: Partial<Account>) => {
        if (!tenantId) return;

        try {
            const res = await fetch(API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId, action: 'create-account', account }),
            });
            const data = await res.json();
            if (data.success) {
                await fetchAccounts();
            }
            return data;
        } catch (err) {
            return { success: false, error: 'Failed to create account' };
        }
    };

    return {
        accounts,
        loading,
        error,
        refresh: fetchAccounts,
        initializeChart,
        createAccount,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// useTrialBalance
// ═══════════════════════════════════════════════════════════════════════════════

export function useTrialBalance(tenantId: string | null) {
    const [data, setData] = useState<TrialBalance | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTrialBalance = useCallback(async () => {
        if (!tenantId) return;

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}?tenantId=${tenantId}&action=trial-balance`);
            const result = await res.json();

            if (result.success) {
                setData(result.data);
                setError(null);
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError('Failed to fetch trial balance');
        } finally {
            setLoading(false);
        }
    }, [tenantId]);

    useEffect(() => {
        fetchTrialBalance();
    }, [fetchTrialBalance]);

    return { data, loading, error, refresh: fetchTrialBalance };
}

// ═══════════════════════════════════════════════════════════════════════════════
// useProfitAndLoss
// ═══════════════════════════════════════════════════════════════════════════════

interface PnLData {
    income: { code: string; name: string; balance: number }[];
    expenses: { code: string; name: string; balance: number }[];
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
}

export function useProfitAndLoss(tenantId: string | null, fromDate?: Date, toDate?: Date) {
    const [data, setData] = useState<PnLData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPnL = useCallback(async () => {
        if (!tenantId) return;

        setLoading(true);
        try {
            let url = `${API_BASE}?tenantId=${tenantId}&action=pnl`;
            if (fromDate) url += `&from=${fromDate.toISOString()}`;
            if (toDate) url += `&to=${toDate.toISOString()}`;

            const res = await fetch(url);
            const result = await res.json();

            if (result.success) {
                setData(result.data);
                setError(null);
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError('Failed to fetch P&L');
        } finally {
            setLoading(false);
        }
    }, [tenantId, fromDate, toDate]);

    useEffect(() => {
        fetchPnL();
    }, [fetchPnL]);

    return { data, loading, error, refresh: fetchPnL };
}

// ═══════════════════════════════════════════════════════════════════════════════
// useJournalEntry
// ═══════════════════════════════════════════════════════════════════════════════

export function useJournalEntry(tenantId: string | null, userId: string | null) {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createJournal = async (entry: {
        date: Date;
        reference: string;
        description: string;
        lines: { accountId: string; debit: number; credit: number; description?: string }[];
    }) => {
        if (!tenantId || !userId) {
            return { success: false, error: 'Missing tenantId or userId' };
        }

        setSubmitting(true);
        try {
            const res = await fetch(API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenantId,
                    action: 'create-journal',
                    date: entry.date.toISOString(),
                    reference: entry.reference,
                    description: entry.description,
                    lines: entry.lines,
                    userId,
                }),
            });
            const data = await res.json();
            setError(data.success ? null : data.error);
            return data;
        } catch (err) {
            const errorMsg = 'Failed to create journal entry';
            setError(errorMsg);
            return { success: false, error: errorMsg };
        } finally {
            setSubmitting(false);
        }
    };

    const postJournal = async (journalId: string) => {
        if (!tenantId) return { success: false, error: 'Missing tenantId' };

        setSubmitting(true);
        try {
            const res = await fetch(API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId, action: 'post-journal', journalId }),
            });
            const data = await res.json();
            setError(data.success ? null : data.error);
            return data;
        } catch (err) {
            const errorMsg = 'Failed to post journal entry';
            setError(errorMsg);
            return { success: false, error: errorMsg };
        } finally {
            setSubmitting(false);
        }
    };

    return { createJournal, postJournal, submitting, error };
}
