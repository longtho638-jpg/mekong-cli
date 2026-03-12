# SOP: Log Business Expense

**ID:** SOP-FIN-002 | **Version:** 1.0 | **Owner:** Finance Agent

---

## Trigger

- [ ] New receipt received (email/upload)
- [ ] Credit card transaction posted
- [ ] Employee expense submitted
- [ ] Monthly subscription charged

---

## Prerequisites

- [ ] Receipt image/PDF available
- [ ] Amount and date visible
- [ ] Business purpose documented
- [ ] Approver assigned (if > $500)

---

## Steps

### Step 1: Extract Receipt Data
```
ACTION: ocr.extract(receipt.file) → {
  merchant: string,
  amount: number,
  date: ISO8601,
  category: string,
  tax_amount: number
}
```

### Step 2: Validate Expense
```
CHECK: amount > 0
CHECK: date <= today
CHECK: category in ALLOWED_CATEGORIES
CHECK: receipt.file is readable
```

### Step 3: Categorize
**Auto-categorization rules:**

| Merchant Pattern | Category |
|-----------------|----------|
| AWS|GCP|Azure | Infrastructure |
| GitHub|Vercel|Netlify | Engineering Tools |
| Uber|Grab|Taxi | Transportation |
| Restaurant|Cafe | Meals & Entertainment |
| Hotel|Airbnb | Travel & Lodging |
| Software|SaaS | Subscriptions |

### Step 4: Check Approval Required
```
IF amount >= 500:
  status = "pending_approval"
  notify: finance_manager
ELSE:
  status = "approved"
```

### Step 5: Record Transaction
```
ACTION: ledger.create({
  type: "expense",
  date: receipt.date,
  merchant: receipt.merchant,
  amount: receipt.amount,
  category: categorized_category,
  status: status,
  receipt_url: storage.upload(receipt.file),
  tax_deductible: true
})
```

### Step 6: Update Budget
```
ACTION: budget.decrement(
  category: expense.category,
  amount: expense.amount,
  period: current_month
)
```

---

## Success Criteria

- [ ] Expense recorded in ledger
- [ ] Receipt stored in cloud storage
- [ ] Budget category updated
- [ ] Approval workflow triggered (if needed)

---

## Error Handling

| Error | Action |
|-------|--------|
| OCR failed | Flag for manual review |
| Duplicate receipt | Alert, do not record |
| Category unknown | Route to finance manager |
| Over budget | Warn + require approval |

---

## Rollback

If expense recorded incorrectly:
1. Create reversing entry
2. Mark original as "voided"
3. Create corrected entry
4. Notify finance manager

---

## Related SOPs

- SOP-FIN-003: Monthly Close
- SOP-FIN-006: Payment Follow-up
- SOP-HR-001: Employee Reimbursement
