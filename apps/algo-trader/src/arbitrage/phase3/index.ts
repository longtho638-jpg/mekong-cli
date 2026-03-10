/**
 * Phase 3 barrel exports — MEV Sandwich, Portfolio Rebalancer, Predatory Liquidity.
 * Uses `export type` for interface-only re-exports (isolatedModules compliance).
 */

export { Phase3Orchestrator } from './phase3-orchestrator';
export type { Phase3Config, Phase3Status, Phase3WsMessage } from './phase3-orchestrator';

export { MevSandwichEngine } from './mev-sandwich/index';
export type { MevSandwichConfig, PendingTransaction, SandwichOpportunity } from './mev-sandwich/index';

export { PortfolioRebalancerEngine } from './portfolio-rebalancer/index';
export type {
  PortfolioRebalancerConfig,
  AssetExposure,
  PortfolioSnapshot,
  RiskMetrics,
  TargetAllocation,
  OptimizationResult,
  RebalanceTrade,
} from './portfolio-rebalancer/index';

export { PredatoryLiquidityEngine } from './predatory-liquidity/index';
export type {
  PredatoryLiquidityConfig,
  PumpSignal,
  MakerOrder,
  DumpTrade,
} from './predatory-liquidity/index';
