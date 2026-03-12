---
name: Monthly Financial Close
version: "0.2"
category: finance
trigger: 1st of each month at 09:00
mcu_cost: 3
---
# Monthly Financial Close

## Trigger
- Scheduled: 1st of month, 09:00 AM
- Manual trigger by finance agent or owner

## Prerequisites
- All invoices for prior month issued
- Bank statements available
- Expense records complete for prior month

## Steps
1. Lock prior month: prevent new entries for closed period
2. Reconcile bank accounts: match transactions to records
3. Post accruals: recognize revenue/expenses not yet invoiced
4. Post depreciation entries for fixed assets
5. Verify accounts receivable: match invoices to payments
6. Verify accounts payable: match bills to disbursements
7. Generate P&L statement for closed month
8. Generate Balance Sheet as of month-end
9. Generate Cash Flow statement
10. Calculate key metrics: MRR, ARR, burn rate, runway
11. Distribute report to owner and stakeholders

## Verification
- Bank balance matches accounting balance (zero variance)
- All invoices have corresponding revenue entries
- P&L, Balance Sheet, Cash Flow generated and saved
- Metrics dashboard updated

## Rollback
If reconciliation fails:
1. Unlock period
2. Flag discrepant transactions for manual review
3. Notify finance agent with variance report
4. Retry after corrections applied
