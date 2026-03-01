/**
 * Subscriptions facade — plan management, trials, upgrades, dunning
 */
export interface SubscriptionPlan {
  id: string;
  name: string;
  interval: 'monthly' | 'yearly' | 'weekly';
  price: number;
  currency: string;
  features: string[];
  trialDays?: number;
}

export interface Subscription {
  id: string;
  customerId: string;
  planId: string;
  status: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'paused';
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export class SubscriptionsFacade {
  async createSubscription(customerId: string, planId: string): Promise<Subscription> {
    throw new Error('Implement with vibe-subscription provider');
  }

  async cancelSubscription(subscriptionId: string, immediate?: boolean): Promise<Subscription> {
    throw new Error('Implement with vibe-subscription provider');
  }

  async upgradeSubscription(subscriptionId: string, newPlanId: string): Promise<Subscription> {
    throw new Error('Implement with vibe-subscription provider');
  }
}
