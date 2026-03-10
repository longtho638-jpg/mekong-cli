/**
 * Phase 4 Orchestrator: conditionally activates Polymarket Sentinel, Sybil Mirage,
 * and Shadow Layering modules based on config.phase4.json.
 * SIMULATION MODE ONLY — no real funds, mainnet keys, or exchange connections.
 */

import { EventEmitter } from 'events';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { logger } from '../../utils/logger';

export interface Phase4Config {
  polymarketSentinel?: {
    enabled?: boolean;
    newsSource?: string;
    pollIntervalMs?: number;
    signalThreshold?: number;
  };
  sybilMirage?: {
    enabled?: boolean;
    numWallets?: number;
    txIntervalMs?: number;
    dumpThreshold?: number;
  };
  shadowLayering?: {
    enabled?: boolean;
    simulatedLatencyMs?: number;
    icebergSizes?: number[];
  };
}

export interface Phase4Status {
  polymarketSentinel: { enabled: boolean; newsProcessed: number; signalsGenerated: number; simulatedTrades: number };
  sybilMirage: { enabled: boolean; activeWallets: number; txCount: number; patternsDetected: number };
  shadowLayering: { enabled: boolean; orderbookDepth: number; layersActive: number; tradesExecuted: number };
}

export type Phase4WsMessage =
  | { type: 'phase4:status'; payload: Phase4Status }
  | { type: 'phase4:sentinel_signal'; payload: unknown }
  | { type: 'phase4:sentinel_trade'; payload: unknown }
  | { type: 'phase4:sybil_activity'; payload: unknown }
  | { type: 'phase4:sybil_pattern'; payload: unknown }
  | { type: 'phase4:orderbook_snapshot'; payload: unknown }
  | { type: 'phase4:layering_action'; payload: unknown };

export class Phase4Orchestrator extends EventEmitter {
  private config: Phase4Config;
  private sentinelEngine: { start(): Promise<void> | void; stop(): Promise<void> | void; getStatus(): Record<string, unknown>; on(e: string, cb: (...args: unknown[]) => void): unknown } | null = null;
  private sybilEngine: { start(): Promise<void> | void; stop(): Promise<void> | void; getStatus(): Record<string, unknown>; on(e: string, cb: (...args: unknown[]) => void): unknown } | null = null;
  private shadowEngine: { start(): Promise<void> | void; stop(): Promise<void> | void; getStatus(): Record<string, unknown>; on(e: string, cb: (...args: unknown[]) => void): unknown } | null = null;
  private running = false;

  constructor(config?: Phase4Config) {
    super();
    this.config = config ?? this.loadConfigFile();
  }

  private loadConfigFile(): Phase4Config {
    const configPath = join(process.cwd(), 'config.phase4.json');
    if (!existsSync(configPath)) {
      logger.info('[Phase4] No config.phase4.json found, all modules disabled');
      return {};
    }
    try {
      return JSON.parse(readFileSync(configPath, 'utf-8')) as Phase4Config;
    } catch (err) {
      logger.warn(`[Phase4] Failed to parse config.phase4.json: ${(err as Error).message}`);
      return {};
    }
  }

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    logger.info('[Phase4] Starting orchestrator (SIMULATION MODE)...');

    if (this.config.polymarketSentinel?.enabled) {
      try {
        const { PolymarketSentinelEngine } = await import('./polymarket-sentinel/index');
        const cfg = this.config.polymarketSentinel;
        const engine = new PolymarketSentinelEngine({
          pollIntervalMs: cfg.pollIntervalMs ?? 5000,
          signalThreshold: cfg.signalThreshold ?? 0.7,
        });
        engine.on('ws:message', (msg: Phase4WsMessage) => this.emit('ws:message', msg));
        await engine.start();
        this.sentinelEngine = engine as unknown as typeof this.sentinelEngine;
        logger.info('[Phase4] Polymarket Sentinel started');
      } catch (err) {
        logger.error(`[Phase4] Polymarket Sentinel failed: ${(err as Error).message}`);
        this.sentinelEngine = null;
      }
    }

    if (this.config.sybilMirage?.enabled) {
      try {
        const { SybilMirageEngine } = await import('./sybil-mirage/index');
        const cfg = this.config.sybilMirage;
        const engine = new SybilMirageEngine({
          numWallets: cfg.numWallets ?? 1000,
          txIntervalMs: cfg.txIntervalMs ?? 100,
          dumpThreshold: cfg.dumpThreshold ?? 0.8,
        });
        engine.on('ws:message', (msg: Phase4WsMessage) => this.emit('ws:message', msg));
        await engine.start();
        this.sybilEngine = engine as unknown as typeof this.sybilEngine;
        logger.info('[Phase4] Sybil Mirage started');
      } catch (err) {
        logger.error(`[Phase4] Sybil Mirage failed: ${(err as Error).message}`);
        this.sybilEngine = null;
      }
    }

    if (this.config.shadowLayering?.enabled) {
      try {
        const { ShadowLayeringEngine } = await import('./shadow-layering/index');
        const cfg = this.config.shadowLayering;
        const engine = new ShadowLayeringEngine({
          simulatedLatencyMs: cfg.simulatedLatencyMs ?? 10,
          icebergSizes: cfg.icebergSizes ?? [10, 50, 100],
        });
        engine.on('ws:message', (msg: Phase4WsMessage) => this.emit('ws:message', msg));
        await engine.start();
        this.shadowEngine = engine as unknown as typeof this.shadowEngine;
        logger.info('[Phase4] Shadow Layering started');
      } catch (err) {
        logger.error(`[Phase4] Shadow Layering failed: ${(err as Error).message}`);
        this.shadowEngine = null;
      }
    }

    this.emit('started', this.getStatus());
  }

  async stop(): Promise<void> {
    if (this.sentinelEngine) { await this.sentinelEngine.stop(); this.sentinelEngine = null; }
    if (this.sybilEngine) { await this.sybilEngine.stop(); this.sybilEngine = null; }
    if (this.shadowEngine) { await this.shadowEngine.stop(); this.shadowEngine = null; }
    this.running = false;
    logger.info('[Phase4] Orchestrator stopped');
  }

  getStatus(): Phase4Status {
    const sentinel = this.sentinelEngine?.getStatus() as Record<string, number> | undefined;
    const sybil = this.sybilEngine?.getStatus() as Record<string, number> | undefined;
    const shadow = this.shadowEngine?.getStatus() as Record<string, number> | undefined;
    return {
      polymarketSentinel: {
        enabled: !!this.sentinelEngine,
        newsProcessed: sentinel?.newsProcessed ?? 0,
        signalsGenerated: sentinel?.signalsGenerated ?? 0,
        simulatedTrades: sentinel?.simulatedTrades ?? 0,
      },
      sybilMirage: {
        enabled: !!this.sybilEngine,
        activeWallets: sybil?.activeWallets ?? 0,
        txCount: sybil?.txCount ?? 0,
        patternsDetected: sybil?.patternsDetected ?? 0,
      },
      shadowLayering: {
        enabled: !!this.shadowEngine,
        orderbookDepth: shadow?.orderbookDepth ?? 0,
        layersActive: shadow?.layersActive ?? 0,
        tradesExecuted: shadow?.tradesExecuted ?? 0,
      },
    };
  }

  isRunning(): boolean { return this.running; }
}
