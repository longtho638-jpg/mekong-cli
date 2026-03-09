/**
 * Gossip Protocol — in-memory P2P broadcast for swarm state sync.
 * Uses Last-Write-Wins CRDT (per agentId, higher timestamp wins).
 * In production: replace with libp2p gossipsub or NATS.
 */

import { EventEmitter } from 'events';
import type { AgentState } from './agent-node';

export interface GossipMessage {
  from: string;
  state: AgentState;
  hopCount: number;
  messageId: string;
}

export interface GossipProtocolConfig {
  /** Max hops before message is dropped (TTL). */
  maxHops: number;
  /** Probability 0..1 that a message is dropped (simulates packet loss). */
  dropRate: number;
  /** Extra latency in ms added per hop (simulates network delay). */
  hopLatencyMs: number;
}

const DEFAULT_CONFIG: GossipProtocolConfig = {
  maxHops: 3,
  dropRate: 0,
  hopLatencyMs: 0,
};

/** CRDT store: agentId → latest AgentState by timestamp. */
type CrdtStore = Map<string, AgentState>;

export class GossipProtocol extends EventEmitter {
  private readonly cfg: GossipProtocolConfig;
  /** Registered peer handlers: agentId → receive callback. */
  private readonly peers = new Map<string, (msg: GossipMessage) => void>();
  /** Global CRDT state visible to all nodes on this in-process bus. */
  private readonly crdt: CrdtStore = new Map();
  private messageCount = 0;
  private droppedCount = 0;

  constructor(config: Partial<GossipProtocolConfig> = {}) {
    super();
    this.cfg = { ...DEFAULT_CONFIG, ...config };
  }

  /** Register a peer agent so it receives gossip messages. */
  register(agentId: string, handler: (msg: GossipMessage) => void): void {
    this.peers.set(agentId, handler);
  }

  unregister(agentId: string): void {
    this.peers.delete(agentId);
  }

  /**
   * Broadcast a state update from `fromAgent` to all other peers.
   * Applies CRDT merge locally, then fans out to registered peers.
   */
  broadcast(fromAgent: string, state: AgentState): void {
    this.mergeCrdt(state);

    const msg: GossipMessage = {
      from: fromAgent,
      state,
      hopCount: 0,
      messageId: `${fromAgent}-${state.timestamp}-${Math.random().toString(36).slice(2)}`,
    };

    this.fanOut(fromAgent, msg);
  }

  /** Merge a received message, forwarding if TTL allows. */
  receive(recipientId: string, msg: GossipMessage): void {
    if (msg.hopCount >= this.cfg.maxHops) return;
    if (Math.random() < this.cfg.dropRate) {
      this.droppedCount++;
      this.emit('message:dropped', { recipientId, messageId: msg.messageId });
      return;
    }

    this.mergeCrdt(msg.state);
    this.emit('message:received', { recipientId, msg });

    // Re-broadcast with incremented hop count (epidemic spread)
    const forwarded: GossipMessage = { ...msg, hopCount: msg.hopCount + 1 };
    this.fanOut(recipientId, forwarded);
  }

  /** Get merged CRDT view of all known agent states. */
  getGlobalState(): AgentState[] {
    return Array.from(this.crdt.values());
  }

  getStats(): { messageCount: number; droppedCount: number; peerCount: number } {
    return {
      messageCount: this.messageCount,
      droppedCount: this.droppedCount,
      peerCount: this.peers.size,
    };
  }

  private mergeCrdt(state: AgentState): void {
    const existing = this.crdt.get(state.agentId);
    if (!existing || state.timestamp > existing.timestamp) {
      this.crdt.set(state.agentId, state);
    }
  }

  private fanOut(excludeId: string, msg: GossipMessage): void {
    for (const [peerId, handler] of this.peers) {
      if (peerId === excludeId) continue;
      this.messageCount++;
      if (this.cfg.hopLatencyMs > 0) {
        setTimeout(() => handler(msg), this.cfg.hopLatencyMs);
      } else {
        handler(msg);
      }
    }
  }
}
