/**
 * @agencyos/fintech-hub-sdk — Arbitrage Facade
 * Re-exports cross-exchange arbitrage operations from @agencyos/vibe-arbitrage-engine.
 */
export {
  createArbitrageScanner,
  createArbitrageExecutor,
  type ArbitrageOpportunity,
  type ArbitrageConfig,
} from '@agencyos/vibe-arbitrage-engine';
