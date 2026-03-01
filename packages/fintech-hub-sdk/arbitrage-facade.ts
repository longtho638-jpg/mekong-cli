/**
 * @agencyos/fintech-hub-sdk — Arbitrage Facade
 * Re-exports cross-exchange arbitrage operations from @agencyos/vibe-arbitrage-engine.
 */
export {
  ArbitrageScanner,
  ArbitrageExecutor,
  type ArbitrageOpportunity,
  type ExecutorConfig as ArbitrageConfig,
} from '@agencyos/vibe-arbitrage-engine';
