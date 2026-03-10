/**
 * Arbitrage Opportunity — emitted when profitable spread detected
 */
export interface IArbitrageOpportunity {
  id: string;                    // uuid or timestamp-based
  symbol: string;                // e.g. 'BTC/USDT'
  buyExchange: string;           // e.g. 'binance'
  sellExchange: string;          // e.g. 'bybit'
  buyPrice: number;
  sellPrice: number;
  spreadPercent: number;         // raw spread before fees
  netProfitPercent: number;      // after fees + slippage
  estimatedProfitUsd: number;    // based on configured position size
  buyFee: number;                // taker fee on buy exchange
  sellFee: number;               // taker fee on sell exchange
  slippageEstimate: number;      // estimated slippage (default 0.1%)
  timestamp: number;             // when detected
  expiresAt: number;             // TTL for opportunity (default 5s)
}
