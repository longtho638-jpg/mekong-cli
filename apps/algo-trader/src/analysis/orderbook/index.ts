/**
 * Order Book Analysis Module
 *
 * Comprehensive order book analysis for Polymarket:
 * - Depth visualization data
 * - Slippage estimation
 * - Order book imbalance
 * - Liquidity concentration zones
 * - Order flow analysis
 *
 * @packageDocumentation
 */

export * from './types';
export * from './orderbook-utils';
export * from './OrderBookAnalyzer';
export * from './OrderFlowAnalyzer';

// Re-export commonly used types
export type { ProcessedOrderBook } from './types';
