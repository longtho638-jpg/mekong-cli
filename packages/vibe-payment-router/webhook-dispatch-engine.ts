/**
 * @agencyos/vibe-payment-router — Webhook Dispatch Engine
 *
 * Multi-provider webhook routing with signature verification dispatch.
 * Extracted from autonomous-webhook-handler.ts + backend webhook router patterns.
 *
 * Usage:
 *   const dispatcher = createWebhookDispatcher({
 *     providers: {
 *       stripe: { verify: stripeVerify, handle: stripeHandler },
 *       polar: { verify: polarVerify, handle: polarHandler },
 *     },
 *   });
 *   const result = await dispatcher.dispatch('stripe', rawBody, headers);
 */

// ─── Types ──────────────────────────────────────────────────────

export type WebhookProvider = 'stripe' | 'polar' | 'payos' | string;

export interface WebhookDispatchResult {
  status: 'processed' | 'ignored' | 'invalid_signature' | 'unknown_provider' | 'error';
  provider: WebhookProvider;
  eventType?: string;
  eventId?: string;
  message?: string;
}

export interface WebhookProviderHandler {
  /** Verify webhook signature. Return parsed event on success, null on failure. */
  verify(rawBody: string, headers: Record<string, string>): Promise<ParsedWebhookEvent | null>;
  /** Process verified webhook event */
  handle(event: ParsedWebhookEvent): Promise<{ processed: boolean; message?: string }>;
}

export interface ParsedWebhookEvent {
  id: string;
  type: string;
  provider: WebhookProvider;
  data: Record<string, unknown>;
  timestamp: number;
  raw: unknown;
}

export interface WebhookDispatcherConfig {
  providers: Record<string, WebhookProviderHandler>;
  /** Idempotency: check if event already processed */
  isProcessed?: (eventId: string, provider: string) => Promise<boolean>;
  /** Idempotency: mark event as processed */
  markProcessed?: (eventId: string, provider: string, eventType: string) => Promise<void>;
  /** Audit logging */
  onEvent?: (event: ParsedWebhookEvent, result: WebhookDispatchResult) => Promise<void>;
}

// ─── Dispatcher Factory ─────────────────────────────────────────

export function createWebhookDispatcher(config: WebhookDispatcherConfig) {
  const { providers, isProcessed, markProcessed, onEvent } = config;

  return {
    /**
     * Dispatch incoming webhook to the correct provider handler.
     *
     * Pipeline:
     * 1. Lookup provider handler
     * 2. Verify signature
     * 3. Idempotency check
     * 4. Process event
     * 5. Mark as processed
     * 6. Audit log
     */
    async dispatch(
      provider: WebhookProvider,
      rawBody: string,
      headers: Record<string, string>,
    ): Promise<WebhookDispatchResult> {
      // Step 1: Find provider handler
      const handler = providers[provider];
      if (!handler) {
        return { status: 'unknown_provider', provider, message: `No handler for provider: ${provider}` };
      }

      // Step 2: Verify signature
      const event = await handler.verify(rawBody, headers);
      if (!event) {
        return { status: 'invalid_signature', provider, message: 'Webhook signature verification failed' };
      }

      // Step 3: Idempotency check
      if (isProcessed) {
        const alreadyDone = await isProcessed(event.id, provider);
        if (alreadyDone) {
          const result: WebhookDispatchResult = {
            status: 'ignored',
            provider,
            eventId: event.id,
            eventType: event.type,
            message: 'Event already processed (idempotency)',
          };
          await onEvent?.(event, result);
          return result;
        }
      }

      // Step 4: Process event
      try {
        const handlerResult = await handler.handle(event);

        const result: WebhookDispatchResult = {
          status: handlerResult.processed ? 'processed' : 'ignored',
          provider,
          eventId: event.id,
          eventType: event.type,
          message: handlerResult.message,
        };

        // Step 5: Mark processed
        if (handlerResult.processed && markProcessed) {
          await markProcessed(event.id, provider, event.type);
        }

        // Step 6: Audit
        await onEvent?.(event, result);

        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        const result: WebhookDispatchResult = {
          status: 'error',
          provider,
          eventId: event.id,
          eventType: event.type,
          message: errorMsg,
        };
        await onEvent?.(event, result);
        return result;
      }
    },

    /**
     * Auto-detect provider from request headers and dispatch.
     * Checks for provider-specific signature headers.
     */
    async autoDispatch(
      rawBody: string,
      headers: Record<string, string>,
    ): Promise<WebhookDispatchResult> {
      const provider = detectProvider(headers);
      if (!provider) {
        return { status: 'unknown_provider', provider: 'unknown', message: 'Could not detect provider from headers' };
      }
      return this.dispatch(provider, rawBody, headers);
    },

    /** List registered providers */
    getRegisteredProviders(): string[] {
      return Object.keys(providers);
    },
  };
}

// ─── Provider Detection ─────────────────────────────────────────

/** Detect payment provider from webhook request headers */
function detectProvider(headers: Record<string, string>): WebhookProvider | null {
  // Normalize header keys to lowercase
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    normalized[key.toLowerCase()] = value;
  }

  if (normalized['stripe-signature']) return 'stripe';
  if (normalized['x-polar-signature'] || normalized['webhook-id']) return 'polar';
  if (normalized['x-payos-signature']) return 'payos';

  return null;
}
