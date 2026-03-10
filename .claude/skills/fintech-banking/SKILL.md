---
name: fintech-banking
description: Banking-as-a-Service, payment processing, KYC/AML, lending, treasury, crypto rails. Use for fintech products, neobanks, payment platforms, regulatory compliance.
license: MIT
version: 1.0.0
---

# Fintech & Banking Skill

Build financial products with Banking-as-a-Service, payment processing, compliance, and modern treasury management.

## When to Use

- Banking-as-a-Service (BaaS) platform integration
- Payment processing beyond basic Stripe
- KYC/AML identity verification workflows
- Open Banking and account aggregation
- Lending platform and credit scoring
- Treasury and cash flow management
- Crypto/stablecoin payment rails
- Multi-currency and FX operations
- Regulatory compliance (PCI DSS, SOC2, GDPR)
- Embedded finance in non-financial apps

## Tool Selection

| Need | Choose |
|------|--------|
| BaaS platform | Unit (cards+accounts), Column (FBO), Treasury Prime |
| Payment processing | Stripe, Adyen (enterprise), Checkout.com |
| Modern treasury | Modern Treasury (payments+ledger), Increase |
| KYC/Identity | Plaid Identity, Persona, Alloy (orchestration) |
| AML screening | Sardine (fraud+AML), ComplyAdvantage, Chainalysis |
| Account aggregation | Plaid, MX, Finicity (Mastercard) |
| Lending/Credit | Codat (SMB data), Canopy (servicing), Blend (origination) |
| Crypto rails | Circle (USDC), Fireblocks (custody), MoonPay (on-ramp) |
| Card issuing | Marqeta (JIT funding), Lithic, Highnote |
| Ledger | Formance (open-source), Modern Treasury, Fragment |

## Fintech Architecture

```
Customer App
    ↓
API Gateway (Auth + Rate Limit)
    ↓
┌─────────────────────────────────────────────────┐
│              Core Banking Layer                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Accounts │  │ Payments │  │ Lending  │      │
│  │ (Unit)   │  │ (Stripe) │  │ (Custom) │      │
│  └──────────┘  └──────────┘  └──────────┘      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ KYC/AML  │  │ Ledger   │  │ Cards    │      │
│  │ (Alloy)  │  │ (ModTrs) │  │(Marqeta) │      │
│  └──────────┘  └──────────┘  └──────────┘      │
└─────────────────────────────────────────────────┘
    ↓
Compliance Layer (audit trail, reporting, SAR filing)
```

## KYC/Onboarding Flow

```
User signup
  → Collect PII (name, DOB, SSN/TIN, address)
  → Plaid Identity verification (document + selfie)
  → Alloy orchestration (multi-vendor KYC check)
    → OFAC/sanctions screening
    → Credit bureau pull (soft)
    → Device fingerprint + behavioral analysis
  → Risk score → Auto-approve / Manual review / Decline
  → Account provisioning (Unit/Column)
  → Card issuance (Marqeta)
```

## Payment Flow Pattern

```python
# Modern Treasury payment initiation
import modern_treasury

client = modern_treasury.ModernTreasury(
    api_key="MT_API_KEY",
    organization_id="ORG_ID"
)

# Create payment order
payment = client.payment_orders.create(
    type="ach",
    amount=10000,  # $100.00 in cents
    direction="credit",
    originating_account_id="acc_xxx",
    receiving_account_id="acc_yyy",
    description="Invoice #1234 payment"
)
# Webhook: payment_order.completed → update ledger
```

## Double-Entry Ledger Pattern

```
Every financial transaction = 2 entries (debit + credit)

User deposit $100:
  DEBIT:  User Cash Account     +$100
  CREDIT: Platform FBO Account  +$100

User payment $50:
  DEBIT:  User Cash Account     -$50
  CREDIT: Merchant Account      +$50
```

## Key Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| Total Payment Volume (TPV) | Sum of all payment values | Growth |
| Take Rate | Revenue / TPV | 1-3% |
| Net Interest Margin (NIM) | (Interest Income - Interest Expense) / Assets | > 2% |
| CAC | Total acquisition cost / New customers | < LTV/3 |
| KYC Pass Rate | Auto-approved / Total applications | > 80% |
| Fraud Rate | Fraudulent transactions / Total | < 0.1% |
| Transaction Success Rate | Successful / Attempted | > 99% |
| Time to Fund | Median time from request to fund delivery | < 24h |
| Regulatory Capital Ratio | Capital / Risk-weighted assets | > 8% |
| Chargeback Rate | Chargebacks / Total transactions | < 0.5% |

## Compliance Checklist

```yaml
pci_dss:
  - Tokenize all card data (never store raw PAN)
  - Use Stripe/Adyen for PCI scope reduction
  - Annual SAQ or ROC assessment

money_transmission:
  - State-by-state MTL or BaaS partner license
  - FinCEN MSB registration
  - BSA/AML program with designated compliance officer

data_privacy:
  - GLBA (financial privacy)
  - CCPA/GDPR for customer data
  - Right to deletion (with regulatory retention exceptions)

soc2:
  - Type II audit annually
  - Continuous monitoring (Vanta, Drata)
```

## References

- Unit API: https://docs.unit.co
- Modern Treasury: https://docs.moderntreasury.com
- Plaid API: https://plaid.com/docs
- Marqeta: https://docs.marqeta.com
- Alloy: https://docs.alloy.com
- Stripe Treasury: https://stripe.com/docs/treasury
