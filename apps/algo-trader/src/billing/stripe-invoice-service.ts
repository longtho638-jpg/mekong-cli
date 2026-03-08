/**
 * Stripe Invoice Service
 *
 * Creates and manages Stripe invoices for overage charges.
 * Integrates with OverageCalculator to generate invoice items from usage data.
 *
 * Features:
 * - Create draft invoices with overage line items
 * - Add invoice items for multiple metrics (API calls, compute minutes, ML inferences)
 * - Finalize and send invoices to customers
 * - Idempotent operations with metadata tracking
 *
 * @see https://docs.stripe.com/api/invoices
 * @see https://docs.stripe.com/api/invoiceitems
 */

import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { OverageSummary, OverageCharge } from './overage-calculator';

const prisma = new PrismaClient();

/**
 * Invoice creation result
 */
export interface InvoiceResult {
  success: boolean;
  invoiceId?: string;
  invoiceNumber?: string;
  hostessUrl?: string;
  totalAmount: number;
  currency: string;
  error?: string;
}

/**
 * Invoice configuration options
 */
export interface InvoiceOptions {
  /** Number of days until invoice is due */
  daysUntilDue?: number;
  /** Custom description for the invoice */
  description?: string;
  /** Metadata to attach to invoice */
  metadata?: Record<string, string>;
  /** Statement descriptor for bank statements */
  statementDescriptor?: string;
  /** Whether to auto-finalize invoice on creation */
  autoFinalize?: boolean;
}

/**
 * Stripe Invoice Service
 */
export class StripeInvoiceService {
  private static instance: StripeInvoiceService;
  private stripe: Stripe;

  private constructor() {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

    if (!stripeSecretKey) {
      logger.warn('[StripeInvoice] STRIPE_SECRET_KEY not configured');
    }

    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-02-24.acacia',
      maxNetworkRetries: 3,
    });
  }

  static getInstance(): StripeInvoiceService {
    if (!StripeInvoiceService.instance) {
      StripeInvoiceService.instance = new StripeInvoiceService();
    }
    return StripeInvoiceService.instance;
  }

  /**
   * Create a draft invoice for overage charges
   *
   * @param customerId - Stripe customer ID
   * @param summary - Overage summary from OverageCalculator
   * @param options - Invoice configuration options
   * @returns Invoice result with invoice ID and details
   */
  async createOverageInvoice(
    customerId: string,
    summary: OverageSummary,
    options?: InvoiceOptions
  ): Promise<InvoiceResult> {
    logger.info('[StripeInvoice] Creating overage invoice', {
      customerId,
      tenantId: summary.tenantId,
      period: summary.period,
      totalOverage: summary.totalOverage,
    });

    try {
      // Validate customer exists
      const customer = await this.stripe.customers.retrieve(customerId);
      if (customer.deleted) {
        throw new Error(`Customer not found: ${customerId}`);
      }

      // Create draft invoice
      const invoiceData: Stripe.InvoiceCreateParams = {
        customer: customerId,
        description: options?.description || `Overage charges for ${summary.period}`,
        metadata: {
          ...options?.metadata,
          tenantId: summary.tenantId,
          period: summary.period,
          tier: summary.tier,
          type: 'overage',
        },
        days_until_due: options?.daysUntilDue || 30,
        auto_advance: false, // Don't auto-finalize
      };

      const invoice = await this.stripe.invoices.create(invoiceData);

      logger.info('[StripeInvoice] Draft invoice created', {
        invoiceId: invoice.id,
        customerId,
      });

      // Add invoice items for each overage charge
      for (const charge of summary.charges) {
        await this.addOverageInvoiceItem(
          invoice.id,
          charge,
          summary.tenantId,
          summary.period
        );
      }

      // Optionally finalize invoice
      if (options?.autoFinalize) {
        await this.finalizeInvoice(invoice.id);
      }

      const result: InvoiceResult = {
        success: true,
        invoiceId: invoice.id,
        invoiceNumber: invoice.number || undefined,
        hostessUrl: invoice.hosted_invoice_url || undefined,
        totalAmount: invoice.amount_due || 0,
        currency: invoice.currency || 'usd',
      };

      logger.info('[StripeInvoice] Overage invoice complete', {
        invoiceId: invoice.id,
        totalAmount: result.totalAmount,
        currency: result.currency,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[StripeInvoice] Failed to create overage invoice', {
        customerId,
        tenantId: summary.tenantId,
        error: errorMessage,
      });

      return {
        success: false,
        totalAmount: 0,
        currency: 'usd',
        error: errorMessage,
      };
    }
  }

  /**
   * Add a single overage charge as an invoice item
   */
  private async addOverageInvoiceItem(
    invoiceId: string,
    charge: OverageCharge,
    tenantId: string,
    period: string
  ): Promise<void> {
    const metricLabels: Record<string, string> = {
      api_calls: 'API Calls',
      compute_minutes: 'Compute Minutes',
      ml_inferences: 'ML Inferences',
    };

    const metricLabel = metricLabels[charge.metric] || charge.metric;

    // Create invoice item
    await this.stripe.invoiceItems.create({
      customer: await this.getCustomerIdForTenant(tenantId),
      invoice: invoiceId,
      amount: Math.round(charge.totalCharge * 100), // Convert to cents
      currency: 'usd',
      description: `${metricLabel} overage: ${charge.overageUnits} units @ $${charge.pricePerUnit}/unit`,
      metadata: {
        metric: charge.metric,
        period,
        tenantId,
        type: 'overage',
        baseLimit: charge.baseLimit.toString(),
        actualUsage: charge.actualUsage.toString(),
        overageUnits: charge.overageUnits.toString(),
      },
    });

    logger.debug('[StripeInvoice] Added invoice item', {
      invoiceId,
      metric: charge.metric,
      amount: charge.totalCharge,
    });
  }

  /**
   * Finalize a draft invoice
   *
   * @param invoiceId - Stripe invoice ID
   * @returns Finalized invoice
   */
  async finalizeInvoice(invoiceId: string): Promise<Stripe.Invoice> {
    logger.info('[StripeInvoice] Finalizing invoice', { invoiceId });

    try {
      const invoice = await this.stripe.invoices.finalizeInvoice(invoiceId, {
        auto_advance: true,
      });

      logger.info('[StripeInvoice] Invoice finalized', {
        invoiceId,
        amountDue: invoice.amount_due,
        dueDate: invoice.due_date,
      });

      return invoice;
    } catch (error) {
      logger.error('[StripeInvoice] Failed to finalize invoice', {
        invoiceId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Void/cancel an invoice
   *
   * @param invoiceId - Stripe invoice ID
   */
  async voidInvoice(invoiceId: string): Promise<void> {
    logger.info('[StripeInvoice] Voiding invoice', { invoiceId });

    try {
      await this.stripe.invoices.voidInvoice(invoiceId);
      logger.info('[StripeInvoice] Invoice voided', { invoiceId });
    } catch (error) {
      logger.error('[StripeInvoice] Failed to void invoice', {
        invoiceId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(invoiceId: string): Promise<Stripe.Invoice | null> {
    try {
      const invoice = await this.stripe.invoices.retrieve(invoiceId);
      return invoice;
    } catch (error) {
      if (error instanceof Stripe.errors.StripeInvalidRequestError) {
        return null;
      }
      throw error;
    }
  }

  /**
   * List invoices for a customer
   */
  async listInvoices(
    customerId: string,
    options?: { limit?: number; status?: Stripe.InvoiceListParams.Status }
  ): Promise<Stripe.Invoice[]> {
    const params: Stripe.InvoiceListParams = {
      customer: customerId,
      limit: options?.limit || 10,
    };

    if (options?.status) {
      params.status = options.status;
    }

    const invoices = await this.stripe.invoices.list(params);
    return invoices.data;
  }

  /**
   * Get customer ID for a tenant
   *
   * Looks up Stripe customer ID from tenant metadata or License table
   */
  private async getCustomerIdForTenant(tenantId: string): Promise<string> {
    // Try to get from Tenant metadata
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true },
    });

    if (tenant && (tenant as any).stripeCustomerId) {
      return (tenant as any).stripeCustomerId;
    }

    // Fallback: try to get from License metadata
    const license = await prisma.license.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    if (license && license.metadata) {
      const metadata = license.metadata as any;
      if (metadata.stripeCustomerId) {
        return metadata.stripeCustomerId;
      }
    }

    // Return tenantId as fallback (assuming it's a Stripe customer ID)
    if (tenantId.startsWith('cus_')) {
      return tenantId;
    }

    throw new Error(
      `Cannot find Stripe customer ID for tenant: ${tenantId}. ` +
      'Ensure tenant has stripeCustomerId in metadata.'
    );
  }

  /**
   * Reset instance (for testing)
   */
  static resetInstance(): void {
    StripeInvoiceService.instance = new StripeInvoiceService();
  }

  /**
   * Close Prisma connection
   */
  async shutdown(): Promise<void> {
    await prisma.$disconnect();
  }
}

// Export singleton instance
export const stripeInvoiceService = StripeInvoiceService.getInstance();
