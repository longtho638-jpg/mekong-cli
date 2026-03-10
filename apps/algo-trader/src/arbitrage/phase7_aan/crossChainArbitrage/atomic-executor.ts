/**
 * Atomic Executor — multi-chain trade coordination.
 * Sequence: flash loan borrow → execute swaps along path → repay loan.
 * Integrates FlashLoanManager + MEVProtector for safe execution.
 */

import { EventEmitter } from 'events';
import { FlashLoanManager, type FlashLoanResult } from './flash-loan-manager';
import { MEVProtector, type BundleSubmitResult } from './mev-protector';
import type { ArbitragePath } from './path-finder';

export interface ExecutionConfig {
  minProfitUsd: number;
  maxSlippageBps: number;
  dryRun: boolean;
}

export interface AtomicExecutionResult {
  path: ArbitragePath;
  flashLoan: FlashLoanResult;
  mevBundle: BundleSubmitResult | null;
  netProfitUsd: number;
  success: boolean;
  failureReason?: string;
  durationMs: number;
}

const DEFAULT_CONFIG: ExecutionConfig = {
  minProfitUsd: 50,
  maxSlippageBps: 30,
  dryRun: true,
};

export class AtomicExecutor extends EventEmitter {
  private readonly cfg: ExecutionConfig;
  private readonly flashLoanMgr: FlashLoanManager;
  private readonly mevProtector: MEVProtector;
  private executionCount = 0;
  private successCount = 0;

  constructor(config: Partial<ExecutionConfig> = {}) {
    super();
    this.cfg = { ...DEFAULT_CONFIG, ...config };
    this.flashLoanMgr = new FlashLoanManager(this.cfg.dryRun);
    this.mevProtector = new MEVProtector('flashbots', this.cfg.dryRun);
  }

  /**
   * Execute a triangular arbitrage path atomically.
   * 1. Validate profit threshold.
   * 2. Build MEV-protected bundle.
   * 3. Execute flash loan with swap callback.
   */
  async execute(path: ArbitragePath): Promise<AtomicExecutionResult> {
    const start = Date.now();
    this.executionCount++;

    if (path.estimatedProfitUsd < this.cfg.minProfitUsd) {
      const result: AtomicExecutionResult = {
        path,
        flashLoan: this.makeFailedLoanResult(path),
        mevBundle: null,
        netProfitUsd: 0,
        success: false,
        failureReason: `Profit ${path.estimatedProfitUsd.toFixed(2)} < min ${this.cfg.minProfitUsd}`,
        durationMs: Date.now() - start,
      };
      this.emit('skipped', result);
      return result;
    }

    // Determine chain from first hop
    const chain = path.hops[0]?.exchangeId.includes('raydium') ? 'solana' : 'ethereum';
    const relay = this.mevProtector.selectRelay(chain);
    const provider = this.flashLoanMgr.selectProvider(path.startCapitalUsd, chain);

    // Build MEV bundle (mock transactions)
    const mockTxs = path.hops.map((hop) => ({
      chain,
      to: `0x${hop.exchangeId.padEnd(40, '0')}`,
      data: `swap_${hop.fromAsset}_${hop.toAsset}`,
      value: path.startCapitalUsd,
    }));

    const bundle =
      chain === 'solana'
        ? this.mevProtector.buildSolanaBundle(mockTxs, Date.now())
        : this.mevProtector.buildEthereumBundle(mockTxs, 0);

    const mevBundle = await this.mevProtector.submit(bundle, path.estimatedProfitUsd);

    if (!mevBundle.included && relay !== 'none') {
      const result: AtomicExecutionResult = {
        path,
        flashLoan: this.makeFailedLoanResult(path),
        mevBundle,
        netProfitUsd: 0,
        success: false,
        failureReason: 'MEV bundle not included',
        durationMs: Date.now() - start,
      };
      this.emit('mev:missed', result);
      return result;
    }

    // Execute flash loan with swap callback
    const flashLoan = await this.flashLoanMgr.execute({
      provider,
      asset: path.hops[0]?.fromAsset ?? 'USDT',
      amountUsd: path.startCapitalUsd,
      callback: async (amount) => {
        // Real impl: execute each swap hop atomically on-chain
        await Promise.resolve();
        return amount * (path.profitRatio - 1);
      },
    });

    const netProfitUsd = flashLoan.netProfitUsd;
    const success = flashLoan.success && netProfitUsd > 0;
    if (success) this.successCount++;

    const result: AtomicExecutionResult = {
      path,
      flashLoan,
      mevBundle,
      netProfitUsd,
      success,
      durationMs: Date.now() - start,
    };

    this.emit(success ? 'executed' : 'failed', result);
    return result;
  }

  private makeFailedLoanResult(path: ArbitragePath): FlashLoanResult {
    return {
      provider: 'aave',
      asset: path.hops[0]?.fromAsset ?? 'USDT',
      borrowedAmount: path.startCapitalUsd,
      repaidAmount: 0,
      feePaid: 0,
      netProfitUsd: 0,
      success: false,
      durationMs: 0,
    };
  }

  getStats(): { executions: number; successes: number; successRate: number } {
    return {
      executions: this.executionCount,
      successes: this.successCount,
      successRate: this.executionCount > 0 ? this.successCount / this.executionCount : 0,
    };
  }
}
