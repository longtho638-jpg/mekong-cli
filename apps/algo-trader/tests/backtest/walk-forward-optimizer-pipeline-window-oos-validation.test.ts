/**
 * Tests for WalkForwardOptimizerPipeline — per-window IS optimization + OOS validation.
 */

import {
  WalkForwardOptimizerPipeline,
  WalkForwardPipelineConfig,
} from '../../src/backtest/walk-forward-optimizer-pipeline';
import { ParameterRange } from '../../src/backtest/BacktestOptimizer';
import { ICandle } from '../../src/interfaces/ICandle';
import { RsiSmaStrategy } from '../../src/strategies/RsiSmaStrategy';

function generateCandles(count: number): ICandle[] {
  return Array.from({ length: count }, (_, i) => ({
    timestamp: Date.now() - (count - i) * 60000,
    open: 100 + Math.sin(i / 50) * 10,
    high: 100 + Math.sin(i / 50) * 10 + 2,
    low: 100 + Math.sin(i / 50) * 10 - 2,
    close: 100 + Math.sin(i / 50) * 10 + (Math.random() - 0.5),
    volume: 1000 + Math.random() * 500,
  }));
}

const paramRanges: ParameterRange[] = [
  { name: 'rsiPeriod', values: [10, 14] },
  { name: 'smaPeriod', values: [20, 30] },
];

const strategyFactory = (_params: Record<string, number>) => new RsiSmaStrategy();

describe('WalkForwardOptimizerPipeline', () => {
  it('should run walk-forward optimization with 3 windows', async () => {
    const candles = generateCandles(2400); // 3 windows × 800 candles each
    const config: Partial<WalkForwardPipelineConfig> = {
      windows: 3,
      trainRatio: 0.7,
      searchMode: 'random',
      maxTrials: 3,
      initialBalance: 10000,
    };

    const pipeline = new WalkForwardOptimizerPipeline(config);
    const result = await pipeline.run(strategyFactory, paramRanges, candles);

    expect(result.totalWindows).toBeGreaterThan(0);
    expect(result.windows.length).toBe(result.totalWindows);
    expect(typeof result.avgDegradation).toBe('number');
    expect(typeof result.avgOosSharpe).toBe('number');
    expect(typeof result.avgOosReturn).toBe('number');
    expect(typeof result.overfit).toBe('boolean');
    expect(result.consistencyScore).toBeGreaterThanOrEqual(0);
    expect(result.consistencyScore).toBeLessThanOrEqual(100);

    // Each window result must have expected shape
    for (const w of result.windows) {
      expect(typeof w.windowIdx).toBe('number');
      expect(w.trainRange.start).toBeLessThan(w.trainRange.end);
      expect(w.testRange.start).toBeLessThan(w.testRange.end);
      expect(w.trainRange.end).toBeLessThanOrEqual(w.testRange.start);
      expect(typeof w.bestParams).toBe('object');
      expect(typeof w.inSampleSharpe).toBe('number');
      expect(typeof w.outOfSampleSharpe).toBe('number');
      expect(w.degradation).toBeGreaterThanOrEqual(0);
    }
  }, 60000);

  it('should handle insufficient data gracefully (fewer than 400 candles per window)', async () => {
    const candles = generateCandles(300); // well below 400 per window for windows=5
    const pipeline = new WalkForwardOptimizerPipeline({ windows: 5 });
    const result = await pipeline.run(strategyFactory, paramRanges, candles);

    expect(result.totalWindows).toBe(0);
    expect(result.windows).toHaveLength(0);
    expect(result.overfit).toBe(true);
    expect(result.avgDegradation).toBe(0);
  }, 10000);

  it('should compute consistency score correctly', async () => {
    const candles = generateCandles(2000); // 2 windows × 1000 each
    const pipeline = new WalkForwardOptimizerPipeline({
      windows: 2,
      trainRatio: 0.7,
      searchMode: 'random',
      maxTrials: 3,
      initialBalance: 10000,
    });

    const result = await pipeline.run(strategyFactory, paramRanges, candles);

    if (result.totalWindows > 0) {
      const positiveCount = result.windows.filter(w => w.outOfSampleReturn > 0).length;
      const expected = (positiveCount / result.totalWindows) * 100;
      expect(result.consistencyScore).toBeCloseTo(expected, 5);
    } else {
      expect(result.consistencyScore).toBe(0);
    }
  }, 60000);

  it('should flag overfit when avgDegradation < 0.5', async () => {
    const candles = generateCandles(2400);
    const pipeline = new WalkForwardOptimizerPipeline({
      windows: 3,
      trainRatio: 0.7,
      searchMode: 'random',
      maxTrials: 3,
    });

    const result = await pipeline.run(strategyFactory, paramRanges, candles);

    // overfit flag must match degradation threshold
    expect(result.overfit).toBe(result.avgDegradation < 0.5);
  }, 60000);
});
