/**
 * React Hook for MRR Metrics
 * Real-time revenue data from Stripe
 */

import { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api/billing/mrr';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface MRRMetrics {
    mrr: number;
    arr: number;
    activeSubscriptions: number;
    newMRR: number;
    churnedMRR: number;
    netNewMRR: number;
    averageRevenuePerUser: number;
    breakdown: {
        plan: string;
        count: number;
        mrr: number;
    }[];
    growth: {
        month: string;
        mrr: number;
    }[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// useMRR
// ═══════════════════════════════════════════════════════════════════════════════

export function useMRR(autoRefresh: boolean = false, refreshInterval: number = 60000) {
    const [metrics, setMetrics] = useState<MRRMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [isMock, setIsMock] = useState(false);

    const fetchMRR = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(API_BASE);
            const data = await res.json();

            if (data.success) {
                setMetrics(data.data);
                setLastUpdated(new Date(data.timestamp));
                setIsMock(data.mock || false);
                setError(null);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to fetch MRR metrics');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMRR();
    }, [fetchMRR]);

    // Auto-refresh if enabled
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(fetchMRR, refreshInterval);
        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval, fetchMRR]);

    // Derived metrics
    const growthRate = metrics?.growth && metrics.growth.length >= 2
        ? ((metrics.growth[metrics.growth.length - 1].mrr - metrics.growth[metrics.growth.length - 2].mrr)
            / metrics.growth[metrics.growth.length - 2].mrr * 100)
        : 0;

    const churnRate = metrics?.activeSubscriptions && metrics.churnedMRR
        ? (metrics.churnedMRR / (metrics.mrr + metrics.churnedMRR) * 100)
        : 0;

    return {
        metrics,
        loading,
        error,
        isMock,
        lastUpdated,
        growthRate: Math.round(growthRate * 10) / 10,
        churnRate: Math.round(churnRate * 10) / 10,
        refresh: fetchMRR,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Formatted Helpers
// ═══════════════════════════════════════════════════════════════════════════════

export function formatCurrency(value: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

export function formatCurrencyWithCents(value: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
    }).format(value);
}

export function formatPercentage(value: number): string {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}
