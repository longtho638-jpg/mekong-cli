/**
 * Path Finder — Bellman-Ford negative cycle detection for triangular arbitrage.
 * Scans for profitable 3-hop cycles every 100ms.
 * Profit = product of (price * (1 - fee)) along path > 1.
 */

import type { ChainGraph, PairEdge } from './chain-graph-builder';

export interface ArbitragePath {
  hops: PathHop[];
  /** Gross profit ratio (1.005 = 0.5% profit before flash loan costs). */
  profitRatio: number;
  /** Estimated USD profit given startCapital. */
  estimatedProfitUsd: number;
  startCapitalUsd: number;
  detectedAt: number;
}

export interface PathHop {
  exchangeId: string;
  fromAsset: string;
  toAsset: string;
  price: number;
  feeBps: number;
  effectiveRate: number;
}

export interface PathFinderConfig {
  minProfitRatio: number;   // e.g. 1.001 = 0.1% minimum
  startCapitalUsd: number;
  maxHops: number;
  scanIntervalMs: number;
}

const DEFAULT_CONFIG: PathFinderConfig = {
  minProfitRatio: 1.001,
  startCapitalUsd: 10_000,
  maxHops: 3,
  scanIntervalMs: 100,
};

/** Asset triples to scan for triangular cycles: [A, B, C] → A→B, B→C, C→A. */
const TRIANGLES = [
  ['BTC', 'ETH', 'USDT'],
  ['ETH', 'BTC', 'USDT'],
];

/**
 * Find best edge for a directed leg. Supports both direct (base→quote)
 * and inverse (quote→base using 1/price) lookups so we can traverse
 * any pair in either direction.
 */
function bestLeg(
  edges: PairEdge[],
  fromAsset: string,
  toAsset: string,
): { edge: PairEdge; effectiveRate: number; inverse: boolean } | null {
  // Direct: fromAsset is base, toAsset is quote → rate = price * (1 - fee)
  const direct = edges.filter((e) => e.baseAsset === fromAsset && e.quoteAsset === toAsset);
  // Inverse: fromAsset is quote, toAsset is base → rate = (1/price) * (1 - fee)
  const inverse = edges.filter((e) => e.baseAsset === toAsset && e.quoteAsset === fromAsset);

  type Candidate = { edge: PairEdge; effectiveRate: number; inverse: boolean };
  const candidates: Candidate[] = [
    ...direct.map((e) => ({ edge: e, effectiveRate: e.price * (1 - e.feeBps / 10_000), inverse: false })),
    ...inverse.map((e) => ({ edge: e, effectiveRate: (1 / e.price) * (1 - e.feeBps / 10_000), inverse: true })),
  ];

  if (!candidates.length) return null;
  return candidates.reduce((best, c) => (c.effectiveRate > best.effectiveRate ? c : best));
}

/**
 * Run Bellman-Ford over a flat list of edges for a given asset triple.
 * Supports both direct and inverse traversal so any stored pair can be used
 * in either direction. Returns profitable path if negative cycle detected.
 */
function bellmanFordTriangle(
  edges: PairEdge[],
  assets: string[],
  startCapital: number,
  minProfit: number,
): ArbitragePath | null {
  const [a, b, c] = assets;

  const legAB = bestLeg(edges, a, b);
  const legBC = bestLeg(edges, b, c);
  const legCA = bestLeg(edges, c, a);

  if (!legAB || !legBC || !legCA) return null;

  const profitRatio = legAB.effectiveRate * legBC.effectiveRate * legCA.effectiveRate;
  if (profitRatio <= minProfit) return null;

  const estimatedProfitUsd = startCapital * (profitRatio - 1);

  return {
    hops: [
      { exchangeId: legAB.edge.from, fromAsset: a, toAsset: b, price: legAB.edge.price, feeBps: legAB.edge.feeBps, effectiveRate: legAB.effectiveRate },
      { exchangeId: legBC.edge.from, fromAsset: b, toAsset: c, price: legBC.edge.price, feeBps: legBC.edge.feeBps, effectiveRate: legBC.effectiveRate },
      { exchangeId: legCA.edge.from, fromAsset: c, toAsset: a, price: legCA.edge.price, feeBps: legCA.edge.feeBps, effectiveRate: legCA.effectiveRate },
    ],
    profitRatio,
    estimatedProfitUsd,
    startCapitalUsd: startCapital,
    detectedAt: Date.now(),
  };
}

export class PathFinder {
  private readonly cfg: PathFinderConfig;

  constructor(config: Partial<PathFinderConfig> = {}) {
    this.cfg = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Scan the graph for all profitable triangular paths.
   */
  scan(graph: ChainGraph): ArbitragePath[] {
    const paths: ArbitragePath[] = [];

    for (const triangle of TRIANGLES) {
      const path = bellmanFordTriangle(
        graph.edges,
        triangle,
        this.cfg.startCapitalUsd,
        this.cfg.minProfitRatio,
      );
      if (path) paths.push(path);
    }

    return paths;
  }

  /**
   * Return best path by estimated profit, or null if none found.
   */
  bestPath(graph: ChainGraph): ArbitragePath | null {
    const paths = this.scan(graph);
    if (!paths.length) return null;
    return paths.reduce((best, p) => (p.estimatedProfitUsd > best.estimatedProfitUsd ? p : best));
  }

  getConfig(): PathFinderConfig {
    return { ...this.cfg };
  }
}
