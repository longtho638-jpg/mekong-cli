/**
 * Mock bridge connections for supported chains.
 * No real RPC calls — all state is simulated in-memory.
 */

import { EventEmitter } from 'events';
import type { ChainStatus } from '../expansion-config-types';

const MOCK_LATENCY: Record<string, number> = {
  ethereum: 120,
  solana: 45,
  bsc: 90,
};

export class ChainConnector extends EventEmitter {
  private readonly chains: string[];
  private readonly connections: Map<string, boolean> = new Map();

  constructor(chains: string[]) {
    super();
    this.chains = chains;
  }

  /** Simulate connecting to all configured chains. */
  async connectAll(): Promise<ChainStatus[]> {
    const statuses: ChainStatus[] = [];

    for (const chain of this.chains) {
      // Mock: all known chains connect successfully
      const connected = chain in MOCK_LATENCY;
      this.connections.set(chain, connected);
      const status: ChainStatus = {
        chain,
        connected,
        latencyMs: connected ? (MOCK_LATENCY[chain] ?? 200) : 0,
      };
      statuses.push(status);
      this.emit('chain-connected', status);
    }

    return statuses;
  }

  /** Returns connection status for a specific chain. */
  isConnected(chain: string): boolean {
    return this.connections.get(chain) === true;
  }

  /** Disconnect a chain (simulate failure). */
  disconnect(chain: string): void {
    this.connections.set(chain, false);
    this.emit('chain-disconnected', chain);
  }

  /** Returns list of currently connected chains. */
  getConnectedChains(): string[] {
    return Array.from(this.connections.entries())
      .filter(([, v]) => v)
      .map(([k]) => k);
  }
}
