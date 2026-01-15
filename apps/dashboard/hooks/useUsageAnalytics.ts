/**
 * React Hook for Usage Analytics
 * Real-time usage data from /api/analytics
 */

import { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api/analytics';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface UsageMetrics {
    summary: {
        pageViews: number;
        featureUses: number;
        uniqueUsers: number;
        totalEvents: number;
    };
    pageBreakdown: { page: string; count: number }[];
    dailyTrend: { date: string; count: number }[];
    recentEvents: any[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// useUsageAnalytics
// ═══════════════════════════════════════════════════════════════════════════════

export function useUsageAnalytics(tenantId?: string, days: number = 30, autoRefresh: boolean = false) {
    const [metrics, setMetrics] = useState<UsageMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isMock, setIsMock] = useState(false);

    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (tenantId) params.append('tenant_id', tenantId);
            params.append('days', days.toString());

            const res = await fetch(`${API_BASE}?${params}`);
            const data = await res.json();

            if (data.success) {
                setMetrics(data.data);
                setIsMock(data.mock || false);
                setError(null);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to fetch analytics');
        } finally {
            setLoading(false);
        }
    }, [tenantId, days]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    // Auto-refresh if enabled
    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(fetchAnalytics, 60000);
        return () => clearInterval(interval);
    }, [autoRefresh, fetchAnalytics]);

    // Track page view
    const trackPageView = useCallback(async (page: string, userId?: string) => {
        try {
            await fetch(API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenant_id: tenantId,
                    event_type: 'page_view',
                    user_id: userId,
                    page,
                }),
            });
        } catch (err) {
            console.error('Failed to track page view:', err);
        }
    }, [tenantId]);

    // Track feature use
    const trackFeatureUse = useCallback(async (feature: string, page: string, userId?: string) => {
        try {
            await fetch(API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenant_id: tenantId,
                    event_type: 'feature_use',
                    user_id: userId,
                    page,
                    metadata: { feature },
                }),
            });
        } catch (err) {
            console.error('Failed to track feature use:', err);
        }
    }, [tenantId]);

    return {
        metrics,
        loading,
        error,
        isMock,
        refresh: fetchAnalytics,
        trackPageView,
        trackFeatureUse,
    };
}
