/**
 * AMM Monitor — tracks Uniswap V3, Curve, Balancer LP positions.
 * All data is mocked; replace fetch calls with real on-chain reads.
 */

import { EventEmitter } from 'events';

export interface PoolState {
  poolId: string;
  protocol: 'uniswap_v3' | 'curve' | 'balancer';
  token0: string;
  token1: string;
  price: number;       // token1 per token0
  liquidity: number;   // USD notional
  fee: number;         // e.g. 0.003 for 0.3%
  tickLower?: number;  // Uni V3 only
  tickUpper?: number;
  updatedAt: number;
}

export interface AmmMonitorConfig {
  poolIds: string[];
  /** Poll interval in ms. */
  pollIntervalMs: number;
  dryRun: boolean;
}

const DEFAULT_CONFIG: AmmMonitorConfig = {
  poolIds: ['uniswap_v3_eth_usdc', 'curve_tricrypto', 'balancer_bb_a_usd'],
  pollIntervalMs: 5_000,
  dryRun: true,
};

/** Generate deterministic mock pool state. */
function mockPoolState(poolId: string): PoolState {
  const protocols: Record<string, PoolState['protocol']> = {
    uniswap_v3_eth_usdc: 'uniswap_v3',
    curve_tricrypto: 'curve',
    balancer_bb_a_usd: 'balancer',
  };
  const basePrices: Record<string, number> = {
    uniswap_v3_eth_usdc: 3_000,
    curve_tricrypto: 1.0,
    balancer_bb_a_usd: 1.0,
  };

  const base = basePrices[poolId] ?? 1.0;
  const noise = 1 + (Math.random() - 0.5) * 0.02;

  return {
    poolId,
    protocol: protocols[poolId] ?? 'uniswap_v3',
    token0: poolId.includes('eth') ? 'ETH' : 'USDC',
    token1: 'USDC',
    price: base * noise,
    liquidity: 5_000_000 + Math.random() * 1_000_000,
    fee: poolId.includes('uniswap') ? 0.003 : poolId.includes('curve') ? 0.0004 : 0.001,
    tickLower: poolId.includes('uniswap') ? -887_272 : undefined,
    tickUpper: poolId.includes('uniswap') ? 887_272 : undefined,
    updatedAt: Date.now(),
  };
}

export class AmmMonitor extends EventEmitter {
  private readonly cfg: AmmMonitorConfig;
  private readonly states = new Map<string, PoolState>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private pollCount = 0;

  constructor(config: Partial<AmmMonitorConfig> = {}) {
    super();
    this.cfg = { ...DEFAULT_CONFIG, ...config };
  }

  start(): void {
    if (this.timer) return;
    // Immediate first poll
    this.poll();
    this.timer = setInterval(() => this.poll(), this.cfg.pollIntervalMs);
    this.emit('started', { pools: this.cfg.poolIds });
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.emit('stopped');
  }

  getPoolState(poolId: string): PoolState | undefined {
    return this.states.get(poolId);
  }

  getAllStates(): PoolState[] {
    return Array.from(this.states.values());
  }

  getPollCount(): number {
    return this.pollCount;
  }

  private poll(): void {
    this.pollCount++;
    for (const poolId of this.cfg.poolIds) {
      const state = mockPoolState(poolId);
      this.states.set(poolId, state);
      this.emit('pool:updated', state);
    }
  }
}
