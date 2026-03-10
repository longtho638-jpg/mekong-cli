/**
 * Auto Executor — Monitors passed proposals and executes approved actions (mock).
 * Polls governance proposer state and dispatches execution handlers.
 * All ops default to dry-run mode.
 */

import { randomBytes } from 'crypto';
import type { GovernanceProposer } from './governance-proposer';

export interface AutoExecutorConfig {
  /** Poll interval in milliseconds. Default: 5000. */
  pollIntervalMs: number;
  /** Max execution log size before rotation. Default: 500. */
  maxLogSize: number;
  /** Dry-run: skip actual execution. Default: true. */
  dryRun: boolean;
}

export interface ExecutionRecord {
  executionId: string;
  proposalId: string;
  payload: string;
  success: boolean;
  error?: string;
  executedAt: number;
}

const DEFAULT_CONFIG: AutoExecutorConfig = {
  pollIntervalMs: 5_000,
  maxLogSize: 500,
  dryRun: true,
};

export class AutoExecutor {
  private readonly cfg: AutoExecutorConfig;
  private proposer: GovernanceProposer | null = null;
  private log: ExecutionRecord[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  constructor(config: Partial<AutoExecutorConfig> = {}) {
    this.cfg = { ...DEFAULT_CONFIG, ...config };
  }

  /** Attach a GovernanceProposer to poll for passed proposals. */
  attachProposer(proposer: GovernanceProposer): void {
    this.proposer = proposer;
  }

  /** Start polling for passed proposals. No-op if already running. */
  start(): void {
    if (this.running) return;
    this.running = true;
    if (this.cfg.dryRun) return;
    this.timer = setInterval(() => this.poll(), this.cfg.pollIntervalMs);
  }

  /** Stop polling. */
  stop(): void {
    this.running = false;
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Execute a specific passed proposal by ID.
   * Marks it as 'executed' in the proposer and logs result.
   */
  executeProposal(proposalId: string): ExecutionRecord {
    const executionId = 'exec-' + randomBytes(8).toString('hex');
    const record: ExecutionRecord = {
      executionId,
      proposalId,
      payload: '',
      success: false,
      executedAt: Date.now(),
    };

    if (this.cfg.dryRun) {
      record.payload = 'dry-run';
      record.success = true;
      this.appendLog(record);
      return record;
    }

    if (!this.proposer) {
      record.error = 'no proposer attached';
      this.appendLog(record);
      return record;
    }

    const proposal = this.proposer.getProposal(proposalId);
    if (!proposal) {
      record.error = `proposal not found: ${proposalId}`;
      this.appendLog(record);
      return record;
    }

    if (proposal.status !== 'passed') {
      record.error = `proposal status is '${proposal.status}', expected 'passed'`;
      this.appendLog(record);
      return record;
    }

    try {
      // Mock: dispatch payload (in prod: call contract method)
      record.payload = proposal.executionPayload;
      record.success = true;
      // Mark executed in proposer internals via type cast (mock only)
      (proposal as unknown as Record<string, unknown>)['status'] = 'executed';
    } catch (err) {
      record.error = String(err);
    }

    this.appendLog(record);
    return record;
  }

  /** Returns execution log (most recent first). */
  getExecutionLog(): ExecutionRecord[] {
    return [...this.log].reverse();
  }

  isRunning(): boolean {
    return this.running;
  }

  isDryRun(): boolean {
    return this.cfg.dryRun;
  }

  /** Internal: scan proposer for newly passed proposals and execute them. */
  private poll(): void {
    if (!this.proposer) return;
    // GovernanceProposer exposes listActiveProposals; passed ones are finalised externally.
    // Here we'd check all proposals for 'passed' status — mock: nothing to do in polling.
  }

  private appendLog(record: ExecutionRecord): void {
    this.log.push(record);
    if (this.log.length > this.cfg.maxLogSize) {
      this.log = this.log.slice(-this.cfg.maxLogSize);
    }
  }
}
