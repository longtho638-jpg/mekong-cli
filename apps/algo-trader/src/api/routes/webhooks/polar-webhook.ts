/**
 * Polar Webhook Handler
 *
 * Processes Polar.sh webhook events and updates LicenseService
 */

import { PolarService, PolarWebhookEvent } from '../../../payment/polar-service';
import { LicenseService, LicenseTier } from '../../../lib/raas-gate';
import { logger } from '../../../utils/logger';

export interface PolarWebhookResult {
  success: boolean;
  eventType: string;
  subscriptionId?: string;
  message: string;
}

/**
 * Polar subscription webhook data type
 */
interface PolarSubscriptionData {
  id: string;
  plan?: { product_id?: string };
  product_id?: string;
  metadata?: Record<string, string>;
  [key: string]: string | Record<string, string> | undefined;
}

/**
 * Polar checkout webhook data type
 */
interface PolarCheckoutData {
  id: string;
  customer_email?: string;
  [key: string]: string | undefined;
}

/**
 * Handle Polar webhook events
 */
export class PolarWebhookHandler {
  private polarService: PolarService;
  private licenseService: LicenseService;

  constructor() {
    this.polarService = PolarService.getInstance();
    this.licenseService = LicenseService.getInstance();
  }

  /**
   * Process webhook event
   */
  async handleWebhook(
    payload: string,
    signature: string
  ): Promise<PolarWebhookResult> {
    // Verify webhook signature
    const isValid = await this.polarService.verifyWebhook(payload, signature);
    if (!isValid) {
      logger.error('[Polar Webhook] Invalid signature');
      return {
        success: false,
        eventType: 'invalid',
        message: 'Invalid webhook signature',
      };
    }

    // Parse event
    let event: PolarWebhookEvent;
    try {
      event = this.polarService.parseWebhookEvent(payload);
    } catch (error) {
      logger.error('[Polar Webhook] Failed to parse event', error);
      return {
        success: false,
        eventType: 'parse_error',
        message: 'Failed to parse webhook payload',
      };
    }

    logger.info('[Polar Webhook] Received event', { type: event.type });

    // Route to handler
    switch (event.type) {
      case 'subscription.created':
        return this.handleSubscriptionCreated(event.data.object);

      case 'subscription.active':
        return this.handleSubscriptionActive(event.data.object);

      case 'subscription.updated':
        return this.handleSubscriptionUpdated(event.data.object);

      case 'subscription.cancelled':
        return this.handleSubscriptionCancelled(event.data.object);

      case 'checkout.created':
        return this.handleCheckoutCreated(event.data.object);

      default:
        logger.warn('[Polar Webhook] Unhandled event type', { type: event.type });
        return {
          success: true,
          eventType: event.type,
          message: 'Event type not handled',
        };
    }
  }

  /**
   * Handle subscription.created
   */
  private async handleSubscriptionCreated(data: PolarSubscriptionData): Promise<PolarWebhookResult> {
    try {
      const subscriptionId = data.id;
      const tier = this.mapTierFromData(data);

      // Activate license
      await this.licenseService.activateLicense(subscriptionId, tier);

      logger.info('[Polar Webhook] Subscription created', {
        subscriptionId,
        tier,
      });

      return {
        success: true,
        eventType: 'subscription.created',
        subscriptionId,
        message: `Activated ${tier} license`,
      };
    } catch (error) {
      logger.error('[Polar Webhook] Failed to handle subscription.created', error);
      return {
        success: false,
        eventType: 'subscription.created',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Handle subscription.active
   */
  private async handleSubscriptionActive(data: PolarSubscriptionData): Promise<PolarWebhookResult> {
    try {
      const subscriptionId = data.id;
      const tier = this.mapTierFromData(data);

      // Set tier (in case of upgrade)
      await this.licenseService.setTier(subscriptionId, tier);

      logger.info('[Polar Webhook] Subscription active', {
        subscriptionId,
        tier,
      });

      return {
        success: true,
        eventType: 'subscription.active',
        subscriptionId,
        message: `Set ${tier} license`,
      };
    } catch (error) {
      logger.error('[Polar Webhook] Failed to handle subscription.active', error);
      return {
        success: false,
        eventType: 'subscription.active',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Handle subscription.updated
   */
  private async handleSubscriptionUpdated(data: PolarSubscriptionData): Promise<PolarWebhookResult> {
    try {
      const subscriptionId = data.id;
      const tier = this.mapTierFromData(data);

      // Update tier
      await this.licenseService.setTier(subscriptionId, tier);

      logger.info('[Polar Webhook] Subscription updated', {
        subscriptionId,
        tier,
      });

      return {
        success: true,
        eventType: 'subscription.updated',
        subscriptionId,
        message: `Updated to ${tier} license`,
      };
    } catch (error) {
      logger.error('[Polar Webhook] Failed to handle subscription.updated', error);
      return {
        success: false,
        eventType: 'subscription.updated',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Handle subscription.cancelled
   */
  private async handleSubscriptionCancelled(data: PolarSubscriptionData): Promise<PolarWebhookResult> {
    try {
      const subscriptionId = data.id;

      // Downgrade to free
      await this.licenseService.downgradeToFree(subscriptionId);

      logger.info('[Polar Webhook] Subscription cancelled', {
        subscriptionId,
      });

      return {
        success: true,
        eventType: 'subscription.cancelled',
        subscriptionId,
        message: 'Downgraded to FREE license',
      };
    } catch (error) {
      logger.error('[Polar Webhook] Failed to handle subscription.cancelled', error);
      return {
        success: false,
        eventType: 'subscription.cancelled',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Handle checkout.created (optional - for tracking)
   */
  private async handleCheckoutCreated(data: PolarCheckoutData): Promise<PolarWebhookResult> {
    logger.info('[Polar Webhook] Checkout created', {
      checkoutId: data.id,
      customerEmail: data.customer_email,
    });

    return {
      success: true,
      eventType: 'checkout.created',
      message: 'Checkout session created',
    };
  }

  /**
   * Map webhook data to LicenseTier
   */
  private mapTierFromData(data: PolarSubscriptionData): LicenseTier {
    const productId = data.product_id || data.plan?.product_id || '';

    // Map Polar product IDs to license tiers
    if (productId.includes('enterprise')) {
      return LicenseTier.ENTERPRISE;
    }
    if (productId.includes('pro')) {
      return LicenseTier.PRO;
    }

    return LicenseTier.FREE;
  }
}
