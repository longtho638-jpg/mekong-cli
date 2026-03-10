/**
 * SignalBroadcaster — publishes MacroState via mock WebSocket channel.
 * Uses EventEmitter subscriber pattern. In production: replace with
 * ws.Server or Socket.IO room broadcast.
 */

import { EventEmitter } from 'events';
import type { MacroState } from './macro-signal-aggregator';

export interface SignalBroadcasterConfig {
  enabled: boolean;
  channel: string;
  /** Max events buffered for late subscribers. */
  replayBufferSize: number;
}

export interface BroadcastEvent {
  channel: string;
  state: MacroState;
  broadcastAt: number;
  sequenceId: number;
}

type SignalSubscriber = (event: BroadcastEvent) => void;

const DEFAULT_CONFIG: SignalBroadcasterConfig = {
  enabled: false,
  channel: 'omso:macro-state',
  replayBufferSize: 10,
};

export class SignalBroadcaster extends EventEmitter {
  private readonly cfg: SignalBroadcasterConfig;
  private readonly subscribers = new Map<string, SignalSubscriber>();
  private readonly replayBuffer: BroadcastEvent[] = [];
  private sequenceId = 0;

  constructor(config: Partial<SignalBroadcasterConfig> = {}) {
    super();
    this.cfg = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Publish a MacroState to all subscribers.
   * Stores event in replay buffer for late joiners.
   */
  broadcast(state: MacroState): BroadcastEvent {
    const event: BroadcastEvent = {
      channel: this.cfg.channel,
      state,
      broadcastAt: Date.now(),
      sequenceId: ++this.sequenceId,
    };

    // Maintain replay buffer
    this.replayBuffer.push(event);
    if (this.replayBuffer.length > this.cfg.replayBufferSize) {
      this.replayBuffer.shift();
    }

    // Notify all subscribers
    for (const [id, fn] of this.subscribers) {
      try {
        fn(event);
      } catch (err) {
        this.emit('subscriber:error', { subscriberId: id, err });
      }
    }

    this.emit('broadcast', event);
    return event;
  }

  /**
   * Subscribe to macro state events.
   * @param id Unique subscriber identifier.
   * @param fn Callback invoked on each broadcast.
   * @param replayMissed If true, immediately replay buffered events.
   */
  subscribe(id: string, fn: SignalSubscriber, replayMissed = false): void {
    this.subscribers.set(id, fn);
    this.emit('subscriber:added', { id });

    if (replayMissed) {
      for (const event of this.replayBuffer) {
        try { fn(event); } catch { /* ignore replay errors */ }
      }
    }
  }

  unsubscribe(id: string): boolean {
    const existed = this.subscribers.delete(id);
    if (existed) this.emit('subscriber:removed', { id });
    return existed;
  }

  getSubscriberCount(): number {
    return this.subscribers.size;
  }

  getReplayBuffer(): BroadcastEvent[] {
    return [...this.replayBuffer];
  }

  getSequenceId(): number {
    return this.sequenceId;
  }

  getChannel(): string {
    return this.cfg.channel;
  }
}
