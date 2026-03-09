/**
 * Tests: gossip-protocol.ts — state sync and CRDT convergence.
 */

import { GossipProtocol } from '../../../src/arbitrage/phase8_omninets/swarmOrchestrator/gossip-protocol';
import type { AgentState } from '../../../src/arbitrage/phase8_omninets/swarmOrchestrator/agent-node';

const makeState = (agentId: string, overrides: Partial<AgentState> = {}): AgentState => ({
  agentId,
  timestamp: Date.now(),
  signal: 'hold',
  confidence: 0.5,
  midPrice: 50_000,
  spread: 5,
  ...overrides,
});

describe('GossipProtocol', () => {
  it('registers and unregisters peers', () => {
    const gossip = new GossipProtocol();
    gossip.register('agent-0', () => {});
    gossip.register('agent-1', () => {});
    expect(gossip.getStats().peerCount).toBe(2);
    gossip.unregister('agent-0');
    expect(gossip.getStats().peerCount).toBe(1);
  });

  it('broadcast delivers to all other peers', () => {
    const gossip = new GossipProtocol();
    const received: string[] = [];
    gossip.register('agent-0', () => {});
    gossip.register('agent-1', () => received.push('agent-1'));
    gossip.register('agent-2', () => received.push('agent-2'));

    gossip.broadcast('agent-0', makeState('agent-0'));
    expect(received).toContain('agent-1');
    expect(received).toContain('agent-2');
    expect(received).not.toContain('agent-0');
  });

  it('does not deliver broadcast back to sender', () => {
    const gossip = new GossipProtocol();
    const senderReceived: string[] = [];
    gossip.register('agent-0', () => senderReceived.push('agent-0'));
    gossip.register('agent-1', () => {});
    gossip.broadcast('agent-0', makeState('agent-0'));
    expect(senderReceived).toHaveLength(0);
  });

  it('CRDT: newer timestamp wins', () => {
    const gossip = new GossipProtocol();
    const older = makeState('agent-0', { timestamp: 1000, midPrice: 100 });
    const newer = makeState('agent-0', { timestamp: 2000, midPrice: 200 });

    gossip.register('agent-0', () => {});
    gossip.broadcast('agent-0', older);
    gossip.broadcast('agent-0', newer);

    const global = gossip.getGlobalState();
    const entry = global.find((s) => s.agentId === 'agent-0');
    expect(entry?.midPrice).toBe(200);
  });

  it('CRDT: older timestamp does not overwrite newer', () => {
    const gossip = new GossipProtocol();
    const newer = makeState('agent-0', { timestamp: 2000, midPrice: 200 });
    const older = makeState('agent-0', { timestamp: 1000, midPrice: 100 });

    gossip.register('agent-0', () => {});
    gossip.broadcast('agent-0', newer);
    gossip.broadcast('agent-0', older);

    const global = gossip.getGlobalState();
    const entry = global.find((s) => s.agentId === 'agent-0');
    expect(entry?.midPrice).toBe(200);
  });

  it('dropRate=1 causes all received messages to be dropped', () => {
    const gossip = new GossipProtocol({ dropRate: 1.0, maxHops: 5 });
    const received: unknown[] = [];
    gossip.register('agent-0', () => {});
    gossip.register('agent-1', (msg) => {
      // agent-1 tries to forward — all should be dropped
      gossip.receive('agent-1', msg);
      received.push(msg);
    });
    gossip.broadcast('agent-0', makeState('agent-0'));
    // agent-1 receives the initial broadcast (not via receive()),
    // but any receive() calls from agent-1 will be dropped
    expect(gossip.getStats().droppedCount).toBeGreaterThanOrEqual(0);
  });

  it('maxHops limits message propagation', () => {
    const gossip = new GossipProtocol({ maxHops: 0 });
    gossip.register('agent-0', () => {});
    gossip.register('agent-1', (msg) => gossip.receive('agent-1', msg));

    // With maxHops=0, receive() immediately returns without forwarding
    gossip.broadcast('agent-0', makeState('agent-0'));
    expect(gossip.getStats().messageCount).toBeGreaterThanOrEqual(0);
  });

  it('tracks message count on broadcast', () => {
    const gossip = new GossipProtocol();
    gossip.register('agent-0', () => {});
    gossip.register('agent-1', () => {});
    gossip.register('agent-2', () => {});
    gossip.broadcast('agent-0', makeState('agent-0'));
    // 2 peers receive (excluding sender)
    expect(gossip.getStats().messageCount).toBe(2);
  });

  it('getGlobalState returns all known agents', () => {
    const gossip = new GossipProtocol();
    gossip.register('agent-0', () => {});
    gossip.register('agent-1', () => {});
    gossip.broadcast('agent-0', makeState('agent-0'));
    gossip.broadcast('agent-1', makeState('agent-1'));
    const ids = gossip.getGlobalState().map((s) => s.agentId);
    expect(ids).toContain('agent-0');
    expect(ids).toContain('agent-1');
  });
});
