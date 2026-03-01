import { describe, it, expect } from 'vitest';
import type { AgentConfig, AgentTool, MemoryConfig, AgentRun } from './agents-facade';

describe('AgentConfig shape validation', () => {
  const baseTool: AgentTool = {
    name: 'search',
    description: 'Web search tool',
    parameters: { query: { type: 'string' } },
    handler: 'search_handler',
  };

  it('should construct a minimal valid AgentConfig', () => {
    const config: AgentConfig = {
      name: 'minimal-agent',
      model: 'claude-3-haiku',
      systemPrompt: 'You are a helper.',
      tools: [],
    };

    expect(config.name).toBe('minimal-agent');
    expect(config.tools).toHaveLength(0);
    expect(config.maxTurns).toBeUndefined();
    expect(config.memory).toBeUndefined();
  });

  it('should accept multiple tools', () => {
    const tools: AgentTool[] = [
      baseTool,
      { name: 'calculator', description: 'Math', parameters: {}, handler: 'calc' },
    ];
    const config: AgentConfig = {
      name: 'multi-tool',
      model: 'claude-3',
      systemPrompt: 'Use tools wisely.',
      tools,
    };

    expect(config.tools).toHaveLength(2);
    expect(config.tools[0].name).toBe('search');
    expect(config.tools[1].name).toBe('calculator');
  });

  it('should accept all three MemoryConfig types', () => {
    const types: MemoryConfig['type'][] = ['buffer', 'vector', 'summary'];

    for (const type of types) {
      const mem: MemoryConfig = { type, maxEntries: 50 };
      expect(mem.type).toBe(type);
    }
  });

  it('should accept memory with optional persistPath', () => {
    const mem: MemoryConfig = {
      type: 'vector',
      maxEntries: 200,
      persistPath: '/tmp/agent-memory',
    };
    expect(mem.persistPath).toBe('/tmp/agent-memory');
  });

  it('should accept maxTurns as a positive integer', () => {
    const config: AgentConfig = {
      name: 'bounded',
      model: 'claude-3',
      systemPrompt: 'Bounded agent.',
      tools: [baseTool],
      maxTurns: 5,
    };
    expect(config.maxTurns).toBe(5);
  });
});

describe('AgentRun shape validation', () => {
  it('should construct a running AgentRun', () => {
    const run: AgentRun = {
      id: 'run-001',
      agentName: 'test-agent',
      status: 'running',
      turns: 0,
      toolCalls: [],
    };

    expect(run.status).toBe('running');
    expect(run.output).toBeUndefined();
  });

  it('should construct a completed AgentRun with output', () => {
    const run: AgentRun = {
      id: 'run-002',
      agentName: 'test-agent',
      status: 'completed',
      turns: 3,
      output: 'Task done.',
      toolCalls: [{ tool: 'search', input: { q: 'hello' }, output: { results: [] } }],
    };

    expect(run.status).toBe('completed');
    expect(run.turns).toBe(3);
    expect(run.toolCalls).toHaveLength(1);
    expect(run.toolCalls[0].tool).toBe('search');
  });

  it('should construct a failed AgentRun', () => {
    const run: AgentRun = {
      id: 'run-003',
      agentName: 'test-agent',
      status: 'failed',
      turns: 1,
      toolCalls: [],
    };

    expect(run.status).toBe('failed');
  });

  it('should accept all status values', () => {
    const statuses: AgentRun['status'][] = ['running', 'completed', 'failed'];
    expect(statuses).toHaveLength(3);
    for (const s of statuses) {
      expect(typeof s).toBe('string');
    }
  });
});
