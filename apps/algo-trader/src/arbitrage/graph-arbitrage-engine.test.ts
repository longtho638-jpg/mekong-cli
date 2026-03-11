/**
 * Tests for GraphArbitrageEngine: edge management, Bellman-Ford cycle detection, license gating.
 */

import { GraphArbitrageEngine } from './graph-arbitrage-engine';

describe('GraphArbitrageEngine', () => {
  let engine: GraphArbitrageEngine;

  beforeEach(() => {
    // Set freeHopLimit=3 to allow 3-hop triangular arbitrage cycles in tests
    engine = new GraphArbitrageEngine({ maxHops: 4, minProfitPct: 0.1, freeHopLimit: 3 });
  });

  describe('edge management', () => {
    it('addEdge creates directed edge with computed weight', () => {
      engine.addEdge('A', 'B', 1.5, 0.001, 100);
      // Weight = -log(rate * (1 - feePct))
      const expectedWeight = -Math.log(1.5 * 0.999);
      const edge = (engine as any).edges.get('A->B');
      expect(edge).toBeDefined();
      expect(edge.from).toBe('A');
      expect(edge.to).toBe('B');
      expect(edge.rate).toBe(1.5);
      expect(edge.feePct).toBe(0.001);
      expect(edge.latencyMs).toBe(100);
      expect(edge.weight).toBeCloseTo(expectedWeight, 6);
    });

    it('removeEdge deletes edge and orphaned nodes', () => {
      engine.addEdge('A', 'B', 1.5, 0.001, 100);
      expect((engine as any).nodes.has('A')).toBe(true);
      engine.removeEdge('A', 'B');
      const edge = (engine as any).edges.get('A->B');
      expect(edge).toBeUndefined();
    });

    it('updateFromOrderbook registers nodes', () => {
      engine.updateFromOrderbook('binance', 'BTC/USDT', 50000, 50001, 0.001, 50);
      expect((engine as any).nodes.has('binance:BTC/USDT')).toBe(true);
    });
  });

  describe('Bellman-Ford cycle detection', () => {
    it('finds no cycles in empty graph', () => {
      const cycles = engine.findArbitrageCycles();
      expect(cycles).toEqual([]);
    });

    it('finds no cycles when graph has no profit opportunity', () => {
      // Linear path: A -> B -> C, no cycle
      engine.addEdge('A', 'B', 1.0, 0.001, 100);
      engine.addEdge('B', 'C', 1.0, 0.001, 100);
      const cycles = engine.findArbitrageCycles();
      expect(cycles.length).toBe(0);
    });

    it('detects triangular arbitrage opportunity', () => {
      // Create profitable triangle: A -> B -> C -> A
      // Rates chosen so product > 1 after fees
      engine.addEdge('A', 'B', 1.1, 0.001, 100);
      engine.addEdge('B', 'C', 1.1, 0.001, 100);
      engine.addEdge('C', 'A', 1.1, 0.001, 100);
      const cycles = engine.findArbitrageCycles();
      expect(cycles.length).toBeGreaterThan(0);
      const cycle = cycles[0];
      expect(cycle.path.length).toBeGreaterThan(2);
      expect(cycle.profitPct).toBeGreaterThan(0);
    });

    it('respects maxHops limit', () => {
      const engineLimited = new GraphArbitrageEngine({ maxHops: 2 });
      // Create 4-hop cycle
      engineLimited.addEdge('A', 'B', 1.5, 0.001, 100);
      engineLimited.addEdge('B', 'C', 1.5, 0.001, 100);
      engineLimited.addEdge('C', 'D', 1.5, 0.001, 100);
      engineLimited.addEdge('D', 'A', 1.5, 0.001, 100);
      const cycles = engineLimited.findArbitrageCycles();
      // Should not find 4-hop cycle with maxHops=2
      expect(cycles.length).toBe(0);
    });

    it('filters cycles by minProfitPct', () => {
      const engineStrict = new GraphArbitrageEngine({ minProfitPct: 5.0 });
      // Create low-profit cycle
      engineStrict.addEdge('A', 'B', 1.01, 0.001, 100);
      engineStrict.addEdge('B', 'A', 1.01, 0.001, 100);
      const cycles = engineStrict.findArbitrageCycles();
      expect(cycles.length).toBe(0);
    });
  });

  describe('lifecycle', () => {
    it('start/stop control flow', async () => {
      expect(engine.isRunning()).toBe(false);
      await engine.start();
      expect(engine.isRunning()).toBe(true);
      await engine.stop();
      expect(engine.isRunning()).toBe(false);
    });

    it('getMetrics returns engine statistics', () => {
      const metrics = engine.getMetrics();
      expect(metrics).toHaveProperty('cyclesFound');
      expect(metrics).toHaveProperty('lastScanTime');
      expect(metrics).toHaveProperty('uptime');
    });
  });
});
