import { TrafficSplitter } from '../../../src/deployment/canary/traffic-splitter';
import { TrafficSplitConfig } from '../../../src/deployment/canary/canary-config-types';

const baseConfig: TrafficSplitConfig = {
  initialPercent: 10,
  incrementSteps: [10, 25, 50, 100],
  evaluationPeriodHours: 24,
  symbols: [],
};

describe('TrafficSplitter', () => {
  describe('percentage-based routing', () => {
    it('routes ~10% of orders to canary at 10% split', () => {
      const splitter = new TrafficSplitter(baseConfig);
      let canary = 0;
      const total = 1000;
      for (let i = 0; i < total; i++) {
        const d = splitter.routeOrder('XYZ/USDT', i * 1000);
        if (d.target === 'canary') canary++;
      }
      // Allow ±10% tolerance around expected 10%
      expect(canary).toBeGreaterThanOrEqual(50);
      expect(canary).toBeLessThanOrEqual(200);
    });

    it('routes 0% to canary at 0% split', () => {
      const splitter = new TrafficSplitter({ ...baseConfig, initialPercent: 0 });
      for (let i = 0; i < 100; i++) {
        const d = splitter.routeOrder('XYZ/USDT', i);
        expect(d.target).toBe('baseline');
      }
    });

    it('routes 100% to canary at 100% split', () => {
      const splitter = new TrafficSplitter({ ...baseConfig, initialPercent: 100 });
      for (let i = 0; i < 100; i++) {
        const d = splitter.routeOrder('XYZ/USDT', i);
        expect(d.target).toBe('canary');
      }
    });
  });

  describe('symbol-based routing', () => {
    it('routes matching symbols to canary', () => {
      const splitter = new TrafficSplitter({ ...baseConfig, symbols: ['BTC/USDT'] });
      const d = splitter.routeOrder('BTC/USDT', 0);
      expect(d.target).toBe('canary');
      expect(d.reason).toContain('symbol match');
    });

    it('does not route non-matching symbols via symbol rule', () => {
      const splitter = new TrafficSplitter({ ...baseConfig, initialPercent: 0, symbols: ['BTC/USDT'] });
      const d = splitter.routeOrder('SOL/USDT', 0);
      expect(d.target).toBe('baseline');
    });
  });

  describe('setPercent and getPercent', () => {
    it('updates percent', () => {
      const splitter = new TrafficSplitter(baseConfig);
      splitter.setPercent(50);
      expect(splitter.getPercent()).toBe(50);
    });

    it('clamps to [0, 100]', () => {
      const splitter = new TrafficSplitter(baseConfig);
      splitter.setPercent(-5);
      expect(splitter.getPercent()).toBe(0);
      splitter.setPercent(150);
      expect(splitter.getPercent()).toBe(100);
    });
  });

  describe('stats tracking', () => {
    it('tracks total and canary orders', () => {
      const splitter = new TrafficSplitter({ ...baseConfig, initialPercent: 100 });
      splitter.routeOrder('A', 1);
      splitter.routeOrder('B', 2);
      const stats = splitter.getStats();
      expect(stats.total).toBe(2);
      expect(stats.canary).toBe(2);
      expect(stats.baseline).toBe(0);
    });
  });

  describe('reset', () => {
    it('resets counters and restores initial percent', () => {
      const splitter = new TrafficSplitter(baseConfig);
      splitter.setPercent(50);
      splitter.routeOrder('A', 1);
      splitter.reset();
      const stats = splitter.getStats();
      expect(stats.total).toBe(0);
      expect(splitter.getPercent()).toBe(10);
    });
  });
});
