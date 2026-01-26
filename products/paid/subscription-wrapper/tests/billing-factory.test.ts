import { BillingFactory, BillingProvider } from '../billing/billing-factory';
import { StripeBillingAdapter } from '../billing/stripe-subscription';
import { PaddleBillingAdapter } from '../billing/paddle-subscription';

describe('BillingFactory', () => {
  const API_KEY = 'sk_test_123';
  const WEBHOOK_SECRET = 'whsec_test_123';

  beforeAll(() => {
    process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
  });

  it('should return Stripe adapter when provider is stripe', () => {
    const adapter = BillingFactory.createAdapter('stripe', API_KEY);
    expect(adapter).toBeInstanceOf(StripeBillingAdapter);
  });

  it('should return Paddle adapter when provider is paddle', () => {
    const adapter = BillingFactory.createAdapter('paddle', API_KEY);
    expect(adapter).toBeInstanceOf(PaddleBillingAdapter);
  });

  it('should throw error for unsupported provider', () => {
    expect(() => {
      BillingFactory.createAdapter('invalid' as BillingProvider, API_KEY);
    }).toThrow('Unsupported billing provider: invalid');
  });
});
