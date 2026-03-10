/**
 * License analytics data fetching hook with loading and error states.
 * Fetches usage analytics, quota data, and activity from the API.
 */
import { useState, useCallback, useEffect } from 'react';
import { useApiClient } from './use-api-client';

export interface UsageQuota {
  tenantId: string;
  apiCalls: number;
  apiCallsLimit: number;
  mlPredictions: number;
  mlPredictionsLimit: number;
  dataPoints: number;
  dataPointsLimit: number;
  resetDate: string;
}

export interface AnalyticsData {
  total: number;
  byTier: { free: number; pro: number; enterprise: number };
  byStatus: { active: number; revoked: number; expired: number };
  usage: {
    apiCalls: number;
    mlFeatures: number;
    premiumData: number;
  };
  recentActivity: Array<{
    event: string;
    timestamp: string;
    licenseId: string;
    details?: string;
  }>;
  revenue: {
    monthly: number;
    projected: number;
  };
  dailyBreakdown: Array<{
    date: string;
    apiCalls: number;
    activeLicenses: number;
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

export function useLicenseAnalytics() {
  const { fetchApi } = useApiClient();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [quota, setQuota] = useState<UsageQuota | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange['value']>('30d');
  const [selectedLicense, setSelectedLicense] = useState<string>('');

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ period: timeRange });
      if (selectedLicense) {
        params.append('licenseKey', selectedLicense);
      }
      const data = await fetchApi<AnalyticsData>(`/licenses/analytics?${params.toString()}`);
      if (data) {
        setAnalytics(data);
      } else {
        setError('Failed to load analytics data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [fetchApi, timeRange, selectedLicense]);

  const loadQuota = useCallback(async (tenantId: string) => {
    try {
      const data = await fetchApi<UsageQuota>(`/licenses/analytics/quota?tenantId=${tenantId}`);
      if (data) {
        setQuota(data);
      }
    } catch {
      // Silently fail - quota is optional
    }
  }, [fetchApi]);

  useEffect(() => {
    loadAnalytics();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadAnalytics, 30000);
    return () => clearInterval(interval);
  }, [loadAnalytics]);

  return {
    analytics,
    quota,
    loading,
    error,
    timeRange,
    setTimeRange,
    selectedLicense,
    setSelectedLicense,
    reload: loadAnalytics,
    loadQuota,
  };
}
