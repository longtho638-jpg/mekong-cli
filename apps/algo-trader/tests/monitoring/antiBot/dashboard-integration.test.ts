/**
 * Tests for DashboardIntegration
 */

import { DashboardIntegration, DashboardMessage } from '../../../src/monitoring/antiBot/dashboard-integration';
import { Coordinator } from '../../../src/monitoring/antiBot/coordinator';
import { DataCollector } from '../../../src/monitoring/antiBot/data-collector';
import { PatternDetector } from '../../../src/monitoring/antiBot/pattern-detector';
import { ResponseEngine } from '../../../src/monitoring/antiBot/response-engine';
import { DEFAULT_ANTIBOT_CONFIG } from '../../../src/monitoring/antiBot/antibot-config-types';

describe('DashboardIntegration', () => {
  let dashboard: DashboardIntegration;
  let coordinator: Coordinator;
  const API_KEY = 'test-api-key';

  beforeEach(() => {
    const collector = new DataCollector(DEFAULT_ANTIBOT_CONFIG.exchanges);
    const detector = new PatternDetector(DEFAULT_ANTIBOT_CONFIG.detection);
    const engine = new ResponseEngine(DEFAULT_ANTIBOT_CONFIG);
    coordinator = new Coordinator(DEFAULT_ANTIBOT_CONFIG, collector, detector, engine);
    dashboard = new DashboardIntegration(coordinator, API_KEY);
  });

  afterEach(() => {
    dashboard.destroy();
    coordinator.stop();
  });

  it('should broadcast detection events from coordinator', () => {
    const messages: DashboardMessage[] = [];
    dashboard.on('message', (m) => messages.push(m));

    coordinator.emit('detection', {
      type: 'RATE_LIMIT',
      exchange: 'binance',
      severity: 'WARNING',
      confidence: 0.9,
      timestamp: Date.now(),
      details: 'Test',
    });

    expect(messages).toHaveLength(1);
    expect(messages[0].type).toBe('detection');
  });

  it('should broadcast action events from coordinator', () => {
    const messages: DashboardMessage[] = [];
    dashboard.on('message', (m) => messages.push(m));

    coordinator.emit('action', {
      action: 'rotateProxy',
      exchange: 'binance',
      timestamp: Date.now(),
      trigger: {},
      success: true,
    });

    expect(messages).toHaveLength(1);
    expect(messages[0].type).toBe('action');
  });

  describe('handleOverride', () => {
    it('should reject invalid API key', () => {
      const result = dashboard.handleOverride({
        command: 'rotateProxy',
        exchange: 'binance',
        apiKey: 'wrong-key',
      });
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid API key');
    });

    it('should execute rotateProxy', () => {
      const emitted: unknown[] = [];
      dashboard.on('override:rotateProxy', (d) => emitted.push(d));

      const result = dashboard.handleOverride({
        command: 'rotateProxy',
        exchange: 'binance',
        apiKey: API_KEY,
      });
      expect(result.success).toBe(true);
      expect(emitted).toHaveLength(1);
    });

    it('should execute pauseSymbol with symbol', () => {
      const result = dashboard.handleOverride({
        command: 'pauseSymbol',
        exchange: 'binance',
        symbol: 'BTC/USDT',
        apiKey: API_KEY,
      });
      expect(result.success).toBe(true);
      expect(result.message).toContain('BTC/USDT');
    });

    it('should reject pauseSymbol without symbol', () => {
      const result = dashboard.handleOverride({
        command: 'pauseSymbol',
        exchange: 'binance',
        apiKey: API_KEY,
      });
      expect(result.success).toBe(false);
      expect(result.message).toContain('Symbol required');
    });

    it('should execute pauseGlobal', () => {
      const emitted: unknown[] = [];
      dashboard.on('override:pauseGlobal', (d) => emitted.push(d));

      const result = dashboard.handleOverride({
        command: 'pauseGlobal',
        exchange: 'bybit',
        apiKey: API_KEY,
      });
      expect(result.success).toBe(true);
      expect(emitted).toHaveLength(1);
    });

    it('should execute resumeSymbol', () => {
      const result = dashboard.handleOverride({
        command: 'resumeSymbol',
        exchange: 'binance',
        symbol: 'ETH/USDT',
        apiKey: API_KEY,
      });
      expect(result.success).toBe(true);
    });

    it('should reject resumeSymbol without symbol', () => {
      const result = dashboard.handleOverride({
        command: 'resumeSymbol',
        exchange: 'binance',
        apiKey: API_KEY,
      });
      expect(result.success).toBe(false);
    });

    it('should execute resumeGlobal', () => {
      const result = dashboard.handleOverride({
        command: 'resumeGlobal',
        exchange: 'okx',
        apiKey: API_KEY,
      });
      expect(result.success).toBe(true);
    });

    it('should execute forceStatus and broadcast', () => {
      const messages: DashboardMessage[] = [];
      dashboard.on('message', (m) => messages.push(m));

      const result = dashboard.handleOverride({
        command: 'forceStatus',
        exchange: 'binance',
        apiKey: API_KEY,
      });
      expect(result.success).toBe(true);
      // Should have status + manual_override messages
      expect(messages.some((m) => m.type === 'status')).toBe(true);
    });

    it('should handle unknown command', () => {
      const result = dashboard.handleOverride({
        command: 'unknownCmd' as any,
        exchange: 'binance',
        apiKey: API_KEY,
      });
      expect(result.success).toBe(false);
      expect(result.message).toContain('Unknown command');
    });

    it('should broadcast manual_override message', () => {
      const messages: DashboardMessage[] = [];
      dashboard.on('message', (m) => messages.push(m));

      dashboard.handleOverride({
        command: 'rotateProxy',
        exchange: 'binance',
        apiKey: API_KEY,
      });

      const overrideMsg = messages.find((m) => m.type === 'manual_override');
      expect(overrideMsg).toBeDefined();
      // API key should be stripped from broadcast
      expect((overrideMsg!.data as any).request.apiKey).toBeUndefined();
    });
  });

  describe('health broadcast', () => {
    it('should start and stop health broadcast', () => {
      dashboard.startHealthBroadcast(100);
      // Should not throw on double start
      dashboard.startHealthBroadcast(100);
      dashboard.stopHealthBroadcast();
    });
  });

  describe('getSnapshot', () => {
    it('should return full status snapshot', () => {
      const snapshot = dashboard.getSnapshot();
      expect(snapshot.health).toBeDefined();
      expect(snapshot.status).toBeDefined();
      expect(snapshot.recentMessages).toEqual([]);
    });

    it('should include recent messages in snapshot', () => {
      coordinator.emit('detection', {
        type: 'ERROR_SPIKE',
        exchange: 'binance',
        severity: 'WARNING',
        confidence: 0.8,
        timestamp: Date.now(),
        details: 'Test',
      });

      const snapshot = dashboard.getSnapshot();
      expect(snapshot.recentMessages).toHaveLength(1);
    });
  });

  describe('message history', () => {
    it('should track message history', () => {
      coordinator.emit('detection', {
        type: 'RATE_LIMIT', exchange: 'binance',
        severity: 'WARNING', confidence: 0.9,
        timestamp: Date.now(), details: 'Test 1',
      });
      coordinator.emit('detection', {
        type: 'ERROR_SPIKE', exchange: 'bybit',
        severity: 'CRITICAL', confidence: 0.95,
        timestamp: Date.now(), details: 'Test 2',
      });

      const history = dashboard.getMessageHistory();
      expect(history).toHaveLength(2);
    });

    it('should limit history retrieval', () => {
      for (let i = 0; i < 10; i++) {
        coordinator.emit('detection', {
          type: 'RATE_LIMIT', exchange: 'binance',
          severity: 'WARNING', confidence: 0.9,
          timestamp: Date.now(), details: `Test ${i}`,
        });
      }

      const limited = dashboard.getMessageHistory(3);
      expect(limited).toHaveLength(3);
    });
  });
});
