/**
 * Instance Manager - Manages baseline and canary instance lifecycle.
 * Uses in-memory simulation for testability (no actual Docker/fork).
 */
import { CanaryConfig, InstanceConfig } from './canary-config-types';

export type InstanceStatus = 'stopped' | 'starting' | 'running' | 'error';

export interface MetricPoint {
  timestamp: number;
  sharpe: number;
  slippageBps: number;
  errorRate: number;
  antiBotFlags: number;
  fillRate: number;
  latencyMs: number;
}

export interface InstanceState {
  id: string;
  role: 'baseline' | 'canary';
  status: InstanceStatus;
  startTime: number | null;
  config: InstanceConfig;
  metricsBuffer: MetricPoint[];
}

function makeState(role: 'baseline' | 'canary', config: InstanceConfig): InstanceState {
  return {
    id: `${role}-${Date.now()}`,
    role,
    status: 'stopped',
    startTime: null,
    config,
    metricsBuffer: [],
  };
}

export class InstanceManager {
  private baseline: InstanceState;
  private canary: InstanceState;

  constructor(config: CanaryConfig) {
    this.baseline = makeState('baseline', config.baseline);
    this.canary = makeState('canary', config.canary);
  }

  async startBaseline(): Promise<void> {
    this.baseline.status = 'starting';
    // Simulate async startup
    await Promise.resolve();
    this.baseline.status = 'running';
    this.baseline.startTime = Date.now();
  }

  async startCanary(): Promise<void> {
    this.canary.status = 'starting';
    await Promise.resolve();
    this.canary.status = 'running';
    this.canary.startTime = Date.now();
  }

  async stopInstance(role: 'baseline' | 'canary'): Promise<void> {
    const inst = role === 'baseline' ? this.baseline : this.canary;
    await Promise.resolve();
    inst.status = 'stopped';
    inst.startTime = null;
  }

  getStatus(): { baseline: InstanceState; canary: InstanceState } {
    return { baseline: this.baseline, canary: this.canary };
  }

  recordMetric(role: 'baseline' | 'canary', metric: MetricPoint): void {
    const inst = role === 'baseline' ? this.baseline : this.canary;
    inst.metricsBuffer.push(metric);
  }

  getMetrics(role: 'baseline' | 'canary'): MetricPoint[] {
    return role === 'baseline' ? this.baseline.metricsBuffer : this.canary.metricsBuffer;
  }

  async restartCanary(): Promise<void> {
    await this.stopInstance('canary');
    this.canary.metricsBuffer = [];
    await this.startCanary();
  }
}
