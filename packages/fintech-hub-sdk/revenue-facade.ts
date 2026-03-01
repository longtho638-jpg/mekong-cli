/**
 * Revenue facade — MRR tracking, cohort analysis, revenue recognition
 */
export interface RevenueMetrics {
  mrr: number;
  arr: number;
  churnRate: number;
  ltv: number;
  arpu: number;
  netRevenue: number;
  currency: string;
  period: string;
}

export interface CohortAnalysis {
  cohort: string;
  size: number;
  retentionByMonth: number[];
  revenueByMonth: number[];
}

export class RevenueFacade {
  async getMetrics(period: string): Promise<RevenueMetrics> {
    throw new Error('Implement with vibe-revenue provider');
  }

  async getCohortAnalysis(startDate: string, endDate: string): Promise<CohortAnalysis[]> {
    throw new Error('Implement with vibe-revenue provider');
  }
}
