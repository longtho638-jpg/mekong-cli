/**
 * Trade Metering Service Tests
 *
 * Tests for daily tier-based usage tracking for trades, signals, and API calls.
 */

import { TradeMeteringService, TIER_LIMITS, LicenseTier, LimitAlert } from '../../src/metering/trade-metering';

describe('TradeMeteringService', () => {
  let metering: TradeMeteringService;

  beforeEach(() => {
    // Reset singleton for clean test state
    TradeMeteringService.resetInstance();
    metering = TradeMeteringService.getInstance();
  });

  afterEach(() => {
    metering.clear();
  });

  describe('Singleton pattern', () => {
    it('should return same instance from getInstance', () => {
      const instance1 = TradeMeteringService.getInstance();
      const instance2 = TradeMeteringService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should create new instance after reset', () => {
      const instance1 = TradeMeteringService.getInstance();
      TradeMeteringService.resetInstance();
      const instance2 = TradeMeteringService.getInstance();
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('Tier management', () => {
    it('should default to FREE tier for unknown users', () => {
      const tier = metering.getUserTier('unknown-user');
      expect(tier).toBe(LicenseTier.FREE);
    });

    it('should set and get user tier', () => {
      metering.setUserTier('user-1', LicenseTier.PRO);
      expect(metering.getUserTier('user-1')).toBe(LicenseTier.PRO);
    });

    it('should override tier when set multiple times', () => {
      metering.setUserTier('user-1', LicenseTier.PRO);
      metering.setUserTier('user-1', LicenseTier.ENTERPRISE);
      expect(metering.getUserTier('user-1')).toBe(LicenseTier.ENTERPRISE);
    });
  });

  describe('TIER_LIMITS configuration', () => {
    it('should have correct FREE tier limits', () => {
      const limits = TIER_LIMITS[LicenseTier.FREE];
      expect(limits.tradesPerDay).toBe(5);
      expect(limits.signalsPerDay).toBe(3);
      expect(limits.apiCallsPerDay).toBe(100);
    });

    it('should have unlimited trades for PRO tier', () => {
      const limits = TIER_LIMITS[LicenseTier.PRO];
      expect(limits.tradesPerDay).toBe(-1);
      expect(limits.signalsPerDay).toBe(-1);
    });

    it('should have unlimited trades for ENTERPRISE tier', () => {
      const limits = TIER_LIMITS[LicenseTier.ENTERPRISE];
      expect(limits.tradesPerDay).toBe(-1);
      expect(limits.signalsPerDay).toBe(-1);
    });
  });

  describe('trackTrade - FREE tier', () => {
    it('should allow trades within daily limit', async () => {
      metering.setUserTier('user-1', LicenseTier.FREE);

      for (let i = 0; i < 5; i++) {
        const allowed = await metering.trackTrade('user-1');
        expect(allowed).toBe(true);
      }
    });

    it('should reject trades after exceeding daily limit', async () => {
      metering.setUserTier('user-1', LicenseTier.FREE);

      // Use all 5 trades
      for (let i = 0; i < 5; i++) {
        await metering.trackTrade('user-1');
      }

      // 6th trade should be rejected
      const allowed = await metering.trackTrade('user-1');
      expect(allowed).toBe(false);
    });

    it('should track trades per user independently', async () => {
      metering.setUserTier('user-1', LicenseTier.FREE);
      metering.setUserTier('user-2', LicenseTier.FREE);

      // User 1 uses all trades
      for (let i = 0; i < 5; i++) {
        await metering.trackTrade('user-1');
      }

      // User 2 should still have trades available
      const allowed = await metering.trackTrade('user-2');
      expect(allowed).toBe(true);
    });
  });

  describe('trackTrade - PRO tier', () => {
    it('should allow unlimited trades for PRO tier', async () => {
      metering.setUserTier('user-pro', LicenseTier.PRO);

      // Try 100 trades
      for (let i = 0; i < 100; i++) {
        const allowed = await metering.trackTrade('user-pro');
        expect(allowed).toBe(true);
      }
    });
  });

  describe('trackSignal - FREE tier', () => {
    it('should allow signals within daily limit', async () => {
      metering.setUserTier('user-1', LicenseTier.FREE);

      for (let i = 0; i < 3; i++) {
        const allowed = await metering.trackSignal('user-1');
        expect(allowed).toBe(true);
      }
    });

    it('should reject signals after exceeding daily limit', async () => {
      metering.setUserTier('user-1', LicenseTier.FREE);

      // Use all 3 signals
      for (let i = 0; i < 3; i++) {
        await metering.trackSignal('user-1');
      }

      // 4th signal should be rejected
      const allowed = await metering.trackSignal('user-1');
      expect(allowed).toBe(false);
    });
  });

  describe('trackApiCall - FREE tier', () => {
    it('should allow API calls within daily limit', async () => {
      metering.setUserTier('user-1', LicenseTier.FREE);

      for (let i = 0; i < 100; i++) {
        const allowed = await metering.trackApiCall('user-1');
        expect(allowed).toBe(true);
      }
    });

    it('should reject API calls after exceeding daily limit', async () => {
      metering.setUserTier('user-1', LicenseTier.FREE);

      // Use all 100 API calls
      for (let i = 0; i < 100; i++) {
        await metering.trackApiCall('user-1');
      }

      // 101st API call should be rejected
      const allowed = await metering.trackApiCall('user-1');
      expect(allowed).toBe(false);
    });
  });

  describe('getUsageStatus', () => {
    it('should return correct usage status for FREE tier', () => {
      metering.setUserTier('user-1', LicenseTier.FREE);

      const status = metering.getUsageStatus('user-1');

      expect(status.userId).toBe('user-1');
      expect(status.tier).toBe(LicenseTier.FREE);
      expect(status.trades.used).toBe(0);
      expect(status.trades.limit).toBe(5);
      expect(status.trades.remaining).toBe(5);
      expect(status.signals.used).toBe(0);
      expect(status.signals.limit).toBe(3);
      expect(status.apiCalls.used).toBe(0);
      expect(status.apiCalls.limit).toBe(100);
    });

    it('should show unlimited for PRO tier', () => {
      metering.setUserTier('user-pro', LicenseTier.PRO);

      const status = metering.getUsageStatus('user-pro');

      expect(status.trades.limit).toBe('Unlimited');
      expect(status.signals.limit).toBe('Unlimited');
      expect(status.apiCalls.limit).toBe(10000);
    });

    it('should update usage after tracking', async () => {
      metering.setUserTier('user-1', LicenseTier.FREE);

      await metering.trackTrade('user-1');
      await metering.trackSignal('user-1');
      await metering.trackApiCall('user-1');

      const status = metering.getUsageStatus('user-1');

      expect(status.trades.used).toBe(1);
      expect(status.signals.used).toBe(1);
      expect(status.apiCalls.used).toBe(1);
    });

    it('should calculate percentUsed correctly', async () => {
      metering.setUserTier('user-1', LicenseTier.FREE);

      // Use 2 out of 5 trades = 40%
      await metering.trackTrade('user-1');
      await metering.trackTrade('user-1');

      const status = metering.getUsageStatus('user-1');
      expect(status.trades.percentUsed).toBe(40);
    });

    it('should set isExceeded when limit reached', async () => {
      metering.setUserTier('user-1', LicenseTier.FREE);

      for (let i = 0; i < 5; i++) {
        await metering.trackTrade('user-1');
      }

      const status = metering.getUsageStatus('user-1');
      expect(status.trades.isExceeded).toBe(true);
      expect(status.canTrade).toBe(false);
    });
  });

  describe('Upgrade prompt', () => {
    it('should show upgrade prompt for FREE tier when exceeded', async () => {
      metering.setUserTier('user-1', LicenseTier.FREE);

      // Exceed trade limit
      for (let i = 0; i < 5; i++) {
        await metering.trackTrade('user-1');
      }

      const status = metering.getUsageStatus('user-1');

      expect(status.upgradePrompt).toBeDefined();
      expect(status.upgradePrompt?.title).toContain('Upgrade');
    });

    it('should not show upgrade prompt for PRO tier', async () => {
      metering.setUserTier('user-pro', LicenseTier.PRO);

      for (let i = 0; i < 100; i++) {
        await metering.trackTrade('user-pro');
      }

      const status = metering.getUsageStatus('user-pro');
      expect(status.upgradePrompt).toBeUndefined();
    });

    it('should not show upgrade prompt when within limits', () => {
      metering.setUserTier('user-1', LicenseTier.FREE);

      const status = metering.getUsageStatus('user-1');
      expect(status.upgradePrompt).toBeUndefined();
    });
  });

  describe('hasExceeded* methods', () => {
    it('should return false when not exceeded', async () => {
      metering.setUserTier('user-1', LicenseTier.FREE);

      expect(metering.hasExceededTradeLimit('user-1')).toBe(false);
      expect(metering.hasExceededSignalLimit('user-1')).toBe(false);
      expect(metering.hasExceededApiCallLimit('user-1')).toBe(false);
    });

    it('should return true when trade limit exceeded', async () => {
      metering.setUserTier('user-1', LicenseTier.FREE);

      for (let i = 0; i < 5; i++) {
        await metering.trackTrade('user-1');
      }

      expect(metering.hasExceededTradeLimit('user-1')).toBe(true);
    });

    it('should return true when signal limit exceeded', async () => {
      metering.setUserTier('user-1', LicenseTier.FREE);

      for (let i = 0; i < 3; i++) {
        await metering.trackSignal('user-1');
      }

      expect(metering.hasExceededSignalLimit('user-1')).toBe(true);
    });

    it('should return true when API call limit exceeded', async () => {
      metering.setUserTier('user-1', LicenseTier.FREE);

      for (let i = 0; i < 100; i++) {
        await metering.trackApiCall('user-1');
      }

      expect(metering.hasExceededApiCallLimit('user-1')).toBe(true);
    });
  });

  describe('getOverageUsers', () => {
    it('should return empty array when no users in overage', () => {
      metering.setUserTier('user-1', LicenseTier.FREE);

      const overageUsers = metering.getOverageUsers();
      expect(overageUsers).toHaveLength(0);
    });

    it('should return users who exceeded limits', async () => {
      metering.setUserTier('user-1', LicenseTier.FREE);

      // Exceed trade limit
      for (let i = 0; i < 5; i++) {
        await metering.trackTrade('user-1');
      }

      const overageUsers = metering.getOverageUsers();
      expect(overageUsers.length).toBeGreaterThan(0);
      expect(overageUsers[0].userId).toBe('user-1');
    });
  });

  describe('resetUsage', () => {
    it('should reset usage for a user', async () => {
      metering.setUserTier('user-1', LicenseTier.FREE);

      // Use some trades
      for (let i = 0; i < 3; i++) {
        await metering.trackTrade('user-1');
      }

      // Reset
      metering.resetUsage('user-1');

      // Check usage is reset
      const status = metering.getUsageStatus('user-1');
      expect(status.trades.used).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear all usage data', async () => {
      metering.setUserTier('user-1', LicenseTier.FREE);
      metering.setUserTier('user-2', LicenseTier.PRO);

      await metering.trackTrade('user-1');
      await metering.trackTrade('user-2');

      metering.clear();

      expect(metering.getTotalRecords()).toBe(0);
    });
  });

  describe('getTotalRecords', () => {
    it('should return number of stored records', async () => {
      metering.setUserTier('user-1', LicenseTier.FREE);
      metering.setUserTier('user-2', LicenseTier.PRO);

      await metering.trackTrade('user-1');
      await metering.trackTrade('user-2');

      expect(metering.getTotalRecords()).toBe(2);
    });
  });

  describe('Alert events', () => {
    it('should emit threshold_alert when reaching 80%', async () => {
      metering.setUserTier('user-1', LicenseTier.FREE);

      const alertPromise = new Promise<LimitAlert>((resolve) => {
        metering.once('threshold_alert', (alert) => {
          resolve(alert as LimitAlert);
        });
      });

      // 4 out of 5 trades = 80%
      for (let i = 0; i < 4; i++) {
        await metering.trackTrade('user-1');
      }

      const alert = await alertPromise;
      expect(alert).toBeDefined();
      expect(alert.threshold).toBe(80);
    });

    it('should emit threshold_alert when reaching 100%', async () => {
      metering.setUserTier('user-2', LicenseTier.FREE);

      const alertPromise = new Promise<LimitAlert>((resolve) => {
        const thresholds: number[] = [];
        metering.on('threshold_alert', (alert: unknown) => {
          thresholds.push((alert as LimitAlert).threshold);
          if ((alert as LimitAlert).threshold === 100) {
            resolve(alert as LimitAlert);
          }
        });
      });

      // Use all 5 trades - will trigger 80%, 90%, and 100%
      for (let i = 0; i < 5; i++) {
        await metering.trackTrade('user-2');
      }

      const alert = await alertPromise;
      expect(alert).toBeDefined();
      expect(alert.threshold).toBe(100);
    });
  });
});
