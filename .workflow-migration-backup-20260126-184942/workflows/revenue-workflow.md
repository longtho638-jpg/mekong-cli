---
description: Revenue tracking and financial analytics workflow
---

# 💰 Revenue Workflow

> **Binh Pháp:** "Tài tụ nhân tán" - Manage resources to sustain the army

## ⚙️ Core Engine
- **Implementation**: `antigravity/core/revenue_engine.py`
- **Controller**: `antigravity/core/money_maker.py`
- **Integrations**: Stripe, Gumroad, PayPal, Polar.sh, SePay

## 🚀 Trigger Commands

- `mekong revenue` - Show revenue dashboard
- `mekong revenue sync` - Sync latest transaction data
- `mekong revenue forecast` - Project future MRR/ARR

## 🔄 Workflow Steps

### 1. 📊 Data Aggregation
The `RevenueEngine` aggregates financial data from configured providers.

```python
# antigravity/core/revenue_engine.py
async def sync_revenue_data():
    # 1. Fetch transactions from PaymentHub (SePay, Polar, etc.)
    # 2. Normalize to standard Transaction model
    # 3. Store in local ledger (.mekong/finance/ledger.json)
```

### 2. 💵 Financial Analysis
The `MoneyMaker` controller calculates key metrics.

**Metrics Calculated:**
- **MRR/ARR**: Monthly/Annual Recurring Revenue
- **LTV**: Lifetime Value
- **Churn Rate**: Customer attrition
- **Burn Rate**: Monthly expenses (if tracked)

### 3. 🎯 Goal Tracking & Moat Verification
Verifies alignment with "WIN-WIN-WIN" principles via `moat_engine.py`.

```text
Monthly Goal: $10,000
Progress: [████████████░░░░░░░░] 60%
Remaining: $4,000
Moat Status: STRONG (Network Effect verified)
```

### 4. 📈 Reporting
Generates ASCII dashboards and JSON reports.

| Platform | Revenue | Transactions | Fees |
| -------- | ------- | ------------ | ---- |
| SePay    | $1,200  | 45           | $12  |
| Polar    | $800    | 20           | $40  |
| **Total**| **$2,000**| **65**     | **$52**|

## 🛠 Configuration
Managed via `.mekong/config.json` or environment variables.

```json
{
  "revenue": {
    "currency": "USD",
    "targets": {
      "monthly": 10000,
      "yearly": 120000
    },
    "providers": ["sepay", "polar"]
  }
}
```

## 🔗 Related Components
- `antigravity/core/finance/` - Payment adapters
- `antigravity/core/pricing.py` - Pricing strategy logic
- `cli/commands/revenue.py` - CLI entry point
