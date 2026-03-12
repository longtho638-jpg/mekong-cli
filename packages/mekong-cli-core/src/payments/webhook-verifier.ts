/**
 * WebhookVerifier — verify Polar.sh webhook signatures.
 * Polar uses HMAC-SHA256 on raw body with webhook secret.
 * Phase 1 of v0.6 Payment Webhook.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Result } from '../types/common.js';
import { ok, err } from '../types/common.js';
import type { WebhookPayload } from './types.js';

export interface VerifyOptions {
  /** Raw request body as string or Buffer */
  rawBody: string | Buffer;
  /** Polar-Signature header value */
  signature: string;
  /** Webhook secret from POLAR_WEBHOOK_SECRET env */
  secret: string;
  /** Max age in seconds before rejecting (default: 300) */
  maxAgeSeconds?: number;
  /** Polar-Webhook-ID header for dedup */
  webhookId?: string;
  /** Polar-Webhook-Timestamp header */
  timestamp?: string;
}

/** Polar Standard Webhooks signature format: v1,<hex-signature> */
const SIG_PREFIX = 'v1,';

/**
 * Verify Polar.sh webhook signature.
 * Polar uses Standard Webhooks spec: sign "id.timestamp.body" with HMAC-SHA256.
 */
export function verifyWebhookSignature(opts: VerifyOptions): Result<void, Error> {
  const { rawBody, signature, secret, maxAgeSeconds = 300, webhookId, timestamp } = opts;

  if (!signature) {
    return err(new Error('Missing Polar-Signature header'));
  }
  if (!secret) {
    return err(new Error('Webhook secret not configured'));
  }

  // Standard Webhooks format: sign "msgId.msgTimestamp.body"
  // Polar sends: Polar-Webhook-ID, Polar-Webhook-Timestamp, Polar-Webhook-Signature
  if (webhookId && timestamp) {
    return verifyStandardWebhooks({ rawBody, signature, secret, maxAgeSeconds, webhookId, timestamp });
  }

  // Legacy fallback: direct HMAC of body
  return verifyLegacyHmac({ rawBody, signature, secret });
}

function verifyStandardWebhooks(opts: {
  rawBody: string | Buffer;
  signature: string;
  secret: string;
  maxAgeSeconds: number;
  webhookId: string;
  timestamp: string;
}): Result<void, Error> {
  const { rawBody, signature, secret, maxAgeSeconds, webhookId, timestamp } = opts;

  // Validate timestamp to prevent replay attacks
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts)) {
    return err(new Error('Invalid webhook timestamp'));
  }
  const nowSeconds = Math.floor(Date.now() / 1000);
  const ageSecs = Math.abs(nowSeconds - ts);
  if (ageSecs > maxAgeSeconds) {
    return err(new Error(`Webhook timestamp too old: ${ageSecs}s (max ${maxAgeSeconds}s)`));
  }

  // Build signed content: "msgId.msgTimestamp.body"
  const body = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf-8');
  const signedContent = `${webhookId}.${timestamp}.${body}`;

  // Compute HMAC-SHA256
  const expected = createHmac('sha256', secret).update(signedContent).digest('hex');

  // Parse signature header: may contain multiple "v1,<hex>" comma-separated
  const sigList = signature.split(' ');
  for (const sig of sigList) {
    const hex = sig.startsWith(SIG_PREFIX) ? sig.slice(SIG_PREFIX.length) : sig;
    if (safeCompare(hex, expected)) return ok(undefined);
  }

  return err(new Error('Webhook signature verification failed'));
}

function verifyLegacyHmac(opts: {
  rawBody: string | Buffer;
  signature: string;
  secret: string;
}): Result<void, Error> {
  const { rawBody, signature, secret } = opts;
  const body = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf-8');
  const expected = createHmac('sha256', secret).update(body).digest('hex');
  const provided = signature.startsWith(SIG_PREFIX) ? signature.slice(SIG_PREFIX.length) : signature;

  if (!safeCompare(provided, expected)) {
    return err(new Error('Webhook signature verification failed'));
  }
  return ok(undefined);
}

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}

/** Parse and validate webhook payload JSON */
export function parseWebhookPayload(rawBody: string): Result<WebhookPayload, Error> {
  try {
    const payload = JSON.parse(rawBody) as WebhookPayload;
    if (!payload.type || !payload.id) {
      return err(new Error('Invalid webhook payload: missing type or id'));
    }
    return ok(payload);
  } catch (e) {
    return err(new Error(`Failed to parse webhook payload: ${String(e)}`));
  }
}
