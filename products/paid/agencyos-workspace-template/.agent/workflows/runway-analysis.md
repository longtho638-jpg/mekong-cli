---
name: Runway Analysis
description: Analyze cash flow, burn rate, and projected runway.
tags: [finance, chapter-2, revenue]
agent: finance-hub
---

# 💵 Runway Analysis Workflow (Ch. 2 Tác Chiến)

**Objective**: Ensure financial sustainability.

## ⚡ Quick Execute
```bash
agency finance:runway
```

## 📝 Steps

1.  **Data Collection**
    Gather current cash balance and last 3 months of expenses.
    ```bash
    agency finance:sync
    ```

2.  **Burn Rate Calculation**
    Calculate average monthly burn.
    `Monthly Burn = (Exp1 + Exp2 + Exp3) / 3`

3.  **Runway Projection**
    `Runway (Months) = Current Cash / Monthly Burn`

4.  **Scenario Planning**
    - **Base Case**: Current trend.
    - **Best Case**: Revenue +20%.
    - **Worst Case**: Revenue -30% (Crisis Mode).

5.  **Action Items**
    If Runway < 6 months -> Trigger Crisis Management (Ch. 11).
    If Runway > 18 months -> Consider investments (Ch. 4).

## ✅ Success Criteria
- [ ] Current Runway calculated
- [ ] 3 Scenarios modeled
- [ ] Action plan defined based on runway length
