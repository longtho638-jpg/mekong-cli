/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useInvoices } from './useInvoices';

/**
 * 🏦 Bank Reconciliation Hook
 * 
 * Inspired by ERPNext Accounting Bank Reconciliation
 * Match bank transactions with invoices
 */

export interface BankTransaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: 'credit' | 'debit';
    reference?: string;
    status: 'unmatched' | 'matched' | 'ignored';
    matchedInvoiceId?: string;
    importedAt: string;
}

export interface ReconciliationMatch {
    transactionId: string;
    invoiceId: string;
    confidence: number;
    matchType: 'exact' | 'amount' | 'date' | 'reference' | 'manual';
}

export interface ReconciliationSummary {
    totalTransactions: number;
    matched: number;
    unmatched: number;
    ignored: number;
    matchRate: number;
    unmatchedAmount: number;
}

export function useBankReconciliation() {
    const [transactions, setTransactions] = useState<BankTransaction[]>([]);
    const [matches, setMatches] = useState<ReconciliationMatch[]>([]);
    const [loading, setLoading] = useState(false);
    const { invoices } = useInvoices();

    // Auto-match transactions with invoices
    const autoMatch = useCallback(() => {
        const newMatches: ReconciliationMatch[] = [];
        const updatedTransactions = [...transactions];

        transactions.forEach((tx, txIndex) => {
            if (tx.status !== 'unmatched') return;

            // Try to find matching invoice
            invoices.forEach(invoice => {
                // Exact amount match
                if (Math.abs(invoice.total - tx.amount) < 0.01 && tx.type === 'credit') {
                    const existingMatch = newMatches.find(m => m.invoiceId === invoice.id);
                    if (!existingMatch) {
                        newMatches.push({
                            transactionId: tx.id,
                            invoiceId: invoice.id,
                            confidence: 0.95,
                            matchType: 'exact',
                        });
                        updatedTransactions[txIndex] = {
                            ...tx,
                            status: 'matched',
                            matchedInvoiceId: invoice.id,
                        };
                    }
                    return;
                }

                // Reference match (invoice number in description)
                if (tx.description.includes(invoice.id.slice(0, 8))) {
                    const existingMatch = newMatches.find(m => m.invoiceId === invoice.id);
                    if (!existingMatch) {
                        newMatches.push({
                            transactionId: tx.id,
                            invoiceId: invoice.id,
                            confidence: 0.85,
                            matchType: 'reference',
                        });
                        updatedTransactions[txIndex] = {
                            ...tx,
                            status: 'matched',
                            matchedInvoiceId: invoice.id,
                        };
                    }
                }
            });
        });

        setMatches(prev => [...prev, ...newMatches]);
        setTransactions(updatedTransactions);
        return newMatches;
    }, [transactions, invoices]);

    // Manual match
    const manualMatch = useCallback((transactionId: string, invoiceId: string) => {
        const match: ReconciliationMatch = {
            transactionId,
            invoiceId,
            confidence: 1.0,
            matchType: 'manual',
        };

        setMatches(prev => [...prev, match]);
        setTransactions(prev => prev.map(tx =>
            tx.id === transactionId
                ? { ...tx, status: 'matched', matchedInvoiceId: invoiceId }
                : tx
        ));
    }, []);

    // Unmatch transaction
    const unmatch = useCallback((transactionId: string) => {
        setMatches(prev => prev.filter(m => m.transactionId !== transactionId));
        setTransactions(prev => prev.map(tx =>
            tx.id === transactionId
                ? { ...tx, status: 'unmatched', matchedInvoiceId: undefined }
                : tx
        ));
    }, []);

    // Ignore transaction
    const ignoreTransaction = useCallback((transactionId: string) => {
        setTransactions(prev => prev.map(tx =>
            tx.id === transactionId
                ? { ...tx, status: 'ignored' }
                : tx
        ));
    }, []);

    // Import transactions (mock - would connect to bank API)
    const importTransactions = useCallback(async (bankData: Partial<BankTransaction>[]) => {
        setLoading(true);
        try {
            const imported: BankTransaction[] = bankData.map((t, i) => ({
                id: crypto.randomUUID(),
                date: t.date || new Date().toISOString(),
                description: t.description || '',
                amount: t.amount || 0,
                type: t.type || 'credit',
                reference: t.reference,
                status: 'unmatched',
                importedAt: new Date().toISOString(),
            }));

            setTransactions(prev => [...imported, ...prev]);

            // Auto-match after import
            setTimeout(() => autoMatch(), 100);
        } finally {
            setLoading(false);
        }
    }, [autoMatch]);

    // Summary stats
    const summary: ReconciliationSummary = useMemo(() => {
        const matched = transactions.filter(t => t.status === 'matched').length;
        const unmatched = transactions.filter(t => t.status === 'unmatched').length;
        const ignored = transactions.filter(t => t.status === 'ignored').length;
        const unmatchedAmount = transactions
            .filter(t => t.status === 'unmatched')
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            totalTransactions: transactions.length,
            matched,
            unmatched,
            ignored,
            matchRate: transactions.length > 0 ? (matched / transactions.length) * 100 : 0,
            unmatchedAmount,
        };
    }, [transactions]);

    // Demo data
    const loadDemoData = useCallback(() => {
        const demoTransactions: BankTransaction[] = [
            { id: '1', date: '2026-01-03', description: 'Payment from Acme Corp', amount: 5000, type: 'credit', status: 'unmatched', importedAt: new Date().toISOString() },
            { id: '2', date: '2026-01-02', description: 'Wire transfer - INV-2024-001', amount: 12500, type: 'credit', reference: 'INV-2024-001', status: 'unmatched', importedAt: new Date().toISOString() },
            { id: '3', date: '2026-01-01', description: 'Stripe payout', amount: 8750, type: 'credit', status: 'unmatched', importedAt: new Date().toISOString() },
            { id: '4', date: '2025-12-30', description: 'AWS hosting', amount: 450, type: 'debit', status: 'unmatched', importedAt: new Date().toISOString() },
            { id: '5', date: '2025-12-28', description: 'Figma subscription', amount: 75, type: 'debit', status: 'unmatched', importedAt: new Date().toISOString() },
        ];
        setTransactions(demoTransactions);
    }, []);

    return {
        transactions,
        matches,
        summary,
        loading,
        autoMatch,
        manualMatch,
        unmatch,
        ignoreTransaction,
        importTransactions,
        loadDemoData,
    };
}

export default useBankReconciliation;
