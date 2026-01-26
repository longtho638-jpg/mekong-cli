import { IBillingAdapter } from '../src/shared/types';

export class PaddleBillingAdapter implements IBillingAdapter {
  constructor(private apiKey: string) {}

  async createSubscription(tier: string, customerEmail: string): Promise<{ subscriptionId: string; clientSecret: string }> {
    // Mock implementation for Paddle
    console.log(`[Paddle] Creating subscription for ${tier} / ${customerEmail}`);
    return {
      subscriptionId: `sub_paddle_${Math.random().toString(36).substring(7)}`,
      clientSecret: 'paddle_checkout_url_mock',
    };
  }

  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    console.log(`[Paddle] Canceling subscription ${subscriptionId}`);
    return true;
  }

  async getInvoice(subscriptionId: string): Promise<any> {
    return { id: 'inv_paddle_mock', amount: 1900, currency: 'USD' };
  }

  async verifyWebhook(signature: string, payload: any): Promise<any> {
    if (!signature) throw new Error('Missing signature');
    return payload;
  }
}
