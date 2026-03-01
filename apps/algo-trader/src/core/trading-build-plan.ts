/**
 * Trading Build Plan — Nixpacks-inspired 3-phase pipeline.
 *
 * Mirrors Nixpacks' Detect → Plan → Build pattern for trading:
 * 1. DETECT: Analyze market conditions, available data, exchange state
 * 2. PLAN:   Select strategy, configure parameters, set risk limits
 * 3. EXECUTE: Run the trading strategy with the generated plan
 *
 * The plan is a structured object (like Nixpacks BuildPlan) that captures
 * all decisions made during detection and can be serialized/replayed.
 */

import { StrategyProvider, DetectionContext, StrategyMetadata } from './strategy-provider-registry';

/** Phase status tracking */
export type PhaseStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

/** Setup phase — environment preparation (like Nixpacks setup) */
export interface SetupPhase {
  exchangeIds: string[];
  pairs: string[];
  timeframe: string;
  requiredApiKeys: string[];
  status: PhaseStatus;
}

/** Install phase — load dependencies (like Nixpacks install) */
export interface InstallPhase {
  strategyId: string;
  strategyName: string;
  indicators: string[];
  minHistoryCandles: number;
  status: PhaseStatus;
}

/** Build phase — configure strategy parameters (like Nixpacks build) */
export interface BuildPhase {
  parameters: Record<string, number | string | boolean>;
  riskLimits: {
    maxPositionSizeUsd: number;
    maxDailyLossUsd: number;
    stopLossPercent: number;
    takeProfitPercent: number;
  };
  status: PhaseStatus;
}

/** Start phase — execution configuration (like Nixpacks start) */
export interface StartPhase {
  mode: 'backtest' | 'paper' | 'live';
  pollIntervalMs: number;
  maxRuntime: number;       // max milliseconds, 0 = unlimited
  enableCircuitBreaker: boolean;
  status: PhaseStatus;
}

/** Complete trading build plan — structured decision record */
export interface TradingBuildPlan {
  id: string;
  createdAt: number;
  detectionContext: DetectionContext;
  selectedProvider: StrategyMetadata;
  setup: SetupPhase;
  install: InstallPhase;
  build: BuildPhase;
  start: StartPhase;
}

/**
 * TradingPlanBuilder — generates TradingBuildPlan from detection context.
 * Analogous to Nixpacks' plan generation from source code analysis.
 */
export class TradingPlanBuilder {
  /** Generate a build plan from provider and context */
  static generatePlan(
    provider: StrategyProvider,
    context: DetectionContext,
    overrides?: Partial<{
      maxPositionSizeUsd: number;
      maxDailyLossUsd: number;
      mode: 'backtest' | 'paper' | 'live';
      pollIntervalMs: number;
    }>
  ): TradingBuildPlan {
    const meta = provider.metadata;

    return {
      id: `plan-${Date.now()}-${meta.id}`,
      createdAt: Date.now(),
      detectionContext: context,
      selectedProvider: meta,
      setup: {
        exchangeIds: [context.exchangeId],
        pairs: [context.pair],
        timeframe: context.timeframe,
        requiredApiKeys: [`${context.exchangeId.toUpperCase()}_API_KEY`],
        status: 'pending',
      },
      install: {
        strategyId: meta.id,
        strategyName: meta.name,
        indicators: meta.requiredIndicators,
        minHistoryCandles: meta.minHistoryCandles,
        status: 'pending',
      },
      build: {
        parameters: {},
        riskLimits: {
          maxPositionSizeUsd: overrides?.maxPositionSizeUsd ?? 500,
          maxDailyLossUsd: overrides?.maxDailyLossUsd ?? 50,
          stopLossPercent: 2.0,
          takeProfitPercent: 5.0,
        },
        status: 'pending',
      },
      start: {
        mode: overrides?.mode ?? 'paper',
        pollIntervalMs: overrides?.pollIntervalMs ?? 2000,
        maxRuntime: 0,
        enableCircuitBreaker: true,
        status: 'pending',
      },
    };
  }

  /** Serialize plan to JSON (for persistence/replay) */
  static serialize(plan: TradingBuildPlan): string {
    return JSON.stringify(plan, null, 2);
  }

  /** Deserialize plan from JSON */
  static deserialize(json: string): TradingBuildPlan {
    return JSON.parse(json) as TradingBuildPlan;
  }
}
