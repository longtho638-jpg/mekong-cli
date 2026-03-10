/**
 * ZeroShotSynthesizer — Orchestrates LLM + RuleGenerator + HotDeployer.
 * Real LLM calls are PRO-gated via LicenseService.
 * Emits: 'rules:deployed', 'cycle:complete', 'error'
 */

import { EventEmitter } from 'events';
import { logger } from '../../../utils/logger';
import { LicenseService, LicenseTier } from '../../../lib/raas-gate';
import { LLMClient, MockLLMClient, HttpLLMClient, SocialMessage } from './llm-client';
import { RuleGenerator, RuleGenConfig } from './rule-generator';
import { HotDeployer } from './hot-deployer';

export interface SynthesizerConfig {
  /** Polling interval in ms (default 30_000) */
  pollIntervalMs?: number;
  /** Market regime to pass to LLM (default 'neutral') */
  regime?: string;
  /** Seed messages for the first cycle (optional) */
  initialMessages?: SocialMessage[];
  /** Rule generation config */
  ruleGenConfig?: RuleGenConfig;
  /** HTTP LLM config — if omitted, MockLLMClient is used */
  llm?: {
    baseUrl: string;
    apiKey: string;
    model: string;
  };
  /** Seed prices for validation backtest */
  seedPrices?: number[];
}

interface SynthesizerStatus {
  activeRules: number;
  messagesProcessed: number;
  rulesGenerated: number;
}

export class ZeroShotSynthesizer extends EventEmitter {
  private readonly generator: RuleGenerator;
  private readonly deployer: HotDeployer;
  private readonly llmClient: LLMClient;
  private readonly config: Required<Omit<SynthesizerConfig, 'llm' | 'ruleGenConfig'>>;

  private running = false;
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private messagesProcessed = 0;
  private rulesGenerated = 0;
  private messageBuffer: SocialMessage[] = [];

  constructor(config: SynthesizerConfig = {}) {
    super();

    this.config = {
      pollIntervalMs: config.pollIntervalMs ?? 30_000,
      regime: config.regime ?? 'neutral',
      initialMessages: config.initialMessages ?? [],
      seedPrices: config.seedPrices ?? [],
    };

    // PRO gate: use real LLM only when license is active
    const license = LicenseService.getInstance();
    const isProLicensed = license.hasTier(LicenseTier.PRO);

    if (config.llm && isProLicensed) {
      this.llmClient = new HttpLLMClient(config.llm.baseUrl, config.llm.apiKey, config.llm.model);
      logger.info('[ZeroShotSynthesizer] PRO license active — using HttpLLMClient');
    } else {
      if (config.llm && !isProLicensed) {
        logger.warn('[ZeroShotSynthesizer] LLM config provided but PRO license not active — falling back to MockLLMClient');
      }
      this.llmClient = new MockLLMClient();
    }

    this.generator = new RuleGenerator(this.llmClient, config.ruleGenConfig);
    this.deployer = new HotDeployer();

    // Bubble up validated rules to caller
    this.generator.on('rules:approved', (rules) => {
      for (const rule of rules) {
        this.deployer.deploy(rule);
        this.rulesGenerated++;
      }
      this.emit('rules:deployed', rules);
    });

    // Seed initial messages
    if (this.config.initialMessages.length > 0) {
      this.messageBuffer.push(...this.config.initialMessages);
    }
  }

  /**
   * Ingest a social message into the buffer for the next processing cycle.
   */
  ingest(message: SocialMessage): void {
    this.messageBuffer.push(message);
  }

  /**
   * Start the processing loop. Each tick runs the full pipeline
   * over buffered messages then clears the buffer.
   */
  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    logger.info('[ZeroShotSynthesizer] Started');

    // Run immediately on start, then on interval
    await this.runCycle();
    this.scheduleTick();
  }

  /**
   * Stop the processing loop. In-flight cycle completes normally.
   */
  stop(): void {
    if (!this.running) return;
    this.running = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    logger.info('[ZeroShotSynthesizer] Stopped');
  }

  /**
   * Current operational status snapshot.
   */
  getStatus(): SynthesizerStatus {
    return {
      activeRules: this.deployer.size,
      messagesProcessed: this.messagesProcessed,
      rulesGenerated: this.rulesGenerated,
    };
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  private scheduleTick(): void {
    if (!this.running) return;
    const t = setTimeout(async () => {
      await this.runCycle();
      this.scheduleTick();
    }, this.config.pollIntervalMs);
    t.unref(); // allow process to exit cleanly when nothing else is pending
    this.timerId = t;
  }

  private async runCycle(): Promise<void> {
    const messages = this.messageBuffer.splice(0);
    if (messages.length === 0) {
      this.emit('cycle:complete', { rulesDeployed: 0 });
      return;
    }

    this.messagesProcessed += messages.length;

    try {
      const approved = await this.generator.pipeline(
        messages,
        this.config.regime,
        this.config.seedPrices,
      );
      this.emit('cycle:complete', { rulesDeployed: approved.length });
    } catch (err) {
      logger.error(`[ZeroShotSynthesizer] Cycle error: ${(err as Error).message}`);
      this.emit('error', err);
    }
  }
}

// Re-export public surface for consumers
export { MockLLMClient, HttpLLMClient } from './llm-client';
export type { LLMClient, SocialMessage, StrategyRule } from './llm-client';
export { RuleGenerator } from './rule-generator';
export type { RuleGenConfig, ValidationResult } from './rule-generator';
export { HotDeployer } from './hot-deployer';
