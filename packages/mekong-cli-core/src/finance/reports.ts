/** Financial report generation — CLI tables, markdown, CSV export */
import { writeFile } from 'node:fs/promises';
import type { Result } from '../types/common.js';
import { ok, err } from '../types/common.js';
import type { RevenueTracker } from './revenue.js';
import type { FinanceStore } from './store.js';
import type { FinancialSummary, MonthlyCloseReport } from './types.js';

export class FinancialReporter {
  constructor(
    private tracker: RevenueTracker,
    private store: FinanceStore,
  ) {}

  /** Generate a MonthlyCloseReport for YYYY-MM */
  async monthlyClose(month: string): Promise<Result<MonthlyCloseReport>> {
    try {
      const from = `${month}-01`;
      const lastDay = new Date(
        parseInt(month.slice(0, 4), 10),
        parseInt(month.slice(5, 7), 10),
        0,
      ).getDate();
      const to = `${month}-${String(lastDay).padStart(2, '0')}`;

      const summaryResult = await this.tracker.generateSummary(from, to);
      if (!summaryResult.ok) return err(summaryResult.error);

      const [invoicesResult, newSubsResult] = await Promise.all([
        this.store.getInvoices(),
        this.store.getRevenue({ from, to, type: 'subscription' }),
      ]);
      if (!invoicesResult.ok) return err(invoicesResult.error);
      if (!newSubsResult.ok) return err(newSubsResult.error);

      const monthInvoices = invoicesResult.value.filter(
        (inv) => inv.createdAt >= from && inv.createdAt <= to + 'T23:59:59Z',
      );

      const report: MonthlyCloseReport = {
        month,
        summary: summaryResult.value,
        invoicesSent: monthInvoices.filter(
          (i) => i.status === 'sent' || i.status === 'viewed' || i.status === 'paid',
        ).length,
        invoicesPaid: monthInvoices.filter((i) => i.status === 'paid').length,
        invoicesOverdue: monthInvoices.filter((i) => i.status === 'overdue').length,
        newSubscriptions: newSubsResult.value.length,
        cancelledSubscriptions: summaryResult.value.customers.churned,
        notes: [],
        generatedAt: new Date().toISOString(),
      };

      return ok(report);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /** Format FinancialSummary as ASCII table for CLI output */
  renderCliTable(summary: FinancialSummary): string {
    const line = '─'.repeat(48);
    const row = (label: string, value: string) =>
      `│ ${label.padEnd(28)} ${value.padStart(16)} │`;

    const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const lines = [
      `┌${line}┐`,
      `│ FINANCIAL SUMMARY  ${summary.period.from} → ${summary.period.to}`.padEnd(49) + '│',
      `├${line}┤`,
      row('Revenue (total)', fmt(summary.revenue.total)),
      row('  MRR', fmt(summary.revenue.mrr)),
      row('  ARR', fmt(summary.revenue.arr)),
      `├${line}┤`,
      row('Expenses (total)', fmt(summary.expenses.total)),
      ...Object.entries(summary.expenses.byCategory).map(([cat, amt]) =>
        row(`  ${cat}`, fmt(amt)),
      ),
      `├${line}┤`,
      row('Gross Profit', fmt(summary.profit.gross)),
      row('Margin', `${summary.profit.margin.toFixed(1)}%`),
      `├${line}┤`,
      row('Burn Rate / mo', fmt(summary.runway.burnRate)),
      row('Runway', `${summary.runway.months} months`),
      `├${line}┤`,
      row('Customers (total)', String(summary.customers.total)),
      row('  New', String(summary.customers.new)),
      row('  Churned', String(summary.customers.churned)),
      row('  ARPU', fmt(summary.customers.arpu)),
      row('AI Costs', fmt(summary.aiCosts.total)),
      row('  % of Revenue', `${summary.aiCosts.percentOfRevenue.toFixed(1)}%`),
      `└${line}┘`,
    ];

    return lines.join('\n');
  }

  /** Format MonthlyCloseReport as markdown */
  renderMarkdown(report: MonthlyCloseReport): string {
    const s = report.summary;
    const fmt = (n: number) =>
      `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const categoryRows = Object.entries(s.expenses.byCategory)
      .map(([cat, amt]) => `| ${cat} | ${fmt(amt)} |`)
      .join('\n');

    return [
      `# Monthly Close Report — ${report.month}`,
      '',
      `_Generated: ${report.generatedAt}_`,
      '',
      '## Revenue',
      `| Metric | Value |`,
      `|--------|-------|`,
      `| Total Revenue | ${fmt(s.revenue.total)} |`,
      `| MRR | ${fmt(s.revenue.mrr)} |`,
      `| ARR | ${fmt(s.revenue.arr)} |`,
      '',
      '## Expenses',
      `| Category | Amount |`,
      `|----------|--------|`,
      categoryRows,
      `| **Total** | **${fmt(s.expenses.total)}** |`,
      '',
      '## Profitability',
      `| Metric | Value |`,
      `|--------|-------|`,
      `| Gross Profit | ${fmt(s.profit.gross)} |`,
      `| Margin | ${s.profit.margin.toFixed(1)}% |`,
      `| Burn Rate | ${fmt(s.runway.burnRate)}/mo |`,
      `| Runway | ${s.runway.months} months |`,
      '',
      '## Invoices',
      `| Status | Count |`,
      `|--------|-------|`,
      `| Sent | ${report.invoicesSent} |`,
      `| Paid | ${report.invoicesPaid} |`,
      `| Overdue | ${report.invoicesOverdue} |`,
      '',
      '## Customers',
      `| Metric | Value |`,
      `|--------|-------|`,
      `| Total | ${s.customers.total} |`,
      `| New | ${s.customers.new} |`,
      `| Churned | ${s.customers.churned} |`,
      `| ARPU | ${fmt(s.customers.arpu)} |`,
      `| LTV | ${fmt(s.customers.ltv)} |`,
      '',
      report.notes.length > 0 ? '## Notes\n' + report.notes.map((n) => `- ${n}`).join('\n') : '',
    ]
      .filter((l) => l !== undefined)
      .join('\n');
  }

  /** Export revenue + expenses as CSV to outputPath */
  async exportCsv(
    from: string,
    to: string,
    outputPath: string,
  ): Promise<Result<void>> {
    try {
      const [revenueResult, expensesResult] = await Promise.all([
        this.store.getRevenue({ from, to }),
        this.store.getExpenses({ from, to }),
      ]);
      if (!revenueResult.ok) return err(revenueResult.error);
      if (!expensesResult.ok) return err(expensesResult.error);

      const rows: string[] = [
        'type,date,description,amount,currency,category,vendor,reference',
      ];

      for (const rev of revenueResult.value) {
        rows.push(
          [
            'revenue',
            rev.date,
            `"${rev.description.replace(/"/g, '""')}"`,
            rev.amount.toFixed(2),
            rev.currency,
            rev.type,
            '',
            rev.invoiceId ?? rev.stripePaymentId ?? '',
          ].join(','),
        );
      }

      for (const exp of expensesResult.value) {
        rows.push(
          [
            'expense',
            exp.date,
            `"${exp.description.replace(/"/g, '""')}"`,
            (-exp.amount).toFixed(2),
            exp.currency,
            exp.category,
            `"${exp.vendor.replace(/"/g, '""')}"`,
            '',
          ].join(','),
        );
      }

      await writeFile(outputPath, rows.join('\n') + '\n', 'utf-8');
      return ok(undefined);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }
}
