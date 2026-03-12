/**
 * WebhookHandler — process Polar.sh webhook events end-to-end.
 * Verifies signature, parses payload, delegates to SubscriptionManager, persists receipt.
 * Phase 2 of v0.6 Payment Webhook.
 */
import type { Result } from '../types/common.js';
import { ok, err } from '../types/common.js';
import { verifyWebhookSignature, parseWebhookPayload } from './webhook-verifier.js';
import { SubscriptionManager } from './subscription.js';
import { ReceiptStore } from './receipt-store.js';
import type {
  WebhookEvent,
  WebhookPayload,
  PolarCheckout,
  PolarSubscription,
} from './types.js';
import { resolveTierFromProduct } from './types.js';

export interface WebhookHandlerOptions {
  /** POLAR_WEBHOOK_SECRET */
  secret: string;
  registryPath?: string;
  auditLogPath?: string;
  receiptStorePath?: string;
}

export interface IncomingWebhook {
  rawBody: string;
  /** Polar-Webhook-Signature header */
  signature: string;
  /** Polar-Webhook-ID header */
  webhookId?: string;
  /** Polar-Webhook-Timestamp header */
  timestamp?: string;
}

export class WebhookHandler {
  private readonly subscriptions: SubscriptionManager;
  private readonly receipts: ReceiptStore;
  private readonly secret: string;

  constructor(opts: WebhookHandlerOptions) {
    this.secret = opts.secret;
    this.subscriptions = new SubscriptionManager(opts.registryPath, opts.auditLogPath);
    this.receipts = new ReceiptStore(
      opts.receiptStorePath ?? `${process.env['HOME'] ?? '/tmp'}/.mekong/payments/receipts.jsonl`,
    );
  }

  /**
   * Process an incoming webhook request.
   * 1. Verify signature
   * 2. Dedup by event ID
   * 3. Dispatch to handler
   * 4. Persist receipt
   */
  async process(incoming: IncomingWebhook): Promise<Result<WebhookEvent, Error>> {
    // Step 1: verify signature
    const verifyResult = verifyWebhookSignature({
      rawBody: incoming.rawBody,
      signature: incoming.signature,
      secret: this.secret,
      webhookId: incoming.webhookId,
      timestamp: incoming.timestamp,
    });
    if (!verifyResult.ok) return verifyResult;

    // Step 2: parse payload
    const parseResult = parseWebhookPayload(incoming.rawBody);
    if (!parseResult.ok) return parseResult;

    const payload = parseResult.value;
    const eventId = incoming.webhookId ?? payload.id;

    // Step 3: dedup
    const alreadyProcessed = await this.receipts.hasEvent(eventId);
    if (alreadyProcessed) {
      return ok({
        id: eventId,
        type: payload.type,
        receivedAt: new Date().toISOString(),
        processed: true,
        error: 'duplicate',
      });
    }

    // Step 4: dispatch
    const event = await this.dispatch(eventId, payload);

    // Step 5: persist
    await this.receipts.append(event);

    return ok(event);
  }

  private async dispatch(eventId: string, payload: WebhookPayload): Promise<WebhookEvent> {
    const base: Omit<WebhookEvent, 'processed' | 'error'> = {
      id: eventId,
      type: payload.type,
      receivedAt: new Date().toISOString(),
    };

    try {
      switch (payload.type) {
        case 'checkout.completed': {
          const checkout = payload.data as PolarCheckout;
          const result = await this.subscriptions.handleCheckout(checkout);
          return {
            ...base,
            processed: result.ok,
            customerId: checkout.customer_id,
            customerEmail: checkout.customer_email,
            productId: checkout.product_id,
            tier: resolveTierFromProduct(checkout.product_id),
            licenseKey: result.ok ? result.value.key : undefined,
            error: result.ok ? undefined : result.error.message,
          };
        }

        case 'subscription.updated':
        case 'subscription.active': {
          const sub = payload.data as PolarSubscription;
          const result = await this.subscriptions.handleUpdate(sub, sub.product_id);
          return {
            ...base,
            processed: result.ok,
            customerId: sub.customer_id,
            customerEmail: sub.customer_email,
            productId: sub.product_id,
            tier: resolveTierFromProduct(sub.product_id),
            licenseKey: result.ok ? result.value.key : undefined,
            error: result.ok ? undefined : result.error.message,
          };
        }

        case 'subscription.canceled':
        case 'subscription.revoked': {
          const sub = payload.data as PolarSubscription;
          const result = await this.subscriptions.handleCancel(sub);
          return {
            ...base,
            processed: result.ok,
            customerId: sub.customer_id,
            customerEmail: sub.customer_email,
            productId: sub.product_id,
            error: result.ok ? undefined : result.error.message,
          };
        }

        default:
          return { ...base, processed: true }; // ack unhandled events
      }
    } catch (e) {
      return { ...base, processed: false, error: String(e) };
    }
  }

  /** Expose receipt store for queries */
  getReceiptStore(): ReceiptStore {
    return this.receipts;
  }

  /** Expose subscription manager for queries */
  getSubscriptionManager(): SubscriptionManager {
    return this.subscriptions;
  }
}
