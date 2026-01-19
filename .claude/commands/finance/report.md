---
description: View P&L and financial reports
---

# /finance/report - Financial Reports

> **Generate P&L, cash flow, and balance sheets**

## Monthly P&L

// turbo

```bash
curl -s http://localhost:8000/dashboard/revenue | jq
```

## Report Types

| Report    | Endpoint              |
| --------- | --------------------- |
| P&L       | `/dashboard/revenue`  |
| Cash Flow | `/dashboard/cashflow` |
| Expenses  | `/dashboard/expenses` |
| Invoices  | `/billing/invoices`   |

## Export to CSV

```bash
curl -s http://localhost:8000/dashboard/revenue?format=csv > report.csv
```

## 🏯 Binh Pháp

> "Biết kinh tế biết chiến thắng" - Know your numbers, know your strategy.
