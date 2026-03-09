/**
 * Dashboard Integration - Exposes canary state for dashboard consumption.
 * Provides read access to all subsystems and override controls.
 */
import { InstanceManager, InstanceStatus, MetricPoint } from './instance-manager';
import { TrafficSplitter } from './traffic-splitter';
import { MetricsComparator, ComparisonResult } from './metrics-comparator';
import { RollbackTrigger, RollbackEvent } from './rollback-trigger';
import { PromotionManager, PromotionRecord, PromotionStatus } from './promotion-manager';

export interface CanaryDashboardState {
  status: PromotionStatus;
  trafficSplit: number;
  baseline: { status: InstanceStatus; metrics: MetricPoint[] };
  canary: { status: InstanceStatus; metrics: MetricPoint[] };
  comparisons: ComparisonResult[];
  rollbackHistory: RollbackEvent[];
  promotionRecords: PromotionRecord[];
  lastUpdated: number;
}

export class DashboardIntegration {
  constructor(
    private instanceManager: InstanceManager,
    private trafficSplitter: TrafficSplitter,
    private metricsComparator: MetricsComparator,
    private rollbackTrigger: RollbackTrigger,
    private promotionManager: PromotionManager,
  ) {}

  getState(): CanaryDashboardState {
    const { baseline, canary } = this.instanceManager.getStatus();
    const baselineMetrics = this.instanceManager.getMetrics('baseline');
    const canaryMetrics = this.instanceManager.getMetrics('canary');
    const comparisons = this.metricsComparator.compareMetrics(baselineMetrics, canaryMetrics);

    return {
      status: this.promotionManager.getStatus(),
      trafficSplit: this.trafficSplitter.getPercent(),
      baseline: { status: baseline.status, metrics: baselineMetrics },
      canary: { status: canary.status, metrics: canaryMetrics },
      comparisons,
      rollbackHistory: this.rollbackTrigger.getHistory(),
      promotionRecords: this.promotionManager.getRecords(),
      lastUpdated: Date.now(),
    };
  }

  handleOverride(
    action: 'setPercent' | 'rollback' | 'promote',
    params?: Record<string, unknown>,
  ): { success: boolean; message: string } {
    try {
      switch (action) {
        case 'setPercent': {
          const pct = typeof params?.percent === 'number' ? params.percent : 0;
          this.trafficSplitter.setPercent(pct);
          return { success: true, message: `Traffic split set to ${pct}%` };
        }
        case 'rollback': {
          const state = this.getState();
          const record = this.promotionManager.forceRollback(state.comparisons);
          return { success: true, message: `Forced rollback at ${new Date(record.timestamp).toISOString()}` };
        }
        case 'promote': {
          const record = this.promotionManager.forcePromote();
          return { success: true, message: `Forced promotion at ${new Date(record.timestamp).toISOString()}` };
        }
        default:
          return { success: false, message: `Unknown action: ${String(action)}` };
      }
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : String(err) };
    }
  }
}
