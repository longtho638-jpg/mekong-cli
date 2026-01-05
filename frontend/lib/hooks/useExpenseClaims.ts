'use client';

import { useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * 💳 Expense Claims Hook
 * 
 * Inspired by Frappe HR Expense Claims
 * Track employee expense submissions and approvals
 */

export type ExpenseStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid';
export type ExpenseCategory = 'travel' | 'meals' | 'software' | 'equipment' | 'office' | 'marketing' | 'other';

export interface ExpenseItem {
    id: string;
    description: string;
    category: ExpenseCategory;
    amount: number;
    date: string;
    receiptUrl?: string;
    notes?: string;
}

export interface ExpenseClaim {
    id: string;
    title: string;
    employeeId: string;
    employeeName: string;
    items: ExpenseItem[];
    totalAmount: number;
    status: ExpenseStatus;
    submittedDate?: string;
    approvedDate?: string;
    approvedBy?: string;
    paidDate?: string;
    rejectReason?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ExpenseSummary {
    totalClaims: number;
    totalAmount: number;
    pendingApproval: number;
    pendingPayment: number;
    byCategory: Record<ExpenseCategory, number>;
    byStatus: Record<ExpenseStatus, number>;
    monthlySpend: { month: string; amount: number }[];
}

export function useExpenseClaims() {
    const [claims, setClaims] = useState<ExpenseClaim[]>(getDemoClaims());
    const [loading, setLoading] = useState(false);

    // Create new claim
    const createClaim = useCallback((title: string, employeeId: string, employeeName: string): ExpenseClaim => {
        const claim: ExpenseClaim = {
            id: crypto.randomUUID(),
            title,
            employeeId,
            employeeName,
            items: [],
            totalAmount: 0,
            status: 'draft',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        setClaims(prev => [claim, ...prev]);
        return claim;
    }, []);

    // Add expense item
    const addItem = useCallback((claimId: string, item: Omit<ExpenseItem, 'id'>) => {
        setClaims(prev => prev.map(c => {
            if (c.id !== claimId) return c;
            const newItem: ExpenseItem = { ...item, id: crypto.randomUUID() };
            const items = [...c.items, newItem];
            return {
                ...c,
                items,
                totalAmount: items.reduce((sum, i) => sum + i.amount, 0),
                updatedAt: new Date().toISOString(),
            };
        }));
    }, []);

    // Submit claim
    const submitClaim = useCallback((claimId: string) => {
        setClaims(prev => prev.map(c =>
            c.id === claimId
                ? { ...c, status: 'submitted', submittedDate: new Date().toISOString(), updatedAt: new Date().toISOString() }
                : c
        ));
    }, []);

    // Approve claim
    const approveClaim = useCallback((claimId: string, approverName: string) => {
        setClaims(prev => prev.map(c =>
            c.id === claimId
                ? { ...c, status: 'approved', approvedDate: new Date().toISOString(), approvedBy: approverName, updatedAt: new Date().toISOString() }
                : c
        ));
    }, []);

    // Reject claim
    const rejectClaim = useCallback((claimId: string, reason: string) => {
        setClaims(prev => prev.map(c =>
            c.id === claimId
                ? { ...c, status: 'rejected', rejectReason: reason, updatedAt: new Date().toISOString() }
                : c
        ));
    }, []);

    // Mark as paid
    const markPaid = useCallback((claimId: string) => {
        setClaims(prev => prev.map(c =>
            c.id === claimId
                ? { ...c, status: 'paid', paidDate: new Date().toISOString(), updatedAt: new Date().toISOString() }
                : c
        ));
    }, []);

    // Summary stats
    const summary: ExpenseSummary = useMemo(() => {
        const byCategory = claims.flatMap(c => c.items).reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + item.amount;
            return acc;
        }, {} as Record<ExpenseCategory, number>);

        const byStatus = claims.reduce((acc, c) => {
            acc[c.status] = (acc[c.status] || 0) + 1;
            return acc;
        }, {} as Record<ExpenseStatus, number>);

        return {
            totalClaims: claims.length,
            totalAmount: claims.reduce((sum, c) => sum + c.totalAmount, 0),
            pendingApproval: claims.filter(c => c.status === 'submitted').length,
            pendingPayment: claims.filter(c => c.status === 'approved').length,
            byCategory,
            byStatus,
            monthlySpend: [
                { month: 'Oct', amount: 4500 },
                { month: 'Nov', amount: 5200 },
                { month: 'Dec', amount: 6100 },
                { month: 'Jan', amount: 3800 },
            ],
        };
    }, [claims]);

    return {
        claims,
        summary,
        loading,
        createClaim,
        addItem,
        submitClaim,
        approveClaim,
        rejectClaim,
        markPaid,
    };
}

// Demo data
function getDemoClaims(): ExpenseClaim[] {
    return [
        {
            id: '1',
            title: 'Client Meeting - Acme Corp',
            employeeId: 'emp-1',
            employeeName: 'John Doe',
            items: [
                { id: '1a', description: 'Uber to client office', category: 'travel', amount: 25, date: '2026-01-02' },
                { id: '1b', description: 'Lunch with client', category: 'meals', amount: 85, date: '2026-01-02' },
            ],
            totalAmount: 110,
            status: 'submitted',
            submittedDate: '2026-01-03T10:00:00Z',
            createdAt: '2026-01-02T00:00:00Z',
            updatedAt: '2026-01-03T10:00:00Z',
        },
        {
            id: '2',
            title: 'Software Subscriptions - Dec',
            employeeId: 'emp-2',
            employeeName: 'Jane Smith',
            items: [
                { id: '2a', description: 'Notion Team Plan', category: 'software', amount: 48, date: '2025-12-01' },
                { id: '2b', description: 'Linear subscription', category: 'software', amount: 40, date: '2025-12-01' },
            ],
            totalAmount: 88,
            status: 'approved',
            submittedDate: '2026-01-01T09:00:00Z',
            approvedDate: '2026-01-02T14:00:00Z',
            approvedBy: 'Manager',
            createdAt: '2025-12-28T00:00:00Z',
            updatedAt: '2026-01-02T14:00:00Z',
        },
    ];
}

export default useExpenseClaims;
