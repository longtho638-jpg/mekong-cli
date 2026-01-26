import { IBillingAdapter } from '../src/shared/types';
import { StripeBillingAdapter } from './stripe-subscription';
import { PaddleBillingAdapter } from './paddle-subscription';

export type BillingProvider = 'stripe' | 'paddle';

export class BillingFactory {
  static createAdapter(provider: BillingProvider, apiKey: string): IBillingAdapter {
    switch (provider) {
      case 'stripe':
        return new StripeBillingAdapter(apiKey);
      case 'paddle':
        return new PaddleBillingAdapter(apiKey);
      default:
        throw new Error(`Unsupported billing provider: ${provider}`);
    }
  }
}
