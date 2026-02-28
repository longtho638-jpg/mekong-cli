/**
 * @agencyos/vibe-payment — Provider-Agnostic Payment SDK
 *
 * Reusable across all RaaS projects. Supports PayOS + Stripe.
 *
 * Usage:
 *   import { createPaymentProvider } from '@agencyos/vibe-payment';
 *   const payos = createPaymentProvider('payos', { supabase });
 *   const stripe = createPaymentProvider('stripe', { stripeSecretKey: 'sk_...' });
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

// ─── Provider Config ────────────────────────────────────────────

export interface PaymentProviderConfig {
  /** Supabase client (required for PayOS) */
  supabase?: SupabaseLike;
  /** Stripe secret key (required for Stripe) */
  stripeSecretKey?: string;
  /** Stripe webhook secret */
  stripeWebhookSecret?: string;
  /** Stripe API version */
  stripeApiVersion?: string;
}

// ─── Factory ────────────────────────────────────────────────────

export function createPaymentProvider(
  name: PaymentProviderName,
  config: SupabaseLike | PaymentProviderConfig,
): VibePaymentProvider {
  switch (name) {
    case 'payos': {
      const supabase = 'functions' in config ? config : (config as PaymentProviderConfig).supabase;
      if (!supabase) throw new Error('PayOS requires supabase client');
      return new PayOSAdapter(supabase as SupabaseLike);
    }
    case 'stripe': {
      const cfg = config as PaymentProviderConfig;
      if (!cfg.stripeSecretKey) throw new Error('Stripe requires stripeSecretKey');
      // Lazy import — @agencyos/vibe-stripe is optional peerDependency
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { StripeAdapter } = require('@agencyos/vibe-stripe');
        return new StripeAdapter({ secretKey: cfg.stripeSecretKey, webhookSecret: cfg.stripeWebhookSecret, apiVersion: cfg.stripeApiVersion });
      } catch {
        throw new Error('Stripe provider requires @agencyos/vibe-stripe package. Install: pnpm add @agencyos/vibe-stripe');
      }
    }
    default:
      throw new Error(`Payment provider "${name}" is not yet supported. Available: payos, stripe`);
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
