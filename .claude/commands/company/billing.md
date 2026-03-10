---
description: Quản lý MCU balance, Polar subscription, billing history và reconciliation
allowed-tools: Read, Write, Bash
---

# /company billing — Billing Management

## USAGE
```
/company billing [status|history|topup|tenants|reconcile]
```

Default nếu không có args: `status`

## SUBCOMMANDS

### `status`
```
Đọc:
  .mekong/mcu_balance.json
  .mekong/mcu_ledger.json (last 10 entries)
  .mekong/company.json

Output:
  💳 BILLING STATUS — {company_name}
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  MCU Balance    : {balance} available
  MCU Locked     : {locked} (in-progress tasks)
  Lifetime used  : {lifetime_used}
  
  Subscription   : {tier} plan
  Renewal        : {renewal_date}
  Monthly MCU    : {included_mcu}/mo
  
  Projected MCU exhaustion:
    At current rate ({avg_daily} MCU/day):
    → {days_remaining} days remaining
    → Runs out: {projected_date}
  
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {IF balance < 50:}
  ⚠️  Low MCU! Top up: /company billing topup
```

### `history [--limit <n>]`
```
Đọc .mekong/mcu_ledger.json
Default limit: 20

Output:
  📜 MCU HISTORY (last {n})
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  TIME           TYPE      GOAL                         MCU
  2026-03-10 10:30  confirm  "build rate limiting"       -5
  2026-03-10 09:15  confirm  "viết blog launch"          -1
  2026-03-10 08:00  seed     "Starter MCU top-up"       +500
  2026-03-09 18:22  refund   "deploy failed"            +3
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Net this week: -{n} MCU  |  Refunds: {n} MCU
```

### `topup <amount>`
```
Valid amounts: 500 | 2000 | 5000

MCU Pack pricing:
  500  MCU → $24.50   ($0.049/MCU)
  2000 MCU → $90.00   ($0.045/MCU)  — 8% discount
  5000 MCU → $200.00  ($0.040/MCU)  — 18% discount

IF .openclaw/config.json có polar_checkout_urls:
  Print checkout URL cho amount đó
  Print: "→ Mở URL này để thanh toán qua Polar.sh"
ELSE:
  Print: "→ Vào app.agencyos.network/billing để top up"
  Print: "→ Hoặc config Polar checkout URLs trong .openclaw/config.json"
```

### `tenants [--sort mrr|usage]`
```
(Chỉ dùng cho AgencyOS platform owner, không phải end-user)

Đọc SQLite: mcu_balance table hoặc .mekong/tenants.json

Output bảng:
  TENANT           TIER      MRR    MCU/mo  LAST ACTIVE
  acme-corp        growth    $149    3,200   today
  freelancer-joe   starter   $49      800   2d ago
  bigclient-xyz    premium   $499    8,100   today
  ─────────────────────────────────────────────────────
  Total: {n} tenants · ${total_mrr} MRR · {total_mcu} MCU/mo

Sort: mrr (default) hoặc usage
```

### `reconcile`
```
Cross-check: Polar revenue data vs mcu_ledger

1. Đọc .mekong/mcu_ledger.json (tất cả "seed" entries = MCU purchased)
2. Tính total MCU sold × price = expected revenue
3. So sánh với .mekong/revenue.json hoặc manual input

Output:
  🔍 RECONCILIATION REPORT — {date}
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  MCU sold (ledger)      : {n} MCU
  Expected revenue       : ${expected}
  Recorded revenue       : ${recorded}
  Discrepancy            : ${diff}
  
  {IF diff > 0:} ⚠️  Possible missing payment records
  {IF diff == 0:} ✅  Reconciled — no discrepancies
  
  Saved: .mekong/reconcile-{date}.json
```
