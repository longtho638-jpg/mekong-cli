/**
 * Candle (OHLCV) data types for trading systems.
 * Reusable across any exchange or data provider.
 */

/** Typed metadata fields used by arbitrage and multi-exchange strategies */
export interface ICandleMetadata {
  /** Cross-Exchange Arbitrage: price of same asset on exchange B */
  exchangeBPrice?: number;
  /** Triangular Arbitrage: ETH/BTC rate */
  priceETH_BTC?: number;
  /** Triangular Arbitrage: ETH/USDT rate */
  priceETH_USDT?: number;
  /** Statistical Arbitrage (Pairs Trading): price of correlated asset B */
  priceB?: number;
  /** Allow other strategy-specific fields */
  [key: string]: number | string | boolean | undefined;
}

/** Standard OHLCV candle with optional metadata */
export interface ICandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  metadata?: ICandleMetadata;
}
