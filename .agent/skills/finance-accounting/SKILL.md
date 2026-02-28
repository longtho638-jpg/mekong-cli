---
name: finance-accounting
description: Bookkeeping, invoicing, financial reporting, tax compliance, budgeting, payment processing. Use for accounting automation, financial dashboards, revenue tracking, expense management.
license: MIT
version: 1.0.0
---

# Finance & Accounting Skill

Automate financial operations with modern accounting tools, payment processing, and compliance frameworks.

## When to Use

- Setting up accounting systems and chart of accounts
- Automating invoicing and payment collection
- Financial reporting and dashboard creation
- Tax compliance and filing preparation
- Budget planning and variance analysis
- Expense management and approval workflows
- Revenue recognition and forecasting
- Payment gateway integration (Stripe, Polar.sh)

## Tool Selection

| Need | Choose |
|------|--------|
| SMB accounting | QuickBooks Online, Xero, FreshBooks |
| Enterprise ERP | NetSuite, SAP Business One |
| Open-source accounting | ERPNext, Akaunting |
| Invoicing | Stripe Invoicing, Polar.sh, Invoice Ninja |
| Expense management | Expensify, Ramp, Brex |
| Payment processing | Stripe, Polar.sh (SaaS/digital) |
| Financial planning | Runway, Mosaic, Jirav |
| Tax compliance | Avalara, TaxJar (US sales tax) |
| Payroll | Gusto, Deel (global), Rippling |

## Financial Dashboard KPIs

| Metric | Formula | Frequency |
|--------|---------|-----------|
| MRR | Sum of active subscription revenue | Real-time |
| ARR | MRR × 12 | Monthly |
| Burn Rate | Total expenses - Total revenue | Monthly |
| Runway | Cash balance / Burn rate | Monthly |
| Gross Margin | (Revenue - COGS) / Revenue × 100 | Monthly |
| CAC | Total sales+marketing / New customers | Quarterly |
| LTV | ARPU × Avg customer lifetime | Quarterly |
| LTV:CAC Ratio | LTV / CAC (target: >3:1) | Quarterly |

## Stripe Integration Pattern

```typescript
// Stripe webhook handler for revenue tracking
import Stripe from 'stripe';

async function handleInvoicePaid(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  await db.revenue.create({
    amount: invoice.amount_paid / 100,
    currency: invoice.currency,
    customerId: invoice.customer as string,
    subscriptionId: invoice.subscription as string,
    period: { start: invoice.period_start, end: invoice.period_end },
    createdAt: new Date(),
  });
  // Update MRR dashboard
  await recalculateMRR();
}
```

## Accounting Automation

```yaml
# Monthly close checklist (automate with n8n/Zapier)
monthly_close:
  - reconcile_bank_accounts
  - review_outstanding_invoices
  - categorize_uncategorized_transactions
  - verify_payroll_entries
  - accrue_prepaid_expenses
  - generate_financial_statements:
      - income_statement
      - balance_sheet
      - cash_flow_statement
  - variance_analysis_vs_budget
  - archive_supporting_documents
```

## Key Best Practices (2026)

**Automate Reconciliation:** Bank feeds + AI categorization → 90% auto-categorized
**Real-time Revenue:** Stripe/Polar.sh webhooks → instant MRR/ARR tracking
**Separation of Duties:** Different people for authorization, recording, custody
**Accrual Basis:** Match revenue to period earned, not cash received
**Tax Automation:** Use Avalara/TaxJar for automatic sales tax calculation

## References

- `references/accounting-automation-setup.md` - QuickBooks, Xero, Stripe integration
- `references/saas-financial-metrics.md` - MRR, ARR, churn, cohort analysis
