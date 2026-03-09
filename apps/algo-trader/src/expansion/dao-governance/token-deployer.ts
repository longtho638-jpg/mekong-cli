/**
 * Mock ERC20 governance token deployment.
 * No real blockchain interaction — all state is in-memory.
 */

import { EventEmitter } from 'events';

export interface TokenDeployment {
  symbol: string;
  name: string;
  totalSupply: bigint;
  contractAddress: string;
  deployedAt: number;
}

export interface TokenDeployerConfig {
  symbol: string;
  name?: string;
  totalSupply?: bigint;
}

/** Generates a deterministic mock contract address from symbol. */
function mockAddress(symbol: string): string {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = (hash * 31 + symbol.charCodeAt(i)) & 0xffffffff;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `0x${hex}${'0'.repeat(32)}`.slice(0, 42);
}

export class TokenDeployer extends EventEmitter {
  private deployment: TokenDeployment | null = null;
  private readonly config: TokenDeployerConfig;

  constructor(config: TokenDeployerConfig) {
    super();
    this.config = config;
  }

  /** Simulate deploying an ERC20 governance token on-chain. */
  async deploy(): Promise<TokenDeployment> {
    if (this.deployment) {
      return this.deployment;
    }

    await Promise.resolve(); // simulate async tx

    this.deployment = {
      symbol: this.config.symbol,
      name: this.config.name ?? `${this.config.symbol} Governance Token`,
      totalSupply: this.config.totalSupply ?? 1_000_000n * 10n ** 18n,
      contractAddress: mockAddress(this.config.symbol),
      deployedAt: Date.now(),
    };

    this.emit('deployed', this.deployment);
    return this.deployment;
  }

  getDeployment(): TokenDeployment | null {
    return this.deployment;
  }

  isDeployed(): boolean {
    return this.deployment !== null;
  }
}
