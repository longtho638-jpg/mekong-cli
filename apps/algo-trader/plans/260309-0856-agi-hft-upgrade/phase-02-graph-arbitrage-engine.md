# Phase 2: Graph-Based Multi-Exchange Arbitrage

## Overview
- **Priority:** P1
- **Status:** pending
- **File:** `src/arbitrage/graph-arbitrage-engine.ts`
- **Test:** `tests/arbitrage/graph-arbitrage-engine.test.ts`

## Key Insights
- Existing HFTArbitrageEngine does pairwise (O(N^2)) spread comparison — works for 2-exchange
- Graph approach finds multi-hop cycles (A→B→C→A) that pairwise misses
- Bellman-Ford detects negative cycles = profitable arbitrage loops
- No TF.js dependency — pure graph algorithms
- Follow EventEmitter pattern from HFTArbitrageEngine

## Requirements

### Functional
- Model exchanges+symbols as weighted directed graph
- Edge weight = -log(exchangeRate) adjusted for fees+latency
- Detect negative cycles via Bellman-Ford (= profitable arb paths)
- Support triangular (3-node) and multi-hop (4+ node) paths
- Real-time graph update when orderbook prices change
- Emit `'arbitragePath'` event with full path + expected profit

### Non-Functional
- Graph update < 1ms per edge
- Bellman-Ford scan < 10ms for 50-node graph
- < 200 lines

## Architecture

```
ExchangeNode {id: "binance:BTC/USDT:bid"}
       ↓
DirectedEdge {from, to, weight: -log(rate * (1-fee)), latencyMs, timestamp}
       ↓
ArbitrageGraph.updateEdge() → Bellman-Ford → NegativeCycle[] → emit paths
```

### Graph Structure
- Node = `exchangeId:symbol:side` (e.g., `binance:BTC/USDT:ask`)
- Edge = conversion rate between two nodes
- Cross-exchange edges: same symbol, different exchanges
- Cross-symbol edges: same exchange, different symbols (for triangular)
- Weight = `-log(rate * (1 - feeRate))` — negative cycle in log-space = profitable loop

## Related Code Files

### Reference (read patterns)
- `src/arbitrage/hft-arbitrage-engine.ts` — EventEmitter, IArbitrageOpportunity
- `src/interfaces/IArbitrageOpportunity.ts` — opportunity interface

### Create
- `src/arbitrage/graph-arbitrage-engine.ts`
- `tests/arbitrage/graph-arbitrage-engine.test.ts`

## Implementation Steps

1. Define interfaces:
   - `GraphNode { id: string, exchange: string, symbol: string, side: 'bid'|'ask' }`
   - `GraphEdge { from: string, to: string, weight: number, rate: number, fee: number, latencyMs: number, updatedAt: number }`
   - `ArbitragePath { nodes: string[], edges: GraphEdge[], expectedProfitPct: number, totalLatencyMs: number, cycleLength: number }`
2. Implement `GraphArbitrageEngine extends EventEmitter`:
   - `addNode(id, exchange, symbol, side)`
   - `updateEdge(from, to, rate, fee, latencyMs)` — recalculates weight as `-log(rate * (1-fee))`
   - `removeStaleEdges(maxAgeMs)` — prune edges older than threshold
   - `detectArbitrage(minProfitPct): ArbitragePath[]` — Bellman-Ford negative cycle detection
   - `getNodeCount() / getEdgeCount()` — diagnostics
3. Bellman-Ford implementation:
   - Standard V-1 relaxation passes
   - Vth pass detects negative cycles
   - Trace back cycle path
   - Convert log-space weight sum to profit percentage
4. Gate full path detection (4+ hops) behind LicenseService PRO; FREE tier gets triangular only
5. Write tests:
   - Simple triangular cycle detection (3 nodes, known profitable path)
   - No false positive when no arb exists
   - Edge update changes detection results
   - Stale edge removal works
   - Multi-hop (4-node) cycle detection
   - Profit calculation accuracy

## Todo List
- [ ] Define graph interfaces (Node, Edge, Path)
- [ ] Implement graph data structure (adjacency list)
- [ ] Implement `updateEdge` with log-space weight
- [ ] Implement Bellman-Ford negative cycle detection
- [ ] Implement cycle path tracing
- [ ] Implement stale edge pruning
- [ ] PRO gate on multi-hop (4+) paths
- [ ] Write tests (triangular, multi-hop, no-arb, stale)
- [ ] Verify < 200 lines

## Success Criteria
- Correctly detects known triangular arb (BTC→ETH→USDT→BTC)
- No false positives on balanced rates
- Bellman-Ford completes < 10ms on 50-node graph
- File < 200 lines

## Risk Assessment
- Bellman-Ford O(V*E) can be slow with many nodes: limit graph size, prune aggressively
- Stale edges create phantom arbs: enforce maxAgeMs (default 5s)
- Floating point precision in log-space: use threshold (minProfitPct > 0.05%)

## Security
- PRO license gate on multi-hop paths
- No external dependencies beyond EventEmitter
