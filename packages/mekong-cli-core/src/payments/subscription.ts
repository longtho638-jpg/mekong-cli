/**
 * SubscriptionManager — maps payment events to license operations.
 * Integrates LicenseAdmin (create/revoke) and TierManager (upgrade/downgrade).
 * Phase 3 of v0.6 Payment Webhook.
 */
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { Result } from '../types/common.js';
import { ok, err } from '../types/common.js';
import { LicenseAdmin } from '../license/admin.js';
import { changeTier } from '../license/tier-manager.js';
import type { LicenseTier, LicenseKey } from '../license/types.js';
import type { PolarCheckout, PolarSubscription, WebhookEvent } from './types.js';
import { resolveTierFromProduct } from './types.js';

const DEFAULT_REGISTRY = join(homedir(), '.mekong', 'admin', 'keys.json');
const DEFAULT_AUDIT_LOG = join(homedir(), '.mekong', 'admin', 'audit.jsonl');
const DEFAULT_EXPIRY_DAYS = 365;

export interface SubscriptionRecord {
  customerId: string;
  customerEmail?: string;
  licenseKeyId: string;
  tier: LicenseTier;
  status: 'active' | 'canceled';
  updatedAt: string;
}

export class SubscriptionManager {
  private readonly admin: LicenseAdmin;

  constructor(
    registryPath: string = DEFAULT_REGISTRY,
    auditLogPath: string = DEFAULT_AUDIT_LOG,
  ) {
    this.admin = new LicenseAdmin(registryPath, auditLogPath, 'webhook');
  }

  /**
   * Handle checkout.completed — create a new license key for the customer.
   */
  async handleCheckout(checkout: PolarCheckout): Promise<Result<LicenseKey, Error>> {
    const tier = resolveTierFromProduct(checkout.product_id);
    const owner = checkout.customer_email || checkout.customer_id || checkout.id;
    const expiryDays = parseInt(checkout.metadata?.['expiry_days'] ?? '0', 10) || DEFAULT_EXPIRY_DAYS;

    const result = await this.admin.createKey(tier, owner, expiryDays);
    if (!result.ok) return result;
    return ok(result.value);
  }

  /**
   * Handle subscription.updated — upgrade or downgrade existing license.
   * Finds the most recent active key for this customer, applies tier change.
   */
  async handleUpdate(
    subscription: PolarSubscription,
    newProductId: string,
  ): Promise<Result<LicenseKey, Error>> {
    const newTier = resolveTierFromProduct(newProductId);
    const owner = subscription.customer_email || subscription.customer_id;

    // Find current active key for customer
    const listResult = await this.admin.listKeys();
    if (!listResult.ok) return listResult;

    const currentKey = listResult.value
      .filter((k) => k.owner === owner && k.status === 'active')
      .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime())[0];

    if (!currentKey) {
      // No existing key — create new one
      const expiryDays =
        Math.max(
          1,
          Math.ceil(
            (new Date(subscription.current_period_end).getTime() - Date.now()) / 86_400_000,
          ),
        ) || DEFAULT_EXPIRY_DAYS;
      return this.admin.createKey(newTier, owner, expiryDays);
    }

    // Apply tier change
    const changeResult = changeTier(currentKey, newTier);
    if (!changeResult.ok) return changeResult;

    const { newKey, oldKey } = changeResult.value;

    // Revoke old key
    await this.admin.revokeKey(oldKey.key);

    // Register new key in admin store
    const listRes2 = await this.admin.listKeys();
    if (!listRes2.ok) return listRes2;

    // Create via admin to persist
    const expiryDays = Math.max(1, changeResult.value.remainingDays);
    const created = await this.admin.createKey(newTier, owner, expiryDays);
    return created;
  }

  /**
   * Handle subscription.canceled — revoke the customer's active license.
   */
  async handleCancel(subscription: PolarSubscription): Promise<Result<void, Error>> {
    const owner = subscription.customer_email || subscription.customer_id;

    const listResult = await this.admin.listKeys();
    if (!listResult.ok) return listResult;

    const activeKeys = listResult.value.filter(
      (k) => k.owner === owner && k.status === 'active',
    );

    if (activeKeys.length === 0) {
      return err(new Error(`No active license found for customer: ${owner}`));
    }

    // Revoke all active keys for this customer
    for (const key of activeKeys) {
      const revResult = await this.admin.revokeKey(key.key);
      if (!revResult.ok) return revResult;
    }

    return ok(undefined);
  }

  /**
   * Get subscription status for a customer (by email or ID).
   */
  async getSubscription(customerId: string): Promise<Result<SubscriptionRecord | null, Error>> {
    const listResult = await this.admin.listKeys();
    if (!listResult.ok) return listResult;

    const keys = listResult.value.filter((k) => k.owner === customerId);
    if (keys.length === 0) return ok(null);

    // Return most recent active key, or most recent revoked if all revoked
    const active = keys
      .filter((k) => k.status === 'active')
      .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime())[0];

    const key = active ?? keys.sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime())[0]!;

    return ok({
      customerId,
      customerEmail: customerId.includes('@') ? customerId : undefined,
      licenseKeyId: key.key,
      tier: key.tier,
      status: key.status === 'active' ? 'active' : 'canceled',
      updatedAt: key.issuedAt,
    });
  }

  /** Build a WebhookEvent record from a processed checkout */
  static buildCheckoutEvent(
    eventId: string,
    checkout: PolarCheckout,
    licenseKey?: LicenseKey,
    error?: string,
  ): WebhookEvent {
    return {
      id: eventId,
      type: 'checkout.completed',
      receivedAt: new Date().toISOString(),
      processed: !error,
      customerId: checkout.customer_id,
      customerEmail: checkout.customer_email,
      productId: checkout.product_id,
      tier: resolveTierFromProduct(checkout.product_id),
      licenseKey: licenseKey?.key,
      error,
    };
  }
}
