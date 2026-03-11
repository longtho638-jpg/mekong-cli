import { EventEmitter } from 'events';
import { LicenseService, LicenseTier } from '../lib/raas-gate';
import { logger } from '../utils/logger';

export interface GraphEdge {
  from: string;
  to: string;
  rate: number;
  feePct: number;
  latencyMs: number;
  weight: number;  // -log(rate * (1 - feePct))
  timestamp: number;
}

export interface ArbitrageCycle {
  path: string[];
  edges: GraphEdge[];
  profitPct: number;        // net profit after all fees
  totalLatencyMs: number;
  hops: number;
  timestamp: number;
}

export interface GraphArbConfig {
  maxHops?: number;         // default 4
  minProfitPct?: number;    // default 0.1 (0.1%)
  maxLatencyMs?: number;    // default 2000
  freeHopLimit?: number;    // default 2 (free tier limit)
}

const DEFAULT_CONFIG: Required<GraphArbConfig> = {
  maxHops: 4,
  minProfitPct: 0.1,
  maxLatencyMs: 2000,
  freeHopLimit: 2,
};

/**
 * Graph-Based Multi-Exchange Arbitrage Engine
 *
 * Models exchanges+symbols as a weighted directed graph.
 * Uses Bellman-Ford to detect negative-weight cycles (= profitable arbitrage loops).
 * Edge weight = -log(rate * (1 - feePct))
 * A negative cycle means: product of rates > 1 after fees → profit opportunity.
 */
export class GraphArbitrageEngine extends EventEmitter {
  private edges: Map<string, GraphEdge> = new Map();
  private nodes: Set<string> = new Set();
  private config: Required<GraphArbConfig>;

  constructor(config: GraphArbConfig = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /** Add or update a directed edge between two nodes */
  addEdge(from: string, to: string, rate: number, feePct: number, latencyMs: number): void {
    const weight = -Math.log(rate * (1 - feePct));
    const edge: GraphEdge = { from, to, rate, feePct, latencyMs, weight, timestamp: Date.now() };
    this.edges.set(`${from}->${to}`, edge);
    this.nodes.add(from);
    this.nodes.add(to);
  }

  /** Remove a directed edge */
  removeEdge(from: string, to: string): void {
    const key = `${from}->${to}`;
    const edge = this.edges.get(key);
    if (edge) {
      this.edges.delete(key);
      // Remove nodes only if they have no remaining edges
      const fromHasEdges = [...this.edges.values()].some(e => e.from === from || e.to === from);
      const toHasEdges = [...this.edges.values()].some(e => e.from === to || e.to === to);
      if (!fromHasEdges) this.nodes.delete(from);
      if (!toHasEdges) this.nodes.delete(to);
    }
  }

  /**
   * Convenience: registers exchange:symbol node from orderbook data.
   * Cross-exchange edges should be built by calling addEdge() after comparing
   * bestBid/bestAsk across exchanges (rate = sellExchange.bestBid / buyExchange.bestAsk).
   */
  updateFromOrderbook(
    exchange: string,
    symbol: string,
    bestBid: number,
    bestAsk: number,
    feePct: number,
    latencyMs: number
  ): void {
    const node = `${exchange}:${symbol}`;
    this.nodes.add(node);
    // Also add internal spread edge so single-exchange round-trip is modelled
    const spreadNode = `${node}:sell`;
    const rate = bestBid / bestAsk;
    this.addEdge(node, spreadNode, rate, feePct, latencyMs);
    this.addEdge(spreadNode, node, 1 / rate, feePct, latencyMs);
    // Remove helper nodes — they exist only to satisfy node registration
    this.removeEdge(node, spreadNode);
    this.removeEdge(spreadNode, node);
    this.nodes.add(node);
  }

  /** Bellman-Ford negative cycle detection. Returns all profitable cycles found. */
  detectCycles(): ArbitrageCycle[] {
    const nodeList = Array.from(this.nodes);
    const edgeList = Array.from(this.edges.values());
    const V = nodeList.length;
    if (V < 2 || edgeList.length === 0) return [];

    const nodeIndex = new Map<string, number>(nodeList.map((n, i) => [n, i]));

    // Add virtual source node (index V) with 0-weight edges to all nodes
    const dist = new Array<number>(V + 1).fill(0);
    const pred = new Array<number>(V + 1).fill(-1);
    const virtualSource = V;

    // First relaxation: virtual source to all nodes (implicitly 0 weight)
    for (let i = 0; i < V; i++) {
      pred[i] = virtualSource;
    }

    // V iterations (not V-1, because we have V+1 nodes now)
    for (let iter = 0; iter < V; iter++) {
      let changed = false;
      for (const edge of edgeList) {
        const u = nodeIndex.get(edge.from)!;
        const v = nodeIndex.get(edge.to)!;
        if (u === undefined || v === undefined) continue;
        if (dist[u] + edge.weight < dist[v]) {
          dist[v] = dist[u] + edge.weight;
          pred[v] = u;
          changed = true;
        }
      }
      // Early exit if no changes
      if (!changed && iter > 0) break;
    }

    // Detect nodes in negative cycles
    const inCycle = new Set<number>();
    for (const edge of edgeList) {
      const u = nodeIndex.get(edge.from)!;
      const v = nodeIndex.get(edge.to)!;
      if (u === undefined || v === undefined) continue;
      if (dist[u] + edge.weight < dist[v]) {
        // Found a node that can still be relaxed = part of negative cycle
        inCycle.add(v);
      }
    }

    const cycles: ArbitrageCycle[] = [];
    const seen = new Set<string>();

    for (const cycleNode of inCycle) {
      const cycle = this.traceCycle(cycleNode, nodeList, pred, edgeList, nodeIndex);
      if (!cycle) continue;

      const cycleKey = cycle.path.slice().sort().join('|');
      if (seen.has(cycleKey)) continue;
      seen.add(cycleKey);

      if (cycle.totalLatencyMs > this.config.maxLatencyMs) continue;
      if (cycle.profitPct < this.config.minProfitPct) continue;
      if (cycle.hops > this.config.maxHops) continue;

      if (cycle.hops > this.config.freeHopLimit) {
        if (!LicenseService.getInstance().hasTier(LicenseTier.PRO)) {
          logger.warn(`[GraphArb] Multi-hop cycle (${cycle.hops} hops) requires PRO license — skipped`);
          continue;
        }
      }

      cycles.push(cycle);
      this.emit('cycle:detected', cycle);
      logger.info(`[GraphArb] Cycle: ${cycle.path.join(' → ')} | profit=${cycle.profitPct.toFixed(4)}% | hops=${cycle.hops}`);
    }

    return cycles;
  }

  private traceCycle(
    startIdx: number,
    nodeList: string[],
    pred: number[],
    _edgeList: GraphEdge[],
    _nodeIndex: Map<string, number>
  ): ArbitrageCycle | null {
    // Walk back V steps to ensure we're inside the cycle
    let cur = startIdx;
    const V = nodeList.length;
    for (let i = 0; i < V; i++) {
      if (pred[cur] === -1 || pred[cur] === V) return null; // -1 or virtual source = no cycle
      cur = pred[cur];
    }

    // Now trace the actual cycle
    const cycleStart = cur;
    const pathIndices: number[] = [cycleStart];
    let node = pred[cycleStart];

    while (node !== cycleStart && node !== -1 && node !== nodeList.length) {
      pathIndices.push(node);
      node = pred[node];
      // Safety limit to prevent infinite loops
      if (pathIndices.length > V) return null;
    }

    // If we didn't complete the cycle, return null
    if (node !== cycleStart) return null;

    // The predecessor chain traces backwards through the cycle
    // Reverse to get the actual cycle direction
    pathIndices.reverse();

    // Convert indices to node names
    const path = pathIndices.map(i => nodeList[i]);

    // Build edges list - now path is in correct direction
    const edges: GraphEdge[] = [];
    for (let i = 0; i < path.length; i++) {
      const from = path[i];
      const to = path[(i + 1) % path.length];
      const key = `${from}->${to}`;
      const edge = this.edges.get(key);
      if (!edge) return null;
      edges.push(edge);
    }

    if (edges.length === 0) return null;

    const totalWeight = edges.reduce((sum, e) => sum + e.weight, 0);
    const profitPct = (Math.exp(-totalWeight) - 1) * 100;
    const totalLatencyMs = edges.reduce((sum, e) => sum + e.latencyMs, 0);

    return {
      path,
      edges,
      profitPct,
      totalLatencyMs,
      hops: edges.length,
      timestamp: Date.now(),
    };
  }

  /** Returns the cycle with highest profitPct, or null if none found */
  findBestCycle(): ArbitrageCycle | null {
    const cycles = this.detectCycles();
    if (cycles.length === 0) return null;
    return cycles.reduce((best, c) => (c.profitPct > best.profitPct ? c : best));
  }

  getNodeCount(): number {
    return this.nodes.size;
  }

  getEdgeCount(): number {
    return this.edges.size;
  }

  clear(): void {
    this.edges.clear();
    this.nodes.clear();
  }

  /** Alias for detectCycles() - legacy API */
  findArbitrageCycles(): ArbitrageCycle[] {
    return this.detectCycles();
  }

  private _running = false;
  private _lastScanTime = 0;
  private _startTime = 0;

  /** Start the engine (for lifecycle management) */
  async start(): Promise<void> {
    this._running = true;
    this._startTime = Date.now();
    logger.info('[GraphArb] Engine started');
  }

  /** Stop the engine */
  async stop(): Promise<void> {
    this._running = false;
    logger.info('[GraphArb] Engine stopped');
  }

  /** Check if engine is running */
  isRunning(): boolean {
    return this._running;
  }

  /** Get engine metrics */
  getMetrics(): { cyclesFound: number; lastScanTime: number; uptime: number } {
    return {
      cyclesFound: this.edges.size,
      lastScanTime: this._lastScanTime,
      uptime: this._startTime ? Date.now() - this._startTime : 0,
    };
  }
}
