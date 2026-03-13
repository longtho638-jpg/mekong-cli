/**
 * Polar.sh Payment Service
 *
 * Handles subscription creation, checkout, and webhook verification
 */

import { polarConfig } from '../config/polar.config';
import { LicenseTier } from '../lib/raas-gate';

export interface PolarCheckoutSession {
  id: string;
  url: string;
  status: string;
}

export interface PolarSubscription {
  id: string;
  status: 'active' | 'cancelled' | 'expired';
  plan: {
    tier: LicenseTier;
    priceAmount: number;
    interval: 'month' | 'year';
  };
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
}

export interface PolarWebhookEvent {
  type: string;
  data: {
    object: any;
  };
}

/**
 * Polar Service - Integration with Polar.sh payment gateway
 */
export class PolarService {
  private static instance: PolarService;

  private constructor() {}

  static getInstance(): PolarService {
    if (!PolarService.instance) {
      PolarService.instance = new PolarService();
    }
    return PolarService.instance;
  }

  /**
   * Create checkout session for subscription upgrade
   */
  async createCheckoutSession(
    tier: LicenseTier,
    customerEmail?: string
  ): Promise<PolarCheckoutSession> {
    if (!polarConfig.apiKey) {
      throw new Error('Polar API key not configured');
    }

    // Map license tier to Polar product/checkout
    const productBenefitId = this.getBenefitIdForTier(tier);

    const response = await fetch(`${polarConfig.baseUrl}/v1/checkouts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${polarConfig.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_benefit_id: productBenefitId,
        success_url: polarConfig.checkoutSuccessUrl,
        customer_email: customerEmail,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Polar API error: ${error}`);
    }

    const data = await response.json() as { id: string; url: string; status: string };
    return {
      id: data.id,
      url: data.url,
      status: data.status,
    };
  }

  /**
   * Verify webhook signature
   */
  async verifyWebhook(payload: string, signature: string): Promise<boolean> {
    if (!polarConfig.webhookSecret) {
      console.warn('[Polar] Webhook secret not configured - skipping verification');
      return true;
    }

    const crypto = await import('crypto');

    const hmac = crypto.createHmac('sha256', polarConfig.webhookSecret);
    const digest = hmac.update(payload).digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(digest)
    );
  }

  /**
   * Parse webhook event
   */
  parseWebhookEvent(payload: string): PolarWebhookEvent {
    return JSON.parse(payload) as PolarWebhookEvent;
  }

  /**
   * Get subscription details by ID
   */
  async getSubscription(subscriptionId: string): Promise<PolarSubscription> {
    if (!polarConfig.apiKey) {
      throw new Error('Polar API key not configured');
    }

    const response = await fetch(`${polarConfig.baseUrl}/v1/subscriptions/${subscriptionId}`, {
      headers: {
        'Authorization': `Bearer ${polarConfig.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Polar API error: ${response.statusText}`);
    }

    const data = await response.json() as {
      id: string;
      status: 'active' | 'cancelled' | 'expired';
      product_id: string;
      price_amount: number;
      recurring_interval: 'month' | 'year';
      current_period_start: string;
      current_period_end: string;
    };
    return {
      id: data.id,
      status: data.status,
      plan: {
        tier: this.mapTierFromProduct(data.product_id),
        priceAmount: data.price_amount,
        interval: data.recurring_interval,
      },
      currentPeriodStart: new Date(data.current_period_start),
      currentPeriodEnd: new Date(data.current_period_end),
    };
  }

  /**
   * Map Polar product ID to LicenseTier
   */
  private mapTierFromProduct(productId: string): LicenseTier {
    // Configure your Polar product IDs here
    const productTierMap: Record<string, LicenseTier> = {
      'pro-monthly': LicenseTier.PRO,
      'pro-yearly': LicenseTier.PRO,
      'enterprise-monthly': LicenseTier.ENTERPRISE,
      'enterprise-yearly': LicenseTier.ENTERPRISE,
    };

    return productTierMap[productId] || LicenseTier.FREE;
  }

  /**
   * Get Polar benefit ID for license tier
   */
  private getBenefitIdForTier(tier: LicenseTier): string {
    // Configure your Polar benefit IDs here
    const benefitMap: Record<LicenseTier, string> = {
      [LicenseTier.FREE]: '',
      [LicenseTier.PRO]: process.env.POLAR_PRO_BENEFIT_ID || 'pro-monthly',
      [LicenseTier.ENTERPRISE]: process.env.POLAR_ENTERPRISE_BENEFIT_ID || 'enterprise-monthly',
    };

    return benefitMap[tier];
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    if (!polarConfig.apiKey) {
      throw new Error('Polar API key not configured');
    }

    const response = await fetch(`${polarConfig.baseUrl}/v1/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${polarConfig.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Polar API error: ${response.statusText}`);
    }
  }
}
