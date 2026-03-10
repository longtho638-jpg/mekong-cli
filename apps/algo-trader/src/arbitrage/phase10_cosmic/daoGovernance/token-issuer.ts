/**
 * Token Issuer — Mock ERC20 governance token deployment.
 * Simulates on-chain token contract without external deps.
 * All ops default to dry-run mode.
 */

import { createHash, randomBytes } from 'crypto';

export interface TokenIssuerConfig {
  /** Token contract name. */
  name: string;
  /** Token ticker symbol. */
  symbol: string;
  /** Max supply cap (0 = unlimited). Default: 0. */
  maxSupply: number;
  /** Dry-run: skip state changes. Default: true. */
  dryRun: boolean;
}

export interface TokenInfo {
  contractAddress: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: number;
  deployedAt: number;
}

const DEFAULT_CONFIG: TokenIssuerConfig = {
  name: 'GovToken',
  symbol: 'GOV',
  maxSupply: 0,
  dryRun: true,
};

/** Deterministic mock contract address from seed. */
function mockAddress(seed: string): string {
  const hash = createHash('sha256').update(seed).digest('hex');
  return '0x' + hash.substring(0, 40);
}

export class TokenIssuer {
  private readonly cfg: TokenIssuerConfig;
  private tokenInfo: TokenInfo | null = null;
  private balances: Map<string, number> = new Map();
  private supply = 0;

  constructor(config: Partial<TokenIssuerConfig> = {}) {
    this.cfg = { ...DEFAULT_CONFIG, ...config };
  }

  /** Deploy the ERC20 governance token contract (mock). */
  deploy(): TokenInfo {
    const seed = randomBytes(16).toString('hex');
    const contractAddress = mockAddress(`${this.cfg.name}-${this.cfg.symbol}-${seed}`);
    this.tokenInfo = {
      contractAddress,
      name: this.cfg.name,
      symbol: this.cfg.symbol,
      decimals: 18,
      totalSupply: 0,
      deployedAt: Date.now(),
    };
    this.balances.clear();
    this.supply = 0;
    return { ...this.tokenInfo };
  }

  /** Mint tokens to an address. Throws if cap exceeded. */
  mint(to: string, amount: number): void {
    if (!to) throw new Error('mint: address required');
    if (amount <= 0) throw new Error('mint: amount must be positive');
    if (this.cfg.maxSupply > 0 && this.supply + amount > this.cfg.maxSupply) {
      throw new Error(`mint: exceeds maxSupply (${this.cfg.maxSupply})`);
    }
    if (this.cfg.dryRun) return;
    const prev = this.balances.get(to) ?? 0;
    this.balances.set(to, prev + amount);
    this.supply += amount;
    if (this.tokenInfo) this.tokenInfo.totalSupply = this.supply;
  }

  /** Burn tokens from an address. Throws if insufficient balance. */
  burn(from: string, amount: number): void {
    if (!from) throw new Error('burn: address required');
    if (amount <= 0) throw new Error('burn: amount must be positive');
    if (this.cfg.dryRun) return;
    const current = this.balances.get(from) ?? 0;
    if (current < amount) throw new Error(`burn: insufficient balance (${current})`);
    this.balances.set(from, current - amount);
    this.supply -= amount;
    if (this.tokenInfo) this.tokenInfo.totalSupply = this.supply;
  }

  /** Returns token balance for address (0 if unknown). */
  balanceOf(address: string): number {
    return this.balances.get(address) ?? 0;
  }

  /** Returns current total supply. */
  totalSupply(): number {
    return this.supply;
  }

  /** Returns deployed token info, or null if not deployed. */
  getTokenInfo(): TokenInfo | null {
    return this.tokenInfo ? { ...this.tokenInfo } : null;
  }

  isDryRun(): boolean {
    return this.cfg.dryRun;
  }
}
