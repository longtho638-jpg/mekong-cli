// @agencyos/trading-core — Unified export
// Reusable algorithmic trading primitives for any exchange/strategy
export * from './interfaces';
export * from './core';
export * from './analysis';
export * from './exchanges';

// Arbitrage re-exported separately to avoid MarketRegime name collision
// (core/signal-filter.ts and vibe-arbitrage-engine/regime-detector.ts both export it)
// Import arbitrage directly: '@agencyos/trading-core/arbitrage'
