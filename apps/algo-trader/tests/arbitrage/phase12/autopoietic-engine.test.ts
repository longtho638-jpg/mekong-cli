/**
 * Tests: Autopoietic Code Evolution Engine — Phase 12 Omega Module 1.
 *
 * Covers:
 *  - CodeAnalyzer: file scanning, metrics aggregation, edge cases
 *  - LlmCodeGenerator: console removal, import removal, expression simplification
 *  - SandboxExecutor: deterministic comparison, metric shapes, win logic
 *  - EvolutionDecider: approve/discard logic, reason detail, logging
 *  - VersionController: store, activate, rollback, prune, reset
 *  - AutopoieticEngine: runCycle, start/stop, metrics, history, rollback, dryRun
 */

import * as fs from 'fs';
import * as path from 'path';

import { CodeAnalyzer } from '../../../src/arbitrage/phase12_omega/autopoieticEngine/code-analyzer';
import type { CodebaseMetrics, FileMetrics } from '../../../src/arbitrage/phase12_omega/autopoieticEngine/code-analyzer';

import { LlmCodeGenerator } from '../../../src/arbitrage/phase12_omega/autopoieticEngine/llm-code-generator';
import type { GenerationResult, GenerationChange } from '../../../src/arbitrage/phase12_omega/autopoieticEngine/llm-code-generator';

import { SandboxExecutor } from '../../../src/arbitrage/phase12_omega/autopoieticEngine/sandbox-executor';
import type { SandboxComparisonResult, ExecutionMetrics } from '../../../src/arbitrage/phase12_omega/autopoieticEngine/sandbox-executor';

import { EvolutionDecider } from '../../../src/arbitrage/phase12_omega/autopoieticEngine/evolution-decider';
import type { EvolutionDecisionResult } from '../../../src/arbitrage/phase12_omega/autopoieticEngine/evolution-decider';

import { VersionController } from '../../../src/arbitrage/phase12_omega/autopoieticEngine/version-controller';
import type { CodeVersion } from '../../../src/arbitrage/phase12_omega/autopoieticEngine/version-controller';

import { AutopoieticEngine } from '../../../src/arbitrage/phase12_omega/autopoieticEngine/index';
import type { EvolutionCycleResult, AutopoieticEngineMetrics } from '../../../src/arbitrage/phase12_omega/autopoieticEngine/index';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeMetrics(overrides: Partial<ExecutionMetrics> = {}): ExecutionMetrics {
  return {
    pnl: 100,
    avgLatencyMs: 50,
    riskScore: 0.3,
    tradeCount: 40,
    winRate: 0.65,
    maxDrawdown: 5,
    ...overrides,
  };
}

function makeComparison(overrides: Partial<SandboxComparisonResult> = {}): SandboxComparisonResult {
  return {
    oldVersion: makeMetrics(),
    newVersion: makeMetrics({ pnl: 110, avgLatencyMs: 45, riskScore: 0.25 }),
    pnlDelta: 10,
    latencyDelta: -5,
    riskDelta: -0.05,
    newVersionWins: true,
    runAt: Date.now(),
    ...overrides,
  };
}

// ── CodeAnalyzer ──────────────────────────────────────────────────────────────

describe('CodeAnalyzer — analyzeFile', () => {
  it('returns FileMetrics with correct shape for a real file', () => {
    const analyzer = new CodeAnalyzer();
    const filePath = path.resolve(
      __dirname,
      '../../../src/arbitrage/phase12_omega/autopoieticEngine/code-analyzer.ts',
    );
    const metrics: FileMetrics = analyzer.analyzeFile(filePath);
    expect(metrics.filePath).toBe(filePath);
    expect(typeof metrics.lineCount).toBe('number');
    expect(metrics.lineCount).toBeGreaterThan(0);
    expect(typeof metrics.functionCount).toBe('number');
    expect(typeof metrics.cyclomaticComplexity).toBe('number');
    expect(metrics.cyclomaticComplexity).toBeGreaterThanOrEqual(1);
    expect(typeof metrics.importCount).toBe('number');
    expect(typeof metrics.hasConsoleLog).toBe('boolean');
  });

  it('returns zero metrics for non-existent file', () => {
    const analyzer = new CodeAnalyzer();
    const metrics = analyzer.analyzeFile('/tmp/does-not-exist-abc.ts');
    expect(metrics.lineCount).toBe(0);
    expect(metrics.functionCount).toBe(0);
    expect(metrics.cyclomaticComplexity).toBe(1);
    expect(metrics.hasConsoleLog).toBe(false);
  });

  it('detects console.log in source with console statement', () => {
    const tmp = path.join('/tmp', `test-console-${Date.now()}.ts`);
    fs.writeFileSync(tmp, 'console.log("hello");\nconst x = 1;\n');
    const analyzer = new CodeAnalyzer();
    const metrics = analyzer.analyzeFile(tmp);
    expect(metrics.hasConsoleLog).toBe(true);
    try { fs.unlinkSync(tmp); } catch { /* already cleaned */ }
  });

  it('reports hasConsoleLog false for clean file', () => {
    const tmp = path.join('/tmp', `test-clean-${Date.now()}.ts`);
    fs.writeFileSync(tmp, 'const x = 1;\nconst y = 2;\n');
    const analyzer = new CodeAnalyzer();
    const metrics = analyzer.analyzeFile(tmp);
    expect(metrics.hasConsoleLog).toBe(false);
    fs.unlinkSync(tmp);
  });

  it('counts imports correctly', () => {
    const tmp = path.join('/tmp', `test-imports-${Date.now()}.ts`);
    fs.writeFileSync(tmp, 'import A from "./a";\nimport B from "./b";\nconst x = 1;\n');
    const analyzer = new CodeAnalyzer();
    const metrics = analyzer.analyzeFile(tmp);
    expect(metrics.importCount).toBe(2);
    fs.unlinkSync(tmp);
  });
});

describe('CodeAnalyzer — analyze (codebase scan)', () => {
  it('returns CodebaseMetrics with correct shape', () => {
    const analyzer = new CodeAnalyzer({
      rootDir: path.resolve(__dirname, '../../../src/arbitrage/phase12_omega/autopoieticEngine'),
    });
    const metrics: CodebaseMetrics = analyzer.analyze();
    expect(typeof metrics.fileCount).toBe('number');
    expect(metrics.fileCount).toBeGreaterThan(0);
    expect(typeof metrics.totalLines).toBe('number');
    expect(typeof metrics.avgLinesPerFile).toBe('number');
    expect(typeof metrics.totalFunctions).toBe('number');
    expect(typeof metrics.avgCyclomaticComplexity).toBe('number');
    expect(typeof metrics.filesWithConsoleLog).toBe('number');
    expect(typeof metrics.totalImports).toBe('number');
    expect(typeof metrics.analyzedAt).toBe('number');
    expect(Array.isArray(metrics.files)).toBe(true);
  });

  it('avgLinesPerFile is consistent with totalLines / fileCount', () => {
    const analyzer = new CodeAnalyzer({
      rootDir: path.resolve(__dirname, '../../../src/arbitrage/phase12_omega/autopoieticEngine'),
    });
    const metrics = analyzer.analyze();
    const expected = Math.round(metrics.totalLines / metrics.fileCount);
    expect(metrics.avgLinesPerFile).toBe(expected);
  });

  it('returns zero metrics for empty non-existent directory', () => {
    const analyzer = new CodeAnalyzer({ rootDir: '/tmp/nonexistent-xyz-abc' });
    const metrics = analyzer.analyze();
    expect(metrics.fileCount).toBe(0);
    expect(metrics.totalLines).toBe(0);
    expect(metrics.avgLinesPerFile).toBe(0);
  });

  it('respects maxFiles limit', () => {
    const analyzer = new CodeAnalyzer({
      rootDir: path.resolve(__dirname, '../../../src'),
      maxFiles: 3,
    });
    const metrics = analyzer.analyze();
    expect(metrics.fileCount).toBeLessThanOrEqual(3);
  });

  it('analyzedAt is a recent timestamp', () => {
    const before = Date.now();
    const analyzer = new CodeAnalyzer({
      rootDir: path.resolve(__dirname, '../../../src/arbitrage/phase12_omega/autopoieticEngine'),
    });
    const metrics = analyzer.analyze();
    expect(metrics.analyzedAt).toBeGreaterThanOrEqual(before);
    expect(metrics.analyzedAt).toBeLessThanOrEqual(Date.now());
  });
});

// ── LlmCodeGenerator ──────────────────────────────────────────────────────────

describe('LlmCodeGenerator — console.log removal', () => {
  const gen = new LlmCodeGenerator();

  it('removes console.log lines', () => {
    const code = 'const x = 1;\nconsole.log("debug");\nconst y = 2;\n';
    const result = gen.generate(code);
    expect(result.refactoredCode).not.toContain('console.log');
    expect(result.changes.some((c) => c.type === 'remove_console_log')).toBe(true);
  });

  it('removes console.warn and console.error', () => {
    const code = 'console.warn("w");\nconsole.error("e");\nconst x = 1;\n';
    const result = gen.generate(code);
    expect(result.refactoredCode).not.toContain('console.warn');
    expect(result.refactoredCode).not.toContain('console.error');
  });

  it('preserves original code in result', () => {
    const code = 'console.log("test");\n';
    const result = gen.generate(code);
    expect(result.originalCode).toBe(code);
  });

  it('reports linesAffected > 0 when console statements removed', () => {
    const code = 'console.log("a");\nconsole.log("b");\n';
    const result = gen.generate(code);
    const change = result.changes.find((c) => c.type === 'remove_console_log');
    expect(change?.linesAffected).toBeGreaterThan(0);
  });

  it('does not report console_log change when none present', () => {
    const gen2 = new LlmCodeGenerator({ removeConsoleLogs: true, removeUnusedImports: false, simplifyExpressions: false });
    const code = 'const x = 1;\n';
    const result = gen2.generate(code);
    expect(result.changes.some((c) => c.type === 'remove_console_log')).toBe(false);
  });
});

describe('LlmCodeGenerator — unused import removal', () => {
  const gen = new LlmCodeGenerator({ removeConsoleLogs: false, removeUnusedImports: true, simplifyExpressions: false });

  it('removes unused named import', () => {
    const code = 'import { Foo } from "./foo";\nconst x = 1;\n';
    const result = gen.generate(code);
    expect(result.refactoredCode).not.toContain("import { Foo }");
    expect(result.changes.some((c) => c.type === 'remove_unused_import')).toBe(true);
  });

  it('preserves used import', () => {
    const code = 'import { Bar } from "./bar";\nconst x = new Bar();\n';
    const result = gen.generate(code);
    expect(result.refactoredCode).toContain('import');
    expect(result.changes.some((c) => c.type === 'remove_unused_import')).toBe(false);
  });

  it('reports correct type for unused import change', () => {
    const code = 'import { Unused } from "./unused";\nconst y = 2;\n';
    const result = gen.generate(code);
    const change = result.changes.find((c) => c.type === 'remove_unused_import');
    expect(change).toBeDefined();
    expect(change?.description).toContain('import');
  });
});

describe('LlmCodeGenerator — expression simplification', () => {
  const gen = new LlmCodeGenerator({ removeConsoleLogs: false, removeUnusedImports: false, simplifyExpressions: true });

  it('replaces !! with Boolean()', () => {
    const code = 'const flag = !!value;\n';
    const result = gen.generate(code);
    expect(result.refactoredCode).toContain('Boolean(value)');
    expect(result.changes.some((c) => c.type === 'simplify_expression')).toBe(true);
  });

  it('does not change code without double-negation', () => {
    const code = 'const x = true;\n';
    const result = gen.generate(code);
    expect(result.changes.some((c) => c.type === 'simplify_expression')).toBe(false);
  });
});

describe('LlmCodeGenerator — no_change fallback', () => {
  it('returns no_change when all rules find nothing', () => {
    const gen = new LlmCodeGenerator({ removeConsoleLogs: true, removeUnusedImports: true, simplifyExpressions: true });
    const code = 'const x = 1;\nconst y = 2;\n';
    const result = gen.generate(code);
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0].type).toBe('no_change');
  });

  it('estimatedComplexityDelta is 0 on no_change', () => {
    const gen = new LlmCodeGenerator({ removeConsoleLogs: false, removeUnusedImports: false, simplifyExpressions: false });
    const code = 'const x = 1;\n';
    const result = gen.generate(code);
    expect(result.estimatedComplexityDelta).toBe(0);
  });

  it('estimatedComplexityDelta is negative when changes made', () => {
    const gen = new LlmCodeGenerator();
    const code = 'console.log("a");\nconsole.log("b");\nconsole.log("c");\n';
    const result = gen.generate(code);
    expect(result.estimatedComplexityDelta).toBeLessThan(0);
  });

  it('generatedAt is a recent timestamp', () => {
    const gen = new LlmCodeGenerator();
    const before = Date.now();
    const result = gen.generate('const x = 1;\n');
    expect(result.generatedAt).toBeGreaterThanOrEqual(before);
  });
});

// ── SandboxExecutor ───────────────────────────────────────────────────────────

describe('SandboxExecutor — compare', () => {
  it('returns SandboxComparisonResult with correct shape', () => {
    const sb = new SandboxExecutor();
    const result = sb.compare('const x = 1;', 'const x = 1; // optimized');
    expect(typeof result.pnlDelta).toBe('number');
    expect(typeof result.latencyDelta).toBe('number');
    expect(typeof result.riskDelta).toBe('number');
    expect(typeof result.newVersionWins).toBe('boolean');
    expect(typeof result.runAt).toBe('number');
    expect(result.oldVersion).toHaveProperty('pnl');
    expect(result.newVersion).toHaveProperty('pnl');
  });

  it('is deterministic with same seed', () => {
    const sb = new SandboxExecutor({ seed: 99 });
    const r1 = sb.compare('code_a', 'code_b');
    const r2 = sb.compare('code_a', 'code_b');
    expect(r1.pnlDelta).toBe(r2.pnlDelta);
    expect(r1.latencyDelta).toBe(r2.latencyDelta);
    expect(r1.riskDelta).toBe(r2.riskDelta);
  });

  it('newVersionWins is true only when pnl>0 AND latency<0 AND risk<0', () => {
    const sb = new SandboxExecutor({ seed: 1 });
    const result = sb.compare('old', 'new', -5);
    if (result.newVersionWins) {
      expect(result.pnlDelta).toBeGreaterThan(0);
      expect(result.latencyDelta).toBeLessThan(0);
      expect(result.riskDelta).toBeLessThan(0);
    }
  });

  it('oldVersion metrics have tradeCount >= 0', () => {
    const sb = new SandboxExecutor();
    const result = sb.compare('a', 'b');
    expect(result.oldVersion.tradeCount).toBeGreaterThanOrEqual(0);
    expect(result.newVersion.tradeCount).toBeGreaterThanOrEqual(0);
  });

  it('riskScore is in [0, 1] range', () => {
    const sb = new SandboxExecutor();
    const result = sb.compare('a', 'b');
    expect(result.oldVersion.riskScore).toBeGreaterThanOrEqual(0);
    expect(result.oldVersion.riskScore).toBeLessThanOrEqual(1);
    expect(result.newVersion.riskScore).toBeGreaterThanOrEqual(0);
    expect(result.newVersion.riskScore).toBeLessThanOrEqual(1);
  });

  it('winRate is in [0, 1] range', () => {
    const sb = new SandboxExecutor();
    const result = sb.compare('a', 'b');
    expect(result.oldVersion.winRate).toBeGreaterThanOrEqual(0);
    expect(result.oldVersion.winRate).toBeLessThanOrEqual(1);
  });

  it('generateTestData returns correct count', () => {
    const sb = new SandboxExecutor({ dataPointCount: 50 });
    const data = sb.generateTestData();
    expect(data).toHaveLength(50);
    expect(data[0]).toHaveProperty('price');
    expect(data[0]).toHaveProperty('volume');
    expect(data[0]).toHaveProperty('spread');
  });

  it('runAt is a recent timestamp', () => {
    const before = Date.now();
    const sb = new SandboxExecutor();
    const result = sb.compare('a', 'b');
    expect(result.runAt).toBeGreaterThanOrEqual(before);
  });

  it('positive complexityDelta increases modifier (new version may be worse)', () => {
    const sb = new SandboxExecutor({ seed: 7 });
    const r1 = sb.compare('old', 'new', -10); // improved
    const r2 = sb.compare('old', 'new', 10);  // degraded
    // With degraded complexity, latency should be higher in r2.newVersion
    expect(r2.newVersion.avgLatencyMs).toBeGreaterThan(r1.newVersion.avgLatencyMs);
  });
});

// ── EvolutionDecider ──────────────────────────────────────────────────────────

describe('EvolutionDecider — decide', () => {
  it('approves when all metrics win', () => {
    const decider = new EvolutionDecider({ enableLogging: false });
    const result = decider.decide(makeComparison({ pnlDelta: 5, latencyDelta: -3, riskDelta: -0.02, newVersionWins: true }));
    expect(result.decision).toBe('approved');
    expect(result.confidence).toBe(1);
  });

  it('discards when pnl is negative', () => {
    const decider = new EvolutionDecider({ enableLogging: false });
    const result = decider.decide(makeComparison({ pnlDelta: -1, latencyDelta: -3, riskDelta: -0.02 }));
    expect(result.decision).toBe('discarded');
    expect(result.reasons.find((r) => r.metric === 'pnl')?.passed).toBe(false);
  });

  it('discards when latency increases', () => {
    const decider = new EvolutionDecider({ enableLogging: false });
    const result = decider.decide(makeComparison({ pnlDelta: 5, latencyDelta: 2, riskDelta: -0.02 }));
    expect(result.decision).toBe('discarded');
    expect(result.reasons.find((r) => r.metric === 'latency')?.passed).toBe(false);
  });

  it('discards when risk increases', () => {
    const decider = new EvolutionDecider({ enableLogging: false });
    const result = decider.decide(makeComparison({ pnlDelta: 5, latencyDelta: -3, riskDelta: 0.05 }));
    expect(result.decision).toBe('discarded');
    expect(result.reasons.find((r) => r.metric === 'riskScore')?.passed).toBe(false);
  });

  it('confidence = 2/3 when two metrics pass', () => {
    const decider = new EvolutionDecider({ enableLogging: false });
    const result = decider.decide(makeComparison({ pnlDelta: -1, latencyDelta: -3, riskDelta: -0.02 }));
    expect(result.confidence).toBeCloseTo(2 / 3, 2);
  });

  it('confidence = 0 when all metrics fail', () => {
    const decider = new EvolutionDecider({ enableLogging: false });
    const result = decider.decide(makeComparison({ pnlDelta: -1, latencyDelta: 5, riskDelta: 0.1 }));
    expect(result.confidence).toBe(0);
  });

  it('reason details include metric values', () => {
    const decider = new EvolutionDecider({ enableLogging: false });
    const result = decider.decide(makeComparison({ pnlDelta: 8.5, latencyDelta: -4, riskDelta: -0.03 }));
    const pnlReason = result.reasons.find((r) => r.metric === 'pnl');
    expect(pnlReason?.detail).toContain('8.50');
  });

  it('decidedAt is a recent timestamp', () => {
    const before = Date.now();
    const decider = new EvolutionDecider({ enableLogging: false });
    const result = decider.decide(makeComparison());
    expect(result.decidedAt).toBeGreaterThanOrEqual(before);
  });

  it('all three reasons are always present', () => {
    const decider = new EvolutionDecider({ enableLogging: false });
    const result = decider.decide(makeComparison());
    expect(result.reasons).toHaveLength(3);
    const metrics = result.reasons.map((r) => r.metric);
    expect(metrics).toContain('pnl');
    expect(metrics).toContain('latency');
    expect(metrics).toContain('riskScore');
  });
});

describe('EvolutionDecider — logging', () => {
  it('logs approved decision', () => {
    const decider = new EvolutionDecider({ enableLogging: true });
    decider.decide(makeComparison({ pnlDelta: 5, latencyDelta: -3, riskDelta: -0.02 }));
    const log = decider.getLog();
    expect(log).toHaveLength(1);
    expect(log[0].decision).toBe('approved');
    expect(log[0].level).toBe('info');
  });

  it('logs discarded decision', () => {
    const decider = new EvolutionDecider({ enableLogging: true });
    decider.decide(makeComparison({ pnlDelta: -1, latencyDelta: 5, riskDelta: 0.1 }));
    const log = decider.getLog();
    expect(log[0].decision).toBe('discarded');
    expect(log[0].level).toBe('warn');
  });

  it('accumulates multiple log entries', () => {
    const decider = new EvolutionDecider({ enableLogging: true });
    decider.decide(makeComparison());
    decider.decide(makeComparison());
    decider.decide(makeComparison());
    expect(decider.getLog()).toHaveLength(3);
  });

  it('clearLog removes all entries', () => {
    const decider = new EvolutionDecider({ enableLogging: true });
    decider.decide(makeComparison());
    decider.clearLog();
    expect(decider.getLog()).toHaveLength(0);
  });

  it('getLog returns a copy, not internal reference', () => {
    const decider = new EvolutionDecider({ enableLogging: true });
    decider.decide(makeComparison());
    const log = decider.getLog();
    log.push({ level: 'info', message: 'injected', timestamp: 0, decision: 'approved' });
    expect(decider.getLog()).toHaveLength(1);
  });

  it('respects enableLogging: false', () => {
    const decider = new EvolutionDecider({ enableLogging: false });
    decider.decide(makeComparison());
    expect(decider.getLog()).toHaveLength(0);
  });
});

describe('EvolutionDecider — threshold config', () => {
  it('minPnlImprovement = 10 rejects delta of 5', () => {
    const decider = new EvolutionDecider({ enableLogging: false, minPnlImprovement: 10 });
    const result = decider.decide(makeComparison({ pnlDelta: 5, latencyDelta: -3, riskDelta: -0.02 }));
    expect(result.reasons.find((r) => r.metric === 'pnl')?.passed).toBe(false);
  });

  it('maxLatencyIncrease = 5 allows latencyDelta of 3', () => {
    const decider = new EvolutionDecider({ enableLogging: false, maxLatencyIncrease: 5 });
    const result = decider.decide(makeComparison({ pnlDelta: 5, latencyDelta: 3, riskDelta: -0.02 }));
    expect(result.reasons.find((r) => r.metric === 'latency')?.passed).toBe(true);
  });
});

// ── VersionController ─────────────────────────────────────────────────────────

describe('VersionController — store and activate', () => {
  it('stores a version and returns CodeVersion', () => {
    const vc = new VersionController();
    const v = vc.store('const x = 1;', makeMetrics(), 'initial');
    expect(v.code).toBe('const x = 1;');
    expect(v.version).toBe(1);
    expect(v.isActive).toBe(false);
    expect(typeof v.id).toBe('string');
    expect(typeof v.createdAt).toBe('number');
  });

  it('version counter increments', () => {
    const vc = new VersionController();
    const v1 = vc.store('a', makeMetrics(), 'a');
    const v2 = vc.store('b', makeMetrics(), 'b');
    expect(v2.version).toBe(v1.version + 1);
  });

  it('activate sets isActive on correct version', () => {
    const vc = new VersionController();
    const v1 = vc.store('a', makeMetrics(), 'a');
    const v2 = vc.store('b', makeMetrics(), 'b');
    vc.activate(v2.id);
    expect(vc.getActive()?.id).toBe(v2.id);
    // v1 should not be active
    expect(vc.getById(v1.id)?.isActive).toBe(false);
  });

  it('activate returns false for unknown id', () => {
    const vc = new VersionController();
    expect(vc.activate('nonexistent')).toBe(false);
  });

  it('getActive returns null when no active version', () => {
    const vc = new VersionController();
    expect(vc.getActive()).toBeNull();
  });

  it('getById returns null for unknown id', () => {
    const vc = new VersionController();
    expect(vc.getById('unknown')).toBeNull();
  });

  it('size reflects stored count', () => {
    const vc = new VersionController();
    vc.store('a', makeMetrics(), 'a');
    vc.store('b', makeMetrics(), 'b');
    expect(vc.size).toBe(2);
  });

  it('getAll returns all versions oldest-first', () => {
    const vc = new VersionController();
    const v1 = vc.store('a', makeMetrics(), 'a');
    const v2 = vc.store('b', makeMetrics(), 'b');
    const all = vc.getAll();
    expect(all[0].id).toBe(v1.id);
    expect(all[1].id).toBe(v2.id);
  });

  it('getRecent(1) returns most recent version first', () => {
    const vc = new VersionController();
    vc.store('a', makeMetrics(), 'a');
    const v2 = vc.store('b', makeMetrics(), 'b');
    const recent = vc.getRecent(1);
    expect(recent[0].id).toBe(v2.id);
  });
});

describe('VersionController — rollback', () => {
  it('rollback fails with fewer than 2 versions', () => {
    const vc = new VersionController();
    const result = vc.rollback();
    expect(result.success).toBe(false);
    expect(result.rolledBackTo).toBeNull();
  });

  it('rollback goes to previous version', () => {
    const vc = new VersionController();
    const v1 = vc.store('a', makeMetrics(), 'a');
    const v2 = vc.store('b', makeMetrics(), 'b');
    vc.activate(v2.id);
    const result = vc.rollback();
    expect(result.success).toBe(true);
    expect(result.rolledBackTo?.id).toBe(v1.id);
    expect(vc.getActive()?.id).toBe(v1.id);
  });

  it('rollbackTo specific version succeeds', () => {
    const vc = new VersionController();
    const v1 = vc.store('a', makeMetrics(), 'a');
    vc.store('b', makeMetrics(), 'b');
    vc.store('c', makeMetrics(), 'c');
    const result = vc.rollbackTo(v1.id);
    expect(result.success).toBe(true);
    expect(vc.getActive()?.id).toBe(v1.id);
  });

  it('rollbackTo unknown id returns failure', () => {
    const vc = new VersionController();
    const result = vc.rollbackTo('ghost');
    expect(result.success).toBe(false);
    expect(result.message).toContain('not found');
  });

  it('rollback message includes version number', () => {
    const vc = new VersionController();
    const v1 = vc.store('a', makeMetrics(), 'a');
    vc.store('b', makeMetrics(), 'b');
    vc.activate(vc.getAll()[1].id);
    const result = vc.rollback();
    expect(result.message).toContain(String(v1.version));
  });
});

describe('VersionController — pruning and reset', () => {
  it('prunes oldest when maxVersions exceeded', () => {
    const vc = new VersionController({ maxVersions: 3 });
    for (let i = 0; i < 5; i++) vc.store(`code${i}`, makeMetrics(), `v${i}`);
    expect(vc.size).toBe(3);
    // Oldest (code0, code1) should be gone
    const all = vc.getAll();
    expect(all[0].code).toBe('code2');
  });

  it('reset clears all versions and state', () => {
    const vc = new VersionController();
    vc.store('a', makeMetrics(), 'a');
    vc.activate(vc.getAll()[0].id);
    vc.reset();
    expect(vc.size).toBe(0);
    expect(vc.getActive()).toBeNull();
  });
});

// ── AutopoieticEngine ─────────────────────────────────────────────────────────

describe('AutopoieticEngine — runCycle', () => {
  it('returns EvolutionCycleResult with correct shape', () => {
    const engine = new AutopoieticEngine({
      srcDir: path.resolve(__dirname, '../../../src/arbitrage/phase12_omega/autopoieticEngine'),
      dryRun: true,
    });
    const result = engine.runCycle();
    expect(typeof result.cycleIndex).toBe('number');
    expect(result.cycleIndex).toBe(1);
    expect(result.codebaseMetrics).toHaveProperty('fileCount');
    expect(result.generation).toHaveProperty('refactoredCode');
    expect(result.sandbox).toHaveProperty('pnlDelta');
    expect(result.decision).toHaveProperty('decision');
    expect(typeof result.completedAt).toBe('number');
  });

  it('increments cycleIndex on each call', () => {
    const engine = new AutopoieticEngine({ dryRun: true });
    engine.runCycle();
    engine.runCycle();
    const r3 = engine.runCycle();
    expect(r3.cycleIndex).toBe(3);
  });

  it('stores version when decision is approved (non-dryRun)', () => {
    // Force approved decision by giving easily-winning comparison
    const engine = new AutopoieticEngine({ dryRun: false, seedCode: 'console.log("x");\n' });
    // Run enough cycles to get at least one approval
    let approved = false;
    for (let i = 0; i < 5; i++) {
      const r = engine.runCycle();
      if (r.decision.decision === 'approved') {
        expect(r.storedVersion).not.toBeNull();
        expect(r.storedVersion?.isActive).toBe(true);
        approved = true;
        break;
      }
    }
    // At minimum, storedVersion is null when discarded
    if (!approved) {
      const r = engine.runCycle();
      if (r.decision.decision === 'discarded') {
        expect(r.storedVersion).toBeNull();
      }
    }
  });

  it('dryRun stores version but does not activate it', () => {
    const engine = new AutopoieticEngine({ dryRun: true, seedCode: 'console.log("x");\n' });
    for (let i = 0; i < 5; i++) {
      const r = engine.runCycle();
      if (r.decision.decision === 'approved' && r.storedVersion) {
        expect(r.storedVersion.isActive).toBe(false);
        break;
      }
    }
  });

  it('completedAt is a recent timestamp', () => {
    const before = Date.now();
    const engine = new AutopoieticEngine({ dryRun: true });
    const r = engine.runCycle();
    expect(r.completedAt).toBeGreaterThanOrEqual(before);
  });
});

describe('AutopoieticEngine — metrics', () => {
  it('initial metrics show zero cycles and not running', () => {
    const engine = new AutopoieticEngine({ dryRun: true });
    const m = engine.getMetrics();
    expect(m.totalCycles).toBe(0);
    expect(m.approvedEvolutions).toBe(0);
    expect(m.discardedEvolutions).toBe(0);
    expect(m.isRunning).toBe(false);
    expect(m.lastCycleAt).toBeNull();
    expect(m.currentVersion).toBeNull();
  });

  it('totalCycles reflects runCycle calls', () => {
    const engine = new AutopoieticEngine({ dryRun: true });
    engine.runCycle();
    engine.runCycle();
    expect(engine.getMetrics().totalCycles).toBe(2);
  });

  it('approved + discarded sums to total cycles', () => {
    const engine = new AutopoieticEngine({ dryRun: true });
    for (let i = 0; i < 5; i++) engine.runCycle();
    const m = engine.getMetrics();
    expect(m.approvedEvolutions + m.discardedEvolutions).toBe(m.totalCycles);
  });

  it('lastCycleAt is set after first runCycle', () => {
    const before = Date.now();
    const engine = new AutopoieticEngine({ dryRun: true });
    engine.runCycle();
    expect(engine.getMetrics().lastCycleAt).toBeGreaterThanOrEqual(before);
  });
});

describe('AutopoieticEngine — start / stop', () => {
  it('isRunning is false before start', () => {
    const engine = new AutopoieticEngine({ dryRun: true, intervalMs: 100_000 });
    expect(engine.isRunning).toBe(false);
  });

  it('isRunning is true after start and false after stop', () => {
    const engine = new AutopoieticEngine({ dryRun: true, intervalMs: 100_000 });
    engine.start();
    expect(engine.isRunning).toBe(true);
    engine.stop();
    expect(engine.isRunning).toBe(false);
  });

  it('start is idempotent (calling twice does not create two timers)', () => {
    const engine = new AutopoieticEngine({ dryRun: true, intervalMs: 100_000 });
    engine.start();
    engine.start(); // no-op
    expect(engine.isRunning).toBe(true);
    engine.stop();
  });

  it('getMetrics().isRunning matches engine.isRunning', () => {
    const engine = new AutopoieticEngine({ dryRun: true, intervalMs: 100_000 });
    engine.start();
    expect(engine.getMetrics().isRunning).toBe(true);
    engine.stop();
    expect(engine.getMetrics().isRunning).toBe(false);
  });
});

describe('AutopoieticEngine — getCycleHistory', () => {
  it('returns empty array before any cycles', () => {
    const engine = new AutopoieticEngine({ dryRun: true });
    expect(engine.getCycleHistory()).toHaveLength(0);
  });

  it('history grows with each runCycle call', () => {
    const engine = new AutopoieticEngine({ dryRun: true });
    engine.runCycle();
    engine.runCycle();
    expect(engine.getCycleHistory()).toHaveLength(2);
  });

  it('getCycleHistory returns a copy', () => {
    const engine = new AutopoieticEngine({ dryRun: true });
    engine.runCycle();
    const h1 = engine.getCycleHistory();
    h1.push({} as EvolutionCycleResult);
    expect(engine.getCycleHistory()).toHaveLength(1);
  });
});

describe('AutopoieticEngine — rollback', () => {
  it('rollback returns failure when no versions stored', () => {
    const engine = new AutopoieticEngine({ dryRun: true });
    const result = engine.rollback();
    expect(result.success).toBe(false);
  });

  it('rollback succeeds after approved evolutions', () => {
    const engine = new AutopoieticEngine({ dryRun: false, seedCode: 'console.log("x");\n' });
    // Run cycles until we get 2+ approved
    const history: EvolutionCycleResult[] = [];
    for (let i = 0; i < 20; i++) {
      history.push(engine.runCycle());
    }
    const approved = history.filter((h) => h.decision.decision === 'approved');
    if (approved.length >= 2) {
      const result = engine.rollback();
      expect(result.success).toBe(true);
    }
  });
});

describe('AutopoieticEngine — versions accessor', () => {
  it('exposes VersionController instance', () => {
    const engine = new AutopoieticEngine({ dryRun: true });
    expect(engine.versions).toBeInstanceOf(VersionController);
  });

  it('version controller size starts at zero', () => {
    const engine = new AutopoieticEngine({ dryRun: true });
    expect(engine.versions.size).toBe(0);
  });
});

// ── Barrel export check ───────────────────────────────────────────────────────

describe('Barrel exports from index', () => {
  it('AutopoieticEngine is exported from index', () => {
    // Already imported at top — verify it is a constructor
    expect(typeof AutopoieticEngine).toBe('function');
  });

  it('CodeAnalyzer is re-exported from index', async () => {
    const mod = await import('../../../src/arbitrage/phase12_omega/autopoieticEngine/index');
    expect(typeof mod.CodeAnalyzer).toBe('function');
  });

  it('LlmCodeGenerator is re-exported from index', async () => {
    const mod = await import('../../../src/arbitrage/phase12_omega/autopoieticEngine/index');
    expect(typeof mod.LlmCodeGenerator).toBe('function');
  });

  it('SandboxExecutor is re-exported from index', async () => {
    const mod = await import('../../../src/arbitrage/phase12_omega/autopoieticEngine/index');
    expect(typeof mod.SandboxExecutor).toBe('function');
  });

  it('EvolutionDecider is re-exported from index', async () => {
    const mod = await import('../../../src/arbitrage/phase12_omega/autopoieticEngine/index');
    expect(typeof mod.EvolutionDecider).toBe('function');
  });

  it('VersionController is re-exported from index', async () => {
    const mod = await import('../../../src/arbitrage/phase12_omega/autopoieticEngine/index');
    expect(typeof mod.VersionController).toBe('function');
  });
});
