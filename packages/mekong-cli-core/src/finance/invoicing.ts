/** Invoice generation, sending, and payment tracking */
import { randomUUID } from 'node:crypto';
import type { Result } from '../types/common.js';
import { ok, err } from '../types/common.js';
import type { FinanceStore } from './store.js';
import type { Invoice } from './types.js';
import type { CrmStore } from '../crm/store.js';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateInvoiceInput {
  customerId: string;
  items: InvoiceItem[];
  taxRate?: number;
  dueDate: string;
  notes?: string;
}

export interface InvoiceSummary {
  sent: number;
  paid: number;
  overdue: number;
  totalSent: number;
  totalPaid: number;
  totalOverdue: number;
}

/** Optional integration interfaces — inject real implementations externally */
export interface StripeIntegration {
  createInvoice(invoice: Invoice): Promise<{ stripeInvoiceId: string }>;
  sendInvoice(stripeInvoiceId: string): Promise<void>;
  getInvoiceStatus(stripeInvoiceId: string): Promise<'draft' | 'open' | 'paid' | 'void'>;
}

export interface EmailIntegration {
  send(to: string, subject: string, body: string): Promise<void>;
}

export class InvoiceManager {
  constructor(
    private store: FinanceStore,
    private crm: CrmStore,
    private stripe?: StripeIntegration,
    private email?: EmailIntegration,
  ) {}

  async create(input: CreateInvoiceInput): Promise<Result<Invoice>> {
    try {
      const customerResult = await this.crm.getById('customers', input.customerId);
      if (!customerResult.ok) return err(customerResult.error);
      if (!customerResult.value) {
        return err(new Error(`Customer not found: ${input.customerId}`));
      }
      const customer = customerResult.value;

      const items = input.items.map((item) => ({
        ...item,
        total: item.quantity * item.unitPrice,
      }));
      const subtotal = items.reduce((sum, i) => sum + i.total, 0);
      const taxRate = input.taxRate ?? 0;
      const tax = Math.round(subtotal * taxRate) / 100;
      const total = subtotal + tax;

      const numResult = await this.store.nextInvoiceNumber();
      if (!numResult.ok) return err(numResult.error);

      const now = new Date().toISOString();
      const invoice: Invoice = {
        id: randomUUID(),
        number: numResult.value,
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email,
        items,
        subtotal,
        tax,
        taxRate,
        total,
        currency: 'USD',
        status: 'draft',
        dueDate: input.dueDate,
        notes: input.notes,
        createdAt: now,
        updatedAt: now,
      };

      return this.store.save('invoices', invoice);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async send(invoiceId: string): Promise<Result<Invoice>> {
    try {
      const result = await this.store.getById('invoices', invoiceId);
      if (!result.ok) return err(result.error);
      if (!result.value) return err(new Error(`Invoice not found: ${invoiceId}`));

      let invoice = result.value;

      if (this.stripe) {
        const { stripeInvoiceId } = await this.stripe.createInvoice(invoice);
        await this.stripe.sendInvoice(stripeInvoiceId);
        invoice = { ...invoice, stripeInvoiceId };
      } else if (this.email) {
        const subject = `Invoice ${invoice.number} — $${invoice.total.toFixed(2)} due ${invoice.dueDate}`;
        const body = this.renderEmailTemplate(invoice);
        await this.email.send(invoice.customerEmail, subject, body);
      }

      const updated: Invoice = {
        ...invoice,
        status: 'sent',
        updatedAt: new Date().toISOString(),
      };
      return this.store.save('invoices', updated);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async syncPaymentStatus(invoiceId: string): Promise<Result<Invoice>> {
    try {
      if (!this.stripe) return err(new Error('Stripe integration not configured'));

      const result = await this.store.getById('invoices', invoiceId);
      if (!result.ok) return err(result.error);
      if (!result.value) return err(new Error(`Invoice not found: ${invoiceId}`));

      const invoice = result.value;
      if (!invoice.stripeInvoiceId) return err(new Error('No Stripe invoice ID'));

      const stripeStatus = await this.stripe.getInvoiceStatus(invoice.stripeInvoiceId);
      const statusMap: Record<string, Invoice['status']> = {
        draft: 'draft',
        open: 'sent',
        paid: 'paid',
        void: 'cancelled',
      };
      const newStatus = statusMap[stripeStatus] ?? invoice.status;

      if (newStatus === invoice.status) return ok(invoice);

      const updated: Invoice = {
        ...invoice,
        status: newStatus,
        paidAt: newStatus === 'paid' ? new Date().toISOString() : invoice.paidAt,
        updatedAt: new Date().toISOString(),
      };
      return this.store.save('invoices', updated);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async sendOverdueReminders(): Promise<Result<number>> {
    try {
      if (!this.email) return err(new Error('Email integration not configured'));

      const today = new Date().toISOString().slice(0, 10);
      const result = await this.store.getInvoices({ status: 'sent' });
      if (!result.ok) return err(result.error);

      const overdue = result.value.filter((inv) => inv.dueDate < today);
      let sent = 0;

      for (const invoice of overdue) {
        const subject = `OVERDUE: Invoice ${invoice.number} — $${invoice.total.toFixed(2)}`;
        const body = `Your invoice ${invoice.number} for $${invoice.total.toFixed(2)} was due on ${invoice.dueDate}. Please remit payment at your earliest convenience.`;
        await this.email.send(invoice.customerEmail, subject, body);

        await this.store.save('invoices', {
          ...invoice,
          status: 'overdue',
          updatedAt: new Date().toISOString(),
        });
        sent++;
      }
      return ok(sent);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async getSummary(from: string, to: string): Promise<Result<InvoiceSummary>> {
    try {
      const result = await this.store.getInvoices();
      if (!result.ok) return err(result.error);

      const inPeriod = result.value.filter(
        (inv) => inv.createdAt >= from && inv.createdAt <= to,
      );

      const summary: InvoiceSummary = {
        sent: 0, paid: 0, overdue: 0,
        totalSent: 0, totalPaid: 0, totalOverdue: 0,
      };

      for (const inv of inPeriod) {
        if (inv.status === 'sent' || inv.status === 'viewed') {
          summary.sent++;
          summary.totalSent += inv.total;
        } else if (inv.status === 'paid') {
          summary.paid++;
          summary.totalPaid += inv.total;
        } else if (inv.status === 'overdue') {
          summary.overdue++;
          summary.totalOverdue += inv.total;
        }
      }
      return ok(summary);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  private renderEmailTemplate(invoice: Invoice): string {
    const itemLines = invoice.items
      .map((i) => `  ${i.description} (${i.quantity} x $${i.unitPrice.toFixed(2)}): $${i.total.toFixed(2)}`)
      .join('\n');
    return [
      `Dear ${invoice.customerName},`,
      '',
      `Please find invoice ${invoice.number} attached.`,
      '',
      'Items:',
      itemLines,
      '',
      `Subtotal: $${invoice.subtotal.toFixed(2)}`,
      invoice.tax > 0 ? `Tax (${invoice.taxRate}%): $${invoice.tax.toFixed(2)}` : '',
      `Total: $${invoice.total.toFixed(2)}`,
      `Due: ${invoice.dueDate}`,
      invoice.notes ? `\nNotes: ${invoice.notes}` : '',
    ].filter((l) => l !== undefined).join('\n');
  }
}
