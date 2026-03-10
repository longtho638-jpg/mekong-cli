/**
 * DEX Deployer — simulates Uniswap V2-style DEX deployment on testnet.
 * Mock: generates deterministic contract addresses, pair addresses, tx hashes.
 * In production: would submit EVM bytecode, await tx receipt.
 * All instances default to simulation: true.
 */

import { randomBytes } from 'crypto';

export interface DexDeployerConfig {
  /** Simulation mode — no real transactions. Default: true. */
  simulation: boolean;
  /** Chain ID to deploy on. Default: 31337 (Hardhat). */
  chainId: number;
  /** Initial ETH liquidity per pair in USD equivalent. Default: 10_000. */
  initialLiquidityUsd: number;
}

export interface TokenPair {
  token0: string;
  token1: string;
  pairAddress: string;
  reserve0: number;
  reserve1: number;
}

export interface DexDeployment {
  factoryAddress: string;
  routerAddress: string;
  deploymentTxHash: string;
  pairs: TokenPair[];
  chainId: number;
  simulation: boolean;
  deployedAt: number;
}

const DEFAULT_CONFIG: DexDeployerConfig = {
  simulation: true,
  chainId: 31337,
  initialLiquidityUsd: 10_000,
};

function mockAddress(): string {
  return '0x' + randomBytes(20).toString('hex');
}

function mockTxHash(): string {
  return '0x' + randomBytes(32).toString('hex');
}

export class DexDeployer {
  private readonly cfg: DexDeployerConfig;
  private deployments: DexDeployment[] = [];

  constructor(config: Partial<DexDeployerConfig> = {}) {
    this.cfg = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Deploy factory + router contracts.
   * @param pairs Token pair symbols to create (e.g. ['ETH/USDC', 'WBTC/ETH']).
   * Returns DexDeployment with addresses and pair info.
   */
  deploy(pairs: string[] = ['ETH/USDC', 'WBTC/ETH']): DexDeployment {
    const factoryAddress = mockAddress();
    const routerAddress = mockAddress();
    const deploymentTxHash = mockTxHash();

    const tokenPairs: TokenPair[] = pairs.map((pair) => {
      const [token0, token1] = pair.split('/');
      const reserve0 = this.cfg.initialLiquidityUsd * (0.9 + Math.random() * 0.2);
      const reserve1 = reserve0 * (0.95 + Math.random() * 0.1);
      return {
        token0: token0 ?? 'TOKEN0',
        token1: token1 ?? 'TOKEN1',
        pairAddress: mockAddress(),
        reserve0: parseFloat(reserve0.toFixed(4)),
        reserve1: parseFloat(reserve1.toFixed(4)),
      };
    });

    const deployment: DexDeployment = {
      factoryAddress,
      routerAddress,
      deploymentTxHash,
      pairs: tokenPairs,
      chainId: this.cfg.chainId,
      simulation: this.cfg.simulation,
      deployedAt: Date.now(),
    };

    this.deployments.push(deployment);
    return deployment;
  }

  /** Return a copy of all deployments. */
  getDeployments(): DexDeployment[] {
    return [...this.deployments];
  }

  /** Clear deployment history. */
  clearDeployments(): void {
    this.deployments.length = 0;
  }

  getConfig(): DexDeployerConfig {
    return { ...this.cfg };
  }
}
