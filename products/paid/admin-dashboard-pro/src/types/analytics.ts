export interface AnalyticsMetric {
  label: string;
  value: string | number;
  change: number; // Percentage change
  changeLabel: string; // e.g., "vs last month"
  trend: 'up' | 'down' | 'neutral';
}

export interface ChartDataPoint {
  name: string;
  value: number;
  date?: string;
}

export interface RealTimeData {
  activeUsers: number;
  serverLoad: number;
  recentSales: number;
}
