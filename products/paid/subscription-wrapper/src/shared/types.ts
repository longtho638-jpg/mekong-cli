export interface IBillingAdapter {
  createSubscription(tier: string, customerEmail: string): Promise<{ subscriptionId: string; clientSecret: string }>;
  cancelSubscription(subscriptionId: string): Promise<boolean>;
  getInvoice(subscriptionId: string): Promise<any>;
  verifyWebhook(signature: string, payload: any): Promise<any>;
}

export interface ILicenseKey {
  tenantId: string;
  timestamp: number;
  checksum: string;
  tier: 'starter' | 'pro' | 'agency';
  features: string[];
}

export interface ISubscriptionStatus {
  isActive: boolean;
  tier: string;
  expiresAt: Date;
}
