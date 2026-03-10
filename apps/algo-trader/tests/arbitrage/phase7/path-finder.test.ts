/**
 * Tests: path-finder.ts — Bellman-Ford negative cycle detection for triangular arb.
 */

import { PathFinder } from '../../../src/arbitrage/phase7_aan/crossChainArbitrage/path-finder';
import { ChainGraphBuilder } from '../../../src/arbitrage/phase7_aan/crossChainArbitrage/chain-graph-builder';
import type { ChainGraph, PairEdge } from '../../../src/arbitrage/phase7_aan/crossChainArbitrage/chain-graph-builder';

/** Build a graph with injected profitable triangle. */
function makeProfitableGraph(): ChainGraph {
  const builder = new ChainGraphBuilder();
  const graph = builder.getGraph();

  // Inject a clearly profitable set of edges:
  // BTC→ETH: 17 (slightly above fair 16.67) * ETH→USDT: 3100 * USDT→BTC: 1/50000 * 1.01
  // Profit ratio = 17 * 3100 / 50000 = 1.054 → ~5.4% profit
  const inject = (base: string, quote: string, price: number): void => {
    const existing = graph.edges.find(
      (e) => e.baseAsset === base && e.quoteAsset === quote,
    );
    if (existing) {
      existing.price = price;
      existing.feeBps = 1; // near-zero fee to ensure profit
      existing.weight = -Math.log(price * (1 - 1 / 10_000));
    }
  };

  inject('BTC', 'ETH', 17);
  inject('ETH', 'USDT', 3100);
  inject('BTC', 'USDT', 50_000);

  return graph;
}

/** Build a graph with all edges at fair prices (no profit). */
function makeFairGraph(): ChainGraph {
  const builder = new ChainGraphBuilder();
  const graph = builder.getGraph();

  // Set all edges to fair prices with realistic fees
  for (const edge of graph.edges) {
    edge.feeBps = 30;
    const fairPrice =
      edge.baseAsset === 'BTC' && edge.quoteAsset === 'USDT' ? 50_000
      : edge.baseAsset === 'ETH' && edge.quoteAsset === 'USDT' ? 3_000
      : edge.baseAsset === 'BTC' && edge.quoteAsset === 'ETH' ? 16.67
      : edge.price;
    edge.price = fairPrice;
    edge.weight = -Math.log(fairPrice * (1 - 30 / 10_000));
  }

  return graph;
}

describe('PathFinder', () => {
  describe('scan', () => {
    it('returns array (may be empty on fair market)', () => {
      const finder = new PathFinder({ minProfitRatio: 1.001 });
      const graph = makeFairGraph();
      const paths = finder.scan(graph);
      expect(Array.isArray(paths)).toBe(true);
    });

    it('detects profitable path on favourable graph', () => {
      const finder = new PathFinder({ minProfitRatio: 1.001, startCapitalUsd: 10_000 });
      const graph = makeProfitableGraph();
      const paths = finder.scan(graph);
      // With injected profitable edges, at least one path should be found
      expect(paths.length).toBeGreaterThan(0);
    });

    it('each path has correct hop count', () => {
      const finder = new PathFinder({ minProfitRatio: 1.001, startCapitalUsd: 10_000 });
      const graph = makeProfitableGraph();
      const paths = finder.scan(graph);
      for (const path of paths) {
        expect(path.hops).toHaveLength(3);
      }
    });

    it('profitable path has profitRatio > minProfitRatio', () => {
      const finder = new PathFinder({ minProfitRatio: 1.001, startCapitalUsd: 10_000 });
      const graph = makeProfitableGraph();
      const paths = finder.scan(graph);
      for (const path of paths) {
        expect(path.profitRatio).toBeGreaterThan(1.001);
      }
    });

    it('estimatedProfitUsd is positive for profitable paths', () => {
      const finder = new PathFinder({ minProfitRatio: 1.001, startCapitalUsd: 10_000 });
      const graph = makeProfitableGraph();
      const paths = finder.scan(graph);
      for (const path of paths) {
        expect(path.estimatedProfitUsd).toBeGreaterThan(0);
      }
    });
  });

  describe('bestPath', () => {
    it('returns null when no profitable paths exist', () => {
      const finder = new PathFinder({ minProfitRatio: 99.0 }); // unreachable threshold
      const graph = makeFairGraph();
      expect(finder.bestPath(graph)).toBeNull();
    });

    it('returns path with highest estimated profit', () => {
      const finder = new PathFinder({ minProfitRatio: 1.001, startCapitalUsd: 10_000 });
      const graph = makeProfitableGraph();
      const best = finder.bestPath(graph);
      const all = finder.scan(graph);
      if (best && all.length > 1) {
        const maxProfit = Math.max(...all.map((p) => p.estimatedProfitUsd));
        expect(best.estimatedProfitUsd).toBe(maxProfit);
      }
    });

    it('path has detectedAt timestamp', () => {
      const finder = new PathFinder({ minProfitRatio: 1.001, startCapitalUsd: 10_000 });
      const graph = makeProfitableGraph();
      const best = finder.bestPath(graph);
      if (best) {
        expect(best.detectedAt).toBeGreaterThan(0);
      }
    });
  });

  describe('hop structure', () => {
    it('each hop has required fields', () => {
      const finder = new PathFinder({ minProfitRatio: 1.001, startCapitalUsd: 10_000 });
      const graph = makeProfitableGraph();
      const paths = finder.scan(graph);
      for (const path of paths) {
        for (const hop of path.hops) {
          expect(hop).toHaveProperty('exchangeId');
          expect(hop).toHaveProperty('fromAsset');
          expect(hop).toHaveProperty('toAsset');
          expect(hop).toHaveProperty('price');
          expect(hop).toHaveProperty('feeBps');
          expect(hop).toHaveProperty('effectiveRate');
          expect(hop.effectiveRate).toBeGreaterThan(0);
        }
      }
    });
  });
});
