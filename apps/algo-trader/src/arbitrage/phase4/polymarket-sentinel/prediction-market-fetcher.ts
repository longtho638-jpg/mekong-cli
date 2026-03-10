/**
 * PredictionMarketFetcher — simulated Polymarket contract fetcher.
 * In production would connect to Polymarket CLOB API via WebSocket.
 * Simulation mode: cycles through static mock prediction contracts.
 */

import { EventEmitter } from 'events';
import { logger } from '../../../utils/logger';

export interface PredictionContract {
  id: string;
  question: string;
  yesPrice: number; // 0.0 - 1.0 (probability)
  noPrice: number;
  volume: number;  // USD
  category: string;
  expiresAt: number; // unix ms
}

const MOCK_CONTRACTS: PredictionContract[] = [
  { id: 'pm1', question: 'Will BTC exceed $100k by end of Q1 2026?', yesPrice: 0.62, noPrice: 0.38, volume: 4_200_000, category: 'crypto', expiresAt: 1743465600000 },
  { id: 'pm2', question: 'Will the Fed cut rates in March 2026?', yesPrice: 0.31, noPrice: 0.69, volume: 8_100_000, category: 'macro', expiresAt: 1743638400000 },
  { id: 'pm3', question: 'Will ETH flip BTC market cap in 2026?', yesPrice: 0.08, noPrice: 0.92, volume: 1_500_000, category: 'crypto', expiresAt: 1767225600000 },
  { id: 'pm4', question: 'Will SEC approve spot ETH ETF options in 2026?', yesPrice: 0.74, noPrice: 0.26, volume: 3_800_000, category: 'regulation', expiresAt: 1767225600000 },
  { id: 'pm5', question: 'Will global CPI drop below 2% by June 2026?', yesPrice: 0.22, noPrice: 0.78, volume: 5_600_000, category: 'macro', expiresAt: 1750896000000 },
];

export class PredictionMarketFetcher extends EventEmitter {
  private running = false;
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private contractsFetched = 0;
  private readonly pollIntervalMs: number;

  constructor(pollIntervalMs = 4000) {
    super();
    this.pollIntervalMs = pollIntervalMs;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    logger.info('[PredictionMarketFetcher] Started — polling mock Polymarket contracts');
    this.intervalHandle = setInterval(() => this.poll(), this.pollIntervalMs);
    // Emit immediately on start
    this.poll();
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
    logger.info('[PredictionMarketFetcher] Stopped');
  }

  fetchContracts(): PredictionContract[] {
    return MOCK_CONTRACTS.map(c => ({
      ...c,
      // Add small random drift to simulate live pricing
      yesPrice: Math.min(0.99, Math.max(0.01, c.yesPrice + (Math.random() - 0.5) * 0.04)),
      noPrice: 0,
    })).map(c => ({ ...c, noPrice: parseFloat((1 - c.yesPrice).toFixed(4)) }));
  }

  getStats(): { contractsFetched: number } {
    return { contractsFetched: this.contractsFetched };
  }

  private poll(): void {
    const contracts = this.fetchContracts();
    this.contractsFetched += contracts.length;
    logger.debug(`[PredictionMarketFetcher] Fetched ${contracts.length} contracts`);
    this.emit('contracts', contracts);
  }
}
