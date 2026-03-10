/**
 * PatternDetector — monitors simulated transactions for wallet cluster
 * accumulation patterns. Emits 'pattern_detected' when threshold met.
 */

import { EventEmitter } from 'events';
import { logger } from '../../../utils/logger';
import type { SimulatedTx } from './tx-orchestrator';

export interface AccumulationPattern {
  walletCluster: string[];
  totalAccumulated: number;
  timeSpanMs: number;
  confidence: number;
}

interface TokenAccumulation {
  wallets: Map<string, number>; // address -> amount accumulated
  firstSeen: number;
  lastSeen: number;
}

const DEFAULT_WINDOW_MS = 30_000;
const DEFAULT_THRESHOLD = 1.0;
const DEFAULT_MIN_WALLETS = 2;

export class PatternDetector extends EventEmitter {
  private accumulations: Map<string, TokenAccumulation> = new Map(); // token -> accumulation
  private detectedPatterns: AccumulationPattern[] = [];
  private windowMs: number;
  private accumulationThreshold: number;
  private minWallets: number;

  constructor(options?: { windowMs?: number; accumulationThreshold?: number; minWallets?: number }) {
    super();
    this.windowMs = options?.windowMs ?? DEFAULT_WINDOW_MS;
    this.accumulationThreshold = options?.accumulationThreshold ?? DEFAULT_THRESHOLD;
    this.minWallets = options?.minWallets ?? DEFAULT_MIN_WALLETS;
  }

  analyzeTxStream(txs: SimulatedTx[]): AccumulationPattern[] {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    const newPatterns: AccumulationPattern[] = [];

    for (const tx of txs) {
      if (tx.timestamp < cutoff) continue;

      const key = tx.token;
      if (!this.accumulations.has(key)) {
        this.accumulations.set(key, { wallets: new Map(), firstSeen: tx.timestamp, lastSeen: tx.timestamp });
      }

      const acc = this.accumulations.get(key)!;
      const current = acc.wallets.get(tx.to) ?? 0;
      acc.wallets.set(tx.to, current + tx.value);
      acc.lastSeen = Math.max(acc.lastSeen, tx.timestamp);
    }

    // Detect patterns: multiple wallets accumulating same token
    for (const [token, acc] of this.accumulations) {
      const qualifyingWallets = [...acc.wallets.entries()]
        .filter(([, amount]) => amount >= this.accumulationThreshold * 0.1);

      if (qualifyingWallets.length < this.minWallets) continue;

      const totalAccumulated = qualifyingWallets.reduce((sum, [, amt]) => sum + amt, 0);
      if (totalAccumulated < this.accumulationThreshold) continue;

      const timeSpanMs = acc.lastSeen - acc.firstSeen;
      const walletCluster = qualifyingWallets.map(([addr]) => addr);

      // Confidence: ratio of wallets participating vs window tightness
      const windowRatio = Math.max(0.1, 1 - timeSpanMs / this.windowMs);
      const confidence = Math.min(1, (walletCluster.length / 5) * 0.5 + windowRatio * 0.5);

      const pattern: AccumulationPattern = { walletCluster, totalAccumulated, timeSpanMs, confidence };

      logger.info(
        `[PatternDetector] Accumulation detected token=${token} wallets=${walletCluster.length} ` +
        `total=${totalAccumulated.toFixed(4)} conf=${confidence.toFixed(2)}`
      );

      this.detectedPatterns.push(pattern);
      newPatterns.push(pattern);
      this.emit('pattern_detected', pattern);

      // Reset accumulation for token after detection
      this.accumulations.delete(token);
    }

    return newPatterns;
  }

  getDetectedPatterns(): AccumulationPattern[] {
    return [...this.detectedPatterns];
  }

  reset(): void {
    this.accumulations.clear();
    this.detectedPatterns = [];
  }
}
