/**
 * Revenue Analytics Hook
 *
 * Fetches revenue metrics from analytics API with auto-refresh polling.
 * Supports date range filtering (7d/30d/90d) and tier filtering.
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { useApiClient } from './use-api-client';

export interface RevenueMetrics {
  mrr: {
    month: string;
    totalMRR: number;
    byTier: Record<string, number>;
    activeSubscriptions: number;
    growthRate?: number;
  };
  trend: Array<{
    month: string;
    totalMRR: number;
    growthRate?: number;
  }>;
}

export interface ActiveLicenses {
  date: string;
  totalLicenses: number;
  byTier: Record<string, number>;
  licensesWithActivity: number;
  activityRate: number;
}

export interface ChurnMetrics {
  month: string;
  churnRate: number;
  cancellations: number;
  startSubscriptions: number;
  byTier: Record<string, number>;
}

export interface RevenueByTier {
  month: string;
  totalRevenue: number;
  tiers: Array<{
    tier: string;
    revenue: number;
    percentage: number;
    subscriptionCount: number;
  }>;
}

export interface AnalyticsMetrics {
  mrr: number;
  mrrGrowth?: number;
  dal: number;
  activityRate: number;
  churnRate: number;
  arpa: number;
  trend: Array<{ month: string; totalMRR: number; growthRate?: number }>;
  byTier: Array<{
    tier: string;
    revenue: number;
    percentage: number;
    subscriptionCount: number;
  }>;
}

export interface TimeRange {
  label: string;
  value: '7d' | '30d' | '90d';
  days: number;
}

export const TIME_RANGES: TimeRange[] = [
  { label: 'Last 7 days', value: '7d', days: 7 },
  { label: 'Last 30 days', value: '30d', days: 30 },
  { label: 'Last 90 days', value: '90d', days: 90 },
];

export function useRevenueAnalytics() {
  const { fetchApi } = useApiClient();
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange['value']>('30d');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isPolling, setIsPolling] = useState(true);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const loadAnalytics = useCallback(async () => {
    try {
      setError(null);

      // Fetch all metrics in parallel
      const [revenueData, activeLicensesData, churnData, byTierData] = await Promise.all([
        fetchApi<RevenueMetrics>('/analytics/revenue'),
        fetchApi<ActiveLicenses>('/analytics/active-licenses'),
        fetchApi<ChurnMetrics>('/analytics/churn'),
        fetchApi<RevenueByTier>('/analytics/by-tier'),
      ]);

      if (!revenueData || !activeLicensesData || !churnData || !byTierData) {
        throw new Error('Failed to load analytics data');
      }

      // Calculate ARPA (Average Revenue Per Account)
      const arpa = revenueData.mrr.activeSubscriptions > 0
        ? revenueData.mrr.totalMRR / revenueData.mrr.activeSubscriptions
        : 0;

      setMetrics({
        mrr: revenueData.mrr.totalMRR,
        mrrGrowth: revenueData.mrr.growthRate,
        dal: activeLicensesData.totalLicenses,
        activityRate: activeLicensesData.activityRate,
        churnRate: churnData.churnRate,
        arpa,
        trend: revenueData.trend,
        byTier: byTierData.tiers,
      });

      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [fetchApi]);

  // Initial load
  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Auto-refresh polling (30s interval)
  useEffect(() => {
    if (!isPolling) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    pollingRef.current = setInterval(() => {
      loadAnalytics();
    }, 30000); // 30 seconds

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [isPolling, loadAnalytics]);

  // Reload when time range changes
  useEffect(() => {
    loadAnalytics();
  }, [timeRange, loadAnalytics]);

  const togglePolling = useCallback(() => {
    setIsPolling(prev => !prev);
  }, []);

  return {
    metrics,
    loading,
    error,
    timeRange,
    setTimeRange,
    selectedTier,
    setSelectedTier,
    lastUpdated,
    isPolling,
    togglePolling,
    reload: loadAnalytics,
  };
}
