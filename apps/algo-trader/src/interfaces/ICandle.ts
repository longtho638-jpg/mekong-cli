/**
 * Typed metadata fields used by arbitrage strategies.
 * Each strategy reads a specific subset of these fields.
 */
export interface ICandleMetadata {
  /** Cross-Exchange Arbitrage: price of the same asset on exchange B */
  exchangeBPrice?: number;
  /** Triangular Arbitrage: ETH/BTC rate */
  priceETH_BTC?: number;
  /** Triangular Arbitrage: ETH/USDT rate */
  priceETH_USDT?: number;
  /** Statistical Arbitrage (Pairs Trading): price of the correlated asset B */
  priceB?: number;
  /** Allow other strategy-specific fields while still being type-aware */
  [key: string]: number | string | boolean | undefined;
}

export interface ICandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  metadata?: ICandleMetadata;
}
