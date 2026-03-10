/**
 * Tests for Coordinator
 */

import { Coordinator } from '../../../src/monitoring/antiBot/coordinator';
import { DataCollector } from '../../../src/monitoring/antiBot/data-collector';
import { PatternDetector } from '../../../src/monitoring/antiBot/pattern-detector';
import { ResponseEngine } from '../../../src/monitoring/antiBot/response-engine';
import {
  DEFAULT_ANTIBOT_CONFIG,
  ExchangeEvent,
} from '../../../src/monitoring/antiBot/antibot-config-types';

describe('Coordinator', () => {
  let coordinator: Coordinator;
  let collector: DataCollector;
  let detector: PatternDetector;
  let engine: ResponseEngine;

  beforeEach(() => {
    collector = new DataCollector(DEFAULT_ANTIBOT_CONFIG.exchanges);
    detector = new PatternDetector(DEFAULT_ANTIBOT_CONFIG.detection);
    engine = new ResponseEngine(DEFAULT_ANTIBOT_CONFIG);
    coordinator = new Coordinator(
      DEFAULT_ANTIBOT_CONFIG,
      collector,
      detector,
      engine
    );
  });

  afterEach(() => {
    coordinator.stop();
  });

  it('should start and stop', () => {
    expect(coordinator.isRunning()).toBe(false);

    coordinator.start(10000); // long interval to avoid auto-cycle
    expect(coordinator.isRunning()).toBe(true);

    coordinator.stop();
    expect(coordinator.isRunning()).toBe(false);
  });

  it('should not double-start', () => {
    const started: unknown[] = [];
    coordinator.on('started', (e) => started.push(e));

    coordinator.start(10000);
    coordinator.start(10000);
    expect(started).toHaveLength(1);
  });

  it('should emit started and stopped events', () => {
    const events: string[] = [];
    coordinator.on('started', () => events.push('started'));
    coordinator.on('stopped', () => events.push('stopped'));

    coordinator.start(10000);
    coordinator.stop();

    expect(events).toEqual(['started', 'stopped']);
  });

  it('should run a detection cycle manually', () => {
    const cycles: unknown[] = [];
    coordinator.on('cycle', (c) => cycles.push(c));

    coordinator.runCycle();
    expect(cycles).toHaveLength(1);
  });

  it('should detect threats and emit detection events', () => {
    const now = Date.now();
    // Inject enough events to trigger error spike (>5% error rate, min 5 events)
    for (let i = 0; i < 90; i++) {
      collector.record({
        exchange: 'binance',
        timestamp: now - i * 100,
        type: 'http_response',
        statusCode: 200,
        responseTimeMs: 50,
      });
    }
    for (let i = 0; i < 10; i++) {
      collector.record({
        exchange: 'binance',
        timestamp: now - i * 100,
        type: 'http_response',
        statusCode: 500,
        responseTimeMs: 50,
      });
    }

    const detections: unknown[] = [];
    coordinator.on('detection', (d) => detections.push(d));

    coordinator.runCycle();
    expect(detections.length).toBeGreaterThanOrEqual(1);
  });

  it('should trigger actions on detection', () => {
    const now = Date.now();
    // Trigger error spike on binance
    for (let i = 0; i < 80; i++) {
      collector.record({
        exchange: 'binance',
        timestamp: now - i * 100,
        type: 'http_response',
        statusCode: 200,
        responseTimeMs: 50,
      });
    }
    for (let i = 0; i < 20; i++) {
      collector.record({
        exchange: 'binance',
        timestamp: now - i * 100,
        type: 'http_response',
        statusCode: 500,
        responseTimeMs: 50,
      });
    }

    const actions: unknown[] = [];
    coordinator.on('action', (a) => actions.push(a));

    coordinator.runCycle();
    expect(actions.length).toBeGreaterThanOrEqual(1);
  });

  it('should calculate exchange health score', () => {
    const health = coordinator.getExchangeHealth('binance');
    expect(health.exchange).toBe('binance');
    expect(health.score).toBe(100); // No detections = 100
    expect(health.activeDefenses).toEqual([]);
  });

  it('should degrade health score with detections', () => {
    const now = Date.now();
    // Inject events that cause detections
    for (let i = 0; i < 80; i++) {
      collector.record({
        exchange: 'binance',
        timestamp: now - i * 100,
        type: 'http_response',
        statusCode: 200,
        responseTimeMs: 50,
      });
    }
    for (let i = 0; i < 20; i++) {
      collector.record({
        exchange: 'binance',
        timestamp: now - i * 100,
        type: 'http_response',
        statusCode: 500,
        responseTimeMs: 50,
      });
    }

    coordinator.runCycle();
    const health = coordinator.getExchangeHealth('binance');
    expect(health.score).toBeLessThan(100);
  });

  it('should return health for all exchanges', () => {
    const allHealth = coordinator.getAllExchangeHealth();
    expect(Object.keys(allHealth)).toEqual(
      expect.arrayContaining(['binance', 'bybit', 'okx'])
    );
  });

  it('should return full status', () => {
    coordinator.start(10000);
    const status = coordinator.getStatus();

    expect(status.running).toBe(true);
    expect(status.startedAt).not.toBeNull();
    expect(status.cycleCount).toBe(0);
    expect(status.exchangeHealth).toBeDefined();
  });

  it('should track cycle and detection counts', () => {
    coordinator.runCycle();
    coordinator.runCycle();

    const status = coordinator.getStatus();
    expect(status.cycleCount).toBe(2);
  });

  it('should not emit stopped if not running', () => {
    const events: string[] = [];
    coordinator.on('stopped', () => events.push('stopped'));
    coordinator.stop();
    expect(events).toHaveLength(0);
  });
});
