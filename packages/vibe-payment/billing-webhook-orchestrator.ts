/**
 * Billing Webhook Orchestrator — Autonomous Payment→Subscription→Tenant Pipeline
 *
 * Connects vibe-payment webhook processing with vibe-subscription activation
 * and vibe-tenant context. Single entry point for end-to-end autonomous billing.
 *
 * Pipeline: Webhook received → Signature verified → Payment processed →
 *           Subscription activated → Tenant notified → Audit logged
 *
 * Provider-agnostic — works with any payment provider implementing VibePaymentProvider.
 */

import type {
  VibePaymentProvider,
  VibeWebhookConfig,
  VibeWebhookEvent,
  WebhookProcessingResult,
} from './types';
import type { WebhookHandlerDeps } from './autonomous-webhook-handler';
import { processWebhookEvent } from './autonomous-webhook-handler';

// ─── Orchestrator Types ──────────────────────────────────────

/** Extended deps that include subscription activation + tenant binding */
export interface BillingOrchestrationDeps extends WebhookHandlerDeps {
  /** Resolve tenant context from org ID (optional — for multi-org) */
  resolveTenantFromOrg?: (orgId: string) => Promise<{ orgSlug: string; orgName: string } | null>;
  /** Notify downstream systems after successful billing event */
  onBillingComplete?: (result: BillingOrchestrationResult) => Promise<void>;
}

/** Full result from the billing orchestration pipeline */
export interface BillingOrchestrationResult {
  webhookResult: WebhookProcessingResult;
  event: VibeWebhookEvent | null;
  tenantContext: { orgSlug: string; orgName: string } | null;
  timestamp: string;
}

// ─── Main Orchestrator ────────────────────────────────────────

/**
 * Orchestrate full billing webhook pipeline:
 * 1. Delegate to autonomous-webhook-handler for payment processing
 * 2. Resolve tenant context if subscription has org binding
 * 3. Notify downstream systems
 * 4. Return comprehensive result
 */
export async function orchestrateBillingWebhook(
  provider: VibePaymentProvider,
  rawPayload: unknown,
  signature: string,
  config: VibeWebhookConfig,
  deps: BillingOrchestrationDeps,
): Promise<BillingOrchestrationResult> {
  const timestamp = new Date().toISOString();

  // Step 1: Process webhook via autonomous handler
  const webhookResult = await processWebhookEvent(
    provider,
    rawPayload,
    signature,
    config,
    deps,
  );

  // Step 2: Parse event for tenant resolution (best-effort)
  let event: VibeWebhookEvent | null = null;
  let tenantContext: { orgSlug: string; orgName: string } | null = null;

  if (webhookResult.status === 'processed') {
    event = await provider.parseWebhookEvent(rawPayload, signature, config.checksumKey);

    // Step 3: Resolve tenant context if org-scoped subscription
    if (event && deps.resolveTenantFromOrg) {
      const intent = await deps.findSubscriptionIntent(event.orderCode);
      if (intent?.orgId) {
        tenantContext = await deps.resolveTenantFromOrg(intent.orgId);
      }
    }
  }

  const result: BillingOrchestrationResult = {
    webhookResult,
    event,
    tenantContext,
    timestamp,
  };

  // Step 4: Notify downstream (non-blocking)
  if (webhookResult.status === 'processed' && deps.onBillingComplete) {
    deps.onBillingComplete(result).catch((err) =>
      console.error('[vibe-payment] onBillingComplete callback failed:', err),
    );
  }

  return result;
}

/**
 * Create a standard webhook config with subscription-aware callbacks.
 * Convenience factory for Edge Functions that need both order + subscription handling.
 */
export function createBillingWebhookConfig(params: {
  webhookSecret: string;
  checksumKey: string;
  onPaymentSuccess?: (event: VibeWebhookEvent, orderId: string) => Promise<void>;
  onPaymentCancelled?: (event: VibeWebhookEvent, orderId: string) => Promise<void>;
}): VibeWebhookConfig {
  return {
    webhookSecret: params.webhookSecret,
    checksumKey: params.checksumKey,
    onOrderPaid: params.onPaymentSuccess,
    onOrderCancelled: params.onPaymentCancelled,
  };
}
