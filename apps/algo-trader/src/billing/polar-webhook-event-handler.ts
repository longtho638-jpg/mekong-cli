/**
 * Polar.sh Webhook Event Handler — processes subscription lifecycle events.
 * Verifies webhook signature, routes events to subscription service.
 * Events: subscription.created, subscription.active, subscription.updated,
 *         subscription.canceled, subscription.revoked, order.created, refund.created
 */

import { createHmac, timingSafeEqual } from 'crypto';
import { z } from 'zod';
import { PolarSubscriptionService, TenantTier } from './polar-subscription-service';
import { LicenseService, LicenseTier } from '../lib/raas-gate';
import { WebhookAuditLogger } from './webhook-audit-logger';
import { restoreAccess } from '../api/middleware/hard-limits-middleware';

const getWebhookSecret = (): string => process.env.POLAR_WEBHOOK_SECRET ?? '';

function mapTenantTierToLicenseTier(tenantTier: TenantTier): LicenseTier {
  switch (tenantTier) {
    case 'pro':
      return LicenseTier.PRO;
    case 'enterprise':
      return LicenseTier.ENTERPRISE;
    default:
      return LicenseTier.FREE;
  }
}

export const PolarWebhookPayloadSchema = z.object({
  type: z.string(),
  data: z.looseObject({
    id: z.string(),
    status: z.string().optional(),
    product_id: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    current_period_end: z.string().nullable().optional(),
    subscription_id: z.string().optional(),
    amount: z.number().optional(),
  }),
});

export type PolarWebhookPayload = z.infer<typeof PolarWebhookPayloadSchema>;

export interface WebhookResult {
  handled: boolean;
  event: string;
  tenantId: string | null;
  tier: TenantTier | null;
  action: 'activated' | 'updated' | 'deactivated' | 'ignored' | 'refunded';
  idempotencyKey?: string;
}

export class PolarWebhookEventHandler {
  private licenseService: LicenseService;
  private subscriptionService: PolarSubscriptionService;
  private auditLogger: WebhookAuditLogger;
  private errorAlerted = false;

  constructor(
    subscriptionService?: PolarSubscriptionService,
    private onTierChange?: (tenantId: string, newTier: TenantTier) => void,
  ) {
    this.licenseService = LicenseService.getInstance();
    this.subscriptionService = subscriptionService ?? PolarSubscriptionService.getInstance();
    this.auditLogger = WebhookAuditLogger.getInstance();
  }

  /**
   * Verify Polar webhook signature (HMAC-SHA256).
   * Returns true if signature valid or no secret configured (dev mode).
   */
  verifySignature(payload: string, signature: string): boolean {
    if (!getWebhookSecret()) {
      return true;
    }

    const expected = createHmac('sha256', getWebhookSecret())
      .update(payload)
      .digest('hex');

    const sigHex = signature.replace('sha256=', '');
    if (expected.length !== sigHex.length) return false;
    return timingSafeEqual(Buffer.from(expected), Buffer.from(sigHex));
  }

  /** Process a webhook event payload with idempotency check. */
  handleEvent(payload: PolarWebhookPayload): WebhookResult {
    const eventId = payload.data.id;
    const tenantId = this.extractTenantId(payload);

    // Idempotency check
    if (eventId && this.auditLogger.isDuplicate(eventId)) {
      return {
        handled: true,
        event: payload.type,
        tenantId,
        tier: null,
        action: 'ignored',
        idempotencyKey: eventId,
      };
    }

    let result: WebhookResult;

    switch (payload.type) {
      case 'subscription.created':
      case 'subscription.active':
        result = this.handleActivation(payload, tenantId);
        break;

      case 'subscription.updated':
        result = this.handleUpdate(payload, tenantId);
        break;

      case 'subscription.canceled':
      case 'subscription.revoked':
        result = this.handleCancellation(tenantId, payload.type);
        break;

      case 'order.created':
        result = this.handleOrderCreated(payload, tenantId);
        break;

      case 'refund.created':
        result = this.handleRefundCreated(payload, tenantId);
        break;

      default:
        result = {
          handled: false,
          event: payload.type,
          tenantId,
          tier: null,
          action: 'ignored',
        };
    }

    // Log event with unified audit logger
    if (eventId) {
      this.auditLogger.logEvent(eventId, payload.type, result.handled ? 'success' : 'ignored', {
        provider: 'polar',
        tenantId,
        success: result.handled,
        idempotencyKey: result.idempotencyKey || eventId,
        extra: { action: result.action, tier: result.tier ?? undefined },
      });
    }

    // Error alerting via shouldAlert()
    if (!result.handled && this.auditLogger.shouldAlert() && !this.errorAlerted) {
      console.error('[PolarWebhook] Error threshold exceeded - immediate attention required');
      this.errorAlerted = true;
    }

    return result;
  }

  private handleActivation(payload: PolarWebhookPayload, tenantId: string | null): WebhookResult {
    if (!tenantId || !payload.data.product_id) {
      return { handled: false, event: payload.type, tenantId, tier: null, action: 'ignored' };
    }

    const tier = this.subscriptionService.getTierByProductId(payload.data.product_id);
    if (!tier) {
      return { handled: false, event: payload.type, tenantId, tier: null, action: 'ignored' };
    }

    this.subscriptionService.activateSubscription(
      tenantId,
      tier,
      payload.data.product_id,
      payload.data.current_period_end ?? null,
    );

    const licenseTier = mapTenantTierToLicenseTier(tier);
    this.licenseService.activateSubscription(tenantId, licenseTier, payload.data.id || payload.data.product_id);

    // Restore access if previously suspended due to quota exceeded
    restoreAccess(tenantId);

    this.onTierChange?.(tenantId, tier);

    return { handled: true, event: payload.type, tenantId, tier, action: 'activated' };
  }

  private handleUpdate(payload: PolarWebhookPayload, tenantId: string | null): WebhookResult {
    if (!tenantId || !payload.data.product_id) {
      return { handled: false, event: payload.type, tenantId, tier: null, action: 'ignored' };
    }

    const tier = this.subscriptionService.getTierByProductId(payload.data.product_id);
    if (!tier) {
      return { handled: false, event: payload.type, tenantId, tier: null, action: 'ignored' };
    }

    this.subscriptionService.activateSubscription(
      tenantId,
      tier,
      payload.data.product_id,
      payload.data.current_period_end ?? null,
    );

    const licenseTier = mapTenantTierToLicenseTier(tier);
    this.licenseService.activateSubscription(tenantId, licenseTier, payload.data.id || payload.data.product_id);

    // Restore access if previously suspended (e.g., payment succeeded after dunning)
    restoreAccess(tenantId);

    this.onTierChange?.(tenantId, tier);

    return { handled: true, event: payload.type, tenantId, tier, action: 'updated' };
  }

  private handleCancellation(tenantId: string | null, event: string): WebhookResult {
    if (!tenantId) {
      return { handled: false, event, tenantId, tier: null, action: 'ignored' };
    }

    this.subscriptionService.deactivateSubscription(tenantId);
    this.licenseService.deactivateSubscription(tenantId);
    this.onTierChange?.(tenantId, 'free');

    return { handled: true, event, tenantId, tier: 'free', action: 'deactivated' };
  }

  private handleOrderCreated(payload: PolarWebhookPayload, tenantId: string | null): WebhookResult {
    if (!tenantId || !payload.data.product_id) {
      return { handled: false, event: 'order.created', tenantId, tier: null, action: 'ignored' };
    }

    const tier = this.subscriptionService.getTierByProductId(payload.data.product_id);
    if (!tier) {
      return { handled: false, event: 'order.created', tenantId, tier: null, action: 'ignored' };
    }

    // One-time purchase = activate for lifetime (no period end)
    this.subscriptionService.activateSubscription(tenantId, tier, payload.data.product_id, null);

    const licenseTier = mapTenantTierToLicenseTier(tier);
    this.licenseService.activateSubscription(tenantId, licenseTier, payload.data.id || payload.data.product_id);

    // Restore access if previously suspended
    restoreAccess(tenantId);

    // Log order with unified audit logger
    this.auditLogger.logEvent(payload.data.id || 'unknown_order', 'order.created', 'success', {
      provider: 'polar',
      tenantId,
      success: true,
      idempotencyKey: payload.data.id,
      extra: { orderId: payload.data.id, productId: payload.data.product_id, action: 'activated', tier },
    });

    this.onTierChange?.(tenantId, tier);

    return { handled: true, event: 'order.created', tenantId, tier, action: 'activated' };
  }

  private handleRefundCreated(payload: PolarWebhookPayload, tenantId: string | null): WebhookResult {
    if (!tenantId) {
      return { handled: false, event: 'refund.created', tenantId, tier: null, action: 'ignored' };
    }

    const subscriptionId = payload.data.subscription_id || payload.data.id;

    // Deactivate subscription
    this.subscriptionService.deactivateSubscription(tenantId);
    this.licenseService.deactivateSubscription(tenantId);
    this.onTierChange?.(tenantId, 'free');

    // Log refund alert with unified audit logger
    const amount = payload.data.amount || 0;
    this.auditLogger.logEvent(payload.data.id || `refund_${subscriptionId}`, 'refund.created', 'success', {
      provider: 'polar',
      tenantId,
      success: true,
      idempotencyKey: subscriptionId,
      extra: { subscriptionId, amount, refundEvent: true, action: 'refunded', tier: 'free' as TenantTier },
    });

    console.warn('[PolarWebhook] REFUND ALERT', JSON.stringify({
      tenantId,
      subscriptionId,
      amount,
      timestamp: new Date().toISOString(),
    }));

    return { handled: true, event: 'refund.created', tenantId, tier: 'free', action: 'refunded' };
  }

  private extractTenantId(payload: PolarWebhookPayload): string | null {
    const metadata = payload.data.metadata;
    if (metadata && typeof metadata.tenantId === 'string') {
      return metadata.tenantId;
    }
    return null;
  }
}
