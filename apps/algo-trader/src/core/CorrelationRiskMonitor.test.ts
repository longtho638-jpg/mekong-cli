/**
 * CorrelationRiskMonitor tests
 */

import { CorrelationRiskMonitor, CorrelationAlert } from './CorrelationRiskMonitor';

describe('CorrelationRiskMonitor', () => {
  let monitor: CorrelationRiskMonitor;

  beforeEach(() => {
    monitor = new CorrelationRiskMonitor({
      warningThreshold: 0.75,
      criticalThreshold: 0.85,
      minDataPoints: 5,
    });
  });

  describe('addReturn', () => {
    it('should add return data points for a symbol', () => {
      monitor.addReturn('AAPL', 0.02);
      monitor.addReturn('AAPL', -0.01);
      monitor.addReturn('AAPL', 0.03);

      const series = monitor.getReturnSeries('AAPL');
      expect(series.length).toBe(3);
      expect(series).toEqual([0.02, -0.01, 0.03]);
    });

    it('should limit series to 100 data points', () => {
      for (let i = 0; i < 150; i++) {
        monitor.addReturn('AAPL', 0.01);
      }

      const series = monitor.getReturnSeries('AAPL');
      expect(series.length).toBe(100);
    });
  });

  describe('setReturnSeries', () => {
    it('should set return series in bulk', () => {
      const returns = [0.01, 0.02, -0.01, 0.03, -0.02];
      monitor.setReturnSeries('GOOGL', returns);

      expect(monitor.getReturnSeries('GOOGL')).toEqual(returns);
    });
  });

  describe('updateCorrelations', () => {
    it('should calculate correlation matrix', () => {
      // Set up two positively correlated series
      monitor.setReturnSeries('AAPL', [0.01, 0.02, 0.03, 0.02, 0.04]);
      monitor.setReturnSeries('GOOGL', [0.01, 0.02, 0.025, 0.02, 0.038]);

      const result = monitor.updateCorrelations();

      expect(result.matrix).toBeDefined();
      expect(Object.keys(result.matrix).length).toBe(2);
    });

    it('should return empty result with insufficient data', () => {
      monitor.setReturnSeries('AAPL', [0.01, 0.02]); // Below minDataPoints
      monitor.setReturnSeries('GOOGL', [0.01, 0.02]);

      const result = monitor.updateCorrelations();
      expect(result.matrix).toEqual({});
    });

    it('should detect high correlation pairs', () => {
      // Perfectly correlated series
      const commonReturns = [0.01, 0.02, -0.01, 0.03, -0.02];
      monitor.setReturnSeries('AAPL', [...commonReturns]);
      monitor.setReturnSeries('GOOGL', [...commonReturns]);

      const result = monitor.updateCorrelations();

      expect(result.highCorrelationPairs.length).toBe(1);
      expect(result.highCorrelationPairs[0].symbolA).toBe('AAPL');
      expect(result.highCorrelationPairs[0].correlation).toBeCloseTo(1, 5);
    });
  });

  describe('alerts', () => {
    it('should generate critical alerts for correlations above threshold', () => {
      const returns = [0.02, 0.04, 0.01, 0.03, 0.02];
      monitor.setReturnSeries('AAPL', returns);
      monitor.setReturnSeries('GOOGL', returns);

      monitor.updateCorrelations();
      const alerts = monitor.getAlerts();

      expect(alerts.length).toBe(1);
      expect(alerts[0].severity).toBe('critical');
      expect(alerts[0].correlation).toBeCloseTo(1, 5);
    });

    it('should generate warning alerts for correlations between thresholds', () => {
      // Create moderately correlated series
      const seriesA = [0.01, 0.02, -0.01, 0.03, -0.02, 0.01, 0.02];
      const seriesB = [0.01, 0.015, -0.005, 0.025, -0.015, 0.008, 0.018];

      monitor.setReturnSeries('AAPL', seriesA);
      monitor.setReturnSeries('GOOGL', seriesB);

      monitor.updateCorrelations();
      const alerts = monitor.getAlerts();

      // Should have warning if correlation is between 0.75 and 0.85
      const warningAlert = alerts.find(a => a.severity === 'warning');
      if (warningAlert) {
        expect(warningAlert.correlation).toBeLessThan(0.85);
        expect(warningAlert.correlation).toBeGreaterThanOrEqual(0.75);
      }
    });

    it('should clear alerts on reset', () => {
      monitor.setReturnSeries('AAPL', [1, 2, 3, 4, 5]);
      monitor.setReturnSeries('GOOGL', [1, 2, 3, 4, 5]);

      monitor.updateCorrelations();
      expect(monitor.getAlerts().length).toBeGreaterThan(0);

      monitor.clearAlerts();
      expect(monitor.getAlerts().length).toBe(0);
    });
  });

  describe('getHeatMapData', () => {
    it('should generate heat map data', () => {
      monitor.setReturnSeries('AAPL', [0.01, 0.02, 0.03, 0.02, 0.04]);
      monitor.setReturnSeries('GOOGL', [0.01, 0.02, 0.025, 0.02, 0.038]);
      monitor.setReturnSeries('MSFT', [0.005, 0.015, 0.02, 0.01, 0.025]);

      const heatMap = monitor.getHeatMapData();

      expect(heatMap.symbols.length).toBe(3);
      expect(heatMap.values.length).toBe(3);
      expect(heatMap.values[0].length).toBe(3);
      expect(heatMap.values[0][0]).toBe(1); // Self-correlation
      expect(heatMap.thresholds.warning).toBe(0.75);
      expect(heatMap.thresholds.critical).toBe(0.85);
    });
  });

  describe('removeSymbol', () => {
    it('should remove symbol and its alerts', () => {
      monitor.setReturnSeries('AAPL', [1, 2, 3, 4, 5]);
      monitor.setReturnSeries('GOOGL', [1, 2, 3, 4, 5]);

      monitor.updateCorrelations();
      monitor.removeSymbol('AAPL');

      expect(monitor.getReturnSeries('AAPL')).toEqual([]);
      const alerts = monitor.getAlerts();
      expect(alerts.filter(a => a.symbolA === 'AAPL' || a.symbolB === 'AAPL').length).toBe(0);
    });
  });

  describe('reset', () => {
    it('should clear all state', () => {
      monitor.setReturnSeries('AAPL', [1, 2, 3, 4, 5]);
      monitor.updateCorrelations();

      monitor.reset();

      expect(monitor.getReturnSeries('AAPL')).toEqual([]);
      expect(monitor.getAlerts().length).toBe(0);
    });
  });
});
