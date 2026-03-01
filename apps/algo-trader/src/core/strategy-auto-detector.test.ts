import { StrategyAutoDetector } from './strategy-auto-detector';

describe('StrategyAutoDetector', () => {
  let detector: StrategyAutoDetector;

  beforeEach(() => {
    detector = new StrategyAutoDetector();
  });

  describe('detection', () => {
    it('should detect explicit type with highest confidence', () => {
      const result = detector.detect({ type: 'arbitrage' });
      expect(result.type).toBe('arbitrage');
      expect(result.confidence).toBe(1.0);
      expect(result.provider).toBe('explicit-type');
    });

    it('should detect trend from SMA indicators', () => {
      const result = detector.detect({ indicators: ['SMA', 'EMA'] });
      expect(result.type).toBe('trend');
      expect(result.confidence).toBe(0.7);
    });

    it('should detect momentum from RSI', () => {
      const result = detector.detect({ indicators: ['RSI'] });
      expect(result.type).toBe('momentum');
    });

    it('should detect arbitrage from multi-exchange config', () => {
      const result = detector.detect({
        indicators: ['hurst'],
        exchanges: ['binance', 'okx'],
      });
      expect(result.type).toBe('arbitrage');
    });

    it('should detect mean-reversion from zscore', () => {
      const result = detector.detect({ indicators: ['zscore', 'correlation'] });
      expect(result.type).toBe('mean-reversion');
    });

    it('should detect composite from RSI+MACD', () => {
      const result = detector.detect({ indicators: ['RSI', 'MACD'] });
      expect(result.type).toBe('composite');
    });

    it('should detect from strategy name', () => {
      const result = detector.detect({ name: 'MeanRevert-BTC-ETH' });
      expect(result.type).toBe('mean-reversion');
    });

    it('should return unknown when no match', () => {
      const result = detector.detect({});
      expect(result.type).toBe('unknown');
      expect(result.confidence).toBe(0);
    });

    it('should prioritize explicit type over heuristics', () => {
      const result = detector.detect({
        type: 'trend',
        indicators: ['RSI'], // Would match momentum
        name: 'ArbitrageBot', // Would match arbitrage
      });
      expect(result.type).toBe('trend');
      expect(result.provider).toBe('explicit-type');
    });
  });

  describe('build plan', () => {
    it('should generate standard phases', () => {
      const plan = detector.generateBuildPlan({
        name: 'TestStrategy',
        type: 'trend',
      });
      expect(plan.strategyType).toBe('trend');
      expect(plan.phases.length).toBeGreaterThanOrEqual(4);
      expect(plan.phases[0].id).toBe('init');
    });

    it('should add exchange-connectivity phase for arbitrage', () => {
      const plan = detector.generateBuildPlan({
        type: 'arbitrage',
        exchanges: ['binance', 'okx'],
      });
      const phaseIds = plan.phases.map(p => p.id);
      expect(phaseIds).toContain('exchange-connectivity');
    });

    it('should NOT add exchange-connectivity for non-arb', () => {
      const plan = detector.generateBuildPlan({ type: 'trend' });
      const phaseIds = plan.phases.map(p => p.id);
      expect(phaseIds).not.toContain('exchange-connectivity');
    });
  });

  describe('execute plan', () => {
    it('should execute all phases sequentially', async () => {
      const plan = detector.generateBuildPlan({
        name: 'RsiSma',
        type: 'trend',
        indicators: ['RSI', 'SMA'],
      });

      const results = await detector.executePlan(plan);
      expect(results.length).toBeGreaterThanOrEqual(4);
      expect(results.every(r => r.status === 'success')).toBe(true);
    });

    it('should stop on gate failure', async () => {
      const plan = detector.generateBuildPlan({
        // No name or indicators → validate-config will fail gate
        type: 'trend',
      });
      // Override validate-config to force fail
      const validatePhase = plan.phases.find(p => p.id === 'validate-config');
      if (validatePhase) {
        validatePhase.execute = async () => ({
          phaseId: 'validate-config',
          status: 'failed',
          metrics: { valid: 0 },
        });
      }

      const results = await detector.executePlan(plan);
      const failed = results.find(r => r.status === 'failed');
      expect(failed).toBeDefined();
    });
  });

  describe('custom detectors', () => {
    it('should accept custom detectors', () => {
      detector.addDetector({
        name: 'custom',
        priority: 200, // Highest priority
        detect: (config) => {
          if (config.name === 'CustomBot') {
            return { type: 'composite', confidence: 1.0, provider: 'custom', markers: ['custom'] };
          }
          return null;
        },
      });

      const result = detector.detect({ name: 'CustomBot', type: 'trend' });
      expect(result.type).toBe('composite'); // Custom wins over explicit
      expect(result.provider).toBe('custom');
    });
  });
});
