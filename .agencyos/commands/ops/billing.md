# /ops/billing - Automated Billing Setup

Spawn agents: `planner`

## 🎯 Mục đích

Setup và manage auto-billing cho clients - Tác Chiến cluster.

## 💰 Money Flow
```
/ops/billing → Auto invoices → On-time payments → Cash flow → $$$
```

## 🚀 Cách sử dụng

```bash
/ops/billing                     # Billing overview
/ops/billing setup "client A"    # Setup new client
/ops/billing remind              # Send reminders
/ops/billing report              # Billing report
```

## 📝 Output Format

```markdown
## 💳 Billing Dashboard

### 📊 This Month
| Status | Count | Amount |
|--------|-------|--------|
| Sent | 10 | $15,000 |
| Paid | 7 | $10,500 |
| Pending | 2 | $3,000 |
| Overdue | 1 | $1,500 |

### ⚠️ Action Required

#### Overdue (>7 days)
- **Client A** - $1,500 - 15 days overdue
  - Last contact: [date]
  - Action: [ ] Send final reminder

#### Due Soon (Next 7 days)
- **Client B** - $2,000 - Due in 3 days
  - Action: [ ] Send reminder

### 🔄 Auto-Billing Setup
| Client | Type | Amount | Next Date |
|--------|------|--------|-----------|
| Client C | Monthly | $1,000 | Jan 1 |
| Client D | Quarterly | $2,500 | Jan 15 |

### 💡 Recommendations
- Enable auto-debit for Client A
- Convert Client B to retainer
```

---

*AgencyOS v10.0 | Tác Chiến Cluster*
