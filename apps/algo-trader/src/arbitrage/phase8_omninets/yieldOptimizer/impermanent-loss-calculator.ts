/**
 * Impermanent Loss Calculator — closed-form IL formulas.
 * Supports standard Uniswap V2 formula and Uni V3 tick-based approximation.
 */

export interface ILResult {
  /** Impermanent loss as a fraction (0..1). E.g. 0.05 = 5% IL. */
  ilFraction: number;
  /** IL in USD given provided liquidity. */
  ilUsd: number;
  /** Price ratio at entry vs now. */
  priceRatio: number;
  formula: 'v2' | 'v3-tick';
}

export interface V3TickParams {
  /** Lower tick price bound. */
  priceLower: number;
  /** Upper tick price bound. */
  priceUpper: number;
}

export class ImpermanentLossCalculator {
  /**
   * Standard Uniswap V2 IL formula.
   * IL = 2*sqrt(r)/(1+r) - 1  where r = p1/p0
   *
   * @param p0 - Entry price (token1 per token0)
   * @param p1 - Current price
   * @param liquidityUsd - USD value of LP position at entry
   */
  calculateV2(p0: number, p1: number, liquidityUsd: number): ILResult {
    if (p0 <= 0) throw new Error('Entry price must be positive');
    if (p1 <= 0) throw new Error('Current price must be positive');
    if (liquidityUsd < 0) throw new Error('liquidityUsd must be non-negative');

    const r = p1 / p0;
    const holdValue = liquidityUsd * (0.5 + 0.5 * r); // HODL: 50/50 split
    const lpValue = liquidityUsd * Math.sqrt(r);        // LP value at current price
    const ilFraction = Math.max(0, 1 - lpValue / holdValue);

    return {
      ilFraction,
      ilUsd: ilFraction * liquidityUsd,
      priceRatio: r,
      formula: 'v2',
    };
  }

  /**
   * Uniswap V3 tick-based IL approximation.
   * When price moves outside [priceLower, priceUpper], position
   * becomes 100% one asset — approximated as V2 IL clamped to range.
   *
   * @param p0 - Entry price
   * @param p1 - Current price
   * @param liquidityUsd - USD LP value at entry
   * @param tickParams - Uni V3 price range bounds
   */
  calculateV3(
    p0: number,
    p1: number,
    liquidityUsd: number,
    tickParams: V3TickParams,
  ): ILResult {
    if (p0 <= 0 || p1 <= 0) throw new Error('Prices must be positive');
    const { priceLower, priceUpper } = tickParams;

    // Clamp current price to range for IL calc
    const p1Clamped = Math.min(Math.max(p1, priceLower), priceUpper);
    const p0Clamped = Math.min(Math.max(p0, priceLower), priceUpper);

    const r = p0Clamped > 0 ? p1Clamped / p0Clamped : 1;
    const rangeFactor = (priceUpper - priceLower) / priceUpper; // narrower range → amplified IL

    const v2Result = this.calculateV2(p0Clamped, p1Clamped, liquidityUsd);
    // V3 amplifies IL by concentration factor (simplified)
    const amplification = 1 + rangeFactor;
    const ilFraction = Math.min(v2Result.ilFraction * amplification, 1);

    return {
      ilFraction,
      ilUsd: ilFraction * liquidityUsd,
      priceRatio: r,
      formula: 'v3-tick',
    };
  }

  /**
   * Break-even fee yield needed to offset IL.
   * Returns annualised fee rate required.
   */
  breakEvenFeeRate(ilFraction: number, daysHeld: number): number {
    if (daysHeld <= 0) throw new Error('daysHeld must be positive');
    return (ilFraction / daysHeld) * 365;
  }
}
