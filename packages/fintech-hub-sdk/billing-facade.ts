/**
 * Billing facade — unified billing orchestration, invoicing, metered billing
 */
export interface BillingConfig {
  provider: 'stripe' | 'polar' | 'custom';
  currency: string;
  taxStrategy: 'inclusive' | 'exclusive' | 'none';
}

export interface Invoice {
  id: string;
  customerId: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  lineItems: LineItem[];
  dueDate: string;
}

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export class BillingFacade {
  constructor(private readonly config: BillingConfig) {}

  async createInvoice(customerId: string, items: LineItem[]): Promise<Invoice> {
    throw new Error('Implement with vibe-billing provider');
  }

  async getInvoice(invoiceId: string): Promise<Invoice> {
    throw new Error('Implement with vibe-billing provider');
  }

  async processMeteredUsage(customerId: string, metric: string, quantity: number): Promise<void> {
    throw new Error('Implement with vibe-billing provider');
  }
}
