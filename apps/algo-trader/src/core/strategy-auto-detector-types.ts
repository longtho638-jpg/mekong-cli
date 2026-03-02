/**
 * strategy-auto-detector-types — Shared types for strategy auto-detection and build plan execution.
 * Extracted from StrategyAutoDetector to enable reuse across detectors and build phase modules.
 */

export type StrategyType = 'trend' | 'momentum' | 'arbitrage' | 'mean-reversion' | 'composite' | 'unknown';

export interface DetectionResult {
  type: StrategyType;
  confidence: number; // 0-1
  provider: string;   // Which detector matched
  markers: string[];  // What triggered detection
}

export interface StrategyDetector {
  name: string;
  priority: number; // Higher = checked first
  detect: (config: StrategyConfig) => DetectionResult | null;
}

export interface StrategyConfig {
  name?: string;
  indicators?: string[];
  exchanges?: string[];
  pairs?: string[];
  params?: Record<string, unknown>;
  type?: string; // Explicit override
}

export type PhaseStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped';

export interface BuildPhase {
  id: string;
  name: string;
  status: PhaseStatus;
  gate?: (result: PhaseResult) => boolean; // Must pass to continue
  execute: (context: BuildContext) => Promise<PhaseResult>;
}

export interface PhaseResult {
  phaseId: string;
  status: PhaseStatus;
  metrics: Record<string, number>;
  output?: string;
}

export interface BuildContext {
  strategyType: StrategyType;
  config: StrategyConfig;
  previousResults: PhaseResult[];
}

export interface BuildPlan {
  strategyType: StrategyType;
  phases: BuildPhase[];
  config: StrategyConfig;
}
