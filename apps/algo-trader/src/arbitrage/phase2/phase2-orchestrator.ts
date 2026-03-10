/**
 * Phase 2 Orchestrator: conditionally activates zero-shot synthesizer,
 * cross-chain flash loans, and adversarial MM modules based on config.
 * Exposes unified status and WebSocket-compatible metrics.
 */

import { EventEmitter } from 'events';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { logger } from '../../utils/logger';
import { ZeroShotSynthesizer } from './zero-shot-synthesizer/index';
import { CrossChainFlashLoanEngine } from './cross-chain-flash-loans/index';
import { SpoofDetector } from './adversarial-mm/spoof-detector';
import { AdversarialStrategyHook } from './adversarial-mm/strategy-hook';
import { ModelLoader } from './adversarial-mm/model-loader';

export interface Phase2Config {
  zeroShotSynthesizer?: { enabled?: boolean; pollIntervalMs?: number; minSharpeRatio?: number; llm?: Record<string, unknown> };
  crossChainFlashLoans?: { enabled?: boolean; minNetProfitUsd?: number; maxHops?: number; enableFlashLoans?: boolean };
  adversarialMM?: { enabled?: boolean; modelPath?: string; windowMs?: number; minConfidence?: number; spoofAvoidThreshold?: number; fadeThreshold?: number; fadeSpreadMultiplier?: number };
}

export interface Phase2Status {
  zeroShot: { enabled: boolean; activeRules: number; messagesProcessed: number; rulesGenerated: number };
  flashLoans: { enabled: boolean; dexCount: number; bridgeCount: number; routesFound: number };
  adversarialMM: { enabled: boolean; modelLoaded: boolean; signalCount: number };
}

/** WebSocket message types for Phase 2 metrics */
export type Phase2WsMessage =
  | { type: 'phase2:status'; payload: Phase2Status }
  | { type: 'phase2:spoof_signal'; payload: { exchange: string; symbol: string; confidence: number; signalType: string } }
  | { type: 'phase2:rules_deployed'; payload: { count: number; names: string[] } }
  | { type: 'phase2:routes_found'; payload: { count: number; bestProfitUsd: number } };

export class Phase2Orchestrator extends EventEmitter {
  private config: Phase2Config;
  private synthesizer: ZeroShotSynthesizer | null = null;
  private flashLoanEngine: CrossChainFlashLoanEngine | null = null;
  private spoofDetector: SpoofDetector | null = null;
  private strategyHook: AdversarialStrategyHook | null = null;
  private modelLoader: ModelLoader | null = null;
  private signalCount = 0;
  private running = false;

  constructor(config?: Phase2Config) {
    super();
    this.config = config ?? this.loadConfigFile();
  }

  /** Load config from config.phase2.json at project root */
  private loadConfigFile(): Phase2Config {
    const configPath = join(process.cwd(), 'config.phase2.json');
    if (!existsSync(configPath)) {
      logger.info('[Phase2] No config.phase2.json found, all modules disabled');
      return {};
    }
    try {
      return JSON.parse(readFileSync(configPath, 'utf-8')) as Phase2Config;
    } catch (err) {
      logger.warn(`[Phase2] Failed to parse config.phase2.json: ${(err as Error).message}`);
      return {};
    }
  }

  /** Initialize enabled modules. Gracefully skips disabled/failed modules. */
  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    logger.info('[Phase2] Starting orchestrator...');

    // Module 1: Zero-Shot Synthesizer
    if (this.config.zeroShotSynthesizer?.enabled) {
      try {
        const cfg = this.config.zeroShotSynthesizer;
        this.synthesizer = new ZeroShotSynthesizer({
          pollIntervalMs: cfg.pollIntervalMs ?? 30000,
          ruleGenConfig: { minSharpeRatio: cfg.minSharpeRatio ?? 1.5 },
          llm: cfg.llm as { baseUrl: string; apiKey: string; model: string } | undefined,
        });
        this.synthesizer.on('rules:deployed', (rules: Array<{ name: string }>) => {
          this.emit('ws:message', {
            type: 'phase2:rules_deployed',
            payload: { count: rules.length, names: rules.map(r => r.name) },
          } as Phase2WsMessage);
        });
        await this.synthesizer.start();
        logger.info('[Phase2] Zero-Shot Synthesizer started');
      } catch (err) {
        logger.error(`[Phase2] Zero-Shot Synthesizer failed: ${(err as Error).message}`);
        this.synthesizer = null;
      }
    }

    // Module 2: Cross-Chain Flash Loans
    if (this.config.crossChainFlashLoans?.enabled) {
      try {
        const cfg = this.config.crossChainFlashLoans;
        this.flashLoanEngine = new CrossChainFlashLoanEngine({
          minNetProfitUsd: cfg.minNetProfitUsd ?? 10,
          enableFlashLoans: cfg.enableFlashLoans ?? true,
        });
        this.flashLoanEngine.on('routes:scanned', (routes: Array<{ netProfitUsd: number }>) => {
          const bestProfit = routes.length > 0 ? Math.max(...routes.map(r => r.netProfitUsd)) : 0;
          this.emit('ws:message', {
            type: 'phase2:routes_found',
            payload: { count: routes.length, bestProfitUsd: bestProfit },
          } as Phase2WsMessage);
        });
        await this.flashLoanEngine.initialize();
        logger.info('[Phase2] Cross-Chain Flash Loan Engine started');
      } catch (err) {
        logger.error(`[Phase2] Flash Loan Engine failed: ${(err as Error).message}`);
        this.flashLoanEngine = null;
      }
    }

    // Module 3: Adversarial Market Making
    if (this.config.adversarialMM?.enabled) {
      try {
        const cfg = this.config.adversarialMM;
        this.modelLoader = new ModelLoader({ modelPath: cfg.modelPath });
        await this.modelLoader.load(); // graceful fallback if model missing

        this.spoofDetector = new SpoofDetector({
          windowMs: cfg.windowMs ?? 5000,
          minConfidence: cfg.minConfidence ?? 0.6,
        });
        this.strategyHook = new AdversarialStrategyHook(this.spoofDetector, {
          spoofAvoidThreshold: cfg.spoofAvoidThreshold ?? 0.7,
          fadeThreshold: cfg.fadeThreshold ?? 0.9,
          fadeSpreadMultiplier: cfg.fadeSpreadMultiplier ?? 1.5,
        });

        this.spoofDetector.on('signal', (signal: { type: string; exchange: string; symbol: string; confidence: number }) => {
          this.signalCount++;
          this.emit('ws:message', {
            type: 'phase2:spoof_signal',
            payload: { exchange: signal.exchange, symbol: signal.symbol, confidence: signal.confidence, signalType: signal.type },
          } as Phase2WsMessage);
        });
        logger.info('[Phase2] Adversarial MM started (model: ' + (this.modelLoader.isLoaded() ? 'ONNX' : 'heuristic') + ')');
      } catch (err) {
        logger.error(`[Phase2] Adversarial MM failed: ${(err as Error).message}`);
        this.spoofDetector = null;
        this.strategyHook = null;
      }
    }

    this.emit('started', this.getStatus());
  }

  /** Stop all modules */
  async stop(): Promise<void> {
    if (this.synthesizer) { this.synthesizer.stop(); this.synthesizer = null; }
    if (this.modelLoader) { await this.modelLoader.dispose(); this.modelLoader = null; }
    this.flashLoanEngine = null;
    this.spoofDetector = null;
    this.strategyHook = null;
    this.running = false;
    logger.info('[Phase2] Orchestrator stopped');
  }

  /** Get unified status for all modules */
  getStatus(): Phase2Status {
    const synthStatus = this.synthesizer?.getStatus();
    const flashStatus = this.flashLoanEngine?.getStatus();
    return {
      zeroShot: {
        enabled: !!this.synthesizer,
        activeRules: synthStatus?.activeRules ?? 0,
        messagesProcessed: synthStatus?.messagesProcessed ?? 0,
        rulesGenerated: synthStatus?.rulesGenerated ?? 0,
      },
      flashLoans: {
        enabled: !!this.flashLoanEngine,
        dexCount: flashStatus?.dexCount ?? 0,
        bridgeCount: flashStatus?.bridgeCount ?? 0,
        routesFound: flashStatus?.routesFound ?? 0,
      },
      adversarialMM: {
        enabled: !!this.spoofDetector,
        modelLoaded: this.modelLoader?.isLoaded() ?? false,
        signalCount: this.signalCount,
      },
    };
  }

  /** Access strategy hook for arb decision integration */
  getStrategyHook(): AdversarialStrategyHook | null { return this.strategyHook; }

  /** Access flash loan engine for route scanning */
  getFlashLoanEngine(): CrossChainFlashLoanEngine | null { return this.flashLoanEngine; }

  /** Access synthesizer for rule ingestion */
  getSynthesizer(): ZeroShotSynthesizer | null { return this.synthesizer; }

  isRunning(): boolean { return this.running; }
}
