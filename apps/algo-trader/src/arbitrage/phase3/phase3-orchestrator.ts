/**
 * Phase 3 Orchestrator: conditionally activates MEV Sandwich, Portfolio Rebalancer,
 * and Predatory Liquidity modules based on config.phase3.json.
 * Exposes unified status and WebSocket-compatible metrics.
 */

import { EventEmitter } from 'events';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { logger } from '../../utils/logger';
import { MevSandwichEngine } from './mev-sandwich/index';
import { PortfolioRebalancerEngine } from './portfolio-rebalancer/index';
import { PredatoryLiquidityEngine } from './predatory-liquidity/index';

export interface Phase3Config {
  mevSandwich?: {
    enabled?: boolean;
    ethereumRpc?: string;
    flashbotsRelay?: string;
    solanaJitoUrl?: string;
    minProfitUsd?: number;
  };
  portfolioRebalancer?: {
    enabled?: boolean;
    intervalMs?: number;
    exchanges?: string[];
    maxSlippageBps?: number;
  };
  predatoryLiquidity?: {
    enabled?: boolean;
    pumpThreshold?: number;
    dumpThreshold?: number;
    makerSpreadBps?: number;
  };
}

export interface Phase3Status {
  mevSandwich: { enabled: boolean; opportunities: number; bundlesSubmitted: number; successRate: number };
  portfolioRebalancer: { enabled: boolean; totalValueUsd: number; lastRebalanceTime: number; tradesExecuted: number };
  predatoryLiquidity: { enabled: boolean; activePumps: number; makerOrders: number; dumpsExecuted: number };
}

export type Phase3WsMessage =
  | { type: 'phase3:status'; payload: Phase3Status }
  | { type: 'phase3:mev_opportunity'; payload: unknown }
  | { type: 'phase3:rebalance_action'; payload: unknown }
  | { type: 'phase3:pump_signal'; payload: unknown };

export class Phase3Orchestrator extends EventEmitter {
  private config: Phase3Config;
  private mevEngine: MevSandwichEngine | null = null;
  private rebalancerEngine: PortfolioRebalancerEngine | null = null;
  private predatoryEngine: PredatoryLiquidityEngine | null = null;
  private running = false;

  constructor(config?: Phase3Config) {
    super();
    this.config = config ?? this.loadConfigFile();
  }

  private loadConfigFile(): Phase3Config {
    const configPath = join(process.cwd(), 'config.phase3.json');
    if (!existsSync(configPath)) {
      logger.info('[Phase3] No config.phase3.json found, all modules disabled');
      return {};
    }
    try {
      return JSON.parse(readFileSync(configPath, 'utf-8')) as Phase3Config;
    } catch (err) {
      logger.warn(`[Phase3] Failed to parse config.phase3.json: ${(err as Error).message}`);
      return {};
    }
  }

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    logger.info('[Phase3] Starting orchestrator...');

    // Module 1: MEV Sandwich
    if (this.config.mevSandwich?.enabled) {
      try {
        const cfg = this.config.mevSandwich;
        this.mevEngine = new MevSandwichEngine({
          minProfitUsd: cfg.minProfitUsd ?? 10,
          ethereumRpc: cfg.ethereumRpc,
          flashbotsRelay: cfg.flashbotsRelay,
          solanaJitoUrl: cfg.solanaJitoUrl,
        });
        this.mevEngine.on('ws:message', (msg: Phase3WsMessage) => this.emit('ws:message', msg));
        this.mevEngine.start();
        logger.info('[Phase3] MEV Sandwich Engine started');
      } catch (err) {
        logger.error(`[Phase3] MEV Sandwich failed: ${(err as Error).message}`);
        this.mevEngine = null;
      }
    }

    // Module 2: Portfolio Rebalancer
    if (this.config.portfolioRebalancer?.enabled) {
      try {
        const cfg = this.config.portfolioRebalancer;
        this.rebalancerEngine = new PortfolioRebalancerEngine({
          intervalMs: cfg.intervalMs ?? 500,
          maxSlippageBps: cfg.maxSlippageBps ?? 5,
          exchanges: cfg.exchanges,
        });
        this.rebalancerEngine.on('ws:message', (msg: Phase3WsMessage) => this.emit('ws:message', msg));
        this.rebalancerEngine.start();
        logger.info('[Phase3] Portfolio Rebalancer started');
      } catch (err) {
        logger.error(`[Phase3] Portfolio Rebalancer failed: ${(err as Error).message}`);
        this.rebalancerEngine = null;
      }
    }

    // Module 3: Predatory Liquidity
    if (this.config.predatoryLiquidity?.enabled) {
      try {
        const cfg = this.config.predatoryLiquidity;
        this.predatoryEngine = new PredatoryLiquidityEngine({
          pumpThreshold: cfg.pumpThreshold ?? 0.7,
          dumpThreshold: cfg.dumpThreshold ?? 0.9,
          makerSpreadBps: cfg.makerSpreadBps ?? 2,
        });
        this.predatoryEngine.on('ws:message', (msg: Phase3WsMessage) => this.emit('ws:message', msg));
        this.predatoryEngine.start();
        logger.info('[Phase3] Predatory Liquidity Engine started');
      } catch (err) {
        logger.error(`[Phase3] Predatory Liquidity failed: ${(err as Error).message}`);
        this.predatoryEngine = null;
      }
    }

    this.emit('started', this.getStatus());
  }

  async stop(): Promise<void> {
    if (this.mevEngine) { this.mevEngine.stop(); this.mevEngine = null; }
    if (this.rebalancerEngine) { this.rebalancerEngine.stop(); this.rebalancerEngine = null; }
    if (this.predatoryEngine) { this.predatoryEngine.stop(); this.predatoryEngine = null; }
    this.running = false;
    logger.info('[Phase3] Orchestrator stopped');
  }

  getStatus(): Phase3Status {
    const mev = this.mevEngine?.getStatus();
    const reb = this.rebalancerEngine?.getStatus();
    const pred = this.predatoryEngine?.getStatus();
    return {
      mevSandwich: {
        enabled: !!this.mevEngine,
        opportunities: mev?.opportunities ?? 0,
        bundlesSubmitted: mev?.bundlesSubmitted ?? 0,
        successRate: mev?.successRate ?? 0,
      },
      portfolioRebalancer: {
        enabled: !!this.rebalancerEngine,
        totalValueUsd: reb?.totalValueUsd ?? 0,
        lastRebalanceTime: reb?.lastRebalanceTime ?? 0,
        tradesExecuted: reb?.tradesExecuted ?? 0,
      },
      predatoryLiquidity: {
        enabled: !!this.predatoryEngine,
        activePumps: pred?.activePumps ?? 0,
        makerOrders: pred?.makerOrders ?? 0,
        dumpsExecuted: pred?.dumpsExecuted ?? 0,
      },
    };
  }

  getMevEngine(): MevSandwichEngine | null { return this.mevEngine; }
  getRebalancerEngine(): PortfolioRebalancerEngine | null { return this.rebalancerEngine; }
  getPredatoryEngine(): PredatoryLiquidityEngine | null { return this.predatoryEngine; }
  isRunning(): boolean { return this.running; }
}
