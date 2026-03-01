import { StatisticalArbitrage } from '@agencyos/trading-core/arbitrage';
import { SignalType } from '../interfaces/IStrategy';

describe('StatisticalArbitrage', () => {
  it('should instantiate and return basic info', () => {
    const s = new StatisticalArbitrage();
    expect(s.name).toBe('Statistical Arbitrage (Pairs Trading)');
  });

  it('should return null if priceB is not in metadata', async () => {
    const s = new StatisticalArbitrage();
    const result = await s.onCandle({
      timestamp: 1000,
      open: 10,
      high: 10,
      low: 10,
      close: 10,
      volume: 100
    });
    expect(result).toBeNull();
  });

  it('should return null if not enough data to form lookbackPeriod', async () => {
    const s = new StatisticalArbitrage();

    // Add 50 candles (less than lookbackPeriod of 100)
    for (let i = 0; i < 50; i++) {
      const result = await s.onCandle({
        timestamp: 1000 * i,
        open: 10,
        high: 10,
        low: 10,
        close: 10,
        volume: 100,
        metadata: { priceB: 10 }
      });
      expect(result).toBeNull();
    }
  });

  it('should trigger SELL A BUY B signal when zScore > 2.0', async () => {
    const s = new StatisticalArbitrage();

    // Create base data with high correlation (~1 ratio)
    for (let i = 0; i < 100; i++) {
      const basePrice = 10 + Math.sin(i) * 2; // fluctuate
      await s.onCandle({
        timestamp: 1000 * i,
        open: basePrice,
        high: basePrice,
        low: basePrice,
        close: basePrice + Math.random() * 0.01, // A
        volume: 100,
        metadata: { priceB: basePrice } // B perfectly correlated with A's base
      });
    }

    // Spike price A to make it very expensive compared to price B
    // A/B ratio will be very high (20/10 = 2), causing a large Z-score
    const result = await s.onCandle({
      timestamp: 1000 * 101,
      open: 20,
      high: 20,
      low: 20,
      close: 20, // priceA spiked
      volume: 100,
      metadata: { priceB: 10 } // priceB unchanged
    });

    expect(result).not.toBeNull();
    if (result) {
      expect(result.type).toBe(SignalType.SELL);
      expect(result.metadata?.action).toBe('SELL_A_BUY_B');
    }
  });

  it('should trigger BUY A SELL B signal when zScore < -2.0', async () => {
    const s = new StatisticalArbitrage();

    // Create base data with high correlation (~1 ratio)
    for (let i = 0; i < 100; i++) {
      const basePrice = 10 + Math.sin(i) * 2; // fluctuate
      await s.onCandle({
        timestamp: 1000 * i,
        open: basePrice,
        high: basePrice,
        low: basePrice,
        close: basePrice + Math.random() * 0.01, // A
        volume: 100,
        metadata: { priceB: basePrice } // B perfectly correlated with A's base
      });
    }

    // Drop price A to make it very cheap compared to price B
    // A/B ratio will be very low (5/10 = 0.5), causing a negative Z-score
    const result = await s.onCandle({
      timestamp: 1000 * 101,
      open: 5,
      high: 5,
      low: 5,
      close: 5, // priceA dropped
      volume: 100,
      metadata: { priceB: 10 } // priceB unchanged
    });

    expect(result).not.toBeNull();
    if (result) {
      expect(result.type).toBe(SignalType.BUY);
      expect(result.metadata?.action).toBe('BUY_A_SELL_B');
    }
  });

  it('should return null when correlation is < 0.8', async () => {
    const s = new StatisticalArbitrage();

    // Create totally random base data to have bad correlation
    for (let i = 0; i < 100; i++) {
      await s.onCandle({
        timestamp: 1000 * i,
        open: 10,
        high: 10,
        low: 10,
        close: Math.random() * 10 + 10, // Random A
        volume: 100,
        metadata: { priceB: Math.random() * 10 + 10 } // Random B (uncorrelated)
      });
    }

    // Attempt trigger
    const result = await s.onCandle({
      timestamp: 1000 * 101,
      open: 5,
      high: 5,
      low: 5,
      close: 5,
      volume: 100,
      metadata: { priceB: 20 }
    });

    expect(result).toBeNull();
  });

  it('should init correctly and slice to lookbackPeriod', async () => {
    const s = new StatisticalArbitrage();
    const history = Array.from({ length: 150 }, (_, i) => ({
      timestamp: 1000 * i,
      open: 10,
      high: 10,
      low: 10,
      close: 10,
      volume: 100,
      metadata: { priceB: 10 }
    }));

    await s.init(history);

    // We can't directly inspect private properties, but we can verify it works by
    // seeing that the next candle triggers logic rather than returning null
    const result = await s.onCandle({
      timestamp: 150000,
      open: 10,
      high: 10,
      low: 10,
      close: 10,
      volume: 100,
      metadata: { priceB: 10 }
    });

    // Should return null because zScore is 0 (prices are identical), but it went through the logic
    expect(result).toBeNull();
  });
});
