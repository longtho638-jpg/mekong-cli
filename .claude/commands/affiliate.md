---
description: 🤝 AFFILIATE - Manage partnership program and payouts
---

# /affiliate - Affiliate Management Command

> **"Buôn có bạn, bán có phường"** - Partnership Multiplier

## Usage

```bash
/affiliate [action] [args]
```

## Actions

| Action | Description | Example |
|--------|-------------|---------|
| `list` | List all active affiliates | `/affiliate list` |
| `stats` | View performance metrics | `/affiliate stats --user user_123` |
| `approve` | Approve a pending affiliate application | `/affiliate approve --id aff_abc123` |
| `payout` | Generate payout for period | `/affiliate payout --month 2026-01` |
| `link` | Generate tracking link for user | `/affiliate link --user user_123 --target /pricing` |

## Execution Protocol

1.  **Agent**: Delegates to `affiliate-manager`.
2.  **Tool**: Uses `AffiliateService` and database.
3.  **Check**: Verifies user permissions (Admin required for payouts).

## Examples

```bash
# Generate a payout run for last month
/affiliate payout --period last-month

# Check stats for top partner
/affiliate stats --top 5
```

## Win-Win-Win
- **Owner**: Expanded reach via partners.
- **Agency**: Automated tracking revenue share.
- **Partner**: Transparent commissions.
