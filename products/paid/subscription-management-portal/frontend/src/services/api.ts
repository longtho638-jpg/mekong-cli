/**
 * API Client for Subscription Management Portal
 * Handles all backend communication
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Subscription {
  id: string;
  user_id: string;
  plan: 'solo' | 'team' | 'enterprise';
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  stripe_subscription_id: string;
}

export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'void';
  created: string;
  invoice_pdf: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card';
  card: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  is_default: boolean;
}

export const api = {
  subscriptions: {
    getCurrent: async (): Promise<Subscription> => {
      const res = await fetch(`${API_BASE}/api/subscriptions/current`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Failed to fetch subscription');
      return res.json();
    },

    upgrade: async (plan: string) => {
      const res = await fetch(`${API_BASE}/api/subscriptions/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) throw new Error('Upgrade failed');
      return res.json();
    },

    downgrade: async (plan: string) => {
      const res = await fetch(`${API_BASE}/api/subscriptions/downgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) throw new Error('Downgrade failed');
      return res.json();
    },

    cancel: async () => {
      const res = await fetch(`${API_BASE}/api/subscriptions/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Cancellation failed');
      return res.json();
    },
  },

  billing: {
    getHistory: async (): Promise<Invoice[]> => {
      const res = await fetch(`${API_BASE}/api/billing/history`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Failed to fetch billing history');
      return res.json();
    },

    getPaymentMethods: async (): Promise<PaymentMethod[]> => {
      const res = await fetch(`${API_BASE}/api/billing/payment-methods`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Failed to fetch payment methods');
      return res.json();
    },

    addPaymentMethod: async (paymentMethodId: string) => {
      const res = await fetch(`${API_BASE}/api/billing/payment-method`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ payment_method_id: paymentMethodId }),
      });
      if (!res.ok) throw new Error('Failed to add payment method');
      return res.json();
    },

    setDefaultPaymentMethod: async (paymentMethodId: string) => {
      const res = await fetch(`${API_BASE}/api/billing/payment-method/default`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ payment_method_id: paymentMethodId }),
      });
      if (!res.ok) throw new Error('Failed to set default payment method');
      return res.json();
    },

    removePaymentMethod: async (paymentMethodId: string) => {
      const res = await fetch(`${API_BASE}/api/billing/payment-method/${paymentMethodId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Failed to remove payment method');
      return res.json();
    },
  },
};
