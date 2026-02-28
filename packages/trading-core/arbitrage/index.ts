// Trading Core — Arbitrage modules barrel export
// Pure-logic primitives + monitoring + execution SDK
export * from './arbitrage-types';
export * from './arb-logger';
export * from './signal-scorer';
export * from './spread-history-tracker';
export * from './fee-calculator';
export * from './emergency-circuit-breaker';
export * from './profit-tracker';
export * from './adaptive-spread-threshold';
export * from './latency-optimizer';
export * from './order-book-analyzer';
export * from './balance-rebalancer';
// Monitoring & execution modules (extracted from algo-trader)
export * from './arbitrage-scanner';
export * from './arbitrage-executor';
export * from './multi-exchange-connector';
export * from './real-time-price-aggregator';
export * from './websocket-price-feed';
export * from './arbitrage-backtester';
export * from './spread-detector-engine';
export * from './arbitrage-orchestrator';
// Strategy implementations (IStrategy-based, candle-driven)
export * from './cross-exchange-arbitrage-strategy';
export * from './triangular-arbitrage-strategy';
export * from './statistical-arbitrage-strategy';
