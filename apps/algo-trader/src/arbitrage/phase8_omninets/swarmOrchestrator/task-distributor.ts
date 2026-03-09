/**
 * Task Distributor — breaks arbitrage opportunities into sub-tasks
 * and assigns them to agents via consistent hashing (jump hash).
 */

import { createHash } from 'crypto';
import { EventEmitter } from 'events';

export interface ArbOpportunity {
  id: string;
  symbol: string;
  expectedProfitUsd: number;
  expiresAt: number;
}

export interface SubTask {
  taskId: string;
  opportunityId: string;
  type: 'fetch-quote' | 'validate-margin' | 'submit-order' | 'monitor-fill';
  assignedAgent: string;
  createdAt: number;
}

export interface TaskDistributorConfig {
  /** Ordered list of active agent IDs for consistent hashing. */
  agentIds: string[];
}

/** Jump consistent hash — maps key to bucket in [0, numBuckets). */
function jumpHash(key: string, numBuckets: number): number {
  const keyNum = BigInt('0x' + createHash('md5').update(key).digest('hex').slice(0, 16));
  let b = -1n;
  let j = 0n;
  while (j < BigInt(numBuckets)) {
    b = j;
    // LCG step
    const k = (keyNum * 2862933555777941757n + 1n) & 0xffffffffffffffffn;
    j = BigInt(Math.floor(Number(b + 1n) / (Number((k >> 33n) + 1n) / 2 ** 31)));
  }
  return Number(b);
}

const SUB_TASK_TYPES: SubTask['type'][] = [
  'fetch-quote',
  'validate-margin',
  'submit-order',
  'monitor-fill',
];

export class TaskDistributor extends EventEmitter {
  private cfg: TaskDistributorConfig;
  private assignedTasks: SubTask[] = [];
  private taskCounter = 0;

  constructor(config: Partial<TaskDistributorConfig> = {}) {
    super();
    this.cfg = { agentIds: [], ...config };
  }

  /** Update the active agent ring (called when agents join/leave). */
  updateAgents(agentIds: string[]): void {
    this.cfg = { ...this.cfg, agentIds };
    this.emit('agents:updated', { count: agentIds.length });
  }

  /**
   * Decompose an opportunity into sub-tasks and assign each to an agent
   * using consistent hashing so re-assignment on agent churn is minimal.
   */
  distribute(opportunity: ArbOpportunity): SubTask[] {
    if (this.cfg.agentIds.length === 0) {
      throw new Error('No agents available for task distribution');
    }

    const tasks: SubTask[] = SUB_TASK_TYPES.map((type) => {
      const taskId = `task-${++this.taskCounter}-${type}`;
      const hashKey = `${opportunity.id}:${type}`;
      const bucketIdx = jumpHash(hashKey, this.cfg.agentIds.length);
      const assignedAgent = this.cfg.agentIds[bucketIdx];

      return {
        taskId,
        opportunityId: opportunity.id,
        type,
        assignedAgent,
        createdAt: Date.now(),
      };
    });

    this.assignedTasks.push(...tasks);
    this.emit('tasks:distributed', { opportunityId: opportunity.id, count: tasks.length });
    return tasks;
  }

  /** Return tasks assigned to a specific agent. */
  getTasksForAgent(agentId: string): SubTask[] {
    return this.assignedTasks.filter((t) => t.assignedAgent === agentId);
  }

  getAllTasks(): SubTask[] {
    return [...this.assignedTasks];
  }

  getTaskCount(): number {
    return this.assignedTasks.length;
  }
}
