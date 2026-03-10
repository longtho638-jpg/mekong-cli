/**
 * Phase 7: Autonomous Alpha Nexus (AAN) — barrel exports.
 *
 * Three modules:
 * 1. Predictive Liquidity Engine (PLE)
 * 2. Multi-Agent RL Spread Optimizer (MARSO)
 * 3. Cross-Chain Triangular Arbitrage with MEV Protection (CCTAMP)
 *
 * All modules default to disabled + dry-run mode.
 */

// Module 1: Predictive Liquidity Engine
export { PredictiveLiquidityEngine } from './predictiveLiquidity/index';
export type { PLEConfig } from './predictiveLiquidity/index';

// Module 2: RL Spread Optimizer
export { RLSpreadOptimizer } from './rlSpreadOptimizer/index';
export type { RLSpreadOptimizerConfig } from './rlSpreadOptimizer/index';

// Module 3: Cross-Chain Arbitrage
export { CrossChainArbitrageEngine } from './crossChainArbitrage/index';
export type { CrossChainArbitrageConfig } from './crossChainArbitrage/index';
