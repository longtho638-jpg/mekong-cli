/**
 * Canary Deployment Controller - Main entry point.
 * Orchestrates the full canary deployment lifecycle.
 */
import * as fs from 'fs';
import * as path from 'path';
import { CanaryConfig, DEFAULT_CANARY_CONFIG } from './canary-config-types';
import { InstanceManager } from './instance-manager';
import { TrafficSplitter } from './traffic-splitter';
import { MetricsComparator } from './metrics-comparator';
import { RollbackTrigger } from './rollback-trigger';
import { PromotionManager } from './promotion-manager';
import { DashboardIntegration } from './dashboard-integration';

export class CanaryDeploymentController {
  private config: CanaryConfig;
  private instanceManager: InstanceManager;
  private trafficSplitter: TrafficSplitter;
  private metricsComparator: MetricsComparator;
  private rollbackTrigger: RollbackTrigger;
  private promotionManager: PromotionManager;
  private dashboard: DashboardIntegration;
  private running: boolean = false;

  constructor(configPath?: string) {
    if (configPath) {
      this.config = this.loadConfigSync(configPath);
    } else {
      this.config = DEFAULT_CANARY_CONFIG;
    }
    this.instanceManager = new InstanceManager(this.config);
    this.trafficSplitter = new TrafficSplitter(this.config.trafficSplit);
    this.metricsComparator = new MetricsComparator(this.config.metrics);
    this.rollbackTrigger = new RollbackTrigger(this.config.metrics);
    this.promotionManager = new PromotionManager(this.config.trafficSplit.evaluationPeriodHours);
    this.dashboard = new DashboardIntegration(
      this.instanceManager,
      this.trafficSplitter,
      this.metricsComparator,
      this.rollbackTrigger,
      this.promotionManager,
    );
  }

  async loadConfig(configPath: string): Promise<CanaryConfig> {
    const resolved = path.resolve(configPath);
    if (!fs.existsSync(resolved)) return DEFAULT_CANARY_CONFIG;
    const raw = fs.readFileSync(resolved, 'utf-8');
    return JSON.parse(raw) as CanaryConfig;
  }

  private loadConfigSync(configPath: string): CanaryConfig {
    const resolved = path.resolve(configPath);
    if (!fs.existsSync(resolved)) return DEFAULT_CANARY_CONFIG;
    const raw = fs.readFileSync(resolved, 'utf-8');
    return JSON.parse(raw) as CanaryConfig;
  }

  async start(): Promise<void> {
    if (this.running) return;
    await this.instanceManager.startBaseline();
    await this.instanceManager.startCanary();
    this.promotionManager.startEvaluation();
    this.running = true;
  }

  async stop(): Promise<void> {
    if (!this.running) return;
    await this.instanceManager.stopInstance('canary');
    await this.instanceManager.stopInstance('baseline');
    this.running = false;
  }

  async evaluationCycle(): Promise<void> {
    const baselineMetrics = this.instanceManager.getMetrics('baseline');
    const canaryMetrics = this.instanceManager.getMetrics('canary');
    const comparisons = this.metricsComparator.compareMetrics(baselineMetrics, canaryMetrics);

    if (comparisons.length === 0) return;

    // Check for rollback
    const rollbackEvent = this.rollbackTrigger.evaluate(comparisons);
    if (rollbackEvent) {
      this.promotionManager.forceRollback(comparisons);
      await this.instanceManager.restartCanary();
      return;
    }

    // Check for promotion
    this.promotionManager.checkPromotion(Date.now(), comparisons);
  }

  getDashboard(): DashboardIntegration {
    return this.dashboard;
  }

  isRunning(): boolean {
    return this.running;
  }
}

// Re-exports
export type { CanaryConfig, InstanceConfig, TrafficSplitConfig, MetricsThresholdConfig, AlertConfig } from './canary-config-types';
export { DEFAULT_CANARY_CONFIG } from './canary-config-types';
export type { InstanceStatus, MetricPoint, InstanceState } from './instance-manager';
export { InstanceManager } from './instance-manager';
export type { SplitMode, SplitDecision } from './traffic-splitter';
export { TrafficSplitter } from './traffic-splitter';
export type { ComparisonResult, WelfordState } from './metrics-comparator';
export { MetricsComparator } from './metrics-comparator';
export type { RollbackEvent } from './rollback-trigger';
export { RollbackTrigger } from './rollback-trigger';
export type { PromotionStatus, PromotionRecord } from './promotion-manager';
export { PromotionManager } from './promotion-manager';
export type { CanaryDashboardState } from './dashboard-integration';
export { DashboardIntegration } from './dashboard-integration';
