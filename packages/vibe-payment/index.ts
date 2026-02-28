/**
 * @agencyos/vibe-payment — Provider-Agnostic Payment SDK
 *
 * Reusable across all RaaS projects. Currently supports PayOS;
 * extensible to VNPay, MoMo, Stripe.
 *
 * Usage:
 *   import { createPaymentProvider } from '@agencyos/vibe-payment';
 *   const provider = createPaymentProvider('payos', supabase);
 *   const result = await provider.createPayment({ ... });
 */

import type { PaymentProviderName, VibePaymentProvider } from './types';
import { PayOSAdapter } from './payos-adapter';

// ─── Generic Supabase interface (matches payos-adapter) ─────────

interface SupabaseFunctionsClient {
  invoke: (name: string, options: { body: Record<string, unknown> }) => Promise<{ data: Record<string, unknown>; error: { message: string } | null }>;
}

interface SupabaseLike {
  functions: SupabaseFunctionsClient;
}

// ─── Factory ────────────────────────────────────────────────────

export function createPaymentProvider(
  name: PaymentProviderName,
  supabase: SupabaseLike,
): VibePaymentProvider {
  switch (name) {
    case 'payos':
      return new PayOSAdapter(supabase);
    default:
      throw new Error(`Payment provider "${name}" is not yet supported. Available: payos`);
  }
}

// Re-export all types
export type {
  PaymentProviderName,
  VibePaymentProvider,
  VibePaymentRequest,
  VibePaymentResponse,
  VibePaymentStatus,
  VibePaymentStatusCode,
  VibePaymentItem,
  VibeWebhookEvent,
  VibeWebhookConfig,
  VibeSubscriptionIntent,
  WebhookEventType,
  WebhookProcessingResult,
  WebhookIdempotencyGuard,
} from './types';

export { PayOSAdapter } from './payos-adapter';
export {
  computeHmacSha256,
  secureCompare,
  payosCodeToStatus,
  payosCodeToEventType,
} from './payos-adapter';

export { processWebhookEvent, isValidTransition } from './autonomous-webhook-handler';
export type { WebhookHandlerDeps, OrderRecord, SubscriptionIntentRecord } from './autonomous-webhook-handler';
