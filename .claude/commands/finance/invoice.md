---
description: Manage invoices and payments
---

# /finance/invoice - Invoice Manager

> **Create, send, and track invoices**

## List Invoices

// turbo

```bash
curl -s http://localhost:8000/billing/invoices | jq
```

## Create Invoice

```bash
curl -X POST http://localhost:8000/billing/invoices \
  -H "Content-Type: application/json" \
  -d '{"client_id": "123", "items": [{"desc": "Dev work", "amount": 5000}]}'
```

## Payment Status

| Status  | Meaning          |
| ------- | ---------------- |
| Draft   | Not sent         |
| Sent    | Awaiting payment |
| Paid    | Completed        |
| Overdue | Past due date    |

## 🏯 Binh Pháp

> "Tài chính là khí huyết" - Cash flow is the lifeblood.
