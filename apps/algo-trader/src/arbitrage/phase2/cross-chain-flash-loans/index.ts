/**
 * Cross-Chain Flash Loan Engine — orchestrator entry point.
 * Wires together DexRegistry, FlashLoanProvider, and SmartOrderRouter
 * with sensible defaults for Ethereum, Solana, and BSC.
 */

import { EventEmitter } from 'events';
import { logger } from '../../../utils/logger';
import { DexNode, DexRegistry } from './dex-node';
import { FlashLoanProvider } from './flash-loan-provider';
import { RoutePath, RouterConfig, SmartOrderRouter } from './smart-order-router';

export * from './dex-node';
export * from './flash-loan-provider';
export * from './smart-order-router';

/**
 * CrossChainFlashLoanEngine bootstraps the full routing stack and exposes
 * a single `scanRoutes` method for the trading loop.
 *
 * Events:
 *   'initialized'     — emitted once after initialize() completes
 *   'routes:scanned'  — emitted after each scanRoutes() call with results
 */
export class CrossChainFlashLoanEngine extends EventEmitter {
  private dexRegistry: DexRegistry;
  private flashLoanProvider: FlashLoanProvider;
  private router: SmartOrderRouter;
  private routesFound = 0;

  constructor(config: RouterConfig = {}) {
    super();
    this.dexRegistry = new DexRegistry();
    this.flashLoanProvider = new FlashLoanProvider();
    this.router = new SmartOrderRouter(this.dexRegistry, this.flashLoanProvider, config);
  }

  /**
   * Register default DEXes and bridges for Ethereum, Solana, and BSC.
   * Also seeds Aave v3 and Port Finance as flash loan providers.
   */
  async initialize(): Promise<void> {
    // ── DEX nodes ────────────────────────────────────────────────────────────
    const defaultNodes: DexNode[] = [
      { id: 'uniswapV3:ETH/USDC',    chain: 'ethereum', protocol: 'uniswapV3',    symbol: 'ETH/USDC',  liquidity: 50_000_000, feePct: 0.003,  gasEstimateUsd: 8  },
      { id: 'uniswapV3:BTC/USDC',    chain: 'ethereum', protocol: 'uniswapV3',    symbol: 'BTC/USDC',  liquidity: 30_000_000, feePct: 0.003,  gasEstimateUsd: 8  },
      { id: 'curve:USDC/USDT',       chain: 'ethereum', protocol: 'curve',        symbol: 'USDC/USDT', liquidity: 100_000_000,feePct: 0.0004, gasEstimateUsd: 6  },
      { id: 'raydium:SOL/USDC',      chain: 'solana',   protocol: 'raydium',      symbol: 'SOL/USDC',  liquidity: 20_000_000, feePct: 0.0025, gasEstimateUsd: 0.01 },
      { id: 'orca:ETH/USDC',         chain: 'solana',   protocol: 'orca',         symbol: 'ETH/USDC',  liquidity: 10_000_000, feePct: 0.003,  gasEstimateUsd: 0.01 },
      { id: 'pancakeswap:BNB/USDT',  chain: 'bsc',      protocol: 'pancakeswap',  symbol: 'BNB/USDT',  liquidity: 25_000_000, feePct: 0.002,  gasEstimateUsd: 0.5  },
      { id: 'pancakeswap:ETH/USDT',  chain: 'bsc',      protocol: 'pancakeswap',  symbol: 'ETH/USDT',  liquidity: 15_000_000, feePct: 0.002,  gasEstimateUsd: 0.5  },
    ];

    for (const node of defaultNodes) {
      this.dexRegistry.registerDex(node);
    }

    // ── Bridges ──────────────────────────────────────────────────────────────
    const ethUsdc  = this.dexRegistry.getNode('uniswapV3:ETH/USDC')!;
    const solUsdc  = this.dexRegistry.getNode('orca:ETH/USDC')!;
    const bscUsdt  = this.dexRegistry.getNode('pancakeswap:ETH/USDT')!;

    this.dexRegistry.registerBridge({
      from: ethUsdc, to: solUsdc,
      bridgeProtocol: 'wormhole', bridgeFeeUsd: 2, bridgeTimeMs: 15_000, maxAmount: 1_000_000,
    });
    this.dexRegistry.registerBridge({
      from: solUsdc, to: ethUsdc,
      bridgeProtocol: 'wormhole', bridgeFeeUsd: 2, bridgeTimeMs: 15_000, maxAmount: 1_000_000,
    });
    this.dexRegistry.registerBridge({
      from: ethUsdc, to: bscUsdt,
      bridgeProtocol: 'axelar', bridgeFeeUsd: 1, bridgeTimeMs: 20_000, maxAmount: 500_000,
    });

    // ── Flash loan providers ─────────────────────────────────────────────────
    this.flashLoanProvider.registerProvider('ethereum', 'aave_v3', [
      { asset: 'ETH',  maxAmount: 10_000_000, feePct: 0.0009 },
      { asset: 'USDC', maxAmount: 50_000_000, feePct: 0.0009 },
      { asset: 'BTC',  maxAmount: 5_000_000,  feePct: 0.0009 },
    ], 8);

    this.flashLoanProvider.registerProvider('ethereum', 'dydx', [
      { asset: 'ETH',  maxAmount: 5_000_000,  feePct: 0 },
      { asset: 'USDC', maxAmount: 20_000_000, feePct: 0 },
    ], 12);

    this.flashLoanProvider.registerProvider('solana', 'port_finance', [
      { asset: 'SOL',  maxAmount: 2_000_000,  feePct: 0.001 },
      { asset: 'USDC', maxAmount: 10_000_000, feePct: 0.001 },
    ], 0.02);

    logger.info(
      `[CrossChainEngine] Initialized: dex=${this.dexRegistry.getNodeCount()} ` +
      `bridges=${this.dexRegistry.getBridgeCount()} ` +
      `flashProviders=${this.flashLoanProvider.getProviderCount()}`
    );

    this.emit('initialized', this.getStatus());
  }

  /**
   * Scan for profitable routes given current CEX price snapshot.
   */
  async scanRoutes(
    cexPrices: Map<string, { bid: number; ask: number }>
  ): Promise<RoutePath[]> {
    const assets = new Set<string>();
    for (const key of cexPrices.keys()) {
      const base = key.split('/')[0];
      if (base) assets.add(base);
    }

    const allRoutes: RoutePath[] = [];

    for (const asset of assets) {
      const routes = this.router.findRoutes(asset, 10_000, cexPrices);
      allRoutes.push(...routes);
    }

    this.routesFound += allRoutes.length;
    this.emit('routes:scanned', allRoutes);

    if (allRoutes.length > 0) {
      logger.info(`[CrossChainEngine] Scan found ${allRoutes.length} profitable routes`);
    }

    return allRoutes;
  }

  getStatus(): { dexCount: number; bridgeCount: number; routesFound: number } {
    return {
      dexCount:    this.dexRegistry.getNodeCount(),
      bridgeCount: this.dexRegistry.getBridgeCount(),
      routesFound: this.routesFound,
    };
  }
}
