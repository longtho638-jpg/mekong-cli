---
description: 💵 Finance Command Suite - Invoice, Expense, Runway
argument-hint: [:invoice|:expense|:runway] [details]
---

## Finance Overview

Quản lý tài chính agency và startups.

## Subcommands

| Command | Description | Output |
|---------|-------------|--------|
| `/finance` | Finance dashboard | Overview |
| `/finance/invoice` | Create invoice | PDF/HTML |
| `/finance/expense` | Track expenses | Report |
| `/finance/runway` | Calculate runway | Months left |

## Usage

```
/finance                        # Finance overview
/finance/invoice "Acme $5000"   # Create invoice
/finance/expense "Q1 2026"      # Expense report
/finance/runway "$50k MRR"      # Runway calculation
```

## Invoice Template

```
INVOICE #2026-001
─────────────────────
Client: [Name]
Amount: $[Amount]
Due: [Date]

Services:
- [Service 1]
- [Service 2]

Total: $[Total]
VN: [VND equivalent]
```

## Runway Formula

```
Runway = Cash / Monthly Burn Rate
Target: 18-24 months
Warning: < 6 months
```

## Revenue Tiers

| Tier | MRR | Commission |
|------|-----|------------|
| Starter | < $5K | 15% |
| Growth | $5-20K | 12% |
| Scale | $20-50K | 10% |
| Enterprise | > $50K | 8% |

---

🏯 **WIN**: Anh WIN + Agency WIN + Client WIN
