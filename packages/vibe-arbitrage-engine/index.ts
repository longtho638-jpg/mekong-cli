/**
 * @agencyos/vibe-arbitrage-engine
 * Cross-exchange arbitrage engine — spread detection, signal scoring,
 * orderbook validation, circuit breaker, auto-execution for Binance/OKX/Bybit.
 *
 * Peer dependency: @agencyos/trading-core (interfaces, analysis)
 */

// Types & utilities
export * from './arbitrage-types';
export * from './arb-logger';

// Signal processing & analysis
export * from './signal-scorer';
export * from './spread-history-tracker';
export * from './fee-calculator';
export * from './order-book-analyzer';
export * from './adaptive-spread-threshold';
export * from './latency-optimizer';

// Risk management
export * from './emergency-circuit-breaker';
export * from './profit-tracker';
export * from './balance-rebalancer';

// Connectivity & data feeds
export * from './arbitrage-scanner';
export * from './arbitrage-executor';
export * from './multi-exchange-connector';
export * from './real-time-price-aggregator';
export * from './websocket-price-feed';

// Backtesting
export * from './arbitrage-backtester';

// AGI intelligence layer
export * from './regime-detector';
export * from './kelly-position-sizer';

// Engines (top-level orchestrators)
export * from './spread-detector-engine';
export * from './arbitrage-orchestrator';
export * from './agi-arbitrage-engine';

// Strategy implementations
export * from './strategies';
