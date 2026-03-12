/**
 * Self-Improve module tests — execution-feedback, skill-evolution, prompt-refiner, memory-curator
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { ExecutionFeedback } from './execution-feedback.js';
import { SkillEvolution } from './skill-evolution.js';
import { PromptRefiner } from './prompt-refiner.js';
import { MemoryCurator } from './memory-curator.js';
import type { ExecutionRecord, PromptVariant } from './types.js';

const TEST_DIR = '/tmp/mekong-self-improve-test';

function makeRecord(overrides: Partial<ExecutionRecord> = {}): ExecutionRecord {
  return {
    id: `exec-${Date.now()}-${Math.random()}`,
    taskType: 'code-review',
    agentName: 'reviewer',
    input: 'Review PR #42',
    toolsCalled: [{ tool: 'git-diff', params: {}, success: true, duration: 100, retries: 0 }],
    llmCalls: [{ model: 'claude-sonnet', provider: 'anthropic', promptHash: 'abc', inputTokens: 500, outputTokens: 200, success: true, duration: 1000 }],
    result: 'success',
    totalDuration: 1200,
    totalCost: 0.003,
    totalTokens: 700,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

const mockLlm = {
  chat: vi.fn().mockResolvedValue({ content: 'mocked LLM response' }),
} as any;

// --- ExecutionFeedback ---
describe('ExecutionFeedback', () => {
  let fb: ExecutionFeedback;

  beforeEach(async () => {
    await fs.mkdir(TEST_DIR, { recursive: true });
    fb = new ExecutionFeedback(TEST_DIR);
  });

  afterEach(async () => {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  });

  it('records execution to JSONL file', async () => {
    await fb.record(makeRecord());
    const content = await fs.readFile(join(TEST_DIR, 'executions.jsonl'), 'utf-8');
    const lines = content.trim().split('\n');
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0]).taskType).toBe('code-review');
  });

  it('appends multiple records', async () => {
    await fb.record(makeRecord());
    await fb.record(makeRecord({ taskType: 'deploy' }));
    const records = await fb.loadRecords();
    expect(records).toHaveLength(2);
  });

  it('loadRecords returns empty array when no file', async () => {
    const records = await fb.loadRecords();
    expect(records).toEqual([]);
  });

  it('analyzePatterns finds success patterns', async () => {
    for (let i = 0; i < 5; i++) await fb.record(makeRecord());
    const patterns = await fb.analyzePatterns(3);
    expect(patterns.length).toBeGreaterThanOrEqual(1);
    const sp = patterns.find(p => p.type === 'success_pattern');
    expect(sp).toBeDefined();
    expect(sp!.confidence).toBe(1); // all success
  });

  it('analyzePatterns finds failure patterns', async () => {
    for (let i = 0; i < 4; i++) {
      await fb.record(makeRecord({ result: 'failure', errorType: 'timeout' }));
    }
    const patterns = await fb.analyzePatterns(3);
    const fp = patterns.find(p => p.type === 'failure_pattern');
    expect(fp).toBeDefined();
    expect(fp!.description).toContain('timeout');
  });

  it('analyzePatterns returns empty when too few records', async () => {
    await fb.record(makeRecord());
    const patterns = await fb.analyzePatterns(5);
    expect(patterns).toEqual([]);
  });

  it('getBestApproach returns recommendation from history', async () => {
    for (let i = 0; i < 3; i++) await fb.record(makeRecord());
    const best = await fb.getBestApproach('code-review');
    expect(best).not.toBeNull();
    expect(best!.recommendedAgent).toBe('reviewer');
    expect(best!.confidence).toBe(1);
  });

  it('getBestApproach returns null for unknown task type', async () => {
    const best = await fb.getBestApproach('unknown');
    expect(best).toBeNull();
  });
});

// --- SkillEvolution ---
describe('SkillEvolution', () => {
  let se: SkillEvolution;

  beforeEach(async () => {
    await fs.mkdir(TEST_DIR, { recursive: true });
    se = new SkillEvolution(TEST_DIR, mockLlm);
  });

  afterEach(async () => {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  });

  it('detectCandidates finds recurring tool sequences', async () => {
    const records = Array.from({ length: 4 }, () =>
      makeRecord({ toolsCalled: [
        { tool: 'git-diff', params: {}, success: true, duration: 100, retries: 0 },
        { tool: 'llm-review', params: {}, success: true, duration: 500, retries: 0 },
      ]})
    );
    const candidates = await se.detectCandidates(records, 3);
    expect(candidates.length).toBeGreaterThanOrEqual(1);
    expect(candidates[0].status).toBe('proposed');
  });

  it('detectCandidates returns empty when below threshold', async () => {
    const records = [makeRecord()];
    const candidates = await se.detectCandidates(records, 5);
    expect(candidates).toEqual([]);
  });

  it('approve saves skill and sets active status', async () => {
    const skill = {
      id: 'sk-test', name: 'test-skill', description: 'test', trigger: 'deploy',
      implementation: { type: 'sop' as const, definition: 'steps' },
      source: 'test', usageCount: 0, successRate: 0, status: 'proposed' as const, createdAt: new Date().toISOString(),
    };
    const result = await se.approve(skill);
    expect(result.ok).toBe(true);
    const active = await se.getActiveSkills();
    expect(active).toHaveLength(1);
    expect(active[0].status).toBe('active');
  });

  it('suggestSkill matches by trigger keyword', async () => {
    const skill = {
      id: 'sk-1', name: 'deploy-workflow', description: 'auto deploy', trigger: 'deploy',
      implementation: { type: 'sop' as const, definition: 'x' },
      source: 'test', usageCount: 0, successRate: 0, status: 'proposed' as const, createdAt: new Date().toISOString(),
    };
    await se.approve(skill);
    const suggestion = await se.suggestSkill('I need to deploy the app');
    expect(suggestion).not.toBeNull();
    expect(suggestion!.name).toBe('deploy-workflow');
  });

  it('suggestSkill returns null when no match', async () => {
    const result = await se.suggestSkill('random task');
    expect(result).toBeNull();
  });

  it('generateSop calls LLM', async () => {
    const result = await se.generateSop({
      toolSequence: ['git-diff', 'llm-review'],
      commonInputs: { repo: 'main' },
      description: 'Code review workflow',
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe('mocked LLM response');
  });
});

// --- PromptRefiner ---
describe('PromptRefiner', () => {
  let pr: PromptRefiner;

  beforeEach(async () => {
    await fs.mkdir(TEST_DIR, { recursive: true });
    pr = new PromptRefiner(TEST_DIR, mockLlm);
  });

  afterEach(async () => {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  });

  it('getVariant returns null when no variants', async () => {
    const v = await pr.getVariant('test-context');
    expect(v).toBeNull();
  });

  it('recordResult updates variant metrics', async () => {
    // Create a variant file manually
    const variant: PromptVariant = {
      id: 'pv-1', name: 'test', targetContext: 'review', promptText: 'Review this code',
      metrics: { uses: 0, successRate: 0, avgTokens: 0, avgDuration: 0, avgCost: 0 },
      isActive: true, createdAt: new Date().toISOString(),
    };
    await fs.writeFile(join(TEST_DIR, 'prompt-variants.json'), JSON.stringify([variant]));

    await pr.recordResult('pv-1', { success: true, tokens: 100, duration: 500, cost: 0.01 });
    const v = await pr.getVariant('review');
    expect(v).not.toBeNull();
    expect(v!.metrics.uses).toBe(1);
    expect(v!.metrics.successRate).toBe(1);
  });

  it('evaluateTest reports no winner with insufficient samples', async () => {
    const variants: PromptVariant[] = [
      { id: 'a', name: 'a', targetContext: 'ctx', promptText: 'a', metrics: { uses: 5, successRate: 0.8, avgTokens: 100, avgDuration: 100, avgCost: 0.01 }, isActive: true, createdAt: '' },
      { id: 'b', name: 'b', targetContext: 'ctx', promptText: 'b', metrics: { uses: 5, successRate: 0.6, avgTokens: 100, avgDuration: 100, avgCost: 0.01 }, isActive: true, createdAt: '' },
    ];
    await fs.writeFile(join(TEST_DIR, 'prompt-variants.json'), JSON.stringify(variants));
    const result = await pr.evaluateTest('ctx');
    expect(result.hasWinner).toBe(false);
  });

  it('evaluateTest declares winner with sufficient data and gap', async () => {
    const variants: PromptVariant[] = [
      { id: 'a', name: 'a', targetContext: 'ctx', promptText: 'a', metrics: { uses: 35, successRate: 0.9, avgTokens: 100, avgDuration: 100, avgCost: 0.01 }, isActive: true, createdAt: '' },
      { id: 'b', name: 'b', targetContext: 'ctx', promptText: 'b', metrics: { uses: 35, successRate: 0.5, avgTokens: 100, avgDuration: 100, avgCost: 0.01 }, isActive: true, createdAt: '' },
    ];
    await fs.writeFile(join(TEST_DIR, 'prompt-variants.json'), JSON.stringify(variants));
    const result = await pr.evaluateTest('ctx');
    expect(result.hasWinner).toBe(true);
    expect(result.winnerId).toBe('a');
  });
});

// --- MemoryCurator ---
describe('MemoryCurator', () => {
  let mc: MemoryCurator;

  beforeEach(async () => {
    await fs.mkdir(TEST_DIR, { recursive: true });
    mc = new MemoryCurator(TEST_DIR, mockLlm);
  });

  afterEach(async () => {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  });

  it('getStorageStats returns zeros for empty dir', async () => {
    const stats = await mc.getStorageStats();
    expect(stats.totalSize).toBe(0);
    expect(stats.sessions.count).toBe(0);
  });

  it('compactSessions skips when <= keepFull sessions', async () => {
    const sessDir = join(TEST_DIR, 'sessions');
    await fs.mkdir(sessDir, { recursive: true });
    await fs.writeFile(join(sessDir, 's1.json'), '{"data":"x"}');
    const result = await mc.compactSessions(5);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.compacted).toBe(0);
  });

  it('compactSessions compacts old sessions', async () => {
    const sessDir = join(TEST_DIR, 'sessions');
    await fs.mkdir(sessDir, { recursive: true });
    for (let i = 0; i < 5; i++) {
      await fs.writeFile(join(sessDir, `s${i}.json`), JSON.stringify({ data: 'x'.repeat(500) }));
    }
    const result = await mc.compactSessions(2);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.compacted).toBe(3);
  });

  it('deduplicateKnowledge merges duplicates', async () => {
    const entities = [
      { id: '1', name: 'React', data: { v: 18 }, confidence: 0.9 },
      { id: '2', name: 'react', data: { v: 19 }, confidence: 0.95 },
      { id: '3', name: 'Vue', data: { v: 3 }, confidence: 0.8 },
    ];
    await fs.writeFile(join(TEST_DIR, 'knowledge.json'), JSON.stringify(entities));
    const result = await mc.deduplicateKnowledge();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.merged).toBe(1);
  });

  it('scoreRelevance returns empty for no knowledge', async () => {
    const scores = await mc.scoreRelevance();
    expect(scores).toEqual([]);
  });

  it('selectContext returns relevant entries within token budget', async () => {
    const entities = [
      { id: '1', name: 'React hooks', data: 'useState, useEffect', confidence: 0.9, lastUsed: new Date().toISOString(), accessCount: 50 },
      { id: '2', name: 'Docker setup', data: 'dockerfile config', confidence: 0.5, lastUsed: '2020-01-01T00:00:00Z', accessCount: 1 },
    ];
    await fs.writeFile(join(TEST_DIR, 'knowledge.json'), JSON.stringify(entities));
    const ctx = await mc.selectContext('React component with hooks', 1000);
    expect(ctx).toContain('React hooks');
  });

  it('cleanup removes old files', async () => {
    const metricsDir = join(TEST_DIR, 'metrics');
    await fs.mkdir(metricsDir, { recursive: true });
    await fs.writeFile(join(metricsDir, 'old.json'), 'data');
    // Set mtime to 1 year ago
    const past = new Date(Date.now() - 400 * 86400000);
    await fs.utimes(join(metricsDir, 'old.json'), past, past);
    const result = await mc.cleanup(30);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.removed).toBe(1);
  });
});
