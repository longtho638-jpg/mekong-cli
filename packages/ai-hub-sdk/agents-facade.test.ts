import { describe, it, expect } from 'vitest';
import { AgentsFacade } from './agents-facade';
import type { AgentConfig } from './agents-facade';

describe('AgentsFacade', () => {
  const facade = new AgentsFacade();

  const validConfig: AgentConfig = {
    name: 'test-agent',
    model: 'claude-3',
    systemPrompt: 'You are a test agent',
    tools: [{ name: 'search', description: 'Search tool', parameters: {}, handler: 'search_handler' }],
  };

  it('should be instantiable', () => {
    expect(facade).toBeDefined();
    expect(facade).toBeInstanceOf(AgentsFacade);
  });

  it('createAgent should throw not-implemented error', async () => {
    await expect(facade.createAgent(validConfig)).rejects.toThrow('Implement with vibe-agents provider');
  });

  it('runAgent should throw not-implemented error', async () => {
    await expect(facade.runAgent('agent-1', 'hello')).rejects.toThrow('Implement with vibe-agents provider');
  });

  it('orchestrate should throw not-implemented error', async () => {
    await expect(facade.orchestrate(['a1', 'a2'], 'task')).rejects.toThrow('Implement with vibe-agents provider');
  });

  it('should accept config with maxTurns', () => {
    const config: AgentConfig = { ...validConfig, maxTurns: 10 };
    expect(config.maxTurns).toBe(10);
  });

  it('should accept config without maxTurns (optional)', () => {
    const config: AgentConfig = { ...validConfig };
    expect(config.maxTurns).toBeUndefined();
  });

  it('should accept config with memory', () => {
    const config: AgentConfig = {
      ...validConfig,
      memory: { type: 'buffer', maxEntries: 100 },
    };
    expect(config.memory?.type).toBe('buffer');
    expect(config.memory?.maxEntries).toBe(100);
  });
});
