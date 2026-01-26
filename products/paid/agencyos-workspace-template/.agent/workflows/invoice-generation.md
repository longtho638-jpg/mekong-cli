---
name: Invoice Generation
description: Generate and send professional invoices.
tags: [finance, revenue, ops]
agent: finance-hub
---

# 💵 Invoice Generation Workflow

**Objective**: Get paid.

## ⚡ Quick Execute
```bash
agency finance:invoice --client="{{CLIENT_ID}}"
```

## 📝 Steps

1.  **Verify Deliverables**
    Ensure work is done and approved.

2.  **Calculate Amount**
    - Retainer: Fixed fee.
    - Hourly: Hours * Rate.
    - Commission: Deal Value * %.

3.  **Generate Invoice**
    Create PDF invoice with:
    - Agency Details
    - Client Details
    - Line Items
    - Payment Terms (Net 15/30)
    - Payment Methods (Bank/Stripe)

4.  **Send to Client**
    Email invoice to billing contact.

5.  **Record in AR**
    Add to Accounts Receivable tracking.

## ✅ Success Criteria
- [ ] Invoice PDF created
- [ ] Sent to client
- [ ] Logged in Finance system
