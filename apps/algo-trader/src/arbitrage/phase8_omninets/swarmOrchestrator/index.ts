/**
 * Swarm Orchestrator — barrel exports and main entry point.
 * Module 2 of Phase 8 OmniNet Genesis.
 *
 * Starts a local agent swarm connected via gossip protocol,
 * with chaos testing and BFT consensus. All disabled by default.
 */

import { EventEmitter } from 'events';
import { AgentNode } from './agent-node';
import { GossipProtocol } from './gossip-protocol';
import { TaskDistributor } from './task-distributor';
import { ChaosMonkey } from './chaos-monkey';
import { ConsensusEngine } from './consensus-engine';

export { AgentNode } from './agent-node';
export type { AgentState, AgentNodeConfig } from './agent-node';

export { GossipProtocol } from './gossip-protocol';
export type { GossipMessage, GossipProtocolConfig } from './gossip-protocol';

export { TaskDistributor } from './task-distributor';
export type { ArbOpportunity, SubTask, TaskDistributorConfig } from './task-distributor';

export { ChaosMonkey } from './chaos-monkey';
export type { ChaosEvent, ChaosMonkeyConfig } from './chaos-monkey';

export { ConsensusEngine } from './consensus-engine';
export type { ConsensusResult, ConsensusSignal, ConsensusEngineConfig } from './consensus-engine';

export interface SwarmOrchestratorConfig {
  enabled: boolean;
  numAgents: number;
  gossipPort: number;
  chaosMonkeyEnabled: boolean;
  consensusThreshold: number;
  tickIntervalMs: number;
  consensusIntervalMs: number;
}

const DEFAULT_CONFIG: SwarmOrchestratorConfig = {
  enabled: false,
  numAgents: 5,
  gossipPort: 9000,
  chaosMonkeyEnabled: true,
  consensusThreshold: 0.67,
  tickIntervalMs: 500,
  consensusIntervalMs: 2_000,
};

export class SwarmOrchestrator extends EventEmitter {
  private readonly cfg: SwarmOrchestratorConfig;
  readonly agents: AgentNode[] = [];
  readonly gossip: GossipProtocol;
  readonly distributor: TaskDistributor;
  readonly chaosMonkey: ChaosMonkey;
  readonly consensus: ConsensusEngine;
  private consensusTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config: Partial<SwarmOrchestratorConfig> = {}) {
    super();
    this.cfg = { ...DEFAULT_CONFIG, ...config };

    this.gossip = new GossipProtocol();
    this.distributor = new TaskDistributor();
    this.chaosMonkey = new ChaosMonkey({ enabled: this.cfg.chaosMonkeyEnabled });
    this.consensus = new ConsensusEngine({ threshold: this.cfg.consensusThreshold });
  }

  async start(): Promise<void> {
    if (!this.cfg.enabled) {
      this.emit('disabled');
      return;
    }

    // Spawn agents
    for (let i = 0; i < this.cfg.numAgents; i++) {
      const agent = new AgentNode({
        agentId: `agent-${i}`,
        tickIntervalMs: this.cfg.tickIntervalMs,
      });

      // Wire gossip
      this.gossip.register(agent.agentId, (msg) => agent.applyGossip(msg.state));
      agent.on('state:updated', (state) => this.gossip.broadcast(agent.agentId, state));
      agent.on('killed', ({ agentId }) => {
        this.gossip.unregister(agentId);
        this.distributor.updateAgents(this.aliveAgentIds());
        this.emit('agent:killed', { agentId });
      });

      this.agents.push(agent);
      agent.start();
    }

    this.distributor.updateAgents(this.aliveAgentIds());

    // Start chaos
    this.chaosMonkey.attach(this.agents, this.gossip);
    this.chaosMonkey.start();

    // Periodic consensus
    this.consensusTimer = setInterval(() => this.runConsensus(), this.cfg.consensusIntervalMs);

    this.emit('started', { numAgents: this.cfg.numAgents });
  }

  stop(): void {
    for (const agent of this.agents) agent.stop();
    this.chaosMonkey.stop();
    if (this.consensusTimer) {
      clearInterval(this.consensusTimer);
      this.consensusTimer = null;
    }
    this.emit('stopped');
  }

  private runConsensus(): void {
    const states = this.agents.filter((a) => a.isAlive()).map((a) => a.getState());
    const result = this.consensus.decide(states);
    this.emit('consensus:result', result);
  }

  private aliveAgentIds(): string[] {
    return this.agents.filter((a) => a.isAlive()).map((a) => a.agentId);
  }

  getAliveCount(): number {
    return this.agents.filter((a) => a.isAlive()).length;
  }
}
