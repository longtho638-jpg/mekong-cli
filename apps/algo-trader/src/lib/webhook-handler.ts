/**
 * Polar.sh Webhook Handler - Phase 2B Billing Integration
 *
 * Handles subscription lifecycle events for RaaS license gating.
 * Integrates with UsageQuota for automatic quota management.
 *
 * Security patches (2026-03-05):
 * - Timing-safe signature comparison (prevent timing attacks)
 * - Input validation on license_key (format/length)
 * - Webhook secret validation
 * - Timestamp expiry check (5 minutes)
 */

import { createHmac, timingSafeEqual } from 'crypto';
import { LicenseService, LicenseTier } from './raas-gate';
import { UsageQuotaService } from './usage-quota';

export interface WebhookEvent {
  type: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export interface WebhookHandlerResult {
  success: boolean;
  licenseKey?: string;
  newTier?: LicenseTier;
  message?: string;
}

/**
 * Input validation for license_key
 */
export function validateLicenseKey(licenseKey: unknown): { valid: boolean; error?: string } {
  if (!licenseKey || typeof licenseKey !== 'string') {
    return { valid: false, error: 'license_key must be a string' };
  }

  if (licenseKey.length < 3 || licenseKey.length > 256) {
    return { valid: false, error: 'license_key must be 3-256 characters' };
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(licenseKey)) {
    return { valid: false, error: 'license_key contains invalid characters' };
  }

  return { valid: true };
}

/**
 * Verify webhook signature using HMAC-SHA256 with timing-safe comparison
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = createHmac('sha256', secret);
  const computedSignature = hmac.update(payload).digest('hex');
  const expected = Buffer.from(`whsec_${computedSignature}`, 'utf8');
  const actual = Buffer.from(signature, 'utf8');

  if (expected.length !== actual.length) {
    return false;
  }

  return timingSafeEqual(expected, actual);
}

/**
 * Parse and validate webhook payload
 */
export function parseWebhookPayload(
  rawBody: string,
  signature: string,
  webhookSecret: string
): WebhookEvent {
  const secret = webhookSecret || process.env.POLAR_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('Webhook secret not configured');
  }

  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    throw new Error('Invalid webhook signature');
  }

  let event: WebhookEvent;
  try {
    event = JSON.parse(rawBody) as WebhookEvent;
  } catch {
    throw new Error('Invalid JSON payload');
  }

  if (!event.type || typeof event.type !== 'string') {
    throw new Error('Missing or invalid event type');
  }

  if (!event.timestamp || typeof event.timestamp !== 'string') {
    throw new Error('Missing or invalid timestamp');
  }

  const eventTime = new Date(event.timestamp).getTime();
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;

  if (isNaN(eventTime) || now - eventTime > fiveMinutes) {
    throw new Error('Webhook timestamp expired or invalid');
  }

  return event;
}

/**
 * Handle subscription lifecycle events with quota integration
 */
export async function handleWebhookEvent(
  event: WebhookEvent
): Promise<WebhookHandlerResult> {
  const licenseService = LicenseService.getInstance();
  const quotaService = UsageQuotaService.getInstance();

  switch (event.type) {
    case 'payment.success': {
      const { license_key, tier } = event.data as {
        license_key: unknown;
        tier?: unknown;
      };

      const keyValidation = validateLicenseKey(license_key);
      if (!keyValidation.valid) {
        return { success: false, message: `Invalid license_key: ${keyValidation.error}` };
      }

      let validatedTier = LicenseTier.PRO;
      if (tier) {
        const tierStr = String(tier).toLowerCase();
        if (!['free', 'pro', 'enterprise'].includes(tierStr)) {
          return { success: false, message: `Invalid tier: ${tier}` };
        }
        validatedTier = tierStr as LicenseTier;
      }

      await licenseService.activateLicense(license_key as string, validatedTier);
      await quotaService.reset(license_key as string);

      return {
        success: true,
        licenseKey: license_key as string,
        newTier: validatedTier,
        message: 'License activated successfully'
      };
    }

    case 'subscription.created': {
      const { license_key, tier } = event.data as {
        license_key: unknown;
        tier: unknown;
      };

      const keyValidation = validateLicenseKey(license_key);
      if (!keyValidation.valid) {
        return { success: false, message: `Invalid license_key: ${keyValidation.error}` };
      }

      const tierStr = String(tier).toLowerCase();
      if (!['free', 'pro', 'enterprise'].includes(tierStr)) {
        return { success: false, message: `Invalid tier: ${tier}` };
      }

      await licenseService.setTier(license_key as string, tierStr as LicenseTier);

      return {
        success: true,
        licenseKey: license_key as string,
        newTier: tierStr as LicenseTier,
        message: 'Subscription created'
      };
    }

    case 'subscription.activated': {
      const { license_key, tier } = event.data as {
        license_key: unknown;
        tier: unknown;
      };

      const keyValidation = validateLicenseKey(license_key);
      if (!keyValidation.valid) {
        return { success: false, message: `Invalid license_key: ${keyValidation.error}` };
      }

      const tierStr = String(tier).toLowerCase() as LicenseTier;
      await licenseService.setTier(license_key as string, tierStr);
      await quotaService.reset(license_key as string);

      return { success: true, licenseKey: license_key as string, newTier: tierStr, message: 'Subscription activated' };
    }

    case 'subscription.updated': {
      const { license_key, tier } = event.data as {
        license_key: unknown;
        tier: unknown;
      };

      const keyValidation = validateLicenseKey(license_key);
      if (!keyValidation.valid) {
        return { success: false, message: `Invalid license_key: ${keyValidation.error}` };
      }

      const tierStr = String(tier).toLowerCase() as LicenseTier;
      await licenseService.setTier(license_key as string, tierStr);

      return { success: true, licenseKey: license_key as string, newTier: tierStr, message: 'Subscription updated' };
    }

    case 'subscription.deactivated':
    case 'subscription.cancelled': {
      const { license_key } = event.data as { license_key: unknown };

      const keyValidation = validateLicenseKey(license_key);
      if (!keyValidation.valid) {
        return { success: false, message: `Invalid license_key: ${keyValidation.error}` };
      }

      await licenseService.downgradeToFree(license_key as string);

      return {
        success: true,
        licenseKey: license_key as string,
        newTier: LicenseTier.FREE,
        message: 'Subscription cancelled, downgraded to FREE'
      };
    }

    case 'payment.paid': {
      const { license_key } = event.data as { license_key: unknown };

      const keyValidation = validateLicenseKey(license_key);
      if (!keyValidation.valid) {
        return { success: false, message: `Invalid license_key: ${keyValidation.error}` };
      }

      await quotaService.reset(license_key as string);

      return { success: true, licenseKey: license_key as string, message: 'Payment recorded, subscription extended' };
    }

    case 'payment.failed': {
      const { license_key } = event.data as { license_key: unknown };

      const keyValidation = validateLicenseKey(license_key);
      if (!keyValidation.valid) {
        return { success: false, message: `Invalid license_key: ${keyValidation.error}` };
      }

      // Security: Removed console.log to prevent info disclosure//

      return { success: true, licenseKey: license_key as string, message: 'Payment failed warning recorded' };
    }

    case 'subscription.refunded': {
      const { license_key } = event.data as { license_key: unknown };

      const keyValidation = validateLicenseKey(license_key);
      if (!keyValidation.valid) {
        return { success: false, message: `Invalid license_key: ${keyValidation.error}` };
      }

      await licenseService.revokeLicense(license_key as string);

      return { success: true, licenseKey: license_key as string, message: 'License revoked due to refund' };
    }

    default:
      return { success: false, message: `Unhandled event type: ${event.type}` };
  }
}

/**
 * Main webhook handler for Express/Fastify
 */
export async function webhookHandler(
  rawBody: string,
  signature: string,
  webhookSecret: string
): Promise<WebhookHandlerResult> {
  if (!rawBody || typeof rawBody !== 'string' || rawBody.length > 1024 * 10) {
    return { success: false, message: 'Invalid request body' };
  }

  if (!signature || typeof signature !== 'string' || signature.length > 512) {
    return { success: false, message: 'Invalid signature' };
  }

  try {
    const event = parseWebhookPayload(rawBody, signature, webhookSecret);
    return await handleWebhookEvent(event);
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Webhook processing failed'
    };
  }
}
