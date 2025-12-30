# /finance/runway - Runway Calculator

Spawn agents: `planner` + `researcher`

## 🎯 Mục đích

Tính runway còn bao lâu - lập kế hoạch tài chính.

## 💰 Money Flow
```
/finance/runway → Know your runway → Plan ahead → Avoid crisis → Survive → $$$
```

## 🚀 Cách sử dụng

```bash
/finance/runway                   # Current runway
/finance/runway --scenario growth # With growth projection
/finance/runway --scenario cut    # With cost cutting
```

## 📝 Output Format

```markdown
## ⏱️ Runway Analysis

### 💰 Current Position
| Metric | Value |
|--------|-------|
| Cash Balance | $50,000 |
| Monthly Revenue | $5,000 |
| Monthly Expenses | $8,000 |
| Monthly Burn | $3,000 |
| **Runway** | **16.7 months** |

### 📈 Scenarios

#### 🟢 Optimistic (Revenue +20%)
- New Burn: $2,000/month
- Runway: 25 months

#### 🟡 Current Trajectory
- Burn: $3,000/month
- Runway: 16.7 months

#### 🔴 Pessimistic (Revenue -20%)
- Burn: $4,000/month
- Runway: 12.5 months

### 💡 Recommendations
1. **Increase revenue** - Add 2 clients = +$2K MRR
2. **Cut costs** - Cancel unused tools = -$500/month
3. **Raise buffer** - Target 18+ months runway

### ⚠️ Danger Zone
- Red flag at: 6 months runway
- Action needed at: 9 months runway
```

---

*AgencyOS v10.0 | Hư Thực Cluster*
