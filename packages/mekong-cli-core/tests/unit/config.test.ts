import { describe, it, expect, afterEach } from 'vitest';
import { loadConfig, deepMerge } from '../../src/config/loader.js';
import { DEFAULT_CONFIG } from '../../src/config/defaults.js';

describe('deepMerge', () => {
  it('merges flat objects', () => {
    const result = deepMerge({ a: 1 }, { b: 2 });
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it('source overrides target', () => {
    const result = deepMerge({ a: 1 }, { a: 2 });
    expect(result).toEqual({ a: 2 });
  });

  it('deep merges nested objects', () => {
    const result = deepMerge(
      { llm: { provider: 'a', model: 'x' } },
      { llm: { provider: 'b' } }
    );
    expect(result).toEqual({ llm: { provider: 'b', model: 'x' } });
  });

  it('arrays are replaced, not merged', () => {
    const result = deepMerge({ arr: [1, 2] }, { arr: [3] });
    expect(result).toEqual({ arr: [3] });
  });
});

describe('DEFAULT_CONFIG', () => {
  it('has all required fields', () => {
    expect(DEFAULT_CONFIG.version).toBe('1');
    expect(DEFAULT_CONFIG.llm.default_provider).toBe('anthropic');
    expect(DEFAULT_CONFIG.agents.wip_limit).toBe(3);
    expect(DEFAULT_CONFIG.budget.max_cost_per_task).toBe(1.0);
    expect(DEFAULT_CONFIG.tools.sandbox_shell).toBe(true);
  });
});

describe('loadConfig', () => {
  afterEach(() => {
    delete process.env.MEKONG_LLM_DEFAULT_PROVIDER;
    delete process.env.MEKONG_LLM_DEFAULT_MODEL;
  });

  it('returns defaults when no config files exist', async () => {
    const config = await loadConfig();
    expect(config.version).toBe('1');
    expect(config.llm.default_provider).toBe('anthropic');
  });

  it('applies overrides', async () => {
    const config = await loadConfig({
      llm: { default_provider: 'openai', default_model: 'gpt-4o', providers: {} },
    });
    expect(config.llm.default_provider).toBe('openai');
  });

  it('respects MEKONG_* env vars', async () => {
    process.env.MEKONG_LLM_DEFAULT_PROVIDER = 'deepseek';
    const config = await loadConfig();
    expect(config.llm.default_provider).toBe('deepseek');
  });
});
