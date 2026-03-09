/**
 * Agent Node — single swarm agent running a lightweight strategy.
 * Communicates state via gossip protocol. Each node has an ID,
 * a local market view, and emits signals for the consensus engine.
 */

import { EventEmitter } from 'events';

export interface AgentState {
  agentId: string;
  timestamp: number;
  signal: 'buy' | 'sell' | 'hold';
  confidence: number; // 0..1
  midPrice: number;
  spread: number;
}

export interface AgentNodeConfig {
  agentId: string;
  /** Tick interval in ms for strategy evaluation. */
  tickIntervalMs: number;
  /** Spread threshold to trigger buy/sell signal. */
  spreadThresholdBps: number;
  dryRun: boolean;
}

const DEFAULT_CONFIG: AgentNodeConfig = {
  agentId: 'agent-0',
  tickIntervalMs: 500,
  spreadThresholdBps: 10,
  dryRun: true,
};

export class AgentNode extends EventEmitter {
  readonly agentId: string;
  private readonly cfg: AgentNodeConfig;
  private alive = false;
  private tickCount = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private currentState: AgentState;

  constructor(config: Partial<AgentNodeConfig> = {}) {
    super();
    this.cfg = { ...DEFAULT_CONFIG, ...config };
    this.agentId = this.cfg.agentId;
    this.currentState = this.makeInitialState();
  }

  private makeInitialState(): AgentState {
    return {
      agentId: this.agentId,
      timestamp: Date.now(),
      signal: 'hold',
      confidence: 0,
      midPrice: 50_000,
      spread: 5,
    };
  }

  start(): void {
    if (this.alive) return;
    this.alive = true;
    this.timer = setInterval(() => this.tick(), this.cfg.tickIntervalMs);
    this.emit('started', { agentId: this.agentId });
  }

  stop(): void {
    if (!this.alive) return;
    this.alive = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.emit('stopped', { agentId: this.agentId });
  }

  /** Kill this agent (used by ChaosMonkey). */
  kill(): void {
    this.stop();
    this.emit('killed', { agentId: this.agentId });
  }

  isAlive(): boolean {
    return this.alive;
  }

  getState(): AgentState {
    return { ...this.currentState };
  }

  /** Accept external market data update (from gossip). */
  applyGossip(state: AgentState): void {
    // Simple CRDT: take state with higher confidence if newer
    if (state.timestamp > this.currentState.timestamp) {
      this.currentState = { ...this.currentState, midPrice: state.midPrice, spread: state.spread };
    }
  }

  getTickCount(): number {
    return this.tickCount;
  }

  private tick(): void {
    if (!this.alive) return;
    this.tickCount++;

    // Lightweight strategy: spread-based mean-reversion signal
    const spread = 2 + Math.random() * 20;
    const midPrice = this.currentState.midPrice * (1 + (Math.random() - 0.5) * 0.001);
    const spreadBps = (spread / midPrice) * 10_000;

    let signal: AgentState['signal'] = 'hold';
    let confidence = 0;

    if (spreadBps > this.cfg.spreadThresholdBps) {
      signal = Math.random() > 0.5 ? 'buy' : 'sell';
      confidence = Math.min(spreadBps / (this.cfg.spreadThresholdBps * 3), 1);
    }

    this.currentState = { agentId: this.agentId, timestamp: Date.now(), signal, confidence, midPrice, spread };
    this.emit('state:updated', this.currentState);
  }
}
