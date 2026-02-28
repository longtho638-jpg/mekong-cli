/**
 * FeeCalculator — Exchange-specific fee tier calculation.
 * Provides accurate fee computation for Binance/OKX/Bybit/Gate.io
 * with maker/taker rates, VIP tier support, and net profit calculation.
 *
 * Used by ArbitrageExecutor and ArbitrageBacktester for accurate P&L.
 */

export interface FeeTier {
  level: string;            // e.g., "VIP0", "Regular", "VIP1"
  makerRate: number;        // Maker fee rate (e.g., 0.001 = 0.1%)
  takerRate: number;        // Taker fee rate (e.g., 0.001 = 0.1%)
  minVolume30d: number;     // Min 30-day volume to qualify (USD)
}

export interface ExchangeFeeSchedule {
  exchange: string;
  tiers: FeeTier[];
  withdrawalFees: Map<string, number>;  // currency → flat fee
}

export interface FeeBreakdown {
  exchange: string;
  side: 'buy' | 'sell';
  orderType: 'maker' | 'taker';
  rate: number;
  feeUsd: number;
  feeBase: number;          // Fee in base currency
}

export interface ArbitrageFeeReport {
  buyFee: FeeBreakdown;
  sellFee: FeeBreakdown;
  totalFeesUsd: number;
  withdrawalFeeUsd: number;  // If transferring between exchanges
  totalCostUsd: number;      // Fees + withdrawal
  breakEvenSpreadPercent: number;  // Min spread needed to cover all costs
}

// Default fee schedules for supported exchanges (spot, taker rates for market orders)
const DEFAULT_FEE_SCHEDULES: ExchangeFeeSchedule[] = [
  {
    exchange: 'binance',
    tiers: [
      { level: 'Regular', makerRate: 0.001, takerRate: 0.001, minVolume30d: 0 },
      { level: 'VIP1', makerRate: 0.0009, takerRate: 0.001, minVolume30d: 1000000 },
      { level: 'VIP2', makerRate: 0.0008, takerRate: 0.001, minVolume30d: 5000000 },
      { level: 'VIP3', makerRate: 0.00042, takerRate: 0.0006, minVolume30d: 20000000 },
    ],
    withdrawalFees: new Map([['BTC', 0.0000046], ['ETH', 0.00054], ['USDT', 1]]),
  },
  {
    exchange: 'okx',
    tiers: [
      { level: 'Regular', makerRate: 0.0008, takerRate: 0.001, minVolume30d: 0 },
      { level: 'VIP1', makerRate: 0.0006, takerRate: 0.0009, minVolume30d: 5000000 },
      { level: 'VIP2', makerRate: 0.0005, takerRate: 0.0007, minVolume30d: 10000000 },
      { level: 'VIP3', makerRate: 0.00035, takerRate: 0.0005, minVolume30d: 20000000 },
    ],
    withdrawalFees: new Map([['BTC', 0.0001], ['ETH', 0.0014], ['USDT', 1]]),
  },
  {
    exchange: 'bybit',
    tiers: [
      { level: 'Regular', makerRate: 0.001, takerRate: 0.001, minVolume30d: 0 },
      { level: 'VIP1', makerRate: 0.0006, takerRate: 0.0008, minVolume30d: 1000000 },
      { level: 'VIP2', makerRate: 0.0004, takerRate: 0.0006, minVolume30d: 5000000 },
      { level: 'VIP3', makerRate: 0.0002, takerRate: 0.0004, minVolume30d: 25000000 },
    ],
    withdrawalFees: new Map([['BTC', 0.0002], ['ETH', 0.0012], ['USDT', 1]]),
  },
  {
    exchange: 'gateio',
    tiers: [
      { level: 'Regular', makerRate: 0.002, takerRate: 0.002, minVolume30d: 0 },
      { level: 'VIP1', makerRate: 0.00185, takerRate: 0.00195, minVolume30d: 1500000 },
      { level: 'VIP2', makerRate: 0.00175, takerRate: 0.00185, minVolume30d: 3000000 },
      { level: 'VIP3', makerRate: 0.0015, takerRate: 0.0016, minVolume30d: 6000000 },
    ],
    withdrawalFees: new Map([['BTC', 0.001], ['ETH', 0.0082], ['USDT', 4]]),
  },
];

export class FeeCalculator {
  private schedules: Map<string, ExchangeFeeSchedule> = new Map();
  private vipLevels: Map<string, string> = new Map(); // exchange → current VIP level

  constructor() {
    // Load default schedules
    for (const schedule of DEFAULT_FEE_SCHEDULES) {
      this.schedules.set(schedule.exchange, schedule);
    }
  }

  /**
   * Set custom fee schedule for an exchange (override defaults).
   */
  setSchedule(schedule: ExchangeFeeSchedule): void {
    this.schedules.set(schedule.exchange, schedule);
  }

  /**
   * Set VIP level for an exchange (affects fee tier selection).
   */
  setVipLevel(exchange: string, level: string): void {
    this.vipLevels.set(exchange, level);
  }

  /**
   * Get the current fee tier for an exchange.
   */
  getTier(exchange: string): FeeTier {
    const schedule = this.schedules.get(exchange);
    if (!schedule) {
      // Default fallback: 0.1% both sides
      return { level: 'Unknown', makerRate: 0.001, takerRate: 0.001, minVolume30d: 0 };
    }

    const vipLevel = this.vipLevels.get(exchange);
    if (vipLevel) {
      const tier = schedule.tiers.find(t => t.level === vipLevel);
      if (tier) return tier;
    }

    // Default to first tier (Regular)
    return schedule.tiers[0];
  }

  /**
   * Calculate fee for a single trade.
   * Arbitrage uses market orders → taker rate.
   */
  calculateFee(
    exchange: string,
    side: 'buy' | 'sell',
    priceUsd: number,
    amountBase: number,
    orderType: 'maker' | 'taker' = 'taker'
  ): FeeBreakdown {
    const tier = this.getTier(exchange);
    const rate = orderType === 'maker' ? tier.makerRate : tier.takerRate;
    const notionalUsd = priceUsd * amountBase;
    const feeUsd = notionalUsd * rate;
    const feeBase = amountBase * rate;

    return {
      exchange,
      side,
      orderType,
      rate,
      feeUsd,
      feeBase,
    };
  }

  /**
   * Calculate total fees for an arbitrage trade (buy + sell across exchanges).
   * Optionally includes withdrawal fee if transferring assets between exchanges.
   */
  calculateArbitrageFees(
    buyExchange: string,
    sellExchange: string,
    symbol: string,
    buyPrice: number,
    sellPrice: number,
    amountBase: number,
    includeWithdrawal: boolean = false
  ): ArbitrageFeeReport {
    const buyFee = this.calculateFee(buyExchange, 'buy', buyPrice, amountBase);
    const sellFee = this.calculateFee(sellExchange, 'sell', sellPrice, amountBase);

    let withdrawalFeeUsd = 0;
    if (includeWithdrawal) {
      const baseCurrency = symbol.split('/')[0]; // "BTC/USDT" → "BTC"
      withdrawalFeeUsd = this.getWithdrawalFee(buyExchange, baseCurrency) * buyPrice;
    }

    const totalFeesUsd = buyFee.feeUsd + sellFee.feeUsd;
    const totalCostUsd = totalFeesUsd + withdrawalFeeUsd;

    // Break-even spread: min spread % needed to cover all costs
    const avgPrice = (buyPrice + sellPrice) / 2;
    const notional = avgPrice * amountBase;
    const breakEvenSpreadPercent = notional > 0 ? (totalCostUsd / notional) * 100 : 0;

    return {
      buyFee,
      sellFee,
      totalFeesUsd,
      withdrawalFeeUsd,
      totalCostUsd,
      breakEvenSpreadPercent,
    };
  }

  /**
   * Get withdrawal fee for a currency on an exchange.
   */
  getWithdrawalFee(exchange: string, currency: string): number {
    const schedule = this.schedules.get(exchange);
    if (!schedule) return 0;
    return schedule.withdrawalFees.get(currency) || 0;
  }

  /**
   * Calculate net profit for an arbitrage opportunity after all costs.
   */
  calculateNetProfit(
    buyExchange: string,
    sellExchange: string,
    symbol: string,
    buyPrice: number,
    sellPrice: number,
    amountBase: number,
    slippageCostUsd: number = 0
  ): { grossProfitUsd: number; totalCostsUsd: number; netProfitUsd: number; profitable: boolean } {
    const feeReport = this.calculateArbitrageFees(
      buyExchange, sellExchange, symbol,
      buyPrice, sellPrice, amountBase
    );

    const grossProfitUsd = (sellPrice - buyPrice) * amountBase;
    const totalCostsUsd = feeReport.totalCostUsd + slippageCostUsd;
    const netProfitUsd = grossProfitUsd - totalCostsUsd;

    return {
      grossProfitUsd,
      totalCostsUsd,
      netProfitUsd,
      profitable: netProfitUsd > 0,
    };
  }

  /**
   * Compare fee costs across all registered exchanges for a given trade size.
   */
  compareFees(priceUsd: number, amountBase: number): { exchange: string; takerFeeUsd: number; makerFeeUsd: number }[] {
    const results: { exchange: string; takerFeeUsd: number; makerFeeUsd: number }[] = [];

    for (const exchange of this.schedules.keys()) {
      const takerFee = this.calculateFee(exchange, 'buy', priceUsd, amountBase, 'taker');
      const makerFee = this.calculateFee(exchange, 'buy', priceUsd, amountBase, 'maker');
      results.push({
        exchange,
        takerFeeUsd: takerFee.feeUsd,
        makerFeeUsd: makerFee.feeUsd,
      });
    }

    return results.sort((a, b) => a.takerFeeUsd - b.takerFeeUsd);
  }

  /** Get all registered exchange names */
  getExchanges(): string[] {
    return Array.from(this.schedules.keys());
  }
}
