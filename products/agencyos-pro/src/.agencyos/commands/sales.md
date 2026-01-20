# /sales - Sales Hub Overview

Spawn agents: `scout` + `researcher` + `planner`

## 🎯 Mục đích

Hub trung tâm cho pipeline bán hàng - từ lead đến close đến invoice.

## 💰 Money Flow
```
/sales → Lead → Qualify → Proposal → Close → Invoice → $$$
```

## 🚀 Cách sử dụng

```bash
/sales                   # Pipeline overview
/sales status            # Xem deals đang chạy
/sales forecast          # Dự báo revenue
/sales report weekly     # Báo cáo tuần
```

## 📋 Sub-commands

| Command | Mục đích |
|---------|----------|
| `/sales/lead` | Tìm & qualify leads |
| `/sales/proposal` | Tạo proposals |
| `/sales/close` | Closing scripts |
| `/sales/followup` | Follow-up templates |
| `/sales/report` | Sales reports |

## 📝 Output Format

```markdown
## 💼 Sales Pipeline

### 🎯 Pipeline Summary
| Stage | Deals | Value |
|-------|-------|-------|
| 🆕 New | 10 | $50K |
| 📞 Contacted | 5 | $25K |
| 📄 Proposal Sent | 3 | $15K |
| 🤝 Negotiation | 2 | $10K |
| ✅ Won | 1 | $5K |

### 📈 This Month
- Total Pipeline: $105K
- Closed Won: $5K
- Win Rate: 20%
- Avg Deal Size: $5K

### 🔥 Hot Deals (Action Needed)
1. **ABC Corp** - $10K - Follow up today
2. **XYZ Inc** - $8K - Send proposal

### 💡 Quick Actions
- [ ] Call 3 new leads
- [ ] Send 2 follow-ups
- [ ] Update CRM
```

## 🔗 Kết hợp với

- `/intel/competitor` → Biết đối thủ quote bao nhiêu
- `/finance/invoice` → Xuất invoice khi close
- `/marketing` → Generate leads từ marketing

---

*AgencyOS v10.0 | Địa Hình Cluster | Sales Hub*
