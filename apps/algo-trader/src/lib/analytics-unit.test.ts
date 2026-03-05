/**
 * Analytics Service Unit Tests
 */

import { AnalyticsService, MetricType } from './analytics';

describe('Analytics Service', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    service = AnalyticsService.getInstance();
    service.reset();
  });

  afterEach(() => {
    service.reset();
  });

  describe('recordMetric', () => {
    test('should record API call metric', () => {
      service.recordMetric('license-123', MetricType.API_CALL, 1);
      const metrics = service.getMetrics('license-123');
      expect(metrics.apiCalls).toBe(1);
    });

    test('should record backtest metric', () => {
      service.recordMetric('license-456', MetricType.BACKTEST, 1);
      const metrics = service.getMetrics('license-456');
      expect(metrics.backtests).toBe(1);
    });

    test('should increment multiple calls', () => {
      service.recordMetric('license-789', MetricType.API_CALL, 1);
      service.recordMetric('license-789', MetricType.API_CALL, 1);
      const metrics = service.getMetrics('license-789');
      expect(metrics.apiCalls).toBe(2);
    });
  });

  describe('getMetrics', () => {
    test('should return zero metrics for new license', () => {
      const metrics = service.getMetrics('new-license');
      expect(metrics.apiCalls).toBe(0);
      expect(metrics.backtests).toBe(0);
    });

    test('should return correct period', () => {
      service.recordMetric('license-period', MetricType.API_CALL, 1);
      const metrics = service.getMetrics('license-period');
      expect(metrics.periodStart).toBeDefined();
      expect(metrics.periodEnd).toBeDefined();
    });
  });

  describe('getSummary', () => {
    test('should return summary with all metrics', () => {
      service.recordMetric('license-summary', MetricType.API_CALL, 10);
      service.recordMetric('license-summary', MetricType.BACKTEST, 5);
      const summary = service.getSummary('license-summary');
      expect(summary.totalApiCalls).toBe(10);
      expect(summary.totalBacktests).toBe(5);
    });
  });

  describe('checkLimit', () => {
    test('should return true when under limit', () => {
      const result = service.checkLimit(50, 100);
      expect(result).toBe(true);
    });

    test('should return false when at limit', () => {
      const result = service.checkLimit(100, 100);
      expect(result).toBe(false);
    });

    test('should return false when over limit', () => {
      const result = service.checkLimit(150, 100);
      expect(result).toBe(false);
    });
  });

  describe('reset', () => {
    test('should clear all metrics', () => {
      service.recordMetric('license-reset', MetricType.API_CALL, 100);
      service.reset();
      const metrics = service.getMetrics('license-reset');
      expect(metrics.apiCalls).toBe(0);
    });
  });
});
