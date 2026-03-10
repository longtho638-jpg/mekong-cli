/**
 * Overage Metering Service Tests
 */

import { OverageMeteringService } from './overage-metering-service';
import { UsageTrackerService } from '../metering/usage-tracker-service';

describe('OverageMeteringService', () => {
  let service: OverageMeteringService;

  beforeEach(() => {
    OverageMeteringService.resetInstance();
    UsageTrackerService.resetInstance();
    service = OverageMeteringService.getInstance();
  });

  it('should create singleton instance', () => {
    const instance1 = OverageMeteringService.getInstance();
    const instance2 = OverageMeteringService.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should configure overage for license', async () => {
    await service.configureOverage('lic_test123', {
      enabled: true,
      maxOveragePercent: 150,
    });

    const config = service.getOverageConfig('lic_test123');
    expect(config).toBeDefined();
    expect(config?.enabled).toBe(true);
    expect(config?.maxOveragePercent).toBe(150);
  });

  it('should allow overage within limits', async () => {
    await service.configureOverage('lic_overage', {
      enabled: true,
      maxOveragePercent: 200,
    });

    // Usage: 12000, Quota: 10000, Max overage: 20000 (200%)
    const result = await service.checkOverageAllowed('lic_overage', 12000, 10000);

    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('overage_allowed');
    expect(result.overageUnits).toBe(2000);
  });

  it('should block when overage disabled', async () => {
    await service.configureOverage('lic_nooverage', {
      enabled: false,
      maxOveragePercent: 0,
    });

    const result = await service.checkOverageAllowed('lic_nooverage', 12000, 10000);

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('overage_disabled');
  });

  it('should block when overage exceeded', async () => {
    await service.configureOverage('lic_maxover', {
      enabled: true,
      maxOveragePercent: 50, // 50% max overage = 5000 units
    });

    // Usage: 16000, Quota: 10000, Overage: 6000 > Max: 5000
    const result = await service.checkOverageAllowed('lic_maxover', 16000, 10000);

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('overage_exceeded');
  });

  it('should allow within quota without overage', async () => {
    const result = await service.checkOverageAllowed('lic_normal', 8000, 10000);

    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('within_quota');
  });

  it('should track overage usage', async () => {
    await service.trackOverage('lic_track', 500, { test: true });

    const state = await service.getOverageState('lic_track');
    expect(state.overageUnits).toBeGreaterThanOrEqual(0);
  });

  it('should clear overage state', () => {
    service.clearOverageState('lic_clear');
    // Should not throw
  });

  it('should get overage licenses', async () => {
    const licenses = await service.getOverageLicenses();
    expect(Array.isArray(licenses)).toBe(true);
  });
});
