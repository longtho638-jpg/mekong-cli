---
description: Create and send invoices with Polar billing integration
agent: money-maker
---

# /invoice Command

Create professional invoices and optionally sync with Polar for subscription billing.

## Usage

```bash
/invoice [client-name] [amount] [--options]
```

## Examples

```bash
/invoice "ABC Corp" 5000
/invoice "XYZ Startup" 5000 --polar --subscription
/invoice "DEF Inc" 15000 --milestone "Phase 1 Complete"
/invoice "GHI Ltd" 3000 --recurring monthly
```

## Workflow

1. **Validate** client exists in CRM
2. **Create** invoice with line items
3. **Apply** payment terms (Net 15/30)
4. **Sync** with Polar if subscription
5. **Send** via email with PDF
6. **Track** payment status

## Options

| Flag | Description |
|------|-------------|
| `--polar` | Sync to Polar billing system |
| `--subscription` | Create recurring subscription |
| `--recurring [period]` | Monthly/quarterly/annual |
| `--milestone [name]` | Tag with project milestone |
| `--due [days]` | Custom payment terms (default: 15) |
| `--currency [USD/VND/THB]` | Currency (default: USD) |

## Payment Terms

| Client Tier | Terms | Late Fee |
|-------------|-------|----------|
| WARRIOR | Net 15 | 2% |
| GENERAL | Net 30 | 1.5% |
| TƯỚNG QUÂN | Net 45 | 1% |

## Python Integration

```bash
# Create invoice via AntigravityKit
python -c "
from antigravity.core.revenue_engine import RevenueEngine
engine = RevenueEngine()
inv = engine.create_invoice('$CLIENT', $AMOUNT)
engine.send_invoice(inv)
print(f'Invoice sent: {inv.id}')
"
```

## Output Format

```
╔════════════════════════════════════════╗
║  🧾 INVOICE #INV-2026-0114-001         ║
║  Status: SENT                          ║
╠════════════════════════════════════════╣
║  Bill To: [Client Name]                ║
║  Date: January 14, 2026                ║
║  Due: January 29, 2026                 ║
╠════════════════════════════════════════╣
║  Description                   Amount  ║
║  ─────────────────────────────────────║
║  [Service Line Item]          $X,XXX  ║
║  [Service Line Item]          $X,XXX  ║
╠════════════════════════════════════════╣
║  TOTAL DUE: $XX,XXX                    ║
║  Payment Link: pay.agency.com/xxx      ║
╚════════════════════════════════════════╝
```

## Post-Invoice Actions

- `mark-paid`: Record payment received
- `send-reminder`: Send payment reminder
- `void`: Cancel invoice

---

💰 *"Tiền bạc là sức mạnh"*
