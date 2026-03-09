/**
 * Dunning Cron Jobs Integration Tests
 *
 * Tests for dunning grace period and suspension processors.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { processGracePeriodTimeouts } from '../../src/jobs/dunning-grace-period-processor';
import { processSuspensionTimeouts } from '../../src/jobs/dunning-suspension-processor';
import { DunningStateMachine } from '../../src/billing/dunning-state-machine';
import { PrismaClient, DunningStatus } from '@prisma/client';

const prisma = new PrismaClient();

describe('Dunning Cron Jobs', () => {
  let dunningMachine: DunningStateMachine;

  beforeEach(async () => {
    dunningMachine = DunningStateMachine.getInstance();
    await dunningMachine.reset();
  });

  afterEach(async () => {
    await dunningMachine.shutdown();
  });

  describe('processGracePeriodTimeouts', () => {
    it('should suspend accounts that exceeded grace period', async () => {
      // Create a test tenant in GRACE_PERIOD with old payment failed date
      const oldDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago

      await prisma.dunningState.create({
        data: {
          tenantId: 'test-grace-001',
          status: DunningStatus.GRACE_PERIOD,
          failedPayments: 1,
          lastPaymentFailedAt: oldDate,
        },
      });

      const result = await processGracePeriodTimeouts();

      expect(result.processed).toBe(1);
      expect(result.tenantIds).toContain('test-grace-001');

      // Verify state changed to SUSPENDED
      const state = await prisma.dunningState.findUnique({
        where: { tenantId: 'test-grace-001' },
      });
      expect(state?.status).toBe(DunningStatus.SUSPENDED);
    });

    it('should not suspend accounts still within grace period', async () => {
      // Create a test tenant in GRACE_PERIOD with recent payment failed date
      const recentDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago

      await prisma.dunningState.create({
        data: {
          tenantId: 'test-grace-002',
          status: DunningStatus.GRACE_PERIOD,
          failedPayments: 1,
          lastPaymentFailedAt: recentDate,
        },
      });

      const result = await processGracePeriodTimeouts();

      expect(result.processed).toBe(0);
      expect(result.tenantIds).not.toContain('test-grace-002');

      // Verify state unchanged
      const state = await prisma.dunningState.findUnique({
        where: { tenantId: 'test-grace-002' },
      });
      expect(state?.status).toBe(DunningStatus.GRACE_PERIOD);
    });

    it('should handle multiple tenants', async () => {
      const oldDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      const recentDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      await prisma.dunningState.createMany({
        data: [
          {
            tenantId: 'test-grace-003',
            status: DunningStatus.GRACE_PERIOD,
            failedPayments: 1,
            lastPaymentFailedAt: oldDate,
          },
          {
            tenantId: 'test-grace-004',
            status: DunningStatus.GRACE_PERIOD,
            failedPayments: 1,
            lastPaymentFailedAt: oldDate,
          },
          {
            tenantId: 'test-grace-005',
            status: DunningStatus.GRACE_PERIOD,
            failedPayments: 1,
            lastPaymentFailedAt: recentDate,
          },
        ],
      });

      const result = await processGracePeriodTimeouts();

      expect(result.processed).toBe(2);
      expect(result.tenantIds).toContain('test-grace-003');
      expect(result.tenantIds).toContain('test-grace-004');
      expect(result.tenantIds).not.toContain('test-grace-005');
    });
  });

  describe('processSuspensionTimeouts', () => {
    it('should revoke accounts that exceeded suspension period', async () => {
      // Create a test tenant in SUSPENDED with old suspended date
      const oldDate = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000); // 20 days ago

      await prisma.dunningState.create({
        data: {
          tenantId: 'test-suspend-001',
          status: DunningStatus.SUSPENDED,
          failedPayments: 1,
          suspendedAt: oldDate,
        },
      });

      const result = await processSuspensionTimeouts();

      expect(result.processed).toBe(1);
      expect(result.tenantIds).toContain('test-suspend-001');

      // Verify state changed to REVOKED
      const state = await prisma.dunningState.findUnique({
        where: { tenantId: 'test-suspend-001' },
      });
      expect(state?.status).toBe(DunningStatus.REVOKED);
    });

    it('should not revoke accounts still within suspension period', async () => {
      // Create a test tenant in SUSPENDED with recent suspended date
      const recentDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago

      await prisma.dunningState.create({
        data: {
          tenantId: 'test-suspend-002',
          status: DunningStatus.SUSPENDED,
          failedPayments: 1,
          suspendedAt: recentDate,
        },
      });

      const result = await processSuspensionTimeouts();

      expect(result.processed).toBe(0);
      expect(result.tenantIds).not.toContain('test-suspend-002');

      // Verify state unchanged
      const state = await prisma.dunningState.findUnique({
        where: { tenantId: 'test-suspend-002' },
      });
      expect(state?.status).toBe(DunningStatus.SUSPENDED);
    });
  });
});
