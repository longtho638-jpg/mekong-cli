/** Revenue tracking, MRR calculation, and financial summary */
import { randomUUID } from 'node:crypto';
import type { Result } from '../types/common.js';
import { ok, err } from '../types/common.js';
import type { FinanceStore } from './store.js';
import type { RevenueEntry, FinancialSummary } from './types.js';
import type { CrmStore } from '../crm/store.js';

export interface RecordRevenueInput {
  customerId: string;
  amount: number;
  type: RevenueEntry['type'];
  description: string;
  date: string;
  invoiceId?: string;
  currency?: string;
  stripePaymentId?: string;
}

export class RevenueTracker {
  constructor(
    private store: FinanceStore,
    private crm: CrmStore,
  ) {}

  async record(input: RecordRevenueInput): Promise<Result<RevenueEntry>> {
    try {
      const entry: RevenueEntry = {
        id: randomUUID(),
        invoiceId: input.invoiceId,
        customerId: input.customerId,
        amount: input.amount,
        currency: input.currency ?? 'USD',
        type: input.type,
        description: input.description,
        date: input.date,
        stripePaymentId: input.stripePaymentId,
        createdAt: new Date().toISOString(),
      };
      return this.store.save('revenue', entry);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /** Sum MRR from active customers in CRM */
  async calculateMrr(): Promise<Result<number>> {
    try {
      const result = await this.crm.getAll('customers', { status: 'active' });
      if (!result.ok) return err(result.error);
      const mrr = result.value.reduce((sum, c) => sum + c.mrr, 0);
      return ok(mrr);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /** Months of runway at current burn rate */
  async calculateRunway(
    cashOnHand: number,
    burnRate: number,
  ): Promise<Result<number>> {
    if (burnRate <= 0) return ok(Infinity);
    return ok(Math.floor(cashOnHand / burnRate));
  }

  async generateSummary(from: string, to: string): Promise<Result<FinancialSummary>> {
    try {
      const [revenueResult, expensesResult, customersResult, mrrResult] = await Promise.all([
        this.store.getRevenue({ from, to }),
        this.store.getExpenses({ from, to }),
        this.crm.getAll('customers'),
        this.calculateMrr(),
      ]);

      if (!revenueResult.ok) return err(revenueResult.error);
      if (!expensesResult.ok) return err(expensesResult.error);
      if (!customersResult.ok) return err(customersResult.error);
      if (!mrrResult.ok) return err(mrrResult.error);

      const revenues = revenueResult.value;
      const expenses = expensesResult.value;
      const customers = customersResult.value;
      const mrr = mrrResult.value;

      // Revenue by type
      const byType: Record<string, number> = {};
      let totalRevenue = 0;
      for (const rev of revenues) {
        byType[rev.type] = (byType[rev.type] ?? 0) + rev.amount;
        totalRevenue += rev.amount;
      }

      // Expenses by category + top vendors
      const byCategory: Record<string, number> = {};
      const vendorTotals: Record<string, number> = {};
      let totalExpenses = 0;
      let aiCosts = 0;
      for (const exp of expenses) {
        byCategory[exp.category] = (byCategory[exp.category] ?? 0) + exp.amount;
        vendorTotals[exp.vendor] = (vendorTotals[exp.vendor] ?? 0) + exp.amount;
        totalExpenses += exp.amount;
        if (exp.category === 'ai_api') aiCosts += exp.amount;
      }

      const topVendors = Object.entries(vendorTotals)
        .map(([vendor, amount]) => ({ vendor, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      const grossProfit = totalRevenue - totalExpenses;
      const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

      // Customer metrics
      const periodStart = new Date(from);
      const periodEnd = new Date(to);
      const activeCustomers = customers.filter((c) => c.status === 'active');
      const newCustomers = customers.filter((c) => {
        const d = new Date(c.createdAt);
        return d >= periodStart && d <= periodEnd;
      });
      const churnedCustomers = customers.filter((c) => {
        if (!c.churnedAt) return false;
        const d = new Date(c.churnedAt);
        return d >= periodStart && d <= periodEnd;
      });

      const arpu = activeCustomers.length > 0 ? mrr / activeCustomers.length : 0;
      const avgChurnRate = activeCustomers.length > 0
        ? churnedCustomers.length / activeCustomers.length
        : 0;
      const ltv = avgChurnRate > 0 ? arpu / avgChurnRate : arpu * 24;

      // Burn rate = average monthly expenses
      const monthCount = this.monthsBetween(from, to) || 1;
      const burnRate = totalExpenses / monthCount;

      return ok({
        period: { from, to },
        revenue: {
          total: totalRevenue,
          byType,
          mrr,
          arr: mrr * 12,
          mrrGrowth: 0, // requires previous period data
        },
        expenses: {
          total: totalExpenses,
          byCategory,
          topVendors,
        },
        profit: {
          gross: grossProfit,
          margin: Math.round(margin * 100) / 100,
        },
        runway: {
          months: burnRate > 0 ? Math.floor(totalRevenue / burnRate) : 0,
          burnRate: Math.round(burnRate * 100) / 100,
        },
        customers: {
          total: customers.length,
          new: newCustomers.length,
          churned: churnedCustomers.length,
          arpu: Math.round(arpu * 100) / 100,
          ltv: Math.round(ltv * 100) / 100,
        },
        aiCosts: {
          total: aiCosts,
          byProvider: {},
          byModel: {},
          percentOfRevenue:
            totalRevenue > 0 ? Math.round((aiCosts / totalRevenue) * 10000) / 100 : 0,
        },
      });
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  private monthsBetween(from: string, to: string): number {
    const f = new Date(from);
    const t = new Date(to);
    return (t.getFullYear() - f.getFullYear()) * 12 + (t.getMonth() - f.getMonth()) + 1;
  }
}
