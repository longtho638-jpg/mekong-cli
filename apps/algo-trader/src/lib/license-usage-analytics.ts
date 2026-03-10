/**
 * License Usage Analytics — Enterprise Tier Monitoring
 * 
 * Track quota consumption, API calls, feature usage for enterprise reporting.
 */

export interface UsageEvent {
  tenantId: string;
  event: string;
  feature?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

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

export class LicenseUsageAnalytics {
  private static instance: LicenseUsageAnalytics;
  private usageData = new Map<string, UsageQuota>();
  private events: UsageEvent[] = [];
  private readonly MAX_EVENTS = 10000;

  private constructor() {}

  static getInstance(): LicenseUsageAnalytics {
    if (!LicenseUsageAnalytics.instance) {
      LicenseUsageAnalytics.instance = new LicenseUsageAnalytics();
    }
    return LicenseUsageAnalytics.instance;
  }

  /** Initialize quota for tenant */
  initTenant(tenantId: string, tier: string): void {
    const limits = this.getLimitsForTier(tier);
    this.usageData.set(tenantId, {
      tenantId,
      apiCalls: 0,
      apiCallsLimit: limits.apiCalls,
      mlPredictions: 0,
      mlPredictionsLimit: limits.mlPredictions,
      dataPoints: 0,
      dataPointsLimit: limits.dataPoints,
      resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  private getLimitsForTier(tier: string) {
    switch (tier) {
      case 'enterprise':
        return { apiCalls: 1000000, mlPredictions: 100000, dataPoints: 10000000 };
      case 'pro':
        return { apiCalls: 100000, mlPredictions: 10000, dataPoints: 1000000 };
      default:
        return { apiCalls: 10000, mlPredictions: 1000, dataPoints: 100000 };
    }
  }

  /** Track API call */
  trackApiCall(tenantId: string, endpoint?: string): boolean {
    const quota = this.usageData.get(tenantId);
    if (!quota) return false;
    
    if (quota.apiCalls >= quota.apiCallsLimit) {
      this.logEvent(tenantId, 'quota_exceeded', 'api_calls');
      return false;
    }
    
    quota.apiCalls++;
    this.logEvent(tenantId, 'api_call', undefined, { endpoint });
    return true;
  }

  /** Track ML prediction */
  trackMLPrediction(tenantId: string, model?: string): boolean {
    const quota = this.usageData.get(tenantId);
    if (!quota) return false;
    
    if (quota.mlPredictions >= quota.mlPredictionsLimit) {
      this.logEvent(tenantId, 'quota_exceeded', 'ml_predictions');
      return false;
    }
    
    quota.mlPredictions++;
    this.logEvent(tenantId, 'ml_prediction', undefined, { model });
    return true;
  }

  /** Track data points processed */
  trackDataPoints(tenantId: string, count: number): boolean {
    const quota = this.usageData.get(tenantId);
    if (!quota) return false;
    
    if (quota.dataPoints + count > quota.dataPointsLimit) {
      this.logEvent(tenantId, 'quota_exceeded', 'data_points');
      return false;
    }
    
    quota.dataPoints += count;
    this.logEvent(tenantId, 'data_processed', undefined, { count });
    return true;
  }

  /** Get current usage for tenant */
  getUsage(tenantId: string): UsageQuota | undefined {
    return this.usageData.get(tenantId);
  }

  /** Get usage percentage */
  getUsagePercentages(tenantId: string): Record<string, number> {
    const quota = this.usageData.get(tenantId);
    if (!quota) return {};
    
    return {
      apiCalls: (quota.apiCalls / quota.apiCallsLimit) * 100,
      mlPredictions: (quota.mlPredictions / quota.mlPredictionsLimit) * 100,
      dataPoints: (quota.dataPoints / quota.dataPointsLimit) * 100,
    };
  }

  /** Reset monthly usage */
  resetUsage(tenantId: string): void {
    const quota = this.usageData.get(tenantId);
    if (quota) {
      quota.apiCalls = 0;
      quota.mlPredictions = 0;
      quota.dataPoints = 0;
      quota.resetDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      this.logEvent(tenantId, 'usage_reset');
    }
  }

  private logEvent(tenantId: string, event: string, feature?: string, metadata?: Record<string, unknown>): void {
    this.events.push({
      tenantId,
      event,
      feature,
      timestamp: new Date().toISOString(),
      metadata,
    });
    
    // Trim old events
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }
  }

  /** Get events for reporting */
  getEvents(tenantId?: string, limit = 100): UsageEvent[] {
    const filtered = tenantId ? this.events.filter(e => e.tenantId === tenantId) : this.events;
    return filtered.slice(-limit);
  }

  /** Export usage report */
  exportReport(tenantId: string): string {
    const quota = this.usageData.get(tenantId);
    if (!quota) return JSON.stringify({ error: 'Tenant not found' });
    
    return JSON.stringify({
      tenantId,
      usage: quota,
      percentages: this.getUsagePercentages(tenantId),
      recentEvents: this.getEvents(tenantId, 50),
      generatedAt: new Date().toISOString(),
    }, null, 2);
  }

  reset(): void {
    this.usageData.clear();
    this.events = [];
  }
}

// Convenience exports
export function trackUsage(tenantId: string, type: 'api' | 'ml' | 'data', detail?: string | number): boolean {
  const analytics = LicenseUsageAnalytics.getInstance();
  switch (type) {
    case 'api': return analytics.trackApiCall(tenantId, detail as string);
    case 'ml': return analytics.trackMLPrediction(tenantId, detail as string);
    case 'data': return analytics.trackDataPoints(tenantId, detail as number);
  }
}

export function getUsageReport(tenantId: string): string {
  return LicenseUsageAnalytics.getInstance().exportReport(tenantId);
}
