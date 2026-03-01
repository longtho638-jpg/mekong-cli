import { describe, it, expect, vi } from 'vitest';
import { BaseAgent } from './base-agent.js';
import type { AgentContext, AgentResult } from '../types/index.js';
import { defaultConfig } from '../config/defaults.js';
import { createSilentLogger } from '../utils/logger.js';

// Concrete implementation for testing the abstract class
class SuccessAgent extends BaseAgent {
  readonly name = 'SuccessAgent';
  runCallCount = 0;

  protected async run(): Promise<Partial<AgentResult>> {
    this.runCallCount++;
    return { data: { computed: true } };
  }
}

class FailingAgent extends BaseAgent {
  readonly name = 'FailingAgent';

  protected async run(): Promise<Partial<AgentResult>> {
    throw new Error('agent exploded');
  }
}

class StringThrowingAgent extends BaseAgent {
  readonly name = 'StringThrowingAgent';

  protected async run(): Promise<Partial<AgentResult>> {
    // eslint-disable-next-line @typescript-eslint/no-throw-literal
    throw 'raw string error';
  }
}

function makeContext(overrides: Partial<AgentContext> = {}): AgentContext {
  return {
    config: defaultConfig,
    app: {
      name: 'test-app',
      path: '/tmp/test',
      type: 'nextjs',
      buildCommand: 'npm run build',
      outputDir: 'dist',
    },
    logger: createSilentLogger(),
    ...overrides,
  };
}

describe('BaseAgent.execute', () => {
  it('should return success=true when run() resolves', async () => {
    const agent = new SuccessAgent();
    const result = await agent.execute(makeContext());

    expect(result.success).toBe(true);
  });

  it('should merge run() return data into result', async () => {
    const agent = new SuccessAgent();
    const result = await agent.execute(makeContext());

    expect(result.data).toEqual({ computed: true });
  });

  it('should call run() exactly once per execute call', async () => {
    const agent = new SuccessAgent();
    await agent.execute(makeContext());

    expect(agent.runCallCount).toBe(1);
  });

  it('should return success=false when run() throws', async () => {
    const agent = new FailingAgent();
    const result = await agent.execute(makeContext());

    expect(result.success).toBe(false);
  });

  it('should capture the thrown Error in result.error', async () => {
    const agent = new FailingAgent();
    const result = await agent.execute(makeContext());

    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toBe('agent exploded');
  });

  it('should wrap a non-Error throw in an Error object', async () => {
    const agent = new StringThrowingAgent();
    const result = await agent.execute(makeContext());

    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toContain('raw string error');
  });

  it('should expose the agent name via readonly property', () => {
    const agent = new SuccessAgent();
    expect(agent.name).toBe('SuccessAgent');
  });

  it('should invoke run() again on a second execute call', async () => {
    const agent = new SuccessAgent();
    await agent.execute(makeContext());
    await agent.execute(makeContext());

    expect(agent.runCallCount).toBe(2);
  });

  it('should use the provided logger from context', async () => {
    const logger = createSilentLogger();
    const debugSpy = vi.spyOn(logger, 'debug');
    const agent = new SuccessAgent();

    await agent.execute(makeContext({ logger }));

    // debug should have been called at least for "Starting agent" and "completed"
    expect(debugSpy).toHaveBeenCalled();
  });

  it('should log error when run() throws', async () => {
    const logger = createSilentLogger();
    const errorSpy = vi.spyOn(logger, 'error');
    const agent = new FailingAgent();

    await agent.execute(makeContext({ logger }));

    expect(errorSpy).toHaveBeenCalled();
  });
});
