/**
 * @agencyos/webhook-billing-sdk — Unified Webhook Handler
 *
 * Provider-agnostic webhook processing pipeline:
 *   HTTP Request → Signature Verify → Idempotency Check → Event Router → Handler → Mark Processed
 *
 * Wraps @agencyos/vibe-payment-router dispatch engine and @agencyos/vibe-stripe
 * webhook handler into a single unified API.
 *
 * Usage:
 *   import { createWebhookBillingHandler } from '@agencyos/webhook-billing-sdk/webhook';
 *   const handler = createWebhookBillingHandler({ providers: { stripe: stripeHandler } });
 *   const result = await handler.handleRequest('stripe', rawBody, headers);
 */

import type {
  WebhookBillingConfig,
  WebhookProcessingResult,
  WebhookProvider,
} from './webhook-billing-types';

// Re-export vibe-stripe webhook handler for Stripe-specific usage
export { createStripeWebhookHandler, verifyStripeSignatureAsync } from '@agencyos/vibe-stripe';
export type { StripeWebhookHandlerConfig, WebhookResult } from '@agencyos/vibe-stripe';

// Re-export vibe-payment-router dispatch engine for multi-provider usage
export { createWebhookDispatcher } from '@agencyos/vibe-payment-router';
export type { WebhookDispatcherConfig, WebhookProviderHandler, ParsedWebhookEvent } from '@agencyos/vibe-payment-router';

// ─── Unified Webhook Handler ────────────────────────────────────

/**
 * Create a unified webhook handler that supports multiple providers
 * with automatic provider detection, signature verification,
 * idempotency, and audit logging.
 */
export function createWebhookBillingHandler(config: WebhookBillingConfig) {
  const { providers, idempotency, audit } = config;

  return {
    /**
     * Process webhook request for a specific provider.
     *
     * Pipeline:
     * 1. Lookup provider handler
     * 2. Verify signature (provider-specific)
     * 3. Idempotency check (if configured)
     * 4. Process event via handler
     * 5. Mark as processed (if idempotency configured)
     * 6. Audit log (if configured)
     */
    async handleRequest(
      provider: WebhookProvider,
      rawBody: string,
      headers: Record<string, string>,
    ): Promise<WebhookProcessingResult> {
      const handler = providers[provider];
      if (!handler) {
        return { status: 'unknown_provider', provider, message: `No handler for: ${provider}` };
      }

      // Verify signature
      const event = await handler.verify(rawBody, headers);
      if (!event) {
        return { status: 'invalid_signature', provider, message: 'Signature verification failed' };
      }

      // Idempotency check
      if (idempotency) {
        const alreadyDone = await idempotency.isProcessed(event.id, provider);
        if (alreadyDone) {
          const result: WebhookProcessingResult = {
            status: 'duplicate',
            provider,
            eventId: event.id,
            eventType: event.type,
          };
          await audit?.onEvent(event, result);
          return result;
        }
      }

      // Process event
      try {
        const handlerResult = await handler.handle(event);
        const result: WebhookProcessingResult = {
          status: handlerResult.processed ? 'processed' : 'ignored',
          provider,
          eventId: event.id,
          eventType: event.type,
          message: handlerResult.message,
        };

        // Mark processed
        if (handlerResult.processed && idempotency) {
          await idempotency.markProcessed(event.id, provider, event.type);
        }

        await audit?.onEvent(event, result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const result: WebhookProcessingResult = {
          status: 'error',
          provider,
          eventId: event.id,
          eventType: event.type,
          message,
        };
        await audit?.onEvent(event, result);
        return result;
      }
    },

    /**
     * Auto-detect provider from request headers and process.
     * Checks for provider-specific signature headers:
     *   - `stripe-signature` → stripe
     *   - `webhook-id` or `x-polar-signature` → polar
     *   - `x-payos-signature` → payos
     */
    async autoHandle(
      rawBody: string,
      headers: Record<string, string>,
    ): Promise<WebhookProcessingResult> {
      const provider = detectProviderFromHeaders(headers);
      if (!provider) {
        return { status: 'unknown_provider', provider: 'unknown', message: 'Cannot detect provider from headers' };
      }
      return this.handleRequest(provider, rawBody, headers);
    },

    /** List all registered providers */
    getProviders(): string[] {
      return Object.keys(providers);
    },
  };
}

// ─── Provider Detection ─────────────────────────────────────────

/** Detect payment provider from webhook request headers */
function detectProviderFromHeaders(headers: Record<string, string>): WebhookProvider | null {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    normalized[key.toLowerCase()] = value;
  }

  if (normalized['stripe-signature']) return 'stripe';
  if (normalized['x-polar-signature'] || normalized['webhook-id']) return 'polar';
  if (normalized['x-payos-signature']) return 'payos';

  return null;
}

// ─── HTTP Response Helper ───────────────────────────────────────

/** Convert webhook processing result to HTTP response (for any framework) */
export function webhookResultToResponse(result: WebhookProcessingResult): { status: number; body: string } {
  switch (result.status) {
    case 'processed':
    case 'duplicate':
    case 'ignored':
      return { status: 200, body: 'OK' };
    case 'invalid_signature':
      return { status: 400, body: result.message ?? 'Invalid signature' };
    case 'unknown_provider':
      return { status: 400, body: result.message ?? 'Unknown provider' };
    case 'error':
      return { status: 500, body: result.message ?? 'Internal error' };
  }
}
