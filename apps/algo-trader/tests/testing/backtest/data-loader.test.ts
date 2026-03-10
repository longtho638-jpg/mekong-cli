import { DataLoader } from '../../../src/testing/backtest/data-loader';
import { DEFAULT_BACKTEST_CONFIG } from '../../../src/testing/backtest/backtest-config-types';

const baseConfig = { ...DEFAULT_BACKTEST_CONFIG, dataPaths: {} };

describe('DataLoader', () => {
  it('generates synthetic data with correct count', () => {
    const loader = new DataLoader(baseConfig);
    const events = loader.generateSyntheticData(3, 10);
    expect(events.length).toBe(30);
  });

  it('synthetic events are sorted by timestamp', () => {
    const loader = new DataLoader(baseConfig);
    const events = loader.generateSyntheticData(2, 20);
    for (let i = 1; i < events.length; i++) {
      expect(events[i].timestamp).toBeGreaterThanOrEqual(events[i - 1].timestamp);
    }
  });

  it('synthetic events have valid prices', () => {
    const loader = new DataLoader(baseConfig);
    const events = loader.generateSyntheticData(1, 50);
    for (const e of events) {
      expect(e.price).toBeGreaterThan(0);
      expect(isFinite(e.price)).toBe(true);
    }
  });

  it('synthetic events have source set', () => {
    const loader = new DataLoader(baseConfig);
    const events = loader.generateSyntheticData(1, 6);
    const sources = new Set(events.map(e => e.source));
    expect(sources.size).toBeGreaterThan(0);
  });

  it('loadData returns events within date range', async () => {
    const start = new Date('2024-01-01');
    const end = new Date('2024-01-05');
    const loader = new DataLoader({
      ...baseConfig,
      dateRange: { start: '2024-01-01', end: '2024-01-05' },
    });
    const events = await loader.loadDateRange(start, end);
    for (const e of events) {
      expect(e.timestamp).toBeGreaterThanOrEqual(start.getTime());
      expect(e.timestamp).toBeLessThanOrEqual(end.getTime());
    }
  });

  it('loadData falls back to synthetic when no files provided', async () => {
    const loader = new DataLoader(baseConfig);
    const events = await loader.loadData();
    expect(events.length).toBeGreaterThan(0);
  });

  it('handles empty date range gracefully', async () => {
    const now = new Date();
    const loader = new DataLoader(baseConfig);
    const events = await loader.loadDateRange(now, now);
    // May return 0 or some events at exact timestamp — no crash
    expect(Array.isArray(events)).toBe(true);
  });

  it('synthetic data is deterministic', () => {
    const loader = new DataLoader(baseConfig);
    const a = loader.generateSyntheticData(2, 10);
    const b = loader.generateSyntheticData(2, 10);
    expect(a.map(e => e.price)).toEqual(b.map(e => e.price));
  });
});
