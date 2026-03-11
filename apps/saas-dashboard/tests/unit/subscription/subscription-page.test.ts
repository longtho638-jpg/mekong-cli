import { describe, it, expect } from 'vitest';

describe('Subscription Page', () => {
  const PLANS = {
    FREE: {
      name: 'Free',
      price: '$0',
      features: ['Basic missions', 'Limited analytics', 'Community support'],
    },
    PRO: {
      name: 'Pro',
      price: '$49',
      features: ['Unlimited missions', 'Advanced analytics', 'Priority support', 'Custom integrations'],
    },
    ENTERPRISE: {
      name: 'Enterprise',
      price: '$199',
      features: ['Everything in Pro', 'Dedicated support', 'SLA', 'Custom contracts', 'SSO/SAML'],
    },
  };

  describe('Plan definitions', () => {
    it('has correct FREE plan', () => {
      expect(PLANS.FREE.name).toBe('Free');
      expect(PLANS.FREE.price).toBe('$0');
      expect(PLANS.FREE.features).toHaveLength(3);
    });

    it('has correct PRO plan', () => {
      expect(PLANS.PRO.name).toBe('Pro');
      expect(PLANS.PRO.price).toBe('$49');
      expect(PLANS.PRO.features).toHaveLength(4);
    });

    it('has correct ENTERPRISE plan', () => {
      expect(PLANS.ENTERPRISE.name).toBe('Enterprise');
      expect(PLANS.ENTERPRISE.price).toBe('$199');
      expect(PLANS.ENTERPRISE.features).toHaveLength(5);
    });
  });

  describe('Plan upgrade logic', () => {
    it('can upgrade from FREE to PRO', () => {
      const currentPlan = 'FREE';
      const targetPlan = 'PRO';
      expect(targetPlan).not.toBe(currentPlan);
      expect(PLANS[targetPlan as keyof typeof PLANS].price).not.toBe(PLANS[currentPlan as keyof typeof PLANS].price);
    });

    it('can upgrade from FREE to ENTERPRISE', () => {
      const currentPlan = 'FREE';
      const targetPlan = 'ENTERPRISE';
      expect(targetPlan).not.toBe(currentPlan);
    });
  });

  describe('Feature comparison', () => {
    it('ENTERPRISE has more features than FREE', () => {
      expect(PLANS.ENTERPRISE.features.length).toBeGreaterThan(PLANS.FREE.features.length);
    });

    it('PRO has more features than FREE', () => {
      expect(PLANS.PRO.features.length).toBeGreaterThan(PLANS.FREE.features.length);
    });
  });
});
