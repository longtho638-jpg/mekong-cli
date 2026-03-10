/**
 * Stripe Webhook Event Handler — processes payment and subscription lifecycle events.
 * Verifies webhook signature, routes events to subscription service.
 * Events: checkout.session.completed, customer.subscription.created/updated/deleted,
 *         invoice.payment_succeeded/failed
 */

import { createHmac, timingSafeEqual } from 'crypto';
import { z } from 'zod';
import { PolarSubscriptionService, TenantTier } from './polar-subscription-service';
import { LicenseService, LicenseTier } from '../lib/raas-gate';
import { WebhookAuditLogger } from './webhook-audit-logger';
import { DunningStateMachine } from './dunning-state-machine';

const getWebhookSecret = (): string => process.env.STRIPE_WEBHOOK_SECRET ?? '';

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

export const StripeWebhookPayloadSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({
    object: z.object({
      id: z.string(),
      customer: z.string().optional(),
      status: z.string().optional(),
      subscription: z.string().optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
      created: z.number().optional(),
      amount_total: z.number().optional(),
      currency: z.string().optional(),
      period: z.object({
        start: z.number().optional(),
        end: z.number().optional(),
      }).optional(),
      plan: z.object({
        product: z.string().optional(),
      }).optional(),
      items: z.array(
        z.object({
          plan: z.object({
            product: z.string().optional(),
          }).optional(),
        })
      ).optional(),
    }),
  }),
});

export type StripeWebhookPayload = z.infer<typeof StripeWebhookPayloadSchema>;

export interface WebhookResult {
  handled: boolean;
  event: string;
  tenantId: string | null;
  tier: TenantTier | null;
  action: 'activated' | 'updated' | 'deactivated' | 'ignored' | 'refunded' | 'provisioned';
  idempotencyKey?: string;
}

export class StripeWebhookHandler {
  private licenseService: LicenseService;
  private subscriptionService: PolarSubscriptionService;
  private auditLogger: WebhookAuditLogger;
  private dunningMachine: DunningStateMachine;

  constructor(
    subscriptionService?: PolarSubscriptionService,
    private onTierChange?: (tenantId: string, newTier: TenantTier) => void,
  ) {
    this.licenseService = LicenseService.getInstance();
    this.subscriptionService = subscriptionService ?? PolarSubscriptionService.getInstance();
    this.auditLogger = WebhookAuditLogger.getInstance();
    this.dunningMachine = DunningStateMachine.getInstance();
  }

  /**
   * Verify Stripe webhook signature (HMAC-SHA256).
   * Returns true if signature valid or no secret configured (dev mode).
   */
  verifySignature(payload: string, signature: string): boolean {
    if (!getWebhookSecret()) {
      return true;
    }

    const expected = createHmac('sha256', getWebhookSecret())
      .update(payload)
      .digest('hex');

    const sigHex = signature.replace('v1=', '');
    if (expected.length !== sigHex.length) return false;
    return timingSafeEqual(Buffer.from(expected), Buffer.from(sigHex));
  }

  /**
   * Process a webhook event payload with idempotency check.
   */
  handleEvent(payload: StripeWebhookPayload): WebhookResult {
    const eventId = payload.id;
    const tenantId = this.extractTenantId(payload);

    // Idempotency check using WebhookAuditLogger
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
      case 'checkout.session.completed':
        result = this.handleCheckoutCompleted(payload, tenantId);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.active':
        result = this.handleActivation(payload, tenantId);
        break;

      case 'customer.subscription.updated':
        result = this.handleUpdate(payload, tenantId);
        break;

      case 'customer.subscription.deleted':
        result = this.handleCancellation(tenantId, payload.type);
        break;

      case 'invoice.payment_succeeded':
        result = this.handlePaymentSucceeded(payload, tenantId);
        break;

      case 'invoice.payment_failed':
        result = this.handlePaymentFailed(payload, tenantId);
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

    // Mark as processed and log
    if (eventId) {
      this.auditLogger.logEvent(
        eventId,
        payload.type,
        result.handled ? 'success' : 'ignored',
        {
          provider: 'stripe',
          tenantId,
          success: result.handled,
          idempotencyKey: result.idempotencyKey || eventId,
          extra: { action: result.action, tier: result.tier },
        },
      );
    }

    return result;
  }

  private handleCheckoutCompleted(payload: StripeWebhookPayload, tenantId: string | null): WebhookResult {
    if (!tenantId) {
      return { handled: false, event: 'checkout.session.completed', tenantId, tier: null, action: 'ignored' };
    }

    const subscriptionObj = payload.data.object;
    const productId = this.extractProductId(subscriptionObj);

    if (!productId) {
      return { handled: false, event: 'checkout.session.completed', tenantId, tier: null, action: 'ignored' };
    }

    const tier = this.subscriptionService.getTierByProductId(productId);
    if (!tier) {
      return { handled: false, event: 'checkout.session.completed', tenantId, tier: null, action: 'ignored' };
    }

    // Extract period end from subscription
    const periodEnd = subscriptionObj.period?.end
      ? new Date(subscriptionObj.period.end * 1000).toISOString()
      : null;

    this.subscriptionService.activateSubscription(
      tenantId,
      tier,
      productId,
      periodEnd,
    );

    const licenseTier = mapTenantTierToLicenseTier(tier);
    this.licenseService.activateSubscription(tenantId, licenseTier, subscriptionObj.id);
    this.onTierChange?.(tenantId, tier);

    // Log order completion
    this.auditLogger.logEvent(
      `order_${subscriptionObj.id}`,
      'checkout.session.completed',
      'success',
      {
        provider: 'stripe',
        tenantId,
        success: true,
        extra: { tier, productId },
      },
    );

    return { handled: true, event: 'checkout.session.completed', tenantId, tier, action: 'provisioned' };
  }

  private handleActivation(payload: StripeWebhookPayload, tenantId: string | null): WebhookResult {
    if (!tenantId) {
      return { handled: false, event: payload.type, tenantId, tier: null, action: 'ignored' };
    }

    const subscriptionObj = payload.data.object;
    const productId = this.extractProductId(subscriptionObj);

    if (!productId) {
      return { handled: false, event: payload.type, tenantId, tier: null, action: 'ignored' };
    }

    const tier = this.subscriptionService.getTierByProductId(productId);
    if (!tier) {
      return { handled: false, event: payload.type, tenantId, tier: null, action: 'ignored' };
    }

    const periodEnd = subscriptionObj.period?.end
      ? new Date(subscriptionObj.period.end * 1000).toISOString()
      : null;

    this.subscriptionService.activateSubscription(
      tenantId,
      tier,
      productId,
      periodEnd,
    );

    const licenseTier = mapTenantTierToLicenseTier(tier);
    this.licenseService.activateSubscription(tenantId, licenseTier, subscriptionObj.id);
    this.onTierChange?.(tenantId, tier);

    return { handled: true, event: payload.type, tenantId, tier, action: 'activated' };
  }

  private handleUpdate(payload: StripeWebhookPayload, tenantId: string | null): WebhookResult {
    if (!tenantId) {
      return { handled: false, event: payload.type, tenantId, tier: null, action: 'ignored' };
    }

    const subscriptionObj = payload.data.object;
    const productId = this.extractProductId(subscriptionObj);

    if (!productId) {
      return { handled: false, event: payload.type, tenantId, tier: null, action: 'ignored' };
    }

    const tier = this.subscriptionService.getTierByProductId(productId);
    if (!tier) {
      return { handled: false, event: payload.type, tenantId, tier: null, action: 'ignored' };
    }

    const periodEnd = subscriptionObj.period?.end
      ? new Date(subscriptionObj.period.end * 1000).toISOString()
      : null;

    this.subscriptionService.activateSubscription(
      tenantId,
      tier,
      productId,
      periodEnd,
    );

    const licenseTier = mapTenantTierToLicenseTier(tier);
    this.licenseService.activateSubscription(tenantId, licenseTier, subscriptionObj.id);
    this.onTierChange?.(tenantId, tier);

    return { handled: true, event: payload.type, tenantId, tier, action: 'updated' };
  }

  private handleCancellation(tenantId: string | null, event: string): WebhookResult {
    if (!tenantId) {
      return { handled: false, event, tenantId, tier: null, action: 'ignored' };
    }

    // TRIGGER DUNNING MACHINE - suspend account on subscription deletion
    try {
      void this.dunningMachine.suspendAccount(tenantId);
    } catch (error) {
      console.error('[Dunning] Failed to process subscription deleted event:', error);
      // Fail-open: don't block webhook processing
    }

    this.subscriptionService.deactivateSubscription(tenantId);
    this.licenseService.deactivateSubscription(tenantId);
    this.onTierChange?.(tenantId, 'free');

    return { handled: true, event, tenantId, tier: 'free', action: 'deactivated' };
  }

  private handlePaymentSucceeded(payload: StripeWebhookPayload, tenantId: string | null): WebhookResult {
    if (!tenantId) {
      return { handled: false, event: 'invoice.payment_succeeded', tenantId, tier: null, action: 'ignored' };
    }

    const invoiceObj = payload.data.object;
    const subscriptionId = invoiceObj.subscription;

    // TRIGGER DUNNING MACHINE - recovery
    try {
      void this.dunningMachine.onPaymentRecovered(tenantId, {
        amount: invoiceObj.amount_total,
        currency: invoiceObj.currency,
        invoiceId: invoiceObj.id,
      });
    } catch (error) {
      console.error('[Dunning] Failed to process payment succeeded event:', error);
    }

    // Log successful payment
    this.auditLogger.logEvent(
      `payment_${invoiceObj.id}`,
      'invoice.payment_succeeded',
      'success',
      {
        provider: 'stripe',
        tenantId,
        success: true,
        extra: {
          amount: invoiceObj.amount_total,
          currency: invoiceObj.currency,
          subscriptionId,
        },
      },
    );

    return {
      handled: true,
      event: 'invoice.payment_succeeded',
      tenantId,
      tier: null,
      action: 'updated',
      idempotencyKey: `payment_${invoiceObj.id}`,
    };
  }

  private handlePaymentFailed(payload: StripeWebhookPayload, tenantId: string | null): WebhookResult {
    if (!tenantId) {
      return { handled: false, event: 'invoice.payment_failed', tenantId, tier: null, action: 'ignored' };
    }

    const invoiceObj = payload.data.object;
    const subscriptionId = invoiceObj.subscription;

    // TRIGGER DUNNING MACHINE
    try {
      void this.dunningMachine.onPaymentFailed(tenantId, {
        amount: invoiceObj.amount_total,
        currency: invoiceObj.currency,
        invoiceId: invoiceObj.id,
      });
    } catch (error) {
      console.error('[Dunning] Failed to process payment failed event:', error);
      // Fail-open: don't block webhook processing
    }

    // Log failed payment alert
    this.auditLogger.logEvent(
      `payment_failed_${invoiceObj.id}`,
      'invoice.payment_failed',
      'error',
      {
        provider: 'stripe',
        tenantId,
        success: false,
        error: 'Payment failed',
        extra: {
          amount: invoiceObj.amount_total,
          currency: invoiceObj.currency,
          subscriptionId,
        },
      },
    );

    console.warn('[Stripe Webhook] PAYMENT FAILED', JSON.stringify({
      tenantId,
      subscriptionId,
      amount: invoiceObj.amount_total,
      timestamp: new Date().toISOString(),
    }));

    return {
      handled: true,
      event: 'invoice.payment_failed',
      tenantId,
      tier: null,
      action: 'ignored',
      idempotencyKey: `payment_failed_${invoiceObj.id}`,
    };
  }

  private extractTenantId(payload: StripeWebhookPayload): string | null {
    const metadata = payload.data.object.metadata;
    if (metadata && typeof metadata.tenantId === 'string') {
      return metadata.tenantId;
    }
    return null;
  }

  private extractProductId(subscriptionObj: {
    plan?: { product?: string };
    items?: Array<{ plan?: { product?: string } }>;
  }): string | undefined {
    // Try to get product ID from plan
    if (subscriptionObj.plan?.product) {
      return subscriptionObj.plan.product;
    }

    // Try to get from subscription items
    if (subscriptionObj.items && subscriptionObj.items.length > 0) {
      const item = subscriptionObj.items[0];
      if (item.plan?.product) {
        return item.plan.product;
      }
    }

    return undefined;
  }
}
