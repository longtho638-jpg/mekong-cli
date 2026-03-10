/**
 * Spread Detector — identifies arbitrage opportunities between on-chain oracle
 * prices and CEX prices for Real-World Assets.
 * Emits SpreadOpportunity only when netSpread (after fees + slippage) exceeds
 * the configured minimum threshold.
 */

export interface SpreadDetectorConfig {
  /** Minimum NET spread in basis points to emit an opportunity. Default: 10 bps. */
  minSpreadBps: number;
  /** Round-trip fee cost in basis points. Default: 5 bps. */
  feeBps: number;
  /** Estimated slippage in basis points. Default: 3 bps. */
  slippageBps: number;
}

export interface SpreadOpportunity {
  assetId: string;
  onChainPrice: number;
  offChainPrice: number;
  /** Raw spread in basis points (absolute). */
  spreadBps: number;
  /** Net spread after fees and slippage. */
  netSpreadBps: number;
  /** buy_onchain: on-chain price is cheaper → buy on-chain, sell on CEX.
   *  sell_onchain: CEX price is cheaper → buy on CEX, sell on-chain. */
  direction: 'buy_onchain' | 'sell_onchain';
  timestamp: number;
}

const DEFAULT_CONFIG: SpreadDetectorConfig = {
  minSpreadBps: 10,
  feeBps: 5,
  slippageBps: 3,
};

export class SpreadDetector {
  private readonly cfg: SpreadDetectorConfig;
  private readonly costBps: number;

  constructor(config: Partial<SpreadDetectorConfig> = {}) {
    this.cfg = { ...DEFAULT_CONFIG, ...config };
    this.costBps = this.cfg.feeBps + this.cfg.slippageBps;
  }

  /**
   * Detect an arbitrage spread between on-chain and off-chain prices.
   * Returns a SpreadOpportunity when netSpread > minSpreadBps, otherwise null.
   *
   * @param onChainPrice  Price from RwaOracleConnector
   * @param offChainPrice Price from CexPriceFetcher
   * @param assetId       Asset identifier
   */
  detectSpread(
    onChainPrice: number,
    offChainPrice: number,
    assetId: string,
  ): SpreadOpportunity | null {
    if (onChainPrice <= 0 || offChainPrice <= 0) return null;

    const mid = (onChainPrice + offChainPrice) / 2;
    const rawDiff = Math.abs(onChainPrice - offChainPrice);
    const spreadBps = parseFloat(((rawDiff / mid) * 10_000).toFixed(4));
    const netSpreadBps = parseFloat((spreadBps - this.costBps).toFixed(4));

    if (netSpreadBps <= this.cfg.minSpreadBps) return null;

    // buy_onchain when on-chain is cheaper (on-chain < CEX)
    const direction: SpreadOpportunity['direction'] =
      onChainPrice < offChainPrice ? 'buy_onchain' : 'sell_onchain';

    return {
      assetId,
      onChainPrice,
      offChainPrice,
      spreadBps,
      netSpreadBps,
      direction,
      timestamp: Date.now(),
    };
  }

  getConfig(): SpreadDetectorConfig {
    return { ...this.cfg };
  }
}
