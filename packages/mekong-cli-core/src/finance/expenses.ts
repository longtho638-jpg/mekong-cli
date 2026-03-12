/** Expense logging and categorization */
import { randomUUID } from 'node:crypto';
import type { Result } from '../types/common.js';
import { ok, err } from '../types/common.js';
import type { FinanceStore } from './store.js';
import type { Expense } from './types.js';

export interface LogExpenseInput {
  description: string;
  amount: number;
  category: Expense['category'];
  vendor: string;
  date: string;
  currency?: string;
  recurring?: boolean;
  recurringInterval?: Expense['recurringInterval'];
  receiptPath?: string;
  tags?: string[];
}

export interface MonthlySummary {
  month: string;
  total: number;
  byCategory: Record<string, number>;
}

export class ExpenseManager {
  constructor(private store: FinanceStore) {}

  async log(input: LogExpenseInput): Promise<Result<Expense>> {
    try {
      const now = new Date().toISOString();
      const expense: Expense = {
        id: randomUUID(),
        description: input.description,
        amount: input.amount,
        currency: input.currency ?? 'USD',
        category: input.category,
        vendor: input.vendor,
        date: input.date,
        recurring: input.recurring ?? false,
        recurringInterval: input.recurringInterval,
        receiptPath: input.receiptPath,
        tags: input.tags ?? [],
        createdAt: now,
      };
      return this.store.save('expenses', expense);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async getByCategory(
    category: Expense['category'],
    filter?: { from?: string; to?: string },
  ): Promise<Result<Expense[]>> {
    return this.store.getExpenses({ category, ...filter });
  }

  async getRecurring(): Promise<Result<Expense[]>> {
    try {
      const result = await this.store.getExpenses();
      if (!result.ok) return err(result.error);
      return ok(result.value.filter((e) => e.recurring));
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async getMonthlySummary(from: string, to: string): Promise<Result<MonthlySummary[]>> {
    try {
      const result = await this.store.getExpenses({ from, to });
      if (!result.ok) return err(result.error);

      const byMonth: Record<string, MonthlySummary> = {};
      for (const expense of result.value) {
        const month = expense.date.slice(0, 7); // YYYY-MM
        if (!byMonth[month]) {
          byMonth[month] = { month, total: 0, byCategory: {} };
        }
        byMonth[month].total += expense.amount;
        byMonth[month].byCategory[expense.category] =
          (byMonth[month].byCategory[expense.category] ?? 0) + expense.amount;
      }

      return ok(Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month)));
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async getTotalByCategory(
    filter?: { from?: string; to?: string },
  ): Promise<Result<Record<string, number>>> {
    try {
      const result = await this.store.getExpenses(filter);
      if (!result.ok) return err(result.error);

      const totals: Record<string, number> = {};
      for (const expense of result.value) {
        totals[expense.category] = (totals[expense.category] ?? 0) + expense.amount;
      }
      return ok(totals);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async getTopVendors(
    limit = 5,
    filter?: { from?: string; to?: string },
  ): Promise<Result<Array<{ vendor: string; amount: number }>>> {
    try {
      const result = await this.store.getExpenses(filter);
      if (!result.ok) return err(result.error);

      const byVendor: Record<string, number> = {};
      for (const expense of result.value) {
        byVendor[expense.vendor] = (byVendor[expense.vendor] ?? 0) + expense.amount;
      }

      const sorted = Object.entries(byVendor)
        .map(([vendor, amount]) => ({ vendor, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, limit);

      return ok(sorted);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }
}
