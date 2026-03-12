/**
 * Advanced Scheduler — manages recurring/periodic tasks with cron, event, and condition triggers.
 * Upgrades v0.1.0 simple interval-based heartbeat while maintaining backward compat.
 */
import { CronJob } from 'cron';
import { emit, on, type MekongEvent } from './events.js';

/** Trigger definitions — interval kept for backward compat */
export type ScheduledTrigger =
  | { type: 'cron'; expression: string }
  | { type: 'interval'; minutes: number }
  | { type: 'event'; eventName: MekongEvent; filter?: Record<string, unknown> }
  | { type: 'condition'; check: () => boolean; intervalMinutes: number };

/** Action definitions */
export type ScheduledAction =
  | { type: 'function'; handler: () => Promise<void> }
  | { type: 'notify'; message: string; channel?: string };

/** Legacy interface kept for backward compat */
export interface ScheduledTask {
  id: string;
  name: string;
  intervalMs: number;
  handler: () => Promise<void>;
}

/** Rich task definition with advanced triggers */
export interface RichScheduledTask {
  id: string;
  name: string;
  trigger: ScheduledTrigger;
  action: ScheduledAction;
  enabled: boolean;
  runCount: number;
  failCount: number;
  lastRun?: Date;
  nextRun?: Date;
}

/** Internal storage for all task types */
interface TaskEntry {
  task: RichScheduledTask;
  cronJob?: CronJob;
  intervalTimer?: ReturnType<typeof setInterval>;
}

export class Scheduler {
  private tasks: Map<string, TaskEntry> = new Map();

  // ─── Legacy interval API (backward compat) ──────────────────────────────

  /** Schedule a legacy interval-based task (v0.1.0 API) */
  schedule(task: ScheduledTask): void {
    this.scheduleRich({
      id: task.id,
      name: task.name,
      trigger: { type: 'interval', minutes: task.intervalMs / 60_000 },
      action: { type: 'function', handler: task.handler },
      enabled: true,
      runCount: 0,
      failCount: 0,
    });
  }

  /** Cancel a scheduled task */
  cancel(id: string): boolean {
    const entry = this.tasks.get(id);
    if (!entry) return false;
    this._stopEntry(entry);
    this.tasks.delete(id);
    return true;
  }

  /** Cancel all scheduled tasks */
  cancelAll(): void {
    for (const [id] of this.tasks) this.cancel(id);
  }

  /** List active task definitions (legacy format) */
  list(): ScheduledTask[] {
    return Array.from(this.tasks.values())
      .filter(e => e.task.trigger.type === 'interval' || e.task.trigger.type === 'cron')
      .map(e => ({
        id: e.task.id,
        name: e.task.name,
        intervalMs: e.task.trigger.type === 'interval'
          ? e.task.trigger.minutes * 60_000
          : 0,
        handler: e.task.action.type === 'function'
          ? e.task.action.handler
          : async () => { emit('task:completed', { id: e.task.id }); },
      }));
  }

  get size(): number {
    return this.tasks.size;
  }

  // ─── Advanced API ────────────────────────────────────────────────────────

  /** Schedule a rich task with any trigger type */
  scheduleRich(task: RichScheduledTask): void {
    if (this.tasks.has(task.id)) this.cancel(task.id);
    if (!task.enabled) {
      this.tasks.set(task.id, { task });
      return;
    }

    const entry: TaskEntry = { task };

    if (task.trigger.type === 'cron') {
      entry.cronJob = this._startCronJob(task, task.trigger.expression);
    } else if (task.trigger.type === 'interval') {
      entry.intervalTimer = this._startInterval(task, task.trigger.minutes * 60_000);
    } else if (task.trigger.type === 'event') {
      // Event triggers are subscribed via the event bus; no timer needed
      on(task.trigger.eventName, (data?: unknown) => {
        if (task.trigger.type !== 'event') return;
        if (task.trigger.filter && !this._matchFilter(data, task.trigger.filter)) return;
        void this._runTask(task);
      });
    } else if (task.trigger.type === 'condition') {
      const intervalMs = task.trigger.intervalMinutes * 60_000;
      entry.intervalTimer = setInterval(() => {
        if (task.trigger.type !== 'condition') return;
        if (task.trigger.check()) void this._runTask(task);
      }, intervalMs);
    }

    this.tasks.set(task.id, entry);
  }

  /** Get a rich task by id */
  getTask(id: string): RichScheduledTask | undefined {
    return this.tasks.get(id)?.task;
  }

  /** List all rich tasks */
  listRich(): RichScheduledTask[] {
    return Array.from(this.tasks.values()).map(e => e.task);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private _startCronJob(task: RichScheduledTask, expression: string): CronJob {
    const job = CronJob.from({
      cronTime: expression,
      onTick: async () => { await this._runTask(task); },
      start: true,
    });
    task.nextRun = job.nextDate().toJSDate();
    return job;
  }

  private _startInterval(task: RichScheduledTask, ms: number): ReturnType<typeof setInterval> {
    task.nextRun = new Date(Date.now() + ms);
    return setInterval(async () => {
      await this._runTask(task);
      task.nextRun = new Date(Date.now() + ms);
    }, ms);
  }

  private async _runTask(task: RichScheduledTask): Promise<void> {
    task.lastRun = new Date();
    task.runCount++;
    try {
      if (task.action.type === 'function') {
        await task.action.handler();
      } else if (task.action.type === 'notify') {
        emit('task:completed', { id: task.id, message: task.action.message });
      }
    } catch (error) {
      task.failCount++;
      emit('engine:stopped', { error: String(error), taskId: task.id });
    }
  }

  private _stopEntry(entry: TaskEntry): void {
    if (entry.cronJob) entry.cronJob.stop();
    if (entry.intervalTimer) clearInterval(entry.intervalTimer);
  }

  private _matchFilter(data: unknown, filter: Record<string, unknown>): boolean {
    if (!data || typeof data !== 'object') return false;
    const d = data as Record<string, unknown>;
    return Object.entries(filter).every(([k, v]) => d[k] === v);
  }
}

// ─── Cron expression validation helper ───────────────────────────────────────

/** Validate a cron expression. Returns true if valid, false otherwise. */
export function isValidCronExpression(expr: string): boolean {
  try {
    // validateCronExpression is too permissive; CronJob.from actually parses fully
    CronJob.from({ cronTime: expr, onTick: () => { /* noop */ }, start: false });
    return true;
  } catch {
    return false;
  }
}
