/**
 * @agencyos/nonprofit-hub-sdk — Impact Measurement Facade
 *
 * Impact metrics tracking, UN SDG alignment, and structured impact
 * reporting for nonprofit accountability and grant compliance.
 *
 * Usage:
 *   import { createImpactTracker } from '@agencyos/nonprofit-hub-sdk/impact';
 */

export interface ImpactMetric {
  metricId: string;
  organizationId: string;
  name: string;
  description: string;
  unit: string;
  category: 'output' | 'outcome' | 'impact';
  targetValue: number;
  currentValue: number;
  baselineValue: number;
  measurementFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  lastMeasuredAt: Date;
  sdgGoals: number[];
}

export interface SDGAlignment {
  alignmentId: string;
  organizationId: string;
  programId: string;
  sdgGoal: number;
  sdgTarget: string;
  contributionDescription: string;
  primaryIndicators: string[];
  evidenceUrls: string[];
  verifiedByBody?: string;
  verifiedAt?: Date;
}

export interface ImpactReport {
  reportId: string;
  organizationId: string;
  reportingPeriodStart: Date;
  reportingPeriodEnd: Date;
  title: string;
  executiveSummary: string;
  metricsSnapshot: Array<{
    metricId: string;
    metricName: string;
    value: number;
    unit: string;
    changeFromBaseline: number;
  }>;
  sdgAlignments: SDGAlignment[];
  beneficiariesReached: number;
  totalFundsDeployed: number;
  currency: string;
  publishedAt?: Date;
  status: 'draft' | 'under-review' | 'published';
}

export interface ImpactTracker {
  createMetric(data: Omit<ImpactMetric, 'metricId' | 'currentValue' | 'lastMeasuredAt'>): Promise<ImpactMetric>;
  recordMeasurement(metricId: string, value: number, measuredAt?: Date): Promise<ImpactMetric>;
  listMetrics(organizationId: string): Promise<ImpactMetric[]>;
  addSDGAlignment(data: Omit<SDGAlignment, 'alignmentId'>): Promise<SDGAlignment>;
  listSDGAlignments(organizationId: string): Promise<SDGAlignment[]>;
  generateImpactReport(organizationId: string, periodStart: Date, periodEnd: Date): Promise<ImpactReport>;
  publishReport(reportId: string): Promise<ImpactReport>;
}

/**
 * Create an impact tracker for metrics, SDG alignment, and impact reporting.
 * Implement with your nonprofit impact measurement backend.
 */
export function createImpactTracker(): ImpactTracker {
  return {
    async createMetric(_data) {
      throw new Error('Implement with your nonprofit impact measurement backend');
    },
    async recordMeasurement(_metricId, _value, _measuredAt) {
      throw new Error('Implement with your nonprofit impact measurement backend');
    },
    async listMetrics(_organizationId) {
      throw new Error('Implement with your nonprofit impact measurement backend');
    },
    async addSDGAlignment(_data) {
      throw new Error('Implement with your nonprofit impact measurement backend');
    },
    async listSDGAlignments(_organizationId) {
      throw new Error('Implement with your nonprofit impact measurement backend');
    },
    async generateImpactReport(_organizationId, _periodStart, _periodEnd) {
      throw new Error('Implement with your nonprofit impact measurement backend');
    },
    async publishReport(_reportId) {
      throw new Error('Implement with your nonprofit impact measurement backend');
    },
  };
}
