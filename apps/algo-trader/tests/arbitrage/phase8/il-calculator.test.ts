/**
 * Tests: impermanent-loss-calculator.ts — IL formula correctness.
 */

import { ImpermanentLossCalculator } from '../../../src/arbitrage/phase8_omninets/yieldOptimizer/impermanent-loss-calculator';

describe('ImpermanentLossCalculator — V2', () => {
  const calc = new ImpermanentLossCalculator();

  it('returns 0 IL when price unchanged', () => {
    const result = calc.calculateV2(1000, 1000, 10_000);
    expect(result.ilFraction).toBeCloseTo(0, 5);
    expect(result.ilUsd).toBeCloseTo(0, 2);
    expect(result.formula).toBe('v2');
  });

  it('IL is positive when price increases 2x', () => {
    const result = calc.calculateV2(1000, 2000, 10_000);
    // Known value: IL = 1 - 2*sqrt(2)/(1+2) ≈ 0.0572
    expect(result.ilFraction).toBeGreaterThan(0);
    expect(result.ilFraction).toBeCloseTo(0.0572, 2);
  });

  it('IL is symmetric: 2x up ≈ 0.5x down', () => {
    const up = calc.calculateV2(1000, 2000, 10_000);
    const down = calc.calculateV2(1000, 500, 10_000);
    expect(Math.abs(up.ilFraction - down.ilFraction)).toBeLessThan(0.001);
  });

  it('IL increases with larger price divergence', () => {
    const small = calc.calculateV2(1000, 1100, 10_000);
    const large = calc.calculateV2(1000, 5000, 10_000);
    expect(large.ilFraction).toBeGreaterThan(small.ilFraction);
  });

  it('ilUsd = ilFraction * liquidityUsd', () => {
    const result = calc.calculateV2(1000, 2000, 50_000);
    expect(result.ilUsd).toBeCloseTo(result.ilFraction * 50_000, 4);
  });

  it('throws on non-positive entry price', () => {
    expect(() => calc.calculateV2(0, 1000, 10_000)).toThrow('Entry price');
  });

  it('throws on non-positive current price', () => {
    expect(() => calc.calculateV2(1000, 0, 10_000)).toThrow('Current price');
  });

  it('priceRatio is p1/p0', () => {
    const result = calc.calculateV2(1000, 3000, 10_000);
    expect(result.priceRatio).toBeCloseTo(3, 5);
  });
});

describe('ImpermanentLossCalculator — V3', () => {
  const calc = new ImpermanentLossCalculator();
  const tickParams = { priceLower: 800, priceUpper: 1200 };

  it('returns formula=v3-tick', () => {
    const result = calc.calculateV3(1000, 1050, 10_000, tickParams);
    expect(result.formula).toBe('v3-tick');
  });

  it('V3 IL is >= V2 IL for same inputs (concentration amplifies)', () => {
    const v2 = calc.calculateV2(1000, 1100, 10_000);
    const v3 = calc.calculateV3(1000, 1100, 10_000, tickParams);
    expect(v3.ilFraction).toBeGreaterThanOrEqual(v2.ilFraction);
  });

  it('price outside range clamps to boundary', () => {
    // Price way above range — should not throw
    const result = calc.calculateV3(1000, 5000, 10_000, tickParams);
    expect(result.ilFraction).toBeGreaterThanOrEqual(0);
    expect(result.ilFraction).toBeLessThanOrEqual(1);
  });

  it('throws on non-positive prices', () => {
    expect(() => calc.calculateV3(0, 1000, 10_000, tickParams)).toThrow();
  });
});

describe('ImpermanentLossCalculator — breakEvenFeeRate', () => {
  const calc = new ImpermanentLossCalculator();

  it('returns positive fee rate for positive IL', () => {
    const rate = calc.breakEvenFeeRate(0.05, 30);
    expect(rate).toBeGreaterThan(0);
  });

  it('rate = (il / days) * 365', () => {
    const rate = calc.breakEvenFeeRate(0.06, 60);
    expect(rate).toBeCloseTo((0.06 / 60) * 365, 5);
  });

  it('throws for daysHeld <= 0', () => {
    expect(() => calc.breakEvenFeeRate(0.05, 0)).toThrow('daysHeld');
  });
});
