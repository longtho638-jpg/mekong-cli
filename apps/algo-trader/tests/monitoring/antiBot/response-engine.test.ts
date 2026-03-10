/**
 * Tests for ResponseEngine
 */

import { ResponseEngine } from '../../../src/monitoring/antiBot/response-engine';
import {
  AntiBotConfig,
  DEFAULT_ANTIBOT_CONFIG,
  DetectionResult,
} from '../../../src/monitoring/antiBot/antibot-config-types';

function makeDetection(overrides: Partial<DetectionResult> = {}): DetectionResult {
  return {
    type: 'RATE_LIMIT',
    exchange: 'binance',
    severity: 'WARNING',
    confidence: 0.9,
    timestamp: Date.now(),
    details: 'Test detection',
    ...overrides,
  };
}

describe('ResponseEngine', () => {
  let engine: ResponseEngine;

  beforeEach(() => {
    engine = new ResponseEngine(DEFAULT_ANTIBOT_CONFIG);
  });

  it('should execute actions for WARNING severity', () => {
    const detection = makeDetection({ severity: 'WARNING' });
    const actions = engine.respond(detection);

    // binance WARNING = ['rotateProxy', 'increaseJitter']
    expect(actions).toHaveLength(2);
    expect(actions[0].action).toBe('rotateProxy');
    expect(actions[1].action).toBe('increaseJitter');
    expect(actions[0].success).toBe(true);
  });

  it('should execute actions for CRITICAL severity', () => {
    const detection = makeDetection({ severity: 'CRITICAL' });
    const actions = engine.respond(detection);

    // binance CRITICAL = ['switchAccount', 'pauseSymbol']
    expect(actions).toHaveLength(2);
    expect(actions[0].action).toBe('switchAccount');
    expect(actions[1].action).toBe('pauseSymbol');
  });

  it('should respect cooldown periods', () => {
    const detection = makeDetection({ severity: 'WARNING' });

    const first = engine.respond(detection);
    expect(first).toHaveLength(2);

    // Same detection immediately — should be on cooldown
    const second = engine.respond(detection);
    expect(second).toHaveLength(0);
  });

  it('should report cooldown remaining', () => {
    const detection = makeDetection({ severity: 'WARNING' });
    engine.respond(detection);

    const remaining = engine.getCooldownRemaining('rotateProxy', 'binance');
    expect(remaining).toBeGreaterThan(0);
    expect(remaining).toBeLessThanOrEqual(60);
  });

  it('should return 0 cooldown for unused action', () => {
    expect(engine.getCooldownRemaining('pauseGlobal', 'binance')).toBe(0);
  });

  it('should return empty for unknown exchange', () => {
    const detection = makeDetection({ exchange: 'unknown_exchange' });
    const actions = engine.respond(detection);
    expect(actions).toHaveLength(0);
  });

  it('should emit action events', () => {
    const emitted: unknown[] = [];
    engine.on('action', (a) => emitted.push(a));

    engine.respond(makeDetection({ severity: 'WARNING' }));
    expect(emitted).toHaveLength(2);
  });

  it('should emit specific action events', () => {
    const rotated: unknown[] = [];
    engine.on('action:rotateProxy', (data) => rotated.push(data));

    engine.respond(makeDetection({ severity: 'WARNING' }));
    expect(rotated).toHaveLength(1);
  });

  it('should track action history', () => {
    engine.respond(makeDetection({ severity: 'WARNING' }));
    const history = engine.getHistory();
    expect(history).toHaveLength(2);
    expect(history[0].trigger.type).toBe('RATE_LIMIT');
  });

  it('should return active defenses within cooldown', () => {
    engine.respond(makeDetection({ severity: 'WARNING', exchange: 'binance' }));
    engine.respond(makeDetection({ severity: 'WARNING', exchange: 'bybit' }));

    const allActive = engine.getActiveDefenses();
    expect(allActive.length).toBeGreaterThanOrEqual(2);

    const binanceActive = engine.getActiveDefenses('binance');
    expect(binanceActive.every((a) => a.exchange === 'binance')).toBe(true);
  });

  it('should clear history and cooldowns', () => {
    engine.respond(makeDetection({ severity: 'WARNING' }));
    engine.clear();

    expect(engine.getHistory()).toHaveLength(0);
    expect(engine.getCooldownRemaining('rotateProxy', 'binance')).toBe(0);

    // Should be able to act again after clear
    const actions = engine.respond(makeDetection({ severity: 'WARNING' }));
    expect(actions).toHaveLength(2);
  });

  it('should include affected symbols in pauseSymbol description', () => {
    const detection = makeDetection({
      severity: 'CRITICAL',
      affectedSymbols: ['BTC/USDT'],
    });
    const actions = engine.respond(detection);
    const pauseAction = actions.find((a) => a.action === 'pauseSymbol');
    expect(pauseAction?.details).toContain('BTC/USDT');
  });

  it('should prune history when exceeding max size', () => {
    // Force many actions by clearing cooldowns each time
    for (let i = 0; i < 300; i++) {
      engine.clear();
      engine.respond(makeDetection({ severity: 'WARNING' }));
    }
    const history = engine.getHistory();
    expect(history.length).toBeLessThanOrEqual(500);
  });
});
