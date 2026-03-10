/**
 * Unit Tests: Expired JWT + Quota Exceedance Edge Cases
 */

import { LicenseService, LicenseTier, LicenseError } from './raas-gate';
import { UsageQuotaService, QUOTA_LIMITS, getCurrentPeriod } from './usage-quota';

describe('LicenseService: Expired JWT Edge Cases', () => {
  let licenseService: LicenseService;

  beforeEach(() => {
    licenseService = LicenseService.getInstance();
    licenseService.reset();
  });

  afterEach(() => {
    licenseService.reset();
  });

  test('should reject when license expires mid-session', async () => {
    await licenseService.activateLicense('raas-pro-test', LicenseTier.PRO);
    expect(licenseService.hasTier(LicenseTier.PRO)).toBe(true);

    // Simulate expiration
    // @ts-ignore
    licenseService['validatedLicense'] = {
      valid: true,
      tier: LicenseTier.PRO,
      expiresAt: new Date(Date.now() - 86400000).toISOString(),
      features: ['ml_models'],
    };

    expect(licenseService.isExpired()).toBe(true);
    expect(licenseService.hasTier(LicenseTier.PRO)).toBe(false);
  });

  test('should throw LicenseError with "expired" message', () => {
    // @ts-ignore
    licenseService['validatedLicense'] = {
      valid: true,
      tier: LicenseTier.PRO,
      expiresAt: new Date(Date.now() - 86400000).toISOString(),
      features: [],
    };

    try {
      licenseService.requireTier(LicenseTier.PRO, 'test');
    } catch (error) {
      expect(error).toBeInstanceOf(LicenseError);
      expect((error as LicenseError).message).toContain('EXPIRED');
    }
  });

  test('should handle JWT payload with past exp', () => {
    const expiredPayload = {
      tier: LicenseTier.ENTERPRISE,
      exp: Math.floor(Date.now() / 1000) - 86400,
      features: ['all'],
    };

    // @ts-ignore
    licenseService['validatedLicense'] = {
      valid: true,
      tier: expiredPayload.tier,
      expiresAt: new Date(expiredPayload.exp * 1000).toISOString(),
      features: expiredPayload.features,
    };

    expect(licenseService.isExpired()).toBe(true);
    expect(licenseService.hasTier(LicenseTier.ENTERPRISE)).toBe(false);
  });

  test('should allow access when not expired yet', () => {
    const expiringSoon = new Date(Date.now() + 3600000).toISOString();

    // @ts-ignore
    licenseService['validatedLicense'] = {
      valid: true,
      tier: LicenseTier.PRO,
      expiresAt: expiringSoon,
      features: ['ml_models'],
    };

    expect(licenseService.isExpired()).toBe(false);
    expect(licenseService.hasTier(LicenseTier.PRO)).toBe(true);
  });
});

describe('UsageQuotaService: Quota Exceedance', () => {
  let quotaService: UsageQuotaService;

  beforeEach(() => {
    quotaService = UsageQuotaService.getInstance();
    // @ts-ignore
    quotaService['memoryStorage'].clear();
  });

  test('should increment usage counter', async () => {
    const key = 'test-inc';
    expect(await quotaService.increment(key, 'free')).toBe(1);
    expect(await quotaService.increment(key, 'free')).toBe(2);
  });

  test('should report exceeded at limit', async () => {
    const key = 'test-exceeded';
    const period = getCurrentPeriod();
    const quotaKey = `raas:quota:${key}:${period.start.toISOString().slice(0, 7)}`;
    // @ts-ignore
    quotaService['memoryStorage'].set(quotaKey, { count: QUOTA_LIMITS.free, thresholds: [] });

    const usage = await quotaService.getUsage(key, 'free');
    expect(usage.isExceeded).toBe(true);
    expect(usage.remaining).toBe(0);
  });

  test('should not exceed just below limit', async () => {
    const key = 'test-near';
    const period = getCurrentPeriod();
    const quotaKey = `raas:quota:${key}:${period.start.toISOString().slice(0, 7)}`;
    // @ts-ignore
    quotaService['memoryStorage'].set(quotaKey, { count: QUOTA_LIMITS.free - 1, thresholds: [] });

    const usage = await quotaService.getUsage(key, 'free');
    expect(usage.isExceeded).toBe(false);
    expect(usage.remaining).toBe(1);
  });

  test('should trigger 80% threshold', async () => {
    const key = 'test-80';
    const count = Math.floor(QUOTA_LIMITS.free * 0.8);
    const period = getCurrentPeriod();
    const quotaKey = `raas:quota:${key}:${period.start.toISOString().slice(0, 7)}`;
    // @ts-ignore
    quotaService['memoryStorage'].set(quotaKey, { count, thresholds: [80] });

    const usage = await quotaService.getUsage(key, 'free');
    expect(usage.alertsTriggered).toContain(80);
  });

  test('should trigger all thresholds at 100%', async () => {
    const key = 'test-100';
    const period = getCurrentPeriod();
    const quotaKey = `raas:quota:${key}:${period.start.toISOString().slice(0, 7)}`;
    // @ts-ignore
    quotaService['memoryStorage'].set(quotaKey, { count: QUOTA_LIMITS.free, thresholds: [80, 90, 100] });

    const usage = await quotaService.getUsage(key, 'free');
    expect(usage.alertsTriggered).toEqual([80, 90, 100]);
  });

  test('should clamp negative remaining to 0', async () => {
    const key = 'test-over';
    const period = getCurrentPeriod();
    const quotaKey = `raas:quota:${key}:${period.start.toISOString().slice(0, 7)}`;
    // @ts-ignore
    quotaService['memoryStorage'].set(quotaKey, { count: QUOTA_LIMITS.free + 500, thresholds: [100] });

    const usage = await quotaService.getUsage(key, 'free');
    expect(usage.remaining).toBe(0);
    expect(usage.isExceeded).toBe(true);
  });

  test('should have different limits by tier', async () => {
    const period = getCurrentPeriod();

    const checkTier = async (tier: string, expected: number) => {
      const key = `test-tier-${tier}`;
      const quotaKey = `raas:quota:${key}:${period.start.toISOString().slice(0, 7)}`;
      // @ts-ignore
      quotaService['memoryStorage'].set(quotaKey, { count: 0, thresholds: [] });
      const usage = await quotaService.getUsage(key, tier);
      expect(usage.limit).toBe(expected);
    };

    await checkTier('free', 1000);
    await checkTier('pro', 10000);
    await checkTier('enterprise', 100000);
  });

  test('should reset usage to zero', async () => {
    const key = 'test-reset';
    const period = getCurrentPeriod();
    const quotaKey = `raas:quota:${key}:${period.start.toISOString().slice(0, 7)}`;
    // @ts-ignore
    quotaService['memoryStorage'].set(quotaKey, { count: 500, thresholds: [] });

    await quotaService.reset(key);

    const usage = await quotaService.getUsage(key, 'free');
    expect(usage.used).toBe(0);
    expect(usage.remaining).toBe(usage.limit);
  });
});

describe('Combined: Expired + Exceeded', () => {
  let licenseService: LicenseService;
  let quotaService: UsageQuotaService;

  beforeEach(() => {
    licenseService = LicenseService.getInstance();
    quotaService = UsageQuotaService.getInstance();
    licenseService.reset();
    // @ts-ignore
    quotaService['memoryStorage'].clear();
  });

  test('should block when both expired and exceeded', async () => {
    // Expired license
    // @ts-ignore
    licenseService['validatedLicense'] = {
      valid: true,
      tier: LicenseTier.PRO,
      expiresAt: new Date(Date.now() - 86400000).toISOString(),
      features: [],
    };

    // Exceeded quota
    const key = 'test-both';
    const period = getCurrentPeriod();
    const quotaKey = `raas:quota:${key}:${period.start.toISOString().slice(0, 7)}`;
    // @ts-ignore
    quotaService['memoryStorage'].set(quotaKey, { count: QUOTA_LIMITS.pro + 1, thresholds: [100] });

    expect(licenseService.hasTier(LicenseTier.PRO)).toBe(false);
    expect(await quotaService.isExceeded(key, 'pro')).toBe(true);
  });

  test('should allow when valid but near limit', async () => {
    await licenseService.activateLicense('raas-pro', LicenseTier.PRO);

    const key = 'raas-pro';
    const period = getCurrentPeriod();
    const quotaKey = `raas:quota:${key}:${period.start.toISOString().slice(0, 7)}`;
    // @ts-ignore
    quotaService['memoryStorage'].set(quotaKey, { count: Math.floor(QUOTA_LIMITS.pro * 0.99), thresholds: [] });

    expect(licenseService.hasTier(LicenseTier.PRO)).toBe(true);
    expect(await quotaService.isExceeded(key, 'pro')).toBe(false);
  });
});
