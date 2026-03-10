/**
 * WalletGenerator — creates deterministic mock Ethereum/Solana addresses
 * using seeded hashing. No real blockchain dependencies. Pure simulation.
 */

import { createHash } from 'crypto';
import { logger } from '../../../utils/logger';

export interface MockWallet {
  address: string;
  chain: 'ethereum' | 'solana';
  index: number;
  balance: number;
}

export class WalletGenerator {
  private seed: string;
  private cache: Map<number, MockWallet> = new Map();

  constructor(seed: string) {
    this.seed = seed;
  }

  /**
   * Deterministically derive a mock address from seed + index.
   * Alternates ethereum/solana by even/odd index.
   */
  getWallet(index: number): MockWallet {
    if (this.cache.has(index)) {
      return this.cache.get(index)!;
    }

    const chain: 'ethereum' | 'solana' = index % 2 === 0 ? 'ethereum' : 'solana';
    const hash = createHash('sha256')
      .update(`${this.seed}:${index}:${chain}`)
      .digest('hex');

    const address = chain === 'ethereum'
      ? `0x${hash.slice(0, 40)}`
      : hash.slice(0, 44).toUpperCase();

    // Deterministic starting balance: 0.1–10 units derived from hash bytes
    const balanceSeed = parseInt(hash.slice(40, 48), 16);
    const balance = (balanceSeed % 990 + 10) / 100; // 0.10–9.99

    const wallet: MockWallet = { address, chain, index, balance };
    this.cache.set(index, wallet);

    logger.debug(`[WalletGenerator] wallet[${index}] ${chain} ${address.slice(0, 12)}... bal=${balance.toFixed(3)}`);
    return wallet;
  }

  generate(count: number): MockWallet[] {
    logger.info(`[WalletGenerator] Generating ${count} deterministic wallets (seed=${this.seed.slice(0, 8)}...)`);
    return Array.from({ length: count }, (_, i) => this.getWallet(i));
  }
}
