import type { Id, Timestamp } from '../types/common.js';

/** Single metric data point */
export interface MetricPoint {
  timestamp: Timestamp;
  value: number;
  labels: Record<string, string>;
}

/** Time series for a metric */
export interface MetricSeries {
  name: string;
  unit: 'ms' | 'seconds' | 'tokens' | 'usd' | 'count' | 'percent';
  points: MetricPoint[];
}

/** Per-step analytics within an SOP */
export interface StepAnalytics {
  stepId: string;
  stepName: string;
  avgDuration: number;
  medianDuration: number;
  successRate: number;
  isBottleneck: boolean;
  percentOfTotal: number;
  retryRate: number;
  costContribution: number;
}

/** SOP execution analytics */
export interface SopAnalytics {
  sopName: string;
  totalRuns: number;
  successRate: number;
  avgDuration: number;
  medianDuration: number;
  p95Duration: number;
  avgCost: number;
  avgTokens: number;
  failureReasons: Array<{ reason: string; count: number; percentage: number }>;
  stepAnalytics: StepAnalytics[];
  trend: 'improving' | 'stable' | 'degrading';
  trendData: { durationTrend: number; successTrend: number; costTrend: number };
}

/** Agent performance analytics */
export interface AgentAnalytics {
  agentName: string;
  totalTasks: number;
  successRate: number;
  avgTokensPerTask: number;
  avgCostPerTask: number;
  avgDuration: number;
  topTools: Array<{ tool: string; uses: number; successRate: number }>;
  failurePatterns: Array<{ pattern: string; count: number }>;
  efficiencyScore: number;
}

/** Bottleneck identification */
export interface Bottleneck {
  id: Id;
  type: 'sop_step' | 'agent' | 'tool' | 'llm_provider' | 'integration';
  location: string;
  metric: string;
  currentValue: number;
  expectedValue: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: Timestamp;
}

/** Improvement suggestion */
export interface KaizenSuggestion {
  id: Id;
  type: 'parallelize' | 'cache' | 'tool_change' | 'model_downgrade' | 'sop_restructure' | 'skip_step' | 'batch' | 'prompt_optimize';
  title: string;
  description: string;
  target: string;
  evidence: string;
  estimatedImpact: { timeSaved: number; costSaved: number; successRateChange: number };
  autoApplicable: boolean;
  status: 'proposed' | 'approved' | 'applied' | 'rejected' | 'reverted';
  appliedAt?: Timestamp;
  createdAt: Timestamp;
}

/** Kaizen report — periodic improvement analysis */
export interface KaizenReport {
  period: { from: Timestamp; to: Timestamp };
  overallHealth: { score: number; trend: 'improving' | 'stable' | 'degrading' };
  sopAnalytics: SopAnalytics[];
  agentAnalytics: AgentAnalytics[];
  bottlenecks: Bottleneck[];
  suggestions: KaizenSuggestion[];
  comparison: {
    totalSopRuns: { current: number; previous: number; change: number };
    avgSopDuration: { current: number; previous: number; change: number };
    totalCost: { current: number; previous: number; change: number };
    overallSuccessRate: { current: number; previous: number; change: number };
  };
}
