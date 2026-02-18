import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'events';
import cp from 'child_process';

// Mock fs to avoid side effects
vi.mock('fs', () => ({
  appendFileSync: vi.fn(),
  default: { appendFileSync: vi.fn() }
}));

// We will use doMock for config in beforeEach to ensure it applies after resetModules

describe('Brain Headless Recovery (Fresh CC CLI Instance)', () => {
  let brainHeadless;
  let spawnSpy;

  beforeEach(async () => {
    vi.resetModules();

    // Use environment variables to control config.js
    // This is more reliable than mocking the module since config.js reads process.env
    vi.stubEnv('MODEL_NAME', 'gemini-3-flash-preview');
    vi.stubEnv('TOM_HUM_LOG', '/dev/null');
    vi.stubEnv('PROXY_PORT', '11436');
    vi.stubEnv('TOM_HUM_ENGINE', 'antigravity');

    // Create a spy on child_process.spawn
    // We must do this BEFORE importing the SUT because the SUT destructures spawn on load
    spawnSpy = vi.spyOn(cp, 'spawn');

    // Import SUT - this will trigger require('child_process') which returns the spied module
    // And it will require('../config') which will read the stubbed env vars
    const mod = await import('../lib/brain-headless-per-mission.js');
    brainHeadless = mod.default || mod;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('should verify mock injection', async () => {
    // Sanity check to ensure we are mocking correctly
    expect(vi.isMockFunction(cp.spawn)).toBe(true);
    expect(spawnSpy.mock).toBeDefined();
  });

  it('should retry with fallback model on HTTP 400 error', async () => {
    let callCount = 0;

    // Setup the mock behavior for this test
    spawnSpy.mockImplementation((cmd, args, opts) => {
      callCount++;
      const child = new EventEmitter();
      child.stdout = new EventEmitter();
      child.stderr = new EventEmitter();
      child.kill = vi.fn();

      setTimeout(() => {
        if (callCount === 1) {
          // First attempt: Fail with 400
          child.stderr.emit('data', 'Error: Request failed with status code 400');
          child.emit('close', 1);
        } else {
          // Second attempt: Success
          child.stdout.emit('data', 'Mission accomplished');
          child.emit('close', 0);
        }
      }, 10);

      return child;
    });

    const result = await brainHeadless.runMission('Test prompt', '/tmp', 1000);

    expect(spawnSpy).toHaveBeenCalledTimes(2);
    expect(result.success).toBe(true);

    const calls = spawnSpy.mock.calls;
    expect(calls.length).toBe(2);
    // First call uses default model
    expect(calls[0][1]).toContain('gemini-3-flash-preview');

    // Second call uses fallback model
    const secondArgs = calls[1][1];
    const modelIndex = secondArgs.indexOf('--model');
    expect(secondArgs[modelIndex + 1]).toBe('claude-sonnet-4-20250514');
  });

  it('should retry with truncated prompt on context overflow', async () => {
    let callCount = 0;
    const longPrompt = 'A'.repeat(10000);

    spawnSpy.mockImplementation((cmd, args, opts) => {
      callCount++;
      const child = new EventEmitter();
      child.stdout = new EventEmitter();
      child.stderr = new EventEmitter();
      child.kill = vi.fn();

      setTimeout(() => {
        if (callCount === 1) {
          // First attempt: Context overflow
          child.stderr.emit('data', 'Error: prompt is too long. context overflow.');
          child.emit('close', 1);
        } else {
          // Second attempt: Success
          child.stdout.emit('data', 'Truncated mission success');
          child.emit('close', 0);
        }
      }, 10);

      return child;
    });

    const result = await brainHeadless.runMission(longPrompt, '/tmp', 1000);

    expect(spawnSpy).toHaveBeenCalledTimes(2);
    expect(result.success).toBe(true);

    const calls = spawnSpy.mock.calls;
    const sentPrompt = calls[1][1][1]; // -p <prompt>
    expect(sentPrompt.length).toBeLessThan(longPrompt.length);
    expect(sentPrompt).toContain('[TRUNCATED');
  });

  it('should NOT retry on unrecoverable error', async () => {
    spawnSpy.mockImplementation((cmd, args, opts) => {
      const child = new EventEmitter();
      child.stdout = new EventEmitter();
      child.stderr = new EventEmitter();
      child.kill = vi.fn();

      setTimeout(() => {
        child.stderr.emit('data', 'SyntaxError: Unexpected token');
        child.emit('close', 1);
      }, 10);

      return child;
    });

    const result = await brainHeadless.runMission('Test prompt', '/tmp', 1000);

    expect(spawnSpy).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(false);
    expect(result.result).toBe('exit_1');
  });
});
