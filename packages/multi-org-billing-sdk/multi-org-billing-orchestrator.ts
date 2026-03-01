/**
 * @agencyos/multi-org-billing-sdk — Multi-Org Billing Orchestrator
 *
 * Tenant-aware billing webhook pipeline:
 *   Webhook → Verify → Route to Order/Subscription → Resolve Tenant → Activate → Notify
 *
 * Re-exports the billing orchestration from @agencyos/vibe-payment
 * and wires it with multi-org tenant resolution.
 *
 * Usage:
 *   import { createMultiOrgBillingHandler } from '@agencyos/multi-org-billing-sdk/orchestrator';
 *
 *   const handler = createMultiOrgBillingHandler({
 *     resolveTenantFromOrg: async (orgId) => db.orgs.find(orgId),
 *     webhookSecret: process.env.WEBHOOK_SECRET!,
 *     checksumKey: process.env.CHECKSUM_KEY!,
 *   });
 */

import type { MultiOrgBillingConfig, MultiOrgBillingResult, TenantContext } from './multi-org-billing-types';

// Re-export core billing orchestration from vibe-payment
export {
  orchestrateBillingWebhook,
  createBillingWebhookConfig,
} from '@agencyos/vibe-payment/billing-webhook-orchestrator';

export type {
  BillingOrchestrationDeps,
  BillingOrchestrationResult,
} from '@agencyos/vibe-payment/billing-webhook-orchestrator';

// Re-export autonomous webhook handler
export {
  processWebhookEvent,
  isValidTransition,
  VALID_TRANSITIONS,
} from '@agencyos/vibe-payment/autonomous-webhook-handler';

export type {
  WebhookHandlerDeps,
  OrderRecord,
  SubscriptionIntentRecord,
} from '@agencyos/vibe-payment/autonomous-webhook-handler';

// ─── Multi-Org Billing Handler ──────────────────────────────────

/**
 * Create a multi-org-aware billing handler that wraps the
 * vibe-payment orchestrator with tenant resolution.
 *
 * Use this for RaaS platforms where subscriptions are org-scoped.
 */
export function createMultiOrgBillingHandler(config: MultiOrgBillingConfig) {
  const { resolveTenantFromOrg, onBillingComplete } = config;

  return {
    /**
     * Resolve tenant context from an org ID.
     * Returns null for personal (non-org) subscriptions.
     */
    async resolveTenant(orgId: string | null | undefined): Promise<TenantContext | null> {
      if (!orgId) return null;
      return resolveTenantFromOrg(orgId);
    },

    /**
     * Build the full deps object for orchestrateBillingWebhook
     * with multi-org tenant resolution wired in.
     */
    buildOrchestrationDeps(baseDeps: Record<string, unknown>) {
      return {
        ...baseDeps,
        resolveTenantFromOrg,
        onBillingComplete: onBillingComplete
          ? async (result: MultiOrgBillingResult) => onBillingComplete(result)
          : undefined,
      };
    },

    /**
     * Create webhook config with standard callbacks.
     */
    createWebhookConfig(callbacks?: {
      onPaymentSuccess?: (event: unknown, orderId: string) => Promise<void>;
      onPaymentCancelled?: (event: unknown, orderId: string) => Promise<void>;
    }) {
      return {
        webhookSecret: config.webhookSecret,
        checksumKey: config.checksumKey,
        onOrderPaid: callbacks?.onPaymentSuccess,
        onOrderCancelled: callbacks?.onPaymentCancelled,
      };
    },
  };
}
