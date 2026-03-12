---
name: Log Business Expense
version: "0.2"
category: finance
trigger: Receipt received or expense incurred
mcu_cost: 1
---
# Log Business Expense

## Trigger
- Receipt received via email or upload
- Manual expense entry by team member
- Credit card transaction detected

## Prerequisites
- Valid receipt or invoice document
- Expense category defined
- Team member authenticated

## Steps
1. Extract data from receipt: vendor, amount, date, description
2. Categorize expense (travel, software, equipment, meals, other)
3. Validate: amount > 0, date <= today, category valid
4. Create expense record in accounting system
5. Attach receipt document to record
6. Check if approval required (amount >= $500 → notify owner)
7. Update budget tracker for relevant category

## Verification
- Expense record created with unique ID
- Receipt attached and accessible
- Budget tracker updated
- Approval notification sent if required

## Rollback
If categorization error:
1. Update category on expense record
2. Re-run budget tracker update
3. Notify approver if approval status changed
