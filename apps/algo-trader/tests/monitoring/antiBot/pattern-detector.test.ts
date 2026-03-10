/**
 * Tests for PatternDetector
 */

import { PatternDetector } from '../../../src/monitoring/antiBot/pattern-detector';
import {
  DetectionConfig,
  ExchangeEvent,
} from '../../../src/monitoring/antiBot/antibot-config-types';

const defaultConfig: DetectionConfig = {
  rateLimitThreshold: 0.8,
  errorRateThreshold: 0.05,
  rejectionSpikeThreshold: 3,
  slippageMultiplier: 2.0,
  latencyShiftThresholdMs: 100,
  useML: false,
};

/** Helper to create HTTP response events */
function httpEvents(
  count: number,
  exchange: string,
  now: number,
  overrides: Partial<ExchangeEvent> = {}
): ExchangeEvent[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `evt_${i}`,
    exchange,
    timestamp: now - Math.floor(((count - i) / count) * 59000),
    type: 'http_response' as const,
    statusCode: 200,
    responseTimeMs: 50,
    ...overrides,
  }));
}

describe('PatternDetector', () => {
  let detector: PatternDetector;
  const now = Date.now();

  beforeEach(() => {
    detector = new PatternDetector(defaultConfig);
  });

  describe('detectRateLimit', () => {
    it('should return null when under threshold', () => {
      const events = httpEvents(10, 'binance', now);
      expect(detector.detectRateLimit('binance', events, now)).toBeNull();
    });

    it('should detect WARNING when approaching limit', () => {
      // binance limit = 1200/min, 80% = 960
      const events = httpEvents(1000, 'binance', now);
      const result = detector.detectRateLimit('binance', events, now);
      expect(result).not.toBeNull();
      expect(result!.type).toBe('RATE_LIMIT');
      expect(result!.severity).toBe('WARNING');
    });

    it('should detect CRITICAL at 95%+ usage', () => {
      const events = httpEvents(1200, 'binance', now);
      const result = detector.detectRateLimit('binance', events, now);
      expect(result).not.toBeNull();
      expect(result!.severity).toBe('CRITICAL');
    });

    it('should use default limit for unknown exchange', () => {
      // default = 600, 80% = 480
      const events = httpEvents(500, 'unknown_exchange', now);
      const result = detector.detectRateLimit('unknown_exchange', events, now);
      expect(result).not.toBeNull();
    });
  });

  describe('detectErrorSpike', () => {
    it('should return null with few events', () => {
      const events = httpEvents(3, 'binance', now, { statusCode: 500 });
      expect(detector.detectErrorSpike('binance', events, now)).toBeNull();
    });

    it('should return null when error rate is low', () => {
      const events = [
        ...httpEvents(95, 'binance', now, { statusCode: 200 }),
        ...httpEvents(2, 'binance', now, { statusCode: 500 }),
      ];
      expect(detector.detectErrorSpike('binance', events, now)).toBeNull();
    });

    it('should detect WARNING on error spike', () => {
      const good = httpEvents(90, 'binance', now, { statusCode: 200 });
      const bad = httpEvents(6, 'binance', now, { statusCode: 500 });
      const result = detector.detectErrorSpike('binance', [...good, ...bad], now);
      expect(result).not.toBeNull();
      expect(result!.type).toBe('ERROR_SPIKE');
      expect(result!.severity).toBe('WARNING');
    });

    it('should detect CRITICAL on high error rate', () => {
      const good = httpEvents(80, 'binance', now, { statusCode: 200 });
      const bad = httpEvents(20, 'binance', now, { statusCode: 429 });
      const result = detector.detectErrorSpike('binance', [...good, ...bad], now);
      expect(result).not.toBeNull();
      expect(result!.severity).toBe('CRITICAL');
    });
  });

  describe('detectOrderRejections', () => {
    it('should return null with few rejections', () => {
      const events: ExchangeEvent[] = [
        { id: '1', exchange: 'binance', timestamp: now, type: 'order_result', orderResult: 'rejected', symbol: 'BTC/USDT' },
        { id: '2', exchange: 'binance', timestamp: now, type: 'order_result', orderResult: 'filled', symbol: 'BTC/USDT' },
      ];
      expect(detector.detectOrderRejections('binance', events, now)).toBeNull();
    });

    it('should detect rejection spike', () => {
      const events: ExchangeEvent[] = Array.from({ length: 5 }, (_, i) => ({
        id: `r_${i}`,
        exchange: 'binance',
        timestamp: now - i * 1000,
        type: 'order_result' as const,
        orderResult: 'rejected' as const,
        rejectionReason: 'Timestamp outside recvWindow',
        symbol: 'ETH/USDT',
      }));
      const result = detector.detectOrderRejections('binance', events, now);
      expect(result).not.toBeNull();
      expect(result!.type).toBe('ORDER_REJECTION');
      expect(result!.affectedSymbols).toContain('ETH/USDT');
    });

    it('should detect CRITICAL on large rejection spike', () => {
      const events: ExchangeEvent[] = Array.from({ length: 10 }, (_, i) => ({
        id: `r_${i}`,
        exchange: 'binance',
        timestamp: now - i * 100,
        type: 'order_result' as const,
        orderResult: 'rejected' as const,
        symbol: 'BTC/USDT',
      }));
      const result = detector.detectOrderRejections('binance', events, now);
      expect(result).not.toBeNull();
      expect(result!.severity).toBe('CRITICAL');
    });
  });

  describe('detectSlippageAnomaly', () => {
    it('should return null with insufficient data', () => {
      const events: ExchangeEvent[] = [
        { id: '1', exchange: 'binance', timestamp: now, type: 'order_result', slippageActualBps: 10, slippageExpectedBps: 5, symbol: 'BTC/USDT' },
      ];
      expect(detector.detectSlippageAnomaly('binance', events, now)).toBeNull();
    });

    it('should return null when slippage is normal', () => {
      const events: ExchangeEvent[] = Array.from({ length: 5 }, (_, i) => ({
        id: `s_${i}`,
        exchange: 'binance',
        timestamp: now - i * 1000,
        type: 'order_result' as const,
        slippageActualBps: 5,
        slippageExpectedBps: 5,
        symbol: 'BTC/USDT',
      }));
      expect(detector.detectSlippageAnomaly('binance', events, now)).toBeNull();
    });

    it('should detect slippage anomaly', () => {
      const events: ExchangeEvent[] = Array.from({ length: 5 }, (_, i) => ({
        id: `s_${i}`,
        exchange: 'binance',
        timestamp: now - i * 1000,
        type: 'order_result' as const,
        slippageActualBps: 15,
        slippageExpectedBps: 5,
        symbol: 'BTC/USDT',
      }));
      const result = detector.detectSlippageAnomaly('binance', events, now);
      expect(result).not.toBeNull();
      expect(result!.type).toBe('SLIPPAGE_ANOMALY');
      expect(result!.affectedSymbols).toContain('BTC/USDT');
    });

    it('should skip events with zero expected slippage', () => {
      const events: ExchangeEvent[] = Array.from({ length: 5 }, (_, i) => ({
        id: `s_${i}`,
        exchange: 'binance',
        timestamp: now - i * 1000,
        type: 'order_result' as const,
        slippageActualBps: 15,
        slippageExpectedBps: 0,
        symbol: 'BTC/USDT',
      }));
      expect(detector.detectSlippageAnomaly('binance', events, now)).toBeNull();
    });
  });

  describe('detectLatencyShift', () => {
    it('should return null with insufficient events', () => {
      const events = httpEvents(5, 'binance', now, { responseTimeMs: 500 });
      expect(detector.detectLatencyShift('binance', events, now)).toBeNull();
    });

    it('should return null when latency is stable', () => {
      const events = httpEvents(20, 'binance', now, { responseTimeMs: 50 });
      expect(detector.detectLatencyShift('binance', events, now)).toBeNull();
    });

    it('should detect latency increase', () => {
      const older = Array.from({ length: 10 }, (_, i) => ({
        id: `o_${i}`,
        exchange: 'binance',
        timestamp: now - 200_000 + i * 1000,
        type: 'http_response' as const,
        statusCode: 200,
        responseTimeMs: 50,
      }));
      const recent = Array.from({ length: 10 }, (_, i) => ({
        id: `r_${i}`,
        exchange: 'binance',
        timestamp: now - 10_000 + i * 1000,
        type: 'http_response' as const,
        statusCode: 200,
        responseTimeMs: 250,
      }));
      const result = detector.detectLatencyShift('binance', [...older, ...recent], now);
      expect(result).not.toBeNull();
      expect(result!.type).toBe('LATENCY_SHIFT');
      expect(result!.metrics!.shift).toBeGreaterThan(100);
    });
  });

  describe('analyze', () => {
    it('should return empty array for empty events', () => {
      expect(detector.analyze('binance', [])).toEqual([]);
    });

    it('should run all detectors and aggregate results', () => {
      // Create events that trigger error spike
      const good = httpEvents(90, 'binance', now);
      const bad = httpEvents(10, 'binance', now, { statusCode: 500 });
      const results = detector.analyze('binance', [...good, ...bad]);
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some((r) => r.type === 'ERROR_SPIKE')).toBe(true);
    });
  });
});
