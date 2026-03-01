/**
 * @agencyos/saas-hub-sdk — Billing Facade
 *
 * Re-exports subscription and billing primitives from @agencyos/vibe-subscription
 * and @agencyos/vibe-billing, augmented with usage metering and invoicing
 * types for SaaS platform billing operations.
 *
 * Usage:
 *   import { createBillingEngine } from '@agencyos/saas-hub-sdk/billing';
 *   import type { SubscriptionPlan, Invoice } from '@agencyos/saas-hub-sdk/billing';
 */

// --- Locally defined types for usage metering and invoicing ---

export interface SubscriptionPlan {
  planId: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceAnnually: number;
  currency: string;
  includedSeats: number;
  includedStorageGb: number;
  features: string[];
  trialDays: number;
  isPublic: boolean;
}

export interface UsageEvent {
  eventId: string;
  tenantId: string;
  metricName: string;
  quantity: number;
  unit: string;
  occurredAt: Date;
  idempotencyKey: string;
}

export interface BillingRecord {
  recordId: string;
  tenantId: string;
  planId: string;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  baseAmount: number;
  usageAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  status: 'pending' | 'finalized' | 'paid' | 'overdue' | 'voided';
}

export interface Invoice {
  invoiceId: string;
  tenantId: string;
  billingRecordId: string;
  invoiceNumber: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  dueDate: Date;
  paidAt?: Date;
  invoicePdfUrl?: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
}

export interface BillingEngine {
  listPlans(): Promise<SubscriptionPlan[]>;
  getPlan(planId: string): Promise<SubscriptionPlan>;
  recordUsage(data: Omit<UsageEvent, 'eventId'>): Promise<UsageEvent>;
  getUsageSummary(tenantId: string, periodStart: Date, periodEnd: Date): Promise<UsageEvent[]>;
  getCurrentBillingRecord(tenantId: string): Promise<BillingRecord>;
  generateInvoice(billingRecordId: string): Promise<Invoice>;
  listInvoices(tenantId: string): Promise<Invoice[]>;
  getInvoice(invoiceId: string): Promise<Invoice>;
}

/**
 * Create a billing engine for plan management, usage metering, and invoicing.
 * Implement with your vibe-subscription and vibe-billing backend.
 */
export function createBillingEngine(): BillingEngine {
  return {
    async listPlans() {
      throw new Error('Implement with your vibe-subscription backend');
    },
    async getPlan(_planId) {
      throw new Error('Implement with your vibe-subscription backend');
    },
    async recordUsage(_data) {
      throw new Error('Implement with your vibe-billing usage metering backend');
    },
    async getUsageSummary(_tenantId, _periodStart, _periodEnd) {
      throw new Error('Implement with your vibe-billing usage metering backend');
    },
    async getCurrentBillingRecord(_tenantId) {
      throw new Error('Implement with your vibe-billing backend');
    },
    async generateInvoice(_billingRecordId) {
      throw new Error('Implement with your vibe-billing invoicing backend');
    },
    async listInvoices(_tenantId) {
      throw new Error('Implement with your vibe-billing invoicing backend');
    },
    async getInvoice(_invoiceId) {
      throw new Error('Implement with your vibe-billing invoicing backend');
    },
  };
}
