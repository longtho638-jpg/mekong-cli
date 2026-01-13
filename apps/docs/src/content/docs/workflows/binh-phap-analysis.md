---
title: "Binh Pháp Analysis Workflow"
description: "Strategic analysis using Sun Tzu's 13 Chapters"
section: "workflows"
order: 6
published: true
ai_executable: true
estimated_time: "15 minutes"
---

# 🏯 Binh Pháp Analysis Workflow

> **WIN-WIN-WIN**: Client WIN (strategy) → Agency WIN (expertise) → Owner WIN (equity)

---

## 🤖 Quick Execute

```
Execute workflow: https://agencyos.network/docs/workflows/binh-phap-analysis
```

---

## ⚡ Step-by-Step Execution

### Step 1: Initialize Analysis (2 min)
```bash
# Start Binh Pháp assessment
mekong binh-phap:init --client "ABC Corp"

# Expected: ✅ Analysis workspace created
```

### Step 2: Run Ngũ Sự Assessment (5 min)
```bash
# Evaluate 5 fundamental factors
mekong binh-phap:assess \
  --dao "How aligned are stakeholders?" \
  --thien "Is timing favorable?" \
  --dia "What is market position?" \
  --tuong "Is leadership strong?" \
  --phap "Are processes ready?"

# Expected: ✅ Ngũ Sự scores calculated
```

### Step 3: Generate Chapter Analysis (5 min)
```bash
# Run all 13 chapters
mekong binh-phap:chapters --client "ABC Corp"

# Chapters analyzed:
# 1. Kế Hoạch (Planning)
# 2. Tác Chiến (Resources)
# 3. Mưu Công (Strategy)
# 4. Hình Thế (Positioning)
# 5. Thế Trận (Momentum)
# 6. Hư Thực (Weakness/Strength)
# 7. Quân Tranh (Speed)
# 8. Cửu Biến (Adaptation)
# 9. Hành Quân (Execution)
# 10. Địa Hình (Terrain)
# 11. Cửu Địa (Situations)
# 12. Hỏa Công (Disruption)
# 13. Dụng Gián (Intelligence)
```

### Step 4: Create Strategy Report (3 min)
```bash
# Generate PDF report
mekong binh-phap:report \
  --client "ABC Corp" \
  --output "./reports/abc-corp-strategy.pdf"

# Expected: ✅ Strategy report generated
```

---

## ✅ Success Criteria

- [ ] Ngũ Sự assessment complete (5/5 factors)
- [ ] 13 chapters analyzed
- [ ] Strategy report generated
- [ ] Actionable recommendations listed

---

## 📋 Ngũ Sự Template

```yaml
# assessment/ngu-su.yaml
factors:
  dao:
    question: "Are all stakeholders aligned?"
    score: 0-100
    
  thien:
    question: "Is timing favorable?"
    score: 0-100
    
  dia:
    question: "What is competitive position?"
    score: 0-100
    
  tuong:
    question: "Is leadership effective?"
    score: 0-100
    
  phap:
    question: "Are systems ready?"
    score: 0-100
    
total_score: 0-500
interpretation:
  400-500: "Victory assured"
  300-399: "Favorable odds"
  200-299: "Uncertain"
  0-199: "Do not engage"
```

---

## 🔗 Next Workflow

→ [VC Readiness](/docs/workflows/vc-readiness)

---

**🏯 "Tri bỉ tri kỉ, bách chiến bách thắng"**
