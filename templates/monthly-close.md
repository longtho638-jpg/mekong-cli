# SOP: Monthly Financial Close

**ID:** SOP-FIN-003 | **Version:** 1.0 | **Owner:** Finance Agent

---

## Trigger

- [ ] Last day of month, 11:00 PM
- [ ] First day of next month, 9:00 AM

---

## Prerequisites

- [ ] All expenses logged for month
- [ ] All invoices sent
- [ ] Bank feed connected
- [ ] Previous month closed

---

## Steps

### Step 1: Cut-off Check
```
CHECK: today = last_day_of_month
ACTION: notify all_agents("Please submit expenses by 11:59 PM")
```

### Step 2: Reconcile Bank Accounts
```
FOR EACH bank_account:
  ledger_balance = ledger.sum(account_id)
  bank_balance = bank_api.get_balance(account_id)

  IF abs(ledger_balance - bank_balance) > 1.00:
    CREATE reconciliation_ticket
    NOTIFY: finance_manager
  ELSE:
    MARK: reconciled = true
```

### Step 3: Accrue Unbilled Revenue
```
unbilled = contracts.active
  .where(status = "active")
  .where(billing_date > today)
  .sum(monthly_value / 30 * days_remaining)

ACTION: ledger.create({
  type: "accrued_revenue",
  amount: unbilled,
  description: "Accrued revenue for month"
})
```

### Step 4: Accrue Unreceived Expenses
```
unreceived = subscriptions.active
  .where(next_billing_date > today)
  .sum(monthly_cost / 30 * days_remaining)

ACTION: ledger.create({
  type: "accrued_expense",
  amount: unreceived,
  description: "Accrued expenses for month"
})
```

### Step 5: Depreciation
```
FOR EACH fixed_asset:
  IF asset.status = "active":
    monthly_dep = asset.cost / asset.useful_life_months
    ACTION: ledger.create({
      type: "depreciation",
      asset_id: asset.id,
      amount: monthly_dep
    })
```

### Step 6: Generate Financial Statements
```
ACTION: reports.generate("income_statement", period = current_month)
ACTION: reports.generate("balance_sheet", date = month_end)
ACTION: reports.generate("cash_flow", period = current_month)
```

### Step 7: Calculate MRR Metrics
```
MRR = sum(all_recurring_revenue)
ARR = MRR * 12
churn_rate = lost_mrr / starting_mrr
growth_rate = (ending_mrr - starting_mrr) / starting_mrr
```

### Step 8: Close Period
```
ACTION: accounting.close_period(month = current_month)
MARK: period_status = "closed"
```

### Step 9: Generate Monthly Report
```
ACTION: reports.compile(
  income_statement,
  balance_sheet,
  cash_flow,
  kpi_summary
)
ACTION: email.send(
  to: owner@email.com,
  subject: "Monthly Financial Report - [month]",
  attachments: [monthly_report.pdf]
)
```

---

## Success Criteria

- [ ] All accounts reconciled
- [ ] Accruals posted
- [ ] Depreciation recorded
- [ ] Financial statements generated
- [ ] MRR metrics calculated
- [ ] Period closed
- [ ] Report sent to owner

---

## Error Handling

| Error | Action |
|-------|--------|
| Reconciliation variance > $100 | Create investigation ticket |
| Missing bank feed | Notify finance manager |
| Report generation failed | Retry, then alert |

---

## Rollback

If close contains errors:
1. Reopen period
2. Reverse incorrect entries
3. Post correcting entries
4. Regenerate reports
5. Re-close period

---

## Related SOPs

- SOP-FIN-001: Send Invoice
- SOP-FIN-002: Log Expense
- SOP-OPS-005: Weekly Report
