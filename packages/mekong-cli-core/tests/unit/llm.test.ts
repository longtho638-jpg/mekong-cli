import { describe, it, expect, beforeEach } from 'vitest';
import { CostTracker } from '../../src/llm/cost-tracker.js';
import { LlmRouter } from '../../src/llm/router.js';
import { ConfigSchema } from '../../src/types/config.js';

describe('CostTracker', () => {
  let tracker: CostTracker;

  beforeEach(() => {
    tracker = new CostTracker();
  });

  it('records usage', () => {
    const record = tracker.record('openai', 'gpt-4o', 1000, 500, 200);
    expect(record.provider).toBe('openai');
    expect(record.inputTokens).toBe(1000);
    expect(record.cost).toBeGreaterThan(0);
  });

  it('calculates cost correctly for gpt-4o', () => {
    // gpt-4o: $2.5/MTok input, $10/MTok output
    const cost = tracker.calculateCost('gpt-4o', 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(12.5, 1);
  });

  it('calculates cost correctly for deepseek-chat', () => {
    // deepseek-chat: $0.14/MTok input, $0.28/MTok output
    const cost = tracker.calculateCost('deepseek-chat', 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(0.42, 2);
  });

  it('tracks summary by model and provider', () => {
    tracker.record('openai', 'gpt-4o', 1000, 500, 100);
    tracker.record('openai', 'gpt-4o', 2000, 1000, 200);
    tracker.record('deepseek', 'deepseek-chat', 5000, 2000, 50);

    const summary = tracker.getSummary();
    expect(summary.totalRequests).toBe(3);
    expect(summary.totalInputTokens).toBe(8000);
    expect(summary.byModel['gpt-4o'].requests).toBe(2);
    expect(summary.byProvider['deepseek'].requests).toBe(1);
  });

  it('resets records', () => {
    tracker.record('openai', 'gpt-4o', 1000, 500, 100);
    tracker.reset();
    expect(tracker.getRecords()).toHaveLength(0);
    expect(tracker.getSummary().totalRequests).toBe(0);
  });

  it('returns empty summary when no records', () => {
    const summary = tracker.getSummary();
    expect(summary.totalRequests).toBe(0);
    expect(summary.avgLatencyMs).toBe(0);
    expect(summary.totalCost).toBe(0);
  });

  it('defaults to Sonnet pricing for unknown model', () => {
    // unknown model falls back to [3, 15] — same as claude-sonnet-4
    const cost = tracker.calculateCost('unknown-model', 1_000_000, 1_000_000);
    const sonnetCost = tracker.calculateCost('claude-sonnet-4', 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(sonnetCost, 5);
  });

  it('returns copy of records (immutable)', () => {
    tracker.record('openai', 'gpt-4o', 100, 50, 10);
    const records = tracker.getRecords();
    records.pop();
    expect(tracker.getRecords()).toHaveLength(1);
  });
});

describe('LlmRouter', () => {
  it('initializes with default config', () => {
    const config = ConfigSchema.parse({});
    const router = new LlmRouter(config);
    expect(router.getProviders()).toBeDefined();
    expect(Array.isArray(router.getProviders())).toBe(true);
  });

  it('initializes from LLM_BASE_URL env', () => {
    const originalUrl = process.env.LLM_BASE_URL;
    const originalKey = process.env.LLM_API_KEY;
    process.env.LLM_BASE_URL = 'https://test.example.com/v1';
    process.env.LLM_API_KEY = 'test-key';

    try {
      const config = ConfigSchema.parse({});
      const router = new LlmRouter(config);
      expect(router.getProviders()).toContain('anthropic');
    } finally {
      if (originalUrl) process.env.LLM_BASE_URL = originalUrl;
      else delete process.env.LLM_BASE_URL;
      if (originalKey) process.env.LLM_API_KEY = originalKey;
      else delete process.env.LLM_API_KEY;
    }
  });

  it('throws when all providers fail', async () => {
    const config = ConfigSchema.parse({});
    const router = new LlmRouter(config);
    await expect(router.chat({
      messages: [{ role: 'user', content: 'test' }],
      provider: 'nonexistent',
    })).rejects.toThrow();
  });

  it('exposes costTracker', () => {
    const config = ConfigSchema.parse({});
    const router = new LlmRouter(config);
    expect(router.costTracker).toBeDefined();
    expect(typeof router.costTracker.getSummary).toBe('function');
  });

  it('getUsageSummary returns empty on init', () => {
    const config = ConfigSchema.parse({});
    const router = new LlmRouter(config);
    const summary = router.getUsageSummary();
    expect(summary.totalRequests).toBe(0);
    expect(summary.totalCost).toBe(0);
  });

  it('auto-detects ANTHROPIC_API_KEY from env', () => {
    const original = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';

    try {
      const config = ConfigSchema.parse({});
      const router = new LlmRouter(config);
      expect(router.getProviders()).toContain('anthropic');
    } finally {
      if (original) process.env.ANTHROPIC_API_KEY = original;
      else delete process.env.ANTHROPIC_API_KEY;
    }
  });
});
