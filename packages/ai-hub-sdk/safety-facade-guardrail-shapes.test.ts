import { describe, it, expect } from 'vitest';
import type { SafetyCheck, SafetyCategory, GuardrailConfig } from './safety-facade';

describe('SafetyCategory shape', () => {
  it('should accept all valid category names', () => {
    const names: SafetyCategory['name'][] = [
      'toxicity',
      'bias',
      'pii',
      'jailbreak',
      'hallucination',
      'custom',
    ];
    expect(names).toHaveLength(6);
    for (const name of names) {
      expect(typeof name).toBe('string');
    }
  });

  it('should construct a flagged category', () => {
    const cat: SafetyCategory = {
      name: 'toxicity',
      score: 0.95,
      flagged: true,
      details: 'High toxicity detected',
    };
    expect(cat.flagged).toBe(true);
    expect(cat.score).toBeGreaterThan(0.5);
  });

  it('should construct a clean category without details', () => {
    const cat: SafetyCategory = {
      name: 'pii',
      score: 0.02,
      flagged: false,
    };
    expect(cat.flagged).toBe(false);
    expect(cat.details).toBeUndefined();
  });

  it('score should be a number between 0 and 1', () => {
    const scores = [0, 0.5, 1];
    for (const score of scores) {
      const cat: SafetyCategory = { name: 'bias', score, flagged: score > 0.5 };
      expect(cat.score).toBeGreaterThanOrEqual(0);
      expect(cat.score).toBeLessThanOrEqual(1);
    }
  });
});

describe('SafetyCheck shape', () => {
  it('should construct a SafetyCheck with multiple categories', () => {
    const check: SafetyCheck = {
      input: 'Hello world',
      threshold: 0.7,
      categories: [
        { name: 'toxicity', score: 0.1, flagged: false },
        { name: 'jailbreak', score: 0.05, flagged: false },
      ],
    };
    expect(check.categories).toHaveLength(2);
    expect(check.threshold).toBe(0.7);
  });

  it('should accept empty categories array', () => {
    const check: SafetyCheck = { input: 'test', threshold: 0.5, categories: [] };
    expect(check.categories).toHaveLength(0);
  });
});

describe('GuardrailConfig shape', () => {
  it('should construct a full guardrail config', () => {
    const config: GuardrailConfig = {
      inputFilters: ['pii', 'toxicity'],
      outputFilters: ['hallucination'],
      maxTokens: 2048,
      blockedTopics: ['violence', 'weapons'],
    };
    expect(config.inputFilters).toHaveLength(2);
    expect(config.outputFilters).toHaveLength(1);
    expect(config.maxTokens).toBe(2048);
    expect(config.blockedTopics).toContain('violence');
  });

  it('should accept empty filter arrays', () => {
    const config: GuardrailConfig = {
      inputFilters: [],
      outputFilters: [],
      maxTokens: 4096,
      blockedTopics: [],
    };
    expect(config.inputFilters).toHaveLength(0);
    expect(config.blockedTopics).toHaveLength(0);
  });

  it('maxTokens should be a positive integer', () => {
    const config: GuardrailConfig = {
      inputFilters: [],
      outputFilters: [],
      maxTokens: 8192,
      blockedTopics: [],
    };
    expect(config.maxTokens).toBeGreaterThan(0);
    expect(Number.isInteger(config.maxTokens)).toBe(true);
  });
});
