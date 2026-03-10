/**
 * Tests: task-distributor.ts — consistent hashing and assignment.
 */

import { TaskDistributor } from '../../../src/arbitrage/phase8_omninets/swarmOrchestrator/task-distributor';
import type { ArbOpportunity } from '../../../src/arbitrage/phase8_omninets/swarmOrchestrator/task-distributor';

const makeOpp = (id: string): ArbOpportunity => ({
  id,
  symbol: 'ETH/USDT',
  expectedProfitUsd: 50,
  expiresAt: Date.now() + 5_000,
});

describe('TaskDistributor', () => {
  it('throws if no agents configured', () => {
    const dist = new TaskDistributor({ agentIds: [] });
    expect(() => dist.distribute(makeOpp('opp-1'))).toThrow('No agents available');
  });

  it('distributes opportunity into 4 sub-tasks', () => {
    const dist = new TaskDistributor({ agentIds: ['agent-0', 'agent-1', 'agent-2'] });
    const tasks = dist.distribute(makeOpp('opp-1'));
    expect(tasks).toHaveLength(4);
  });

  it('each task has correct structure', () => {
    const dist = new TaskDistributor({ agentIds: ['agent-0', 'agent-1'] });
    const tasks = dist.distribute(makeOpp('opp-2'));
    for (const task of tasks) {
      expect(task).toHaveProperty('taskId');
      expect(task).toHaveProperty('opportunityId', 'opp-2');
      expect(task).toHaveProperty('type');
      expect(task).toHaveProperty('assignedAgent');
      expect(task).toHaveProperty('createdAt');
    }
  });

  it('all tasks assigned to known agents', () => {
    const agents = ['agent-0', 'agent-1', 'agent-2'];
    const dist = new TaskDistributor({ agentIds: agents });
    const tasks = dist.distribute(makeOpp('opp-3'));
    for (const task of tasks) {
      expect(agents).toContain(task.assignedAgent);
    }
  });

  it('consistent hashing: same opp → same agent assignments', () => {
    const agents = ['agent-0', 'agent-1', 'agent-2'];
    const dist1 = new TaskDistributor({ agentIds: agents });
    const dist2 = new TaskDistributor({ agentIds: agents });
    const tasks1 = dist1.distribute(makeOpp('opp-stable'));
    const tasks2 = dist2.distribute(makeOpp('opp-stable'));
    const agents1 = tasks1.map((t) => t.assignedAgent);
    const agents2 = tasks2.map((t) => t.assignedAgent);
    expect(agents1).toEqual(agents2);
  });

  it('getTasksForAgent returns only that agent tasks', () => {
    const dist = new TaskDistributor({ agentIds: ['agent-0', 'agent-1', 'agent-2'] });
    dist.distribute(makeOpp('opp-4'));
    const tasks = dist.getTasksForAgent('agent-0');
    for (const t of tasks) {
      expect(t.assignedAgent).toBe('agent-0');
    }
  });

  it('updateAgents changes assignment pool', () => {
    const dist = new TaskDistributor({ agentIds: ['agent-0'] });
    dist.updateAgents(['agent-0', 'agent-1', 'agent-2', 'agent-3']);
    const tasks = dist.distribute(makeOpp('opp-5'));
    const agents = ['agent-0', 'agent-1', 'agent-2', 'agent-3'];
    for (const t of tasks) {
      expect(agents).toContain(t.assignedAgent);
    }
  });

  it('getTaskCount accumulates across multiple distributions', () => {
    const dist = new TaskDistributor({ agentIds: ['agent-0', 'agent-1'] });
    dist.distribute(makeOpp('opp-a'));
    dist.distribute(makeOpp('opp-b'));
    expect(dist.getTaskCount()).toBe(8); // 4 sub-tasks * 2 opportunities
  });

  it('getAllTasks returns all distributed tasks', () => {
    const dist = new TaskDistributor({ agentIds: ['agent-0'] });
    dist.distribute(makeOpp('opp-x'));
    expect(dist.getAllTasks()).toHaveLength(4);
  });
});
