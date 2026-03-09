import { RiskAdjuster } from '../../../src/expansion/asset-universe/risk-adjuster';
import type { SymbolInfo } from '../../../src/expansion/expansion-config-types';

const config = { basePositionUsd: 1000, maxPositionUsd: 10_000, minPositionUsd: 100 };

describe('RiskAdjuster', () => {
  it('returns position within min/max bounds', () => {
    const adjuster = new RiskAdjuster(config);
    const symbol: SymbolInfo = { symbol: 'BTC/USDT', volume24h: 5_000_000_000, volatility: 0.05 };
    const result = adjuster.adjust(symbol);
    expect(result.positionUsd).toBeGreaterThanOrEqual(config.minPositionUsd);
    expect(result.positionUsd).toBeLessThanOrEqual(config.maxPositionUsd);
  });

  it('high volatility reduces position size vs low volatility', () => {
    const adjuster = new RiskAdjuster(config);
    const base: Omit<SymbolInfo, 'volatility'> = { symbol: 'ETH/USDT', volume24h: 1_000_000_000 };
    const lowVol = adjuster.adjust({ ...base, volatility: 0.01 });
    const highVol = adjuster.adjust({ ...base, volatility: 0.20 });
    expect(highVol.positionUsd).toBeLessThanOrEqual(lowVol.positionUsd);
  });

  it('emits adjusted event', () => {
    const adjuster = new RiskAdjuster(config);
    const events: unknown[] = [];
    adjuster.on('adjusted', (e) => events.push(e));
    adjuster.adjust({ symbol: 'SOL/USDT', volume24h: 500_000_000, volatility: 0.08 });
    expect(events).toHaveLength(1);
  });

  it('adjustAll returns one result per symbol', () => {
    const adjuster = new RiskAdjuster(config);
    const symbols: SymbolInfo[] = [
      { symbol: 'BTC/USDT', volume24h: 5_000_000_000, volatility: 0.05 },
      { symbol: 'ETH/USDT', volume24h: 2_000_000_000, volatility: 0.07 },
    ];
    const results = adjuster.adjustAll(symbols);
    expect(results).toHaveLength(2);
    expect(results[0].symbol).toBe('BTC/USDT');
    expect(results[1].symbol).toBe('ETH/USDT');
  });

  it('scaleFactor is positive', () => {
    const adjuster = new RiskAdjuster(config);
    const result = adjuster.adjust({ symbol: 'BTC/USDT', volume24h: 1_000_000_000, volatility: 0.05 });
    expect(result.scaleFactor).toBeGreaterThan(0);
  });

  it('low volume reduces position vs high volume', () => {
    const adjuster = new RiskAdjuster(config);
    const low = adjuster.adjust({ symbol: 'X/USDT', volume24h: 10_000, volatility: 0.05 });
    const high = adjuster.adjust({ symbol: 'X/USDT', volume24h: 5_000_000_000, volatility: 0.05 });
    expect(high.positionUsd).toBeGreaterThanOrEqual(low.positionUsd);
  });
});
