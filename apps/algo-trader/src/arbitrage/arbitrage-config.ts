/**
 * Arbitrage Config — Configuration interfaces and defaults
 */

export interface ArbitrageConfig {
  exchanges: string[];           // ['binance', 'bybit', 'okx']
  symbols: string[];             // ['BTC/USDT', 'ETH/USDT']
  pollIntervalMs: number;        // default 10000 (10s)
  minNetProfitPercent: number;   // default 0.5% after fees
  positionSizeUsd: number;       // default 1000 USDT per leg
  maxSlippagePercent: number;    // default 0.1%
  opportunityTtlMs: number;      // default 5000 (5s)
  enabled: boolean;              // master switch
}

export const DEFAULT_ARBITRAGE_CONFIG: ArbitrageConfig = {
  exchanges: ['binance', 'bybit', 'okx'],
  symbols: ['BTC/USDT', 'ETH/USDT'],
  pollIntervalMs: 10000,
  minNetProfitPercent: 0.5,
  positionSizeUsd: 1000,
  maxSlippagePercent: 0.1,
  opportunityTtlMs: 5000,
  enabled: false,
};

/**
 * Load arbitrage config from environment or use defaults
 */
export function loadArbitrageConfig(): ArbitrageConfig {
  const config = { ...DEFAULT_ARBITRAGE_CONFIG };

  // Override from env if available
  if (process.env.ARBITRAGE_EXCHANGES) {
    config.exchanges = process.env.ARBITRAGE_EXCHANGES.split(',');
  }
  if (process.env.ARBITRAGE_SYMBOLS) {
    config.symbols = process.env.ARBITRAGE_SYMBOLS.split(',');
  }
  if (process.env.ARBITRAGE_MIN_PROFIT) {
    config.minNetProfitPercent = parseFloat(process.env.ARBITRAGE_MIN_PROFIT);
  }
  if (process.env.ARBITRAGE_POSITION_SIZE) {
    config.positionSizeUsd = parseFloat(process.env.ARBITRAGE_POSITION_SIZE);
  }
  if (process.env.ARBITRAGE_ENABLED === 'true') {
    config.enabled = true;
  }

  return config;
}
