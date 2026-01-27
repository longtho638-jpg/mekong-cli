/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';

/**
 * 📦 Subscription Tracker Hook
 * 
 * Inspired by ERPNext Inventory Auto-Replenishment
 * Track SaaS subscriptions and renewal dates
 */

export type SubscriptionStatus = 'active' | 'expiring' | 'expired' | 'cancelled' | 'trial';
export type BillingCycle = 'monthly' | 'quarterly' | 'yearly' | 'lifetime';

export interface Subscription {
    id: string;
    name: string;
    vendor: string;
    category: string;
    status: SubscriptionStatus;
    cost: number;
    billingCycle: BillingCycle;
    startDate: string;
    renewalDate: string;
    autoRenew: boolean;
    seats?: number;
    usedSeats?: number;
    notes?: string;
    tags: string[];
}

export interface SubscriptionSummary {
    totalSubscriptions: number;
    monthlySpend: number;
    yearlySpend: number;
    expiringThisMonth: number;
    byStatus: Record<SubscriptionStatus, number>;
    byCategory: Record<string, number>;
    topVendors: { vendor: string; spend: number }[];
}

export function useSubscriptions() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>(getDemoSubscriptions());
    const [loading, setLoading] = useState(false);

    // Update status based on renewal dates
    useEffect(() => {
        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        setSubscriptions(prev => prev.map(sub => {
            const renewalDate = new Date(sub.renewalDate);
            if (renewalDate < now) {
                return { ...sub, status: 'expired' };
            } else if (renewalDate <= thirtyDaysFromNow) {
                return { ...sub, status: 'expiring' };
            }
            return sub;
        }));
    }, []);

    // Add subscription
    const addSubscription = useCallback((sub: Omit<Subscription, 'id'>) => {
        const newSub: Subscription = {
            ...sub,
            id: crypto.randomUUID(),
        };
        setSubscriptions(prev => [newSub, ...prev]);
        return newSub;
    }, []);

    // Update subscription
    const updateSubscription = useCallback((id: string, updates: Partial<Subscription>) => {
        setSubscriptions(prev => prev.map(s =>
            s.id === id ? { ...s, ...updates } : s
        ));
    }, []);

    // Cancel subscription
    const cancelSubscription = useCallback((id: string) => {
        setSubscriptions(prev => prev.map(s =>
            s.id === id ? { ...s, status: 'cancelled', autoRenew: false } : s
        ));
    }, []);

    // Renew subscription
    const renewSubscription = useCallback((id: string, newRenewalDate: string) => {
        setSubscriptions(prev => prev.map(s =>
            s.id === id ? { ...s, status: 'active', renewalDate: newRenewalDate } : s
        ));
    }, []);

    // Calculate monthly cost from billing cycle
    const getMonthlyEquivalent = useCallback((sub: Subscription): number => {
        switch (sub.billingCycle) {
            case 'monthly': return sub.cost;
            case 'quarterly': return sub.cost / 3;
            case 'yearly': return sub.cost / 12;
            case 'lifetime': return 0;
        }
    }, []);

    // Summary stats
    const summary: SubscriptionSummary = useMemo(() => {
        const activeOrExpiring = subscriptions.filter(s =>
            s.status === 'active' || s.status === 'expiring' || s.status === 'trial'
        );

        const monthlySpend = activeOrExpiring.reduce((sum, s) =>
            sum + getMonthlyEquivalent(s), 0
        );

        const now = new Date();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const expiringThisMonth = subscriptions.filter(s => {
            const renewal = new Date(s.renewalDate);
            return renewal <= endOfMonth && renewal >= now;
        }).length;

        const byStatus = subscriptions.reduce((acc, s) => {
            acc[s.status] = (acc[s.status] || 0) + 1;
            return acc;
        }, {} as Record<SubscriptionStatus, number>);

        const byCategory = subscriptions.reduce((acc, s) => {
            acc[s.category] = (acc[s.category] || 0) + getMonthlyEquivalent(s);
            return acc;
        }, {} as Record<string, number>);

        const vendorSpend = subscriptions.reduce((acc, s) => {
            acc[s.vendor] = (acc[s.vendor] || 0) + getMonthlyEquivalent(s);
            return acc;
        }, {} as Record<string, number>);

        const topVendors = Object.entries(vendorSpend)
            .map(([vendor, spend]) => ({ vendor, spend }))
            .sort((a, b) => b.spend - a.spend)
            .slice(0, 5);

        return {
            totalSubscriptions: subscriptions.length,
            monthlySpend: Math.round(monthlySpend),
            yearlySpend: Math.round(monthlySpend * 12),
            expiringThisMonth,
            byStatus,
            byCategory,
            topVendors,
        };
    }, [subscriptions, getMonthlyEquivalent]);

    // Filter helpers
    const getExpiring = useCallback((days: number = 30) => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() + days);
        return subscriptions.filter(s => {
            const renewal = new Date(s.renewalDate);
            return renewal <= cutoff && renewal >= new Date() && s.status !== 'cancelled';
        });
    }, [subscriptions]);

    const getByCategory = useCallback((category: string) =>
        subscriptions.filter(s => s.category === category), [subscriptions]);

    return {
        subscriptions,
        summary,
        loading,
        addSubscription,
        updateSubscription,
        cancelSubscription,
        renewSubscription,
        getExpiring,
        getByCategory,
        getMonthlyEquivalent,
    };
}

// Demo data
function getDemoSubscriptions(): Subscription[] {
    return [
        { id: '1', name: 'Vercel Pro', vendor: 'Vercel', category: 'Hosting', status: 'active', cost: 20, billingCycle: 'monthly', startDate: '2025-01-01', renewalDate: '2026-02-01', autoRenew: true, tags: ['hosting', 'essential'] },
        { id: '2', name: 'Figma Enterprise', vendor: 'Figma', category: 'Design', status: 'active', cost: 75, billingCycle: 'monthly', startDate: '2025-03-01', renewalDate: '2026-02-01', autoRenew: true, seats: 10, usedSeats: 8, tags: ['design', 'collaboration'] },
        { id: '3', name: 'Supabase Pro', vendor: 'Supabase', category: 'Database', status: 'active', cost: 25, billingCycle: 'monthly', startDate: '2025-06-01', renewalDate: '2026-02-01', autoRenew: true, tags: ['database', 'essential'] },
        { id: '4', name: 'Linear', vendor: 'Linear', category: 'Project Management', status: 'active', cost: 96, billingCycle: 'yearly', startDate: '2025-01-15', renewalDate: '2026-01-15', autoRenew: true, seats: 5, usedSeats: 5, tags: ['pm', 'essential'] },
        { id: '5', name: 'Notion Team', vendor: 'Notion', category: 'Documentation', status: 'expiring', cost: 120, billingCycle: 'yearly', startDate: '2025-01-10', renewalDate: '2026-01-10', autoRenew: false, seats: 8, usedSeats: 6, tags: ['docs', 'wiki'] },
        { id: '6', name: 'Slack Pro', vendor: 'Slack', category: 'Communication', status: 'active', cost: 8.25, billingCycle: 'monthly', startDate: '2024-06-01', renewalDate: '2026-02-01', autoRenew: true, seats: 15, usedSeats: 12, tags: ['communication', 'essential'] },
    ];
}

export default useSubscriptions;
