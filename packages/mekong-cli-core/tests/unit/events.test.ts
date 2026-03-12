import { describe, it, expect, vi, afterEach } from 'vitest';
import { emit, on, once, off, removeAllListeners } from '../../src/core/events.js';

afterEach(() => {
  removeAllListeners();
});

describe('event bus', () => {
  it('emits and receives events', () => {
    const handler = vi.fn();
    on('engine:started', handler);
    emit('engine:started', { time: Date.now() });
    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith({ time: expect.any(Number) });
  });

  it('once fires only once', () => {
    const handler = vi.fn();
    once('task:created', handler);
    emit('task:created');
    emit('task:created');
    expect(handler).toHaveBeenCalledOnce();
  });

  it('off removes listener', () => {
    const handler = vi.fn();
    on('budget:warning', handler);
    off('budget:warning', handler);
    emit('budget:warning');
    expect(handler).not.toHaveBeenCalled();
  });

  it('multiple listeners receive same event', () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    on('task:completed', h1);
    on('task:completed', h2);
    emit('task:completed', { id: '123' });
    expect(h1).toHaveBeenCalledWith({ id: '123' });
    expect(h2).toHaveBeenCalledWith({ id: '123' });
  });

  it('removeAllListeners clears specific event', () => {
    const handler = vi.fn();
    on('agent:failed', handler);
    removeAllListeners('agent:failed');
    emit('agent:failed');
    expect(handler).not.toHaveBeenCalled();
  });

  it('emit without data calls handler with undefined', () => {
    const handler = vi.fn();
    on('engine:stopped', handler);
    emit('engine:stopped');
    expect(handler).toHaveBeenCalledWith(undefined);
  });
});
