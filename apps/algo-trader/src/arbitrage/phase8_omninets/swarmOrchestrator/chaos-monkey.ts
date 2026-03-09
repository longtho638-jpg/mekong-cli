/**
 * Chaos Monkey — randomly kills agents, drops gossip messages,
 * and introduces artificial latency to test swarm resilience.
 */

import { EventEmitter } from 'events';
import type { AgentNode } from './agent-node';
import type { GossipProtocol } from './gossip-protocol';

export interface ChaosEvent {
  type: 'agent-killed' | 'latency-injected' | 'config-updated';
  targetId?: string;
  value?: number;
  timestamp: number;
}

export interface ChaosMonkeyConfig {
  enabled: boolean;
  /** Probability per interval that an agent is killed. */
  killProbability: number;
  /** Probability per interval that gossip drop rate spikes. */
  dropRateProbability: number;
  /** Spike drop rate value when triggered. */
  dropRateSpike: number;
  /** How long (ms) the drop rate spike lasts. */
  spikeDurationMs: number;
  /** How often (ms) chaos events are evaluated. */
  intervalMs: number;
}

const DEFAULT_CONFIG: ChaosMonkeyConfig = {
  enabled: true,
  killProbability: 0.1,
  dropRateProbability: 0.15,
  dropRateSpike: 0.5,
  spikeDurationMs: 2_000,
  intervalMs: 1_000,
};

export class ChaosMonkey extends EventEmitter {
  private readonly cfg: ChaosMonkeyConfig;
  private agents: AgentNode[] = [];
  private gossip: GossipProtocol | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private eventLog: ChaosEvent[] = [];

  constructor(config: Partial<ChaosMonkeyConfig> = {}) {
    super();
    this.cfg = { ...DEFAULT_CONFIG, ...config };
  }

  /** Provide the agent pool and gossip bus to act upon. */
  attach(agents: AgentNode[], gossip: GossipProtocol): void {
    this.agents = agents;
    this.gossip = gossip;
  }

  start(): void {
    if (!this.cfg.enabled || this.timer) return;
    this.timer = setInterval(() => this.runChaos(), this.cfg.intervalMs);
    this.emit('started');
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.emit('stopped');
  }

  getEventLog(): ChaosEvent[] {
    return [...this.eventLog];
  }

  private runChaos(): void {
    this.maybeKillAgent();
    this.maybeSpikeDrop();
  }

  private maybeKillAgent(): void {
    if (Math.random() >= this.cfg.killProbability) return;
    const alive = this.agents.filter((a) => a.isAlive());
    if (alive.length === 0) return;

    const target = alive[Math.floor(Math.random() * alive.length)];
    target.kill();

    const ev: ChaosEvent = {
      type: 'agent-killed',
      targetId: target.agentId,
      timestamp: Date.now(),
    };
    this.eventLog.push(ev);
    this.emit('chaos:event', ev);
  }

  private maybeSpikeDrop(): void {
    if (!this.gossip) return;
    if (Math.random() >= this.cfg.dropRateProbability) return;

    // Inject high drop-rate by overriding the gossip config temporarily
    // We emit an event; the index loop can react to it
    const ev: ChaosEvent = {
      type: 'latency-injected',
      value: this.cfg.dropRateSpike,
      timestamp: Date.now(),
    };
    this.eventLog.push(ev);
    this.emit('chaos:event', ev);

    // Restore after spike duration (single timeout, no loop)
    setTimeout(() => {
      const restore: ChaosEvent = {
        type: 'config-updated',
        value: 0,
        timestamp: Date.now(),
      };
      this.eventLog.push(restore);
      this.emit('chaos:event', restore);
    }, this.cfg.spikeDurationMs);
  }
}
