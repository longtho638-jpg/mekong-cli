---
title: "Legal Contracts Workflow"
description: "MSA, NDA, and SOW templates for agencies"
section: "workflows"
order: 12
published: true
ai_executable: true
estimated_time: "10 minutes"
---

# ⚖️ Legal Contracts Workflow

> **WIN-WIN-WIN**: Client WIN (protection) → Agency WIN (clarity) → Owner WIN (security)

---

## 🤖 Quick Execute

```
Execute workflow: https://agencyos.network/docs/workflows/legal-contracts
```

---

## ⚡ Step-by-Step Execution

### Step 1: Generate MSA (3 min)
```bash
mekong legal:msa \
  --client "ABC Corp" \
  --tier "warrior" \
  --payment "net-15"

# Expected: ✅ MSA generated: ./contracts/abc-corp-msa.pdf
```

### Step 2: Generate NDA (2 min)
```bash
mekong legal:nda \
  --client "ABC Corp" \
  --type "mutual" \
  --duration "2 years"

# Expected: ✅ NDA generated
```

### Step 3: Generate SOW (3 min)
```bash
mekong legal:sow \
  --client "ABC Corp" \
  --deliverables "CRM setup, Training, Support" \
  --timeline "90 days"

# Expected: ✅ SOW generated
```

### Step 4: Send for Signature (2 min)
```bash
mekong legal:sign \
  --docs "msa,nda,sow" \
  --to "john@abccorp.com" \
  --provider "docusign"

# Expected: ✅ Contracts sent for e-signature
```

---

## ✅ Success Criteria

- [ ] MSA signed before work starts
- [ ] NDA in place for sensitive projects
- [ ] SOW clearly defines deliverables
- [ ] All contracts stored securely

---

**🏯 "Họ WIN → Mình WIN"**
