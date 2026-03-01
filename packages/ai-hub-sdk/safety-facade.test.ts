import { describe, it, expect } from 'vitest';
import { SafetyFacade } from './safety-facade';
import type { GuardrailConfig, SafetyCategory } from './safety-facade';

describe('SafetyFacade', () => {
  const facade = new SafetyFacade();

  it('should be instantiable', () => {
    expect(facade).toBeDefined();
    expect(facade).toBeInstanceOf(SafetyFacade);
  });

  it('checkContent should throw not-implemented error', async () => {
    await expect(facade.checkContent('test input')).rejects.toThrow('Implement with vibe-ai-safety provider');
  });

  it('checkContent with categories should throw not-implemented error', async () => {
    await expect(facade.checkContent('test', ['toxicity'])).rejects.toThrow('Implement with vibe-ai-safety provider');
  });

  it('configureGuardrails should throw not-implemented error', async () => {
    const config: GuardrailConfig = {
      inputFilters: ['pii'],
      outputFilters: ['toxicity'],
      maxTokens: 4096,
      blockedTopics: ['violence'],
    };
    await expect(facade.configureGuardrails(config)).rejects.toThrow('Implement with vibe-ai-safety provider');
  });

  it('SafetyCategory should support all category types', () => {
    const categories: SafetyCategory['name'][] = ['toxicity', 'bias', 'pii', 'jailbreak', 'hallucination', 'custom'];
    expect(categories).toHaveLength(6);
  });
});
