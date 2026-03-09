/**
 * Tests: chaos-monkey.ts — agent kill and recovery.
 */

import { ChaosMonkey } from '../../../src/arbitrage/phase8_omninets/swarmOrchestrator/chaos-monkey';
import { AgentNode } from '../../../src/arbitrage/phase8_omninets/swarmOrchestrator/agent-node';
import { GossipProtocol } from '../../../src/arbitrage/phase8_omninets/swarmOrchestrator/gossip-protocol';

function makeAgents(n: number): AgentNode[] {
  return Array.from({ length: n }, (_, i) => {
    const a = new AgentNode({ agentId: `agent-${i}`, tickIntervalMs: 10_000 });
    a.start();
    return a;
  });
}

describe('ChaosMonkey', () => {
  afterEach(() => {
    // Ensure no leaked timers
  });

  it('does not start when disabled', () => {
    const monkey = new ChaosMonkey({ enabled: false });
    const agents = makeAgents(3);
    const gossip = new GossipProtocol();
    monkey.attach(agents, gossip);
    monkey.start();
    expect(monkey.getEventLog()).toHaveLength(0);
    agents.forEach((a) => a.stop());
  });

  it('kills an agent when killProbability=1', () => {
    const monkey = new ChaosMonkey({ enabled: true, killProbability: 1, dropRateProbability: 0, intervalMs: 50 });
    const agents = makeAgents(3);
    const gossip = new GossipProtocol();
    monkey.attach(agents, gossip);

    return new Promise<void>((resolve) => {
      monkey.on('chaos:event', (ev) => {
        if (ev.type === 'agent-killed') {
          monkey.stop();
          agents.forEach((a) => a.stop());
          resolve();
        }
      });
      monkey.start();
    });
  });

  it('emits chaos:event on kill', () => {
    const monkey = new ChaosMonkey({ enabled: true, killProbability: 1, dropRateProbability: 0, intervalMs: 50 });
    const agents = makeAgents(2);
    monkey.attach(agents, new GossipProtocol());

    return new Promise<void>((resolve) => {
      monkey.on('chaos:event', () => {
        monkey.stop();
        agents.forEach((a) => a.stop());
        resolve();
      });
      monkey.start();
    });
  });

  it('records kill events in event log', () => {
    const monkey = new ChaosMonkey({ enabled: true, killProbability: 1, dropRateProbability: 0, intervalMs: 50 });
    const agents = makeAgents(2);
    monkey.attach(agents, new GossipProtocol());

    return new Promise<void>((resolve) => {
      monkey.on('chaos:event', () => {
        monkey.stop();
        agents.forEach((a) => a.stop());
        expect(monkey.getEventLog().length).toBeGreaterThan(0);
        resolve();
      });
      monkey.start();
    });
  });

  it('does not kill when no agents are alive', () => {
    const monkey = new ChaosMonkey({ enabled: true, killProbability: 1, dropRateProbability: 0, intervalMs: 50 });
    const agents = makeAgents(2);
    agents.forEach((a) => a.kill()); // pre-kill all
    monkey.attach(agents, new GossipProtocol());

    return new Promise<void>((resolve) => {
      // Run for 150ms — no kill events should be logged
      monkey.start();
      setTimeout(() => {
        monkey.stop();
        const killEvents = monkey.getEventLog().filter((e) => e.type === 'agent-killed');
        expect(killEvents).toHaveLength(0);
        resolve();
      }, 150);
    });
  });

  it('emits started and stopped events', () => {
    const monkey = new ChaosMonkey({ enabled: true, killProbability: 0, dropRateProbability: 0, intervalMs: 10_000 });
    monkey.attach([], new GossipProtocol());
    const events: string[] = [];
    monkey.on('started', () => events.push('started'));
    monkey.on('stopped', () => events.push('stopped'));
    monkey.start();
    monkey.stop();
    expect(events).toContain('started');
    expect(events).toContain('stopped');
  });

  it('latency-injected event has a value', () => {
    const monkey = new ChaosMonkey({ enabled: true, killProbability: 0, dropRateProbability: 1, spikeDurationMs: 50, intervalMs: 50 });
    monkey.attach([], new GossipProtocol());

    return new Promise<void>((resolve) => {
      monkey.on('chaos:event', (ev) => {
        if (ev.type === 'latency-injected') {
          expect(typeof ev.value).toBe('number');
          monkey.stop();
          resolve();
        }
      });
      monkey.start();
    });
  });
});
