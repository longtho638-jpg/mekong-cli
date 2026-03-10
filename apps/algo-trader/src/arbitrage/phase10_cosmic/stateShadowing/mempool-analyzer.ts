/**
 * MempoolAnalyzer — connects to mempool data (mock static JSON feed).
 * Builds a directed graph of pending transactions.
 * Module 3 of Phase 10 Cosmic — default disabled/dry-run.
 */

export interface MempoolAnalyzerConfig {
  /** Master switch. Default: false. */
  enabled: boolean;
  /** Poll interval in ms. Default: 1000. */
  pollIntervalMs: number;
  /** Max pending transactions to retain. Default: 500. */
  maxPending: number;
}

export interface PendingTransaction {
  hash: string;
  from: string;
  to: string;
  value: bigint;
  gasPrice: bigint;
  nonce: number;
  data: string;
  timestamp: number;
}

export interface TxGraph {
  /** Adjacency list: from -> list of tx hashes */
  edges: Map<string, string[]>;
  /** All pending txns indexed by hash */
  nodes: Map<string, PendingTransaction>;
}

type Subscriber = (txns: PendingTransaction[]) => void;

const DEFAULT_CONFIG: MempoolAnalyzerConfig = {
  enabled: false,
  pollIntervalMs: 1000,
  maxPending: 500,
};

/** Static mock mempool feed — deterministic for testing. */
function buildMockFeed(count: number): PendingTransaction[] {
  const addrs = ['0xAAA', '0xBBB', '0xCCC', '0xDDD', '0xEEE'];
  const txns: PendingTransaction[] = [];
  for (let i = 0; i < count; i++) {
    txns.push({
      hash: `0x${i.toString(16).padStart(64, '0')}`,
      from: addrs[i % addrs.length],
      to: addrs[(i + 1) % addrs.length],
      value: BigInt(i * 1_000_000),
      gasPrice: BigInt(1_000_000_000 + i * 1_000),
      nonce: i,
      data: i % 3 === 0 ? '0xswap' : '0x',
      timestamp: Date.now() - (count - i) * 100,
    });
  }
  return txns;
}

export class MempoolAnalyzer {
  private readonly cfg: MempoolAnalyzerConfig;
  private pending: Map<string, PendingTransaction> = new Map();
  private subscribers: Subscriber[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(config: Partial<MempoolAnalyzerConfig> = {}) {
    this.cfg = { ...DEFAULT_CONFIG, ...config };
  }

  start(): void {
    if (!this.cfg.enabled || this.timer !== null) return;
    this.timer = setInterval(() => this._poll(), this.cfg.pollIntervalMs);
    this._poll();
  }

  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private _poll(): void {
    const fresh = buildMockFeed(20);
    for (const tx of fresh) {
      if (this.pending.size >= this.cfg.maxPending) break;
      this.pending.set(tx.hash, tx);
    }
    const list = Array.from(this.pending.values());
    for (const sub of this.subscribers) {
      try { sub(list); } catch { /* swallow subscriber errors */ }
    }
  }

  getPendingTxns(): PendingTransaction[] {
    return Array.from(this.pending.values());
  }

  getGraph(): TxGraph {
    const edges = new Map<string, string[]>();
    const nodes = new Map<string, PendingTransaction>(this.pending);
    for (const tx of this.pending.values()) {
      const list = edges.get(tx.from) ?? [];
      list.push(tx.hash);
      edges.set(tx.from, list);
    }
    return { edges, nodes };
  }

  subscribe(fn: Subscriber): () => void {
    this.subscribers.push(fn);
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== fn);
    };
  }

  isRunning(): boolean {
    return this.timer !== null;
  }
}
