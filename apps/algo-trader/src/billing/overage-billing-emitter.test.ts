/**
 * Overage Billing Emitter Tests
 */

import { OverageBillingEmitter } from './overage-billing-emitter';
import { OverageMeteringService } from './overage-metering-service';
import { UsageTrackerService } from '../metering/usage-tracker-service';

describe('OverageBillingEmitter', () => {
  let emitter: OverageBillingEmitter;

  beforeEach(() => {
    OverageMeteringService.resetInstance();
    UsageTrackerService.resetInstance();
    OverageBillingEmitter.resetInstance();
    emitter = OverageBillingEmitter.getInstance({
      stripeApiKey: 'sk_test_123',
      autoStart: false,
    });
  });

  it('should create singleton instance', () => {
    const instance1 = OverageBillingEmitter.getInstance();
    const instance2 = OverageBillingEmitter.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should start without Stripe key (degraded mode)', () => {
    const emitterNoKey = OverageBillingEmitter.getInstance({
      autoStart: false,
    });
    expect(emitterNoKey).toBeDefined();
  });

  it('should return error when Stripe not configured', async () => {
    const result = await emitter.emitOverageToStripe('lic_test', 'si_test');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should track retry queue', async () => {
    expect(emitter.getRetryQueueSize()).toBe(0);
  });

  it('should not be running initially', () => {
    expect(emitter.isSyncRunning()).toBe(false);
  });

  it('should stop sync', async () => {
    await emitter.stop();
    // Should not throw
  });

  it('should run sync without errors', async () => {
    await emitter.runSync();
    // Should complete without throwing
  });
});
