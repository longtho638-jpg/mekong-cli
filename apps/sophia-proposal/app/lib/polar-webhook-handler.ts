/**
 * Polar.sh Webhook Handler for Sophia AI Video Engine
 *
 * Processes Polar.sh Standard Webhooks for subscription events.
 * Handles license activation on payment success and revocation on cancellation.
 *
 * @see https://docs.polar.sh/api/webhooks
 */

import { LicenseService } from './license-service'
import type { License } from './license-types'
import { isPolarConfigured } from './polar-config'

/**
 * Polar.sh webhook event types
 */
export type PolarEventType =
  | 'subscription.created'
  | 'subscription.active'
  | 'subscription.cancelled'
  | 'subscription.uncancelled'

/**
 * Polar.sh subscription event payload
 */
export interface PolarSubscriptionEvent {
  id: string
  customer_id: string
  product_id: string
  status: 'active' | 'cancelled' | 'uncancelled'
  started_at: string
  ended_at?: string
  canceled_at?: string
}

/**
 * Webhook processing result
 */
export interface WebhookResult {
  success: boolean
  action: 'activated' | 'revoked' | 'ignored' | 'error'
  licenseId?: string
  message: string
}

/**
 * Get or create license for Polar subscription
 *
 * Maps Polar subscription to Sophia license system.
 * Creates new license if customer doesn't have one.
 */
function getOrCreateLicense(
  customerId: string,
  subscriptionId: string
): License {
  const existing = LicenseService.getByCustomerId(customerId)

  if (existing) {
    return existing
  }

  // Determine tier from product ID (simplified mapping)
  const tier: License['tier'] = 'PRO' // Default to PRO, can be extended

  const license = LicenseService.create({
    tier,
    customerId,
    customerName: `Polar Customer ${customerId.slice(-8)}`,
    expiresInDays: 365,
    features: undefined,
  })

  // Link subscription to license
  LicenseService.updateSubscription(license.id, subscriptionId, 'active')

  return license
}

/**
 * Handle subscription.created event
 *
 * Activates license when new subscription is created.
 */
function handleSubscriptionCreated(
  event: PolarSubscriptionEvent
): WebhookResult {
  try {
    const license = getOrCreateLicense(event.customer_id, event.id)

    // Update subscription info on license
    LicenseService.updateSubscription(license.id, event.id, event.status)

    return {
      success: true,
      action: 'activated',
      licenseId: license.id,
      message: `License ${license.id} activated for subscription ${event.id}`,
    }
  } catch (error) {
    return {
      success: false,
      action: 'error',
      message: `Failed to create license: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Handle subscription.active event
 *
 * Confirms license is active (payment successful).
 */
function handleSubscriptionActive(
  event: PolarSubscriptionEvent
): WebhookResult {
  try {
    const license = LicenseService.getByCustomerId(event.customer_id)

    if (!license) {
      // Create if doesn't exist
      const newLicense = getOrCreateLicense(event.customer_id, event.id)
      LicenseService.updateSubscription(newLicense.id, event.id, event.status)
      return {
        success: true,
        action: 'activated',
        licenseId: newLicense.id,
        message: `License ${newLicense.id} activated for active subscription ${event.id}`,
      }
    }

    // Update subscription info on existing license
    LicenseService.updateSubscription(license.id, event.id, event.status)

    return {
      success: true,
      action: 'ignored',
      licenseId: license.id,
      message: `License ${license.id} already active`,
    }
  } catch (error) {
    return {
      success: false,
      action: 'error',
      message: `Failed to process active subscription: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Handle subscription.cancelled event
 *
 * Revokes license when subscription is cancelled.
 */
function handleSubscriptionCancelled(
  event: PolarSubscriptionEvent
): WebhookResult {
  try {
    const license = LicenseService.getByCustomerId(event.customer_id)

    if (!license) {
      return {
        success: true,
        action: 'ignored',
        message: `No license found for customer ${event.customer_id}`,
      }
    }

    LicenseService.revoke(license.id)
    LicenseService.updateSubscription(license.id, event.id, 'cancelled')

    return {
      success: true,
      action: 'revoked',
      licenseId: license.id,
      message: `License ${license.id} revoked due to subscription cancellation`,
    }
  } catch (error) {
    return {
      success: false,
      action: 'error',
      message: `Failed to revoke license: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Process Polar.sh webhook event
 *
 * Main entry point for webhook processing.
 * Routes events to appropriate handlers.
 */
export async function processWebhookEvent(
  eventType: PolarEventType,
  payload: PolarSubscriptionEvent
): Promise<WebhookResult> {
  if (!isPolarConfigured()) {
    return {
      success: false,
      action: 'error',
      message: 'Polar.sh not configured. Missing environment variables.',
    }
  }

  switch (eventType) {
    case 'subscription.created':
      return handleSubscriptionCreated(payload)
    case 'subscription.active':
      return handleSubscriptionActive(payload)
    case 'subscription.cancelled':
      return handleSubscriptionCancelled(payload)
    case 'subscription.uncancelled':
      // Treat uncancel as reactivation
      return handleSubscriptionActive(payload)
    default:
      return {
        success: true,
        action: 'ignored',
        message: `Unknown event type: eventType`,
      }
  }
}
