/**
 * Tests for the advanced Scheduler (v0.3 upgrade).
 * Covers legacy interval API, cron, event, condition triggers.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Scheduler, isValidCronExpression, type RichScheduledTask } from './scheduler.js';
import { eventBus } from './events.js';

// Use fake timers so interval/timeout based tasks are controllable
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  eventBus.removeAllListeners();
});

// ─── Legacy API ──────────────────────────────────────────────────────────────

describe('Legacy interval API (backward compat)', () => {
  it('schedules and runs interval task', async () => {
    const scheduler = new Scheduler();
    const handler = vi.fn().mockResolvedValue(undefined);

    scheduler.schedule({ id: 'hb', name: 'Heartbeat', intervalMs: 60_000, handler });
    expect(scheduler.size).toBe(1);

    await vi.advanceTimersByTimeAsync(60_000);
    expect(handler).toHaveBeenCalledTimes(1);

    scheduler.cancelAll();
  });

  it('cancel() removes task and stops timer', async () => {
    const scheduler = new Scheduler();
    const handler = vi.fn().mockResolvedValue(undefined);

    scheduler.schedule({ id: 'task1', name: 'T1', intervalMs: 30_000, handler });
    scheduler.cancel('task1');
    expect(scheduler.size).toBe(0);

    await vi.advanceTimersByTimeAsync(60_000);
    expect(handler).not.toHaveBeenCalled();
  });

  it('cancel() returns false for unknown id', () => {
    const scheduler = new Scheduler();
    expect(scheduler.cancel('nonexistent')).toBe(false);
  });

  it('cancelAll() clears all tasks', () => {
    const scheduler = new Scheduler();
    const noop = vi.fn().mockResolvedValue(undefined);

    scheduler.schedule({ id: 'a', name: 'A', intervalMs: 1000, handler: noop });
    scheduler.schedule({ id: 'b', name: 'B', intervalMs: 2000, handler: noop });
    expect(scheduler.size).toBe(2);

    scheduler.cancelAll();
    expect(scheduler.size).toBe(0);
  });

  it('list() returns legacy task format', () => {
    const scheduler = new Scheduler();
    const noop = vi.fn().mockResolvedValue(undefined);

    scheduler.schedule({ id: 'hb', name: 'Heartbeat', intervalMs: 60_000, handler: noop });
    const tasks = scheduler.list();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe('hb');
    expect(tasks[0].intervalMs).toBe(60_000);

    scheduler.cancelAll();
  });

  it('re-scheduling same id replaces old task', async () => {
    const scheduler = new Scheduler();
    const handler1 = vi.fn().mockResolvedValue(undefined);
    const handler2 = vi.fn().mockResolvedValue(undefined);

    scheduler.schedule({ id: 'same', name: 'S', intervalMs: 1000, handler: handler1 });
    scheduler.schedule({ id: 'same', name: 'S', intervalMs: 1000, handler: handler2 });
    expect(scheduler.size).toBe(1);

    await vi.advanceTimersByTimeAsync(1000);
    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).toHaveBeenCalledTimes(1);

    scheduler.cancelAll();
  });

  it('handler errors do not crash scheduler', async () => {
    const scheduler = new Scheduler();
    const handler = vi.fn().mockRejectedValue(new Error('boom'));

    scheduler.schedule({ id: 'err', name: 'Err', intervalMs: 1000, handler });
    await expect(vi.advanceTimersByTimeAsync(1000)).resolves.not.toThrow();

    scheduler.cancelAll();
  });
});

// ─── Rich task API — interval trigger ────────────────────────────────────────

describe('RichScheduledTask — interval trigger', () => {
  it('runs handler on interval', async () => {
    const scheduler = new Scheduler();
    const handler = vi.fn().mockResolvedValue(undefined);

    const task: RichScheduledTask = {
      id: 'rich-interval',
      name: 'Rich Interval',
      trigger: { type: 'interval', minutes: 1 },
      action: { type: 'function', handler },
      enabled: true,
      runCount: 0,
      failCount: 0,
    };

    scheduler.scheduleRich(task);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(task.runCount).toBe(1);
    expect(task.lastRun).toBeInstanceOf(Date);

    scheduler.cancelAll();
  });

  it('disabled task is registered but never runs', async () => {
    const scheduler = new Scheduler();
    const handler = vi.fn().mockResolvedValue(undefined);

    scheduler.scheduleRich({
      id: 'disabled',
      name: 'Disabled',
      trigger: { type: 'interval', minutes: 1 },
      action: { type: 'function', handler },
      enabled: false,
      runCount: 0,
      failCount: 0,
    });

    expect(scheduler.size).toBe(1);
    await vi.advanceTimersByTimeAsync(120_000);
    expect(handler).not.toHaveBeenCalled();

    scheduler.cancelAll();
  });

  it('tracks failCount on error', async () => {
    const scheduler = new Scheduler();
    const handler = vi.fn().mockRejectedValue(new Error('fail'));

    const task: RichScheduledTask = {
      id: 'failing',
      name: 'Failing',
      trigger: { type: 'interval', minutes: 1 },
      action: { type: 'function', handler },
      enabled: true,
      runCount: 0,
      failCount: 0,
    };

    scheduler.scheduleRich(task);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(task.failCount).toBe(1);

    scheduler.cancelAll();
  });
});

// ─── Rich task API — event trigger ───────────────────────────────────────────

describe('RichScheduledTask — event trigger', () => {
  it('fires when target event emitted', async () => {
    const scheduler = new Scheduler();
    const handler = vi.fn().mockResolvedValue(undefined);

    scheduler.scheduleRich({
      id: 'on-sop-failed',
      name: 'React to sop:failed',
      trigger: { type: 'event', eventName: 'sop:failed' },
      action: { type: 'function', handler },
      enabled: true,
      runCount: 0,
      failCount: 0,
    });

    eventBus.emit('sop:failed', { sopId: 'abc' });
    // Allow microtasks to flush
    await Promise.resolve();

    expect(handler).toHaveBeenCalledTimes(1);

    scheduler.cancelAll();
  });

  it('filter: only fires when filter matches', async () => {
    const scheduler = new Scheduler();
    const handler = vi.fn().mockResolvedValue(undefined);

    scheduler.scheduleRich({
      id: 'filtered-event',
      name: 'Filtered',
      trigger: { type: 'event', eventName: 'task:failed', filter: { critical: true } },
      action: { type: 'function', handler },
      enabled: true,
      runCount: 0,
      failCount: 0,
    });

    eventBus.emit('task:failed', { critical: false });
    await Promise.resolve();
    expect(handler).not.toHaveBeenCalled();

    eventBus.emit('task:failed', { critical: true });
    await Promise.resolve();
    expect(handler).toHaveBeenCalledTimes(1);

    scheduler.cancelAll();
  });
});

// ─── Rich task API — condition trigger ───────────────────────────────────────

describe('RichScheduledTask — condition trigger', () => {
  it('fires when condition returns true', async () => {
    const scheduler = new Scheduler();
    const handler = vi.fn().mockResolvedValue(undefined);
    let conditionValue = false;

    scheduler.scheduleRich({
      id: 'cond-task',
      name: 'Condition Task',
      trigger: { type: 'condition', check: () => conditionValue, intervalMinutes: 1 },
      action: { type: 'function', handler },
      enabled: true,
      runCount: 0,
      failCount: 0,
    });

    // Condition false → should not fire
    await vi.advanceTimersByTimeAsync(60_000);
    expect(handler).not.toHaveBeenCalled();

    // Condition true → should fire
    conditionValue = true;
    await vi.advanceTimersByTimeAsync(60_000);
    expect(handler).toHaveBeenCalledTimes(1);

    scheduler.cancelAll();
  });
});

// ─── notify action ───────────────────────────────────────────────────────────

describe('notify action', () => {
  it('emits task:completed event with message', async () => {
    const scheduler = new Scheduler();
    const received: unknown[] = [];

    eventBus.on('task:completed', (data) => received.push(data));

    scheduler.scheduleRich({
      id: 'notify-task',
      name: 'Notify',
      trigger: { type: 'interval', minutes: 1 },
      action: { type: 'notify', message: 'Daily standup reminder' },
      enabled: true,
      runCount: 0,
      failCount: 0,
    });

    await vi.advanceTimersByTimeAsync(60_000);
    expect(received.length).toBe(1);
    expect((received[0] as { message: string }).message).toBe('Daily standup reminder');

    scheduler.cancelAll();
  });
});

// ─── getTask / listRich ───────────────────────────────────────────────────────

describe('getTask and listRich', () => {
  it('getTask returns task by id', () => {
    const scheduler = new Scheduler();
    const handler = vi.fn().mockResolvedValue(undefined);

    scheduler.scheduleRich({
      id: 'lookup',
      name: 'Lookup',
      trigger: { type: 'interval', minutes: 5 },
      action: { type: 'function', handler },
      enabled: true,
      runCount: 0,
      failCount: 0,
    });

    expect(scheduler.getTask('lookup')?.id).toBe('lookup');
    expect(scheduler.getTask('missing')).toBeUndefined();

    scheduler.cancelAll();
  });

  it('listRich returns all registered tasks', () => {
    const scheduler = new Scheduler();
    const noop = vi.fn().mockResolvedValue(undefined);

    scheduler.scheduleRich({
      id: 't1',
      name: 'T1',
      trigger: { type: 'interval', minutes: 1 },
      action: { type: 'function', handler: noop },
      enabled: true,
      runCount: 0,
      failCount: 0,
    });
    scheduler.scheduleRich({
      id: 't2',
      name: 'T2',
      trigger: { type: 'condition', check: () => false, intervalMinutes: 5 },
      action: { type: 'notify', message: 'hi' },
      enabled: true,
      runCount: 0,
      failCount: 0,
    });

    const all = scheduler.listRich();
    expect(all.map(t => t.id).sort()).toEqual(['t1', 't2']);

    scheduler.cancelAll();
  });
});

// ─── isValidCronExpression ────────────────────────────────────────────────────

describe('isValidCronExpression', () => {
  it('accepts valid cron expressions', () => {
    expect(isValidCronExpression('0 9 * * *')).toBe(true);    // 9am daily
    expect(isValidCronExpression('*/30 * * * *')).toBe(true); // every 30 min
    expect(isValidCronExpression('0 8 * * 1')).toBe(true);    // monday 8am
  });

  it('rejects invalid cron expressions', () => {
    expect(isValidCronExpression('not-a-cron')).toBe(false);
    expect(isValidCronExpression('99 99 99 99 99')).toBe(false);
  });
});
