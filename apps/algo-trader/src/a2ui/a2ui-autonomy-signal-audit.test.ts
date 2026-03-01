import { AgentEventBus } from './agent-event-bus';
import { AutonomyController } from '../core/autonomy-controller';
import { SignalExplainer } from './signal-explainer';
import { TradeAuditLogger } from './trade-audit-logger';
import { AgentEventType, AutonomyLevel, AgentEvent } from './types';

describe('AutonomyController', () => {
  let bus: AgentEventBus;
  let controller: AutonomyController;

  beforeEach(() => {
    bus = new AgentEventBus();
    controller = new AutonomyController(bus, {
      defaultLevel: AutonomyLevel.ACT_CONFIRM,
      strategyOverrides: { 'AGI-Arb': AutonomyLevel.AUTONOMOUS },
      autoEscalateOnRisk: true,
      autoRestoreAfterTrades: 3,
    });
  });

  it('should return default level for unknown strategy', () => {
    expect(controller.getLevel('RsiSma')).toBe(AutonomyLevel.ACT_CONFIRM);
  });

  it('should return override level for configured strategy', () => {
    expect(controller.getLevel('AGI-Arb')).toBe(AutonomyLevel.AUTONOMOUS);
  });

  it('should require confirmation for OBSERVE/PLAN/ACT_CONFIRM', () => {
    expect(controller.requiresConfirmation('RsiSma')).toBe(true);
    expect(controller.requiresConfirmation('AGI-Arb')).toBe(false);
  });

  it('should allow execution for ACT_CONFIRM and AUTONOMOUS', () => {
    expect(controller.canExecute('RsiSma')).toBe(true); // ACT_CONFIRM
    expect(controller.canExecute('AGI-Arb')).toBe(true); // AUTONOMOUS

    controller.setLevel('test', AutonomyLevel.OBSERVE, 'test');
    expect(controller.canExecute('test')).toBe(false);
  });

  it('should emit autonomy change events', () => {
    const events: AgentEvent[] = [];
    bus.onAny((e) => events.push(e));

    controller.setLevel('RsiSma', AutonomyLevel.AUTONOMOUS, 'User requested');
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe(AgentEventType.AUTONOMY_CHANGE);
  });

  it('should escalate on risk event', () => {
    controller.setLevel('test', AutonomyLevel.AUTONOMOUS, 'setup');
    controller.escalate('test', 'Drawdown breach');
    expect(controller.getLevel('test')).toBe(AutonomyLevel.ACT_CONFIRM);
  });

  it('should auto-restore after N successful trades', () => {
    controller.setLevel('test', AutonomyLevel.AUTONOMOUS, 'setup');
    controller.escalate('test', 'Risk event');
    expect(controller.getLevel('test')).toBe(AutonomyLevel.ACT_CONFIRM);

    controller.recordSuccess('test');
    controller.recordSuccess('test');
    controller.recordSuccess('test');
    expect(controller.getLevel('test')).toBe(AutonomyLevel.AUTONOMOUS); // Restored
  });

  it('should not change level if already at target', () => {
    const events: AgentEvent[] = [];
    bus.onAny((e) => events.push(e));

    controller.setLevel('test', AutonomyLevel.ACT_CONFIRM, 'already default');
    expect(events).toHaveLength(0); // No event emitted
  });
});

describe('SignalExplainer', () => {
  let bus: AgentEventBus;
  let explainer: SignalExplainer;

  beforeEach(() => {
    bus = new AgentEventBus();
    explainer = new SignalExplainer(bus);
  });

  it('should explain RSI signal', () => {
    const reasoning = explainer.explainSignal('RsiSma', 'BUY', { rsi: 25 });
    expect(reasoning).toContain('RSI=25.0');
    expect(reasoning).toContain('oversold');
  });

  it('should explain SMA crossover', () => {
    const reasoning = explainer.explainSignal('RsiSma', 'BUY', {
      smaShort: 51000, smaLong: 49000,
    });
    expect(reasoning).toContain('bullish cross');
  });

  it('should explain MACD signal', () => {
    const reasoning = explainer.explainSignal('Macd', 'BUY', {
      macd: 150, macdSignal: 100,
    });
    expect(reasoning).toContain('MACD above signal');
  });

  it('should explain Hurst regime', () => {
    const reasoning = explainer.explainSignal('AGI', 'BUY', { hurst: 0.65 });
    expect(reasoning).toContain('trending');
  });

  it('should emit signal rationale event', () => {
    const events: AgentEvent[] = [];
    bus.onAny((e) => events.push(e));

    explainer.explainSignal('Test', 'SELL', { rsi: 75 });
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe(AgentEventType.SIGNAL_RATIONALE);
  });

  it('should calculate weighted confidence', () => {
    const confidence = explainer.updateConfidence([
      { name: 'RSI', score: 0.9, weight: 0.5 },
      { name: 'SMA', score: 0.7, weight: 0.3 },
      { name: 'Volume', score: 0.5, weight: 0.2 },
    ]);
    // (0.9*0.5 + 0.7*0.3 + 0.5*0.2) / (0.5+0.3+0.2) = 0.76
    expect(confidence).toBeCloseTo(0.76, 2);
  });

  it('should clamp confidence scores to 0-1', () => {
    const confidence = explainer.updateConfidence([
      { name: 'test', score: 1.5, weight: 1.0 },
    ]);
    expect(confidence).toBe(1.0);
  });

  it('should emit thought summary', () => {
    const events: AgentEvent[] = [];
    bus.onAny((e) => events.push(e));

    explainer.emitThoughtSummary(
      ['Step 1: Analyzed price', 'Step 2: Checked regime'],
      'Market is trending bullish',
      'trending'
    );
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe(AgentEventType.THOUGHT_SUMMARY);
  });
});

describe('TradeAuditLogger', () => {
  let bus: AgentEventBus;
  let audit: TradeAuditLogger;

  beforeEach(() => {
    bus = new AgentEventBus();
    audit = new TradeAuditLogger(bus, 50);
  });

  it('should log entries', () => {
    const id = audit.log('BUY', 'BUY 0.5 BTC @ $50000');
    expect(id).toContain('audit-');
    expect(audit.size).toBe(1);
  });

  it('should emit trade audit events', () => {
    const events: AgentEvent[] = [];
    bus.onAny((e) => events.push(e));

    audit.log('SELL', 'SELL 0.5 BTC @ $51000');
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe(AgentEventType.TRADE_AUDIT);
  });

  it('should support undo for undoable entries', () => {
    const id = audit.log('CANCEL_ORDER', 'Cancel order #123', true);
    expect(audit.getUndoable()).toHaveLength(1);

    const undone = audit.undo(id);
    expect(undone).toBe(true);
    expect(audit.getUndoable()).toHaveLength(0);
  });

  it('should not undo non-undoable entries', () => {
    const id = audit.log('TRADE', 'BUY 1 ETH', false);
    expect(audit.undo(id)).toBe(false);
  });

  it('should not undo already-undone entries', () => {
    const id = audit.log('CANCEL', 'test', true);
    audit.undo(id);
    expect(audit.undo(id)).toBe(false);
  });

  it('should get recent entries', () => {
    audit.log('A', 'first');
    audit.log('B', 'second');
    audit.log('C', 'third');
    expect(audit.getRecent(2)).toHaveLength(2);
    expect(audit.getRecent(2)[0].action).toBe('B');
  });

  it('should filter by action', () => {
    audit.log('BUY', 'test 1');
    audit.log('SELL', 'test 2');
    audit.log('BUY', 'test 3');
    expect(audit.getByAction('BUY')).toHaveLength(2);
  });

  it('should export log as JSON', () => {
    audit.log('TEST', 'entry');
    const json = audit.exportLog();
    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(1);
  });

  it('should cap entries at maxEntries', () => {
    const smallAudit = new TradeAuditLogger(bus, 5);
    for (let i = 0; i < 10; i++) {
      smallAudit.log('LOG', `entry ${i}`);
    }
    expect(smallAudit.size).toBe(5);
  });

  it('should reset all entries', () => {
    audit.log('TEST', 'entry');
    audit.reset();
    expect(audit.size).toBe(0);
  });
});
