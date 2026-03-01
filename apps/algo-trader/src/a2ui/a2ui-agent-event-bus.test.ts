import { AgentEventBus } from './agent-event-bus';
import {
  AgentEventType,
  IntentPreviewEvent,
  AgentEvent,
} from './types';

describe('AgentEventBus', () => {
  let bus: AgentEventBus;

  beforeEach(() => {
    bus = AgentEventBus.getInstance();
    bus.reset();
  });

  it('should emit and receive typed events for a tenant', async () => {
    const received: IntentPreviewEvent[] = [];
    bus.on<IntentPreviewEvent>(AgentEventType.INTENT_PREVIEW, (e) => { received.push(e); }, 'tenant-1');

    const event: IntentPreviewEvent = {
      type: AgentEventType.INTENT_PREVIEW,
      tenantId: 'tenant-1',
      action: 'BUY',
      symbol: 'BTC/USDT',
      amount: 0.5,
      price: 50000,
      rationale: 'RSI oversold + SMA bullish cross',
      confidence: 0.85,
      requiresConfirmation: true,
      timestamp: Date.now(),
    };
    await bus.emit(event);

    expect(received).toHaveLength(1);
    expect(received[0].action).toBe('BUY');
    expect(received[0].tenantId).toBe('tenant-1');
  });

  it('should support onTenant handler', async () => {
    const received: AgentEvent[] = [];
    bus.onTenant('tenant-1', (e) => { received.push(e); });

    await bus.emit({
      type: AgentEventType.INTENT_PREVIEW,
      tenantId: 'tenant-1',
      action: 'BUY', symbol: 'BTC/USDT', amount: 1, price: 50000,
      rationale: 'test', confidence: 0.5, requiresConfirmation: false,
      timestamp: Date.now(),
    });

    await bus.emit({
      type: AgentEventType.INTENT_PREVIEW,
      tenantId: 'tenant-2',
      action: 'BUY', symbol: 'BTC/USDT', amount: 1, price: 50000,
      rationale: 'test', confidence: 0.5, requiresConfirmation: false,
      timestamp: Date.now(),
    });

    expect(received).toHaveLength(1);
    expect(received[0].tenantId).toBe('tenant-1');
  });

  it('should support onAny global handler', async () => {
    const all: AgentEvent[] = [];
    bus.onAny((e) => { all.push(e); });

    await bus.emit({
      type: AgentEventType.INTENT_PREVIEW,
      tenantId: 'tenant-1',
      action: 'BUY', symbol: 'BTC/USDT', amount: 1, price: 50000,
      rationale: 'test', confidence: 0.5, requiresConfirmation: false,
      timestamp: Date.now(),
    });
    await bus.emit({
      type: AgentEventType.ESCALATION,
      tenantId: 'tenant-2',
      severity: 'warning', reason: 'High volatility',
      suggestedAction: 'Reduce position', autoHalted: false,
      timestamp: Date.now(),
    });

    expect(all).toHaveLength(2);
  });

  it('should maintain event log per tenant', async () => {
    await bus.emit({
      type: AgentEventType.TRADE_AUDIT,
      tenantId: 'tenant-1',
      entryId: 'a1', action: 'BUY', detail: 'test', undoable: false, timestamp: Date.now(),
    });
    await bus.emit({
      type: AgentEventType.TRADE_AUDIT,
      tenantId: 'tenant-2',
      entryId: 'a2', action: 'SELL', detail: 'test', undoable: false, timestamp: Date.now(),
    });

    expect(bus.getLog('tenant-1')).toHaveLength(1);
    expect(bus.getLog('tenant-2')).toHaveLength(1);
    expect(bus.getLog()).toHaveLength(2);
  });

  it('should handle handler errors gracefully', async () => {
    bus.on<IntentPreviewEvent>(AgentEventType.INTENT_PREVIEW, () => { throw new Error('crash'); });
    const received: AgentEvent[] = [];
    bus.on<IntentPreviewEvent>(AgentEventType.INTENT_PREVIEW, (e) => { received.push(e); });

    // Should not throw
    await bus.emit({
      type: AgentEventType.INTENT_PREVIEW,
      tenantId: 'tenant-1',
      action: 'BUY', symbol: 'BTC/USDT', amount: 1, price: 50000,
      rationale: 'test', confidence: 0.5, requiresConfirmation: false,
      timestamp: Date.now(),
    });

    expect(received).toHaveLength(1);
  });
});
