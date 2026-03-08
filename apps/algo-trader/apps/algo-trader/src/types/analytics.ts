/**
 * Analytics Types - ROIaaS Phase 5
 * Comprehensive analytics data structures for algo-trader
 */

// Revenue Types
export interface RevenueData {
  month: string;
  subscriptions: number;
  oneTimePayments: number;
  total: number;
}

export interface RevenueSummary {
  totalRevenue: number;
  monthlyGrowth: number;
  activeSubscriptions: number;
  churnRate: number;
}

// User Metrics Types
export interface UserMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  retentionRate: number;
}

export interface UserActivity {
  date: string;
  logins: number;
  trades: number;
  apiCalls: number;
}

// ROI Calculator Types
export interface ROICalculation {
  initialInvestment: number;
  monthlySubscription: number;
  tradingCapital: number;
  expectedReturn: number;
  timeHorizon: number;
}

export interface ROIResult {
  totalReturn: number;
  roi: number;
  monthlyProfit: number;
  breakEven: number;
  projectionData: ProjectionPoint[];
}

export interface ProjectionPoint {
  month: number;
  value: number;
  cumulativeProfit: number;
}

// Chart Types
export interface ChartDataset {
  label: string;
  data: number[];
  color: string;
}

export interface TimeSeriesData {
  labels: string[];
  datasets: ChartDataset[];
}

// Dashboard Types
export interface DashboardSummary {
  revenue: RevenueSummary;
  users: UserMetrics;
  performance: PerformanceMetrics;
}

export interface PerformanceMetrics {
  uptime: number;
  avgResponseTime: number;
  errorRate: number;
  totalTrades: number;
}

// Real-time Types
export interface RealTimeMetrics {
  timestamp: string;
  activeConnections: number;
  requestsPerSecond: number;
  cpuUsage: number;
  memoryUsage: number;
}
