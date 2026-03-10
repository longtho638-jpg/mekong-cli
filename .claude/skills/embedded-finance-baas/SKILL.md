# Embedded Finance (BaaS) — Banking-as-a-Service Integration

Embed financial services (payments, lending, insurance, accounts) directly into non-financial apps. $92B market by 2026, 25% CAGR.

## When to Use
- Embedding payment/lending features into SaaS platforms
- Building BaaS integrations (Stripe Treasury, Unit, Synapse)
- Adding embedded insurance or BNPL to checkout flows
- KYC/KYB onboarding for fintech-enabled platforms

## Key Concepts
| Term | Meaning |
|------|---------|
| BaaS | Banking-as-a-Service — API-first banking infrastructure |
| BaaP | Banking-as-a-Platform — full-stack financial platform |
| BNPL | Buy Now Pay Later — installment payment model |
| KYC/KYB | Know Your Customer/Business — identity verification |
| Ledger | Double-entry accounting system for money movement |
| FBO | For Benefit Of — omnibus bank account structure |

## Core Modules
```
Accounts & Ledger
  ├── Virtual account creation (FBO)
  ├── Double-entry ledger engine
  ├── Multi-currency support
  └── Balance reconciliation

Payments & Transfers
  ├── ACH / Wire / RTP rails
  ├── Card issuing (virtual + physical)
  ├── Cross-border payments
  └── Payment orchestration

Lending & Credit
  ├── Underwriting engine
  ├── Loan origination pipeline
  ├── Credit scoring integration
  └── Collections automation

Compliance & Risk
  ├── KYC/KYB verification flows
  ├── Transaction monitoring (AML)
  ├── Regulatory reporting
  └── Sanctions screening
```

## Key Integrations
| Category | Services |
|----------|---------|
| BaaS Providers | Unit, Stripe Treasury, Synapse, Column |
| KYC/KYB | Alloy, Persona, Plaid Identity |
| Payments | Stripe, Adyen, Checkout.com |
| Lending | Blend, LoanPro, Peach Finance |
| Card Issuing | Marqeta, Lithic, Stripe Issuing |

## Implementation Patterns
```typescript
interface EmbeddedFinanceConfig {
  provider: 'unit' | 'stripe-treasury' | 'column';
  environment: 'sandbox' | 'production';
  apiKey: string;
  webhookSecret: string;
}

interface VirtualAccount {
  id: string;
  type: 'checking' | 'savings' | 'escrow';
  balance: { available: number; pending: number; currency: string };
  status: 'active' | 'frozen' | 'closed';
  routingNumber: string;
  accountNumber: string;
}

interface LoanApplication {
  applicantId: string;
  amount: number;
  term: number; // months
  purpose: string;
  creditScore?: number;
  status: 'pending' | 'approved' | 'declined' | 'funded';
}
```

## SDK
`@agencyos/vibe-embedded-finance` — virtual accounts, ledger engine, card issuing, KYC flows, lending pipeline
