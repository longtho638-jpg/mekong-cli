/**
 * Tests for AntiBotSentinel (main entry point)
 */

import { AntiBotSentinel, DEFAULT_ANTIBOT_CONFIG } from '../../../src/monitoring/antiBot/index';

describe('AntiBotSentinel', () => {
  let sentinel: AntiBotSentinel;

  afterEach(() => {
    if (sentinel) sentinel.destroy();
  });

  it('should create with default config', () => {
    sentinel = new AntiBotSentinel();
    const config = sentinel.getConfig();
    expect(config.exchanges).toEqual(['binance', 'bybit', 'okx']);
    expect(config.detection.rateLimitThreshold).toBe(0.8);
  });

  it('should create with custom config', () => {
    sentinel = new AntiBotSentinel({
      exchanges: ['binance'],
      dataRetentionSeconds: 1800,
    });
    const config = sentinel.getConfig();
    expect(config.exchanges).toEqual(['binance']);
    expect(config.dataRetentionSeconds).toBe(1800);
  });

  it('should start and stop', () => {
    sentinel = new AntiBotSentinel();
    expect(sentinel.isRunning()).toBe(false);

    sentinel.start(10000);
    expect(sentinel.isRunning()).toBe(true);

    sentinel.stop();
    expect(sentinel.isRunning()).toBe(false);
  });

  it('should expose all components', () => {
    sentinel = new AntiBotSentinel();
    expect(sentinel.collector).toBeDefined();
    expect(sentinel.detector).toBeDefined();
    expect(sentinel.engine).toBeDefined();
    expect(sentinel.coordinator).toBeDefined();
    expect(sentinel.dashboard).toBeDefined();
  });

  it('should return status', () => {
    sentinel = new AntiBotSentinel();
    const status = sentinel.getStatus();
    expect(status.running).toBe(false);
    expect(status.cycleCount).toBe(0);
    expect(status.exchangeHealth).toBeDefined();
  });

  it('should run end-to-end detection cycle', () => {
    sentinel = new AntiBotSentinel();
    const now = Date.now();

    // Inject error events to trigger detection
    for (let i = 0; i < 80; i++) {
      sentinel.collector.record({
        exchange: 'binance',
        timestamp: now - i * 100,
        type: 'http_response',
        statusCode: 200,
        responseTimeMs: 50,
      });
    }
    for (let i = 0; i < 20; i++) {
      sentinel.collector.record({
        exchange: 'binance',
        timestamp: now - i * 100,
        type: 'http_response',
        statusCode: 500,
        responseTimeMs: 50,
      });
    }

    const detections: unknown[] = [];
    sentinel.coordinator.on('detection', (d) => detections.push(d));

    sentinel.coordinator.runCycle();
    expect(detections.length).toBeGreaterThanOrEqual(1);

    // Health should degrade
    const status = sentinel.getStatus();
    const binanceHealth = status.exchangeHealth.binance;
    expect(binanceHealth.score).toBeLessThan(100);
  });

  it('should destroy cleanly', () => {
    sentinel = new AntiBotSentinel();
    sentinel.start(10000);
    sentinel.destroy();
    expect(sentinel.isRunning()).toBe(false);
  });

  it('should support dashboard overrides', () => {
    sentinel = new AntiBotSentinel();
    const result = sentinel.dashboard.handleOverride({
      command: 'rotateProxy',
      exchange: 'binance',
      apiKey: 'default-api-key',
    });
    expect(result.success).toBe(true);
  });

  it('should collect and retrieve events', () => {
    sentinel = new AntiBotSentinel();
    sentinel.collector.record({
      exchange: 'binance',
      timestamp: Date.now(),
      type: 'http_response',
      statusCode: 200,
      responseTimeMs: 30,
    });

    const events = sentinel.collector.getAllEvents('binance');
    expect(events).toHaveLength(1);
  });

  it('should export all types and classes', () => {
    // Verify re-exports work
    expect(DEFAULT_ANTIBOT_CONFIG).toBeDefined();
    expect(AntiBotSentinel).toBeDefined();
  });
});
