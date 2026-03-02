/**
 * Polar.sh Webhook Event Handler — processes subscription lifecycle events.
 * Verifies webhook signature, routes events to subscription service.
 * Events: subscription.created, subscription.updated, subscription.canceled
 */

import { createHmac, timingSafeEqual } from 'crypto';
import { z } from 'zod';
import { PolarSubscriptionService, TenantTier } from './polar-subscription-service';

const WEBHOOK_SECRET = process.env.POLAR_WEBHOOK_SECRET ?? '';

export const PolarWebhookPayloadSchema = z.object({
  type: z.string(),
  data: z.looseObject({
    id: z.string(),
    status: z.string().optional(),
    product_id: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    current_period_end: z.string().nullable().optional(),
  }),
});

export type PolarWebhookPayload = z.infer<typeof PolarWebhookPayloadSchema>;

export interface WebhookResult {
  handled: boolean;
  event: string;
  tenantId: string | null;
  tier: TenantTier | null;
  action: 'activated' | 'updated' | 'deactivated' | 'ignored';
}

export class PolarWebhookEventHandler {
  constructor(
    private subscriptionService: PolarSubscriptionService,
    private onTierChange?: (tenantId: string, newTier: TenantTier) => void,
  ) {}

  /**
   * Verify Polar webhook signature (HMAC-SHA256).
   * Returns true if signature valid or no secret configured (dev mode).
   */
  verifySignature(payload: string, signature: string): boolean {
    if (!WEBHOOK_SECRET) return true; // Dev mode — no verification

    const expected = createHmac('sha256', WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    const sigHex = signature.replace('sha256=', '');

    if (expected.length !== sigHex.length) return false;
    return timingSafeEqual(Buffer.from(expected), Buffer.from(sigHex));
  }

  /** Process a webhook event payload. */
  handleEvent(payload: PolarWebhookPayload): WebhookResult {
    const tenantId = this.extractTenantId(payload);

    switch (payload.type) {
      case 'subscription.created':
      case 'subscription.active':
        return this.handleActivation(payload, tenantId);

      case 'subscription.updated':
        return this.handleUpdate(payload, tenantId);

      case 'subscription.canceled':
      case 'subscription.revoked':
        return this.handleCancellation(tenantId, payload.type);

      default:
        return {
          handled: false,
          event: payload.type,
          tenantId,
          tier: null,
          action: 'ignored',
        };
    }
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

    this.onTierChange?.(tenantId, tier);

    return { handled: true, event: payload.type, tenantId, tier, action: 'updated' };
  }

  private handleCancellation(tenantId: string | null, event: string): WebhookResult {
    if (!tenantId) {
      return { handled: false, event, tenantId, tier: null, action: 'ignored' };
    }

    this.subscriptionService.deactivateSubscription(tenantId);
    this.onTierChange?.(tenantId, 'free');

    return { handled: true, event, tenantId, tier: 'free', action: 'deactivated' };
  }

  private extractTenantId(payload: PolarWebhookPayload): string | null {
    const metadata = payload.data.metadata;
    if (metadata && typeof metadata.tenantId === 'string') {
      return metadata.tenantId;
    }
    return null;
  }
}
