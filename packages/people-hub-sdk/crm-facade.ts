/**
 * CRM facade — contacts, deals, pipeline, customer success
 */
export interface Contact {
  id: string;
  name: string;
  email: string;
  company?: string;
  stage: 'lead' | 'prospect' | 'customer' | 'churned';
  score: number;
  tags: string[];
  lastInteraction: string;
}

export interface Deal {
  id: string;
  contactId: string;
  title: string;
  value: number;
  currency: string;
  stage: 'discovery' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  probability: number;
  closeDate: string;
}

export interface CustomerHealthScore {
  customerId: string;
  score: number;
  factors: { name: string; impact: number; trend: 'up' | 'down' | 'stable' }[];
  churnRisk: 'low' | 'medium' | 'high';
}

export class CRMFacade {
  async getContact(contactId: string): Promise<Contact> {
    throw new Error('Implement with vibe-crm provider');
  }

  async createDeal(deal: Omit<Deal, 'id'>): Promise<Deal> {
    throw new Error('Implement with vibe-crm provider');
  }

  async getHealthScore(customerId: string): Promise<CustomerHealthScore> {
    throw new Error('Implement with vibe-customer-success provider');
  }

  async getPipeline(stage?: string): Promise<Deal[]> {
    throw new Error('Implement with vibe-crm provider');
  }
}
