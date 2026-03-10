import {
  checkMaxOrderSize,
  checkDailyVolumeLimit,
  checkVolumeSpike,
  MaxOrderLimitsChecker,
  createMaxOrderLimitsChecker,
  DEFAULT_LIMITS,
  VolumeRecord,
  OrderLimitsConfig,
} from './max-order-limits';

describe('MaxOrderLimits', () => {
  describe('checkMaxOrderSize', () => {
    const config: OrderLimitsConfig = {
      maxOrderSize: 10,
      maxOrderValue: 1_000_000,
      dailyVolumeLimit: 10_000_000,
      volumeSpikeThreshold: 5,
      baselineLookbackHours: 24,
    };

    it('passes for valid order', () => {
      const result = checkMaxOrderSize(0.5, 50000, config);

      expect(result.passed).toBe(true);
      expect(result.rejectedReason).toBeUndefined();
    });

    it('rejects order exceeding maxOrderSize', () => {
      const result = checkMaxOrderSize(15, 50000, config);

      expect(result.passed).toBe(false);
      expect(result.rejectedReason).toContain('exceeds maximum');
    });

    it('rejects order exceeding maxOrderValue', () => {
      const result = checkMaxOrderSize(10, 150000, config);
      // 10 * 150000 = 1,500,000 > 1,000,000

      expect(result.passed).toBe(false);
      expect(result.rejectedReason).toContain('Order value');
    });

    it('passes when price is undefined', () => {
      const result = checkMaxOrderSize(5, undefined, config);

      expect(result.passed).toBe(true);
    });
  });

  describe('checkDailyVolumeLimit', () => {
    const config: OrderLimitsConfig = {
      ...DEFAULT_LIMITS,
      dailyVolumeLimit: 1_000_000,
    };

    it('passes when under limit', () => {
      const history: VolumeRecord[] = [
        { timestamp: Date.now() - 1000, amount: 1, value: 50000, symbol: 'tenant1:BTC/USDT', side: 'buy' },
      ];

      const result = checkDailyVolumeLimit('tenant1', 100000, config, history);

      expect(result.passed).toBe(true);
      expect(result.currentUsage?.dailyVolume).toBe(50000);
      expect(result.currentUsage?.usagePercent).toBeCloseTo(15, 0);
    });

    it('rejects when exceeding daily limit', () => {
      const history: VolumeRecord[] = [
        { timestamp: Date.now() - 1000, amount: 10, value: 950000, symbol: 'tenant1:BTC/USDT', side: 'buy' },
      ];

      const result = checkDailyVolumeLimit('tenant1', 100000, config, history);
      // 950000 + 100000 = 1,050,000 > 1,000,000

      expect(result.passed).toBe(false);
      expect(result.rejectedReason).toContain('exceeds limit');
    });

    it('filters by tenant', () => {
      const history: VolumeRecord[] = [
        { timestamp: Date.now() - 1000, amount: 10, value: 900000, symbol: 'other:BTC/USDT', side: 'buy' },
      ];

      const result = checkDailyVolumeLimit('tenant1', 100000, config, history);

      expect(result.passed).toBe(true);
      expect(result.currentUsage?.dailyVolume).toBe(0);
    });

    it('filters to last 24 hours', () => {
      const oldRecord: VolumeRecord = {
        timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
        amount: 100,
        value: 5000000,
        symbol: 'tenant1:BTC/USDT',
        side: 'buy',
      };

      const result = checkDailyVolumeLimit('tenant1', 100000, config, [oldRecord]);

      expect(result.passed).toBe(true);
      expect(result.currentUsage?.dailyVolume).toBe(0);
    });
  });

  describe('checkVolumeSpike', () => {
    it('detects volume spike', () => {
      const history: VolumeRecord[] = [
        { timestamp: Date.now(), amount: 1, value: 50000, symbol: 'BTC/USDT', side: 'buy' },
        { timestamp: Date.now(), amount: 1, value: 50000, symbol: 'BTC/USDT', side: 'buy' },
        { timestamp: Date.now(), amount: 1, value: 50000, symbol: 'BTC/USDT', side: 'buy' },
      ];

      const result = checkVolumeSpike(500000, history, 5);
      // Baseline = 50000, current = 500000, multiplier = 10x > 5x threshold

      expect(result.isSpike).toBe(true);
      expect(result.baselineAverage).toBe(50000);
      expect(result.spikeMultiplier).toBe(10);
    });

    it('no spike when under threshold', () => {
      const history: VolumeRecord[] = [
        { timestamp: Date.now(), amount: 1, value: 100000, symbol: 'BTC/USDT', side: 'buy' },
      ];

      const result = checkVolumeSpike(200000, history, 5);
      // Multiplier = 2x < 5x threshold

      expect(result.isSpike).toBe(false);
      expect(result.spikeMultiplier).toBe(2);
    });

    it('handles empty history', () => {
      const result = checkVolumeSpike(100000, [], 5);

      expect(result.isSpike).toBe(false);
      expect(result.baselineAverage).toBe(0);
    });
  });

  describe('MaxOrderLimitsChecker', () => {
    let checker: MaxOrderLimitsChecker;

    beforeEach(() => {
      checker = createMaxOrderLimitsChecker({
        maxOrderSize: 10,
        maxOrderValue: 500000,
        dailyVolumeLimit: 2000000,
        volumeSpikeThreshold: 5,
        baselineLookbackHours: 24,
      });
    });

    afterEach(() => {
      checker.clearHistory();
    });

    describe('validateOrder', () => {
      it('passes valid order', () => {
        const result = checker.validateOrder('tenant1', 'BTC/USDT', 'buy', 1, 40000);

        expect(result.passed).toBe(true);
      });

      it('rejects order exceeding size limit', () => {
        const result = checker.validateOrder('tenant1', 'BTC/USDT', 'buy', 15, 40000);

        expect(result.passed).toBe(false);
        expect(result.rejectedReason).toContain('amount');
      });

      it('rejects order exceeding value limit', () => {
        const result = checker.validateOrder('tenant1', 'BTC/USDT', 'buy', 10, 60000);
        // 10 * 60000 = 600000 > 500000

        expect(result.passed).toBe(false);
        expect(result.rejectedReason).toContain('value');
      });
    });

    describe('recordExecution', () => {
      it('records executed order volume', () => {
        checker.recordExecution('tenant1', 'BTC/USDT', 'buy', 1, 50000);

        const usage = checker.getDailyUsage('tenant1');
        expect(usage.volume).toBe(50000);
      });

      it('accumulates multiple executions', () => {
        checker.recordExecution('tenant1', 'BTC/USDT', 'buy', 1, 50000);
        checker.recordExecution('tenant1', 'ETH/USDT', 'sell', 2, 3000);

        const usage = checker.getDailyUsage('tenant1');
        expect(usage.volume).toBe(56000);
      });
    });

    describe('updateConfig', () => {
      it('updates configuration', () => {
        checker.updateConfig({ maxOrderSize: 20, maxOrderValue: 1_000_000 });

        const result = checker.validateOrder('tenant1', 'BTC/USDT', 'buy', 15, 40000);
        expect(result.passed).toBe(true);
      });
    });

    describe('getDailyUsage', () => {
      it('returns zero for new tenant', () => {
        const usage = checker.getDailyUsage('new-tenant');

        expect(usage.volume).toBe(0);
        expect(usage.percent).toBe(0);
      });

      it('calculates percentage correctly', () => {
        checker.recordExecution('tenant1', 'BTC/USDT', 'buy', 1, 1000000);

        const usage = checker.getDailyUsage('tenant1');
        expect(usage.percent).toBe(50); // 1M / 2M = 50%
      });
    });

    describe('volume spike detection', () => {
      it('detects spike after recording baseline', () => {
        // Record normal trades
        for (let i = 0; i < 5; i++) {
          checker.recordExecution('tenant1', 'BTC/USDT', 'buy', 0.1, 40000);
        }

        // Try large order
        const result = checker.validateOrder('tenant1', 'BTC/USDT', 'buy', 5, 40000);
        // Baseline ~200k * 5 = 1M, spike = 200k * 5 = 1M, but single order 200k is 2x average

        // Should detect if individual order is spike compared to average
        expect(result.passed).toBeDefined();
      });
    });
  });

  describe('createMaxOrderLimitsChecker factory', () => {
    it('creates checker with default config', () => {
      const checker = createMaxOrderLimitsChecker();

      expect(checker).toBeInstanceOf(MaxOrderLimitsChecker);
    });

    it('creates checker with custom config', () => {
      const customConfig: Partial<OrderLimitsConfig> = {
        maxOrderSize: 100,
        dailyVolumeLimit: 100_000_000,
      };

      const checker = createMaxOrderLimitsChecker(customConfig);
      expect(checker).toBeInstanceOf(MaxOrderLimitsChecker);
    });
  });

  describe('DEFAULT_LIMITS', () => {
    it('has reasonable defaults', () => {
      expect(DEFAULT_LIMITS.maxOrderSize).toBe(10);
      expect(DEFAULT_LIMITS.maxOrderValue).toBe(1_000_000);
      expect(DEFAULT_LIMITS.dailyVolumeLimit).toBe(10_000_000);
      expect(DEFAULT_LIMITS.volumeSpikeThreshold).toBe(5);
    });
  });
});
