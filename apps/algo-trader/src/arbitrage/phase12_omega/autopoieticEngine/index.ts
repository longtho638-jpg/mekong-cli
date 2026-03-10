/**
 * Phase 12 Omega — Autopoietic Code Evolution Engine.
 *
 * Orchestrates the full evolution loop:
 *   1. Analyze  — scan codebase metrics
 *   2. Generate — LLM-simulated refactoring
 *   3. Sandbox  — compare old vs new in simulation
 *   4. Decide   — approve or discard evolution
 *   5. Version  — store and activate approved versions
 *
 * Usage:
 *   const engine = new AutopoieticEngine({ intervalMs: 60_000 });
 *   engine.start();
 *   // later…
 *   engine.stop();
 *   engine.getMetrics();
 */

import { CodeAnalyzer } from './code-analyzer';
import type { CodebaseMetrics } from './code-analyzer';

import { LlmCodeGenerator } from './llm-code-generator';
import type { GenerationResult } from './llm-code-generator';

import { SandboxExecutor } from './sandbox-executor';
import type { SandboxComparisonResult } from './sandbox-executor';

import { EvolutionDecider } from './evolution-decider';
import type { EvolutionDecisionResult } from './evolution-decider';

import { VersionController } from './version-controller';
import type { CodeVersion } from './version-controller';

// Re-export all sub-module types for consumers
export * from './code-analyzer';
export * from './llm-code-generator';
export * from './sandbox-executor';
export * from './evolution-decider';
export * from './version-controller';

// ── Types ────────────────────────────────────────────────────────────────────

export interface EvolutionCycleResult {
  cycleIndex: number;
  codebaseMetrics: CodebaseMetrics;
  generation: GenerationResult;
  sandbox: SandboxComparisonResult;
  decision: EvolutionDecisionResult;
  storedVersion: CodeVersion | null;
  completedAt: number;
}

export interface AutopoieticEngineMetrics {
  totalCycles: number;
  approvedEvolutions: number;
  discardedEvolutions: number;
  lastCycleAt: number | null;
  currentVersion: CodeVersion | null;
  isRunning: boolean;
}

export interface AutopoieticEngineConfig {
  /** Milliseconds between evolution cycles. Default: 60_000 (1 min) */
  intervalMs: number;
  /** Root directory to scan. Default: 'src' */
  srcDir: string;
  /** Run in dry-run mode (no version activation). Default: false */
  dryRun: boolean;
  /** Seed code string when no active version exists yet. Default: '' */
  seedCode: string;
}

const DEFAULT_CONFIG: AutopoieticEngineConfig = {
  intervalMs: 60_000,
  srcDir: 'src',
  dryRun: false,
  seedCode: '// seed — no prior version',
};

// ── AutopoieticEngine class ──────────────────────────────────────────────────

export class AutopoieticEngine {
  private readonly config: AutopoieticEngineConfig;
  private readonly analyzer: CodeAnalyzer;
  private readonly generator: LlmCodeGenerator;
  private readonly sandbox: SandboxExecutor;
  private readonly decider: EvolutionDecider;
  private readonly versionCtrl: VersionController;

  private cycleIndex = 0;
  private approvedCount = 0;
  private discardedCount = 0;
  private lastCycleAt: number | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly cycleHistory: EvolutionCycleResult[] = [];

  constructor(config: Partial<AutopoieticEngineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    this.analyzer = new CodeAnalyzer({ rootDir: this.config.srcDir });
    this.generator = new LlmCodeGenerator();
    this.sandbox = new SandboxExecutor();
    this.decider = new EvolutionDecider();
    this.versionCtrl = new VersionController();
  }

  /** Run a single evolution cycle synchronously and return the result. */
  runCycle(): EvolutionCycleResult {
    this.cycleIndex++;

    // 1. Analyze
    const codebaseMetrics = this.analyzer.analyze();

    // 2. Generate — use current active version code or seed
    const currentCode = this.versionCtrl.getActive()?.code ?? this.config.seedCode;
    const generation = this.generator.generate(currentCode);

    // 3. Sandbox — compare
    const sandbox = this.sandbox.compare(
      generation.originalCode,
      generation.refactoredCode,
      generation.estimatedComplexityDelta,
    );

    // 4. Decide
    const decision = this.decider.decide(sandbox);

    // 5. Version — store and optionally activate
    let storedVersion: CodeVersion | null = null;

    if (decision.decision === 'approved' && !this.config.dryRun) {
      storedVersion = this.versionCtrl.store(
        generation.refactoredCode,
        sandbox.newVersion,
        generation.changes.map((c) => c.description).join('; '),
      );
      this.versionCtrl.activate(storedVersion.id);
      this.approvedCount++;
    } else if (decision.decision === 'approved' && this.config.dryRun) {
      // Dry-run: store but do not activate
      storedVersion = this.versionCtrl.store(
        generation.refactoredCode,
        sandbox.newVersion,
        `[dry-run] ${generation.changes.map((c) => c.description).join('; ')}`,
      );
      this.approvedCount++;
    } else {
      this.discardedCount++;
    }

    const result: EvolutionCycleResult = {
      cycleIndex: this.cycleIndex,
      codebaseMetrics,
      generation,
      sandbox,
      decision,
      storedVersion,
      completedAt: Date.now(),
    };

    this.lastCycleAt = result.completedAt;
    this.cycleHistory.push(result);

    // Keep history bounded to last 50 cycles
    if (this.cycleHistory.length > 50) {
      this.cycleHistory.shift();
    }

    return result;
  }

  /** Start the periodic evolution loop. No-op if already running. */
  start(): void {
    if (this.timer !== null) return;
    // Run an initial cycle immediately, then on interval
    this.runCycle();
    this.timer = setInterval(() => this.runCycle(), this.config.intervalMs);
  }

  /** Stop the periodic evolution loop. */
  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Return engine-level metrics snapshot. */
  getMetrics(): AutopoieticEngineMetrics {
    return {
      totalCycles: this.cycleIndex,
      approvedEvolutions: this.approvedCount,
      discardedEvolutions: this.discardedCount,
      lastCycleAt: this.lastCycleAt,
      currentVersion: this.versionCtrl.getActive(),
      isRunning: this.timer !== null,
    };
  }

  /** Return cycle history (up to last 50). */
  getCycleHistory(): EvolutionCycleResult[] {
    return [...this.cycleHistory];
  }

  /** Rollback to the previous approved version. */
  rollback() {
    return this.versionCtrl.rollback();
  }

  /** Expose version controller for advanced consumers. */
  get versions(): VersionController {
    return this.versionCtrl;
  }

  get isRunning(): boolean {
    return this.timer !== null;
  }
}

// ── Default export ───────────────────────────────────────────────────────────

export default AutopoieticEngine;
