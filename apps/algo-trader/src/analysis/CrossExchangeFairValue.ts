/**
 * Cross-Exchange Fair Value Calculator
 *
 * Normalizes prices across different exchanges for accurate comparison.
 * Handles different fee structures, tick sizes, and contract specifications.
 *
 * Key Functions:
 * - Normalize prices to a common basis (0.00-1.00)
 * - Calculate fair value spread across exchanges
 * - Detect arbitrage opportunities with fee-aware calculations
 */

export interface ExchangeConfig {
  name: string;
  makerFee: number;      // Fee for providing liquidity (0.0025 = 0.25%)
  takerFee: number;      // Fee for removing liquidity (0.005 = 0.5%)
  tickSize: number;      // Minimum price increment (0.01 = 1 cent)
  minSize: number;       // Minimum order size
  maxSize: number;       // Maximum order size
}

export interface NormalizedPrice {
  exchange: string;
  yesBid: number;        // Normalized YES bid price
  yesAsk: number;        // Normalized YES ask price
  noBid: number;         // Normalized NO bid price
  noAsk: number;         // Normalized NO ask price
  midPrice: number;      // Fair value midpoint
  timestamp: number;
}

export interface ArbEdge {
  buyExchange: string;   // Where to buy
  sellExchange: string;  // Where to sell (opposite side)
  buyPrice: number;      // Price to buy (incl. fees)
  sellPrice: number;     // Price to sell (incl. fees)
  edge: number;          // Profit margin (0.00-1.00)
  profitPerShare: number;// Expected profit per share
  confidence: number;    // 0.0-1.0 confidence score
}

export const DEFAULT_EXCHANGES: Record<string, ExchangeConfig> = {
  POLYMATERIAL: {
    name: 'POLYMATERIAL',
    makerFee: 0,           // Polymarket: 0% maker fee
    takerFee: 0.0025,      // 0.25% taker fee (25 bps)
    tickSize: 0.01,
    minSize: 1,
    maxSize: 10000,
  },
  KALSHI: {
    name: 'KALSHI',
    makerFee: 0,           // Kalshi: 0% maker fee
    takerFee: 0.0007,      // 0.07% taker fee (7 bps)
    tickSize: 0.01,
    minSize: 1,
    maxSize: 25000,
  },
};

export class CrossExchangeFairValue {
  private exchangeConfigs: Map<string, ExchangeConfig>;

  constructor(exchangeConfigs: Record<string, ExchangeConfig> = DEFAULT_EXCHANGES) {
    this.exchangeConfigs = new Map(Object.entries(exchangeConfigs));
  }

  /**
   * Normalize raw price data from different exchanges to common format
   */
  normalize(
    exchange: string,
    yesBid: number,
    yesAsk: number,
    noBid: number,
    noAsk: number,
  ): NormalizedPrice {
    const config = this.exchangeConfigs.get(exchange);
    if (!config) {
      throw new Error(`Unknown exchange: ${exchange}`);
    }

    // Ensure prices are within valid range [0, 1]
    const clamp = (p: number) => Math.max(0, Math.min(1, p));

    // Round to exchange tick size
    const roundToTick = (p: number) => Math.round(p / config.tickSize) * config.tickSize;

    const normalizedYesBid = roundToTick(clamp(yesBid));
    const normalizedYesAsk = roundToTick(clamp(yesAsk));
    const normalizedNoBid = roundToTick(clamp(noBid));
    const normalizedNoAsk = roundToTick(clamp(noAsk));

    // Mid price = (best bid + best ask) / 2
    const yesMid = (normalizedYesBid + normalizedYesAsk) / 2;
    const noMid = (normalizedNoBid + normalizedNoAsk) / 2;

    // Fair value should have YES + NO = 1.00
    // Use YES mid as primary, NO mid as secondary check
    const fairMid = yesMid;

    return {
      exchange,
      yesBid: normalizedYesBid,
      yesAsk: normalizedYesAsk,
      noBid: normalizedNoBid,
      noAsk: normalizedNoAsk,
      midPrice: fairMid,
      timestamp: Date.now(),
    };
  }

  /**
   * Calculate fee-adjusted prices for execution
   */
  getExecutionPrices(
    normalized: NormalizedPrice,
    side: 'BUY' | 'SELL',
    isMaker: boolean = true,
  ): { effectivePrice: number; fee: number } {
    const config = this.exchangeConfigs.get(normalized.exchange);
    if (!config) {
      throw new Error(`Unknown exchange: ${normalized.exchange}`);
    }

    const feeRate = isMaker ? config.makerFee : config.takerFee;
    let basePrice: number;

    if (side === 'BUY') {
      // Buying: pay ask price + taker fee (or maker if providing liquidity)
      basePrice = normalized.yesAsk;
    } else {
      // Selling: receive bid price - taker fee (or maker if providing liquidity)
      basePrice = normalized.yesBid;
    }

    const fee = basePrice * feeRate;
    const effectivePrice = side === 'BUY' ? basePrice + fee : basePrice - fee;

    return { effectivePrice, fee };
  }

  /**
   * Detect cross-exchange arbitrage opportunity
   *
   * Arb exists when:
   * - Buy YES on Exchange A + Buy NO on Exchange B < 1.00 (after fees)
   * - Or vice versa
   */
  detectArb(
    priceA: NormalizedPrice,
    priceB: NormalizedPrice,
  ): ArbEdge | null {
    // Scenario 1: Buy YES on A, Buy NO on B
    const buyYesOnA = this.getExecutionPrices(priceA, 'BUY', false); // Taker
    const buyNoOnB = this.getExecutionPrices(priceB, 'BUY', false);  // Taker (for NO)

    // Total cost to buy both sides
    const totalCostScenario1 = buyYesOnA.effectivePrice + buyNoOnB.effectivePrice;
    const edgeScenario1 = 1.00 - totalCostScenario1;

    // Scenario 2: Buy NO on A, Buy YES on B
    const buyNoOnA = this.getExecutionPrices(priceA, 'BUY', false);   // Taker (for NO)
    const buyYesOnB = this.getExecutionPrices(priceB, 'BUY', false);  // Taker

    const totalCostScenario2 = (1 - buyNoOnA.effectivePrice) + buyYesOnB.effectivePrice;
    const edgeScenario2 = 1.00 - totalCostScenario2;

    // Find best edge
    let bestEdge = Math.max(edgeScenario1, edgeScenario2);
    const minEdgeThreshold = 0.005; // 0.5% minimum edge after fees

    if (bestEdge < minEdgeThreshold) {
      return null; // No arb opportunity
    }

    // Determine which scenario is better
    let arbEdge: ArbEdge;
    if (edgeScenario1 >= edgeScenario2) {
      // Buy YES on A, Buy NO on B
      arbEdge = {
        buyExchange: priceA.exchange,
        sellExchange: priceB.exchange,
        buyPrice: buyYesOnA.effectivePrice,
        sellPrice: buyNoOnB.effectivePrice,
        edge: edgeScenario1,
        profitPerShare: edgeScenario1,
        confidence: Math.min(edgeScenario1 / 0.02, 1.0), // Scale to 2% = 100% confidence
      };
    } else {
      // Buy NO on A, Buy YES on B
      arbEdge = {
        buyExchange: priceB.exchange,
        sellExchange: priceA.exchange,
        buyPrice: buyYesOnB.effectivePrice,
        sellPrice: buyNoOnA.effectivePrice,
        edge: edgeScenario2,
        profitPerShare: edgeScenario2,
        confidence: Math.min(edgeScenario2 / 0.02, 1.0),
      };
    }

    return arbEdge;
  }

  /**
   * Calculate fair value spread between two exchanges
   */
  calculateSpread(priceA: NormalizedPrice, priceB: NormalizedPrice): {
    spread: number;
    direction: 'A_TO_B' | 'B_TO_A' | 'NEUTRAL';
    fairValueDiff: number;
  } {
    const spread = priceB.midPrice - priceA.midPrice;
    const absSpread = Math.abs(spread);

    // Determine direction of advantage
    let direction: 'A_TO_B' | 'B_TO_A' | 'NEUTRAL' = 'NEUTRAL';
    if (absSpread > 0.01) { // 1 cent threshold
      direction = spread > 0 ? 'A_TO_B' : 'B_TO_A';
    }

    return {
      spread: absSpread,
      direction,
      fairValueDiff: priceB.midPrice - priceA.midPrice,
    };
  }

  /**
   * Get exchange configuration
   */
  getExchangeConfig(exchange: string): ExchangeConfig | undefined {
    return this.exchangeConfigs.get(exchange);
  }

  /**
   * Add or update exchange configuration
   */
  addExchangeConfig(exchange: string, config: ExchangeConfig): void {
    this.exchangeConfigs.set(exchange, config);
  }
}
