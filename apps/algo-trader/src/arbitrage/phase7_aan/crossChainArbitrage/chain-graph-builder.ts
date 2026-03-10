/**
 * Chain Graph Builder — dynamic directed graph of exchanges and trading pairs.
 * Nodes = exchanges (CEX + DEX), edges = pairs with price/liquidity/fees.
 * Used by Bellman-Ford path finder to detect profitable cycles.
 */

export type ChainId = 'ethereum' | 'solana' | 'bsc' | 'polygon';
export type ExchangeType = 'cex' | 'dex';

export interface ExchangeNode {
  id: string;           // e.g. "binance", "uniswap_v3_eth"
  name: string;
  chain: ChainId;
  type: ExchangeType;
}

export interface PairEdge {
  from: string;         // exchange id
  to: string;           // exchange id
  baseAsset: string;
  quoteAsset: string;
  price: number;        // quote per base
  liquidity: number;    // available liquidity in base units
  feeBps: number;       // total fee in basis points
  /** log(-price * (1 - fee)) — used by Bellman-Ford for cycle detection */
  weight: number;
  updatedAt: number;
}

export interface ChainGraph {
  nodes: Map<string, ExchangeNode>;
  edges: PairEdge[];
}

/** Compute Bellman-Ford weight: negative log of effective exchange rate. */
function computeWeight(price: number, feeBps: number): number {
  const effectiveRate = price * (1 - feeBps / 10_000);
  return -Math.log(effectiveRate + 1e-12);
}

const MOCK_EXCHANGES: ExchangeNode[] = [
  { id: 'binance',        name: 'Binance',       chain: 'ethereum', type: 'cex' },
  { id: 'coinbase',       name: 'Coinbase',      chain: 'ethereum', type: 'cex' },
  { id: 'kraken',         name: 'Kraken',        chain: 'ethereum', type: 'cex' },
  { id: 'uniswap_v3',     name: 'Uniswap V3',    chain: 'ethereum', type: 'dex' },
  { id: 'raydium',        name: 'Raydium',       chain: 'solana',   type: 'dex' },
  { id: 'pancakeswap',    name: 'PancakeSwap',   chain: 'bsc',      type: 'dex' },
];

/** Build mock price edges between exchanges for a given asset triple. */
function buildMockEdges(nodes: ExchangeNode[]): PairEdge[] {
  const edges: PairEdge[] = [];
  const pairs = [
    { base: 'BTC', quote: 'USDT', basePrice: 50_000 },
    { base: 'ETH', quote: 'USDT', basePrice: 3_000 },
    { base: 'BTC', quote: 'ETH',  basePrice: 16.67 },
  ];

  for (const node of nodes) {
    for (const pair of pairs) {
      // Add small random spread per exchange to simulate market differences
      const priceFuzz = 1 + (Math.random() - 0.5) * 0.002;
      const price = pair.basePrice * priceFuzz;
      const feeBps = node.type === 'dex' ? 30 : 10;

      edges.push({
        from: node.id,
        to: node.id,
        baseAsset: pair.base,
        quoteAsset: pair.quote,
        price,
        liquidity: 10 + Math.random() * 90,
        feeBps,
        weight: computeWeight(price, feeBps),
        updatedAt: Date.now(),
      });
    }
  }
  return edges;
}

export class ChainGraphBuilder {
  private graph: ChainGraph;

  constructor() {
    this.graph = { nodes: new Map(), edges: [] };
    this.initializeMockExchanges();
  }

  private initializeMockExchanges(): void {
    for (const ex of MOCK_EXCHANGES) {
      this.graph.nodes.set(ex.id, ex);
    }
    this.graph.edges = buildMockEdges(MOCK_EXCHANGES);
  }

  /**
   * Update price for a specific exchange/pair edge.
   * Recomputes Bellman-Ford weight after update.
   */
  updatePrice(
    exchangeId: string,
    baseAsset: string,
    quoteAsset: string,
    price: number,
    liquidity: number,
  ): void {
    const edge = this.graph.edges.find(
      (e) => e.from === exchangeId && e.baseAsset === baseAsset && e.quoteAsset === quoteAsset,
    );
    if (edge) {
      edge.price = price;
      edge.liquidity = liquidity;
      edge.weight = computeWeight(price, edge.feeBps);
      edge.updatedAt = Date.now();
    }
  }

  /** Refresh all mock prices (simulates live feed update). */
  refreshPrices(): void {
    for (const edge of this.graph.edges) {
      const fuzz = 1 + (Math.random() - 0.5) * 0.002;
      edge.price *= fuzz;
      edge.weight = computeWeight(edge.price, edge.feeBps);
      edge.updatedAt = Date.now();
    }
  }

  getGraph(): ChainGraph {
    return this.graph;
  }

  getEdgesForPair(baseAsset: string, quoteAsset: string): PairEdge[] {
    return this.graph.edges.filter(
      (e) => e.baseAsset === baseAsset && e.quoteAsset === quoteAsset,
    );
  }
}
