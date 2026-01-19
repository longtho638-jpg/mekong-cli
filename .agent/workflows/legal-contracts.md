---
description: How to create and manage legal contracts (MSA, NDA, SOW)
---

# 📜 Legal Contracts Workflow

Set up standardized legal agreements for your agency.

## 🤖 Quick Execute
```bash
Execute workflow: https://agencyos.network/docs/workflows/legal-contracts
```

## ⚡ Step-by-Step Execution

### Step 1: Initialize Contract Templates (3 min)
// turbo
```bash
# Create contract template structure
mekong legal:init

# Creates:
# /contracts/
# ├── templates/
# │   ├── msa.md       # Master Service Agreement
# │   ├── nda.md       # Non-Disclosure Agreement
# │   └── sow.md       # Statement of Work
# └── signed/
```

### Step 2: Configure MSA Template (5 min)
// turbo
```bash
# Generate MSA with agency details
mekong legal:msa --agency-name "YourAgency" --jurisdiction "Vietnam"

# MSA Sections:
# - Scope of Services
# - Payment Terms
# - Intellectual Property
# - Confidentiality
# - Termination
# - Liability
```

### Step 3: Create Client NDA (2 min)
// turbo
```bash
# Generate NDA for new client
mekong legal:nda --client "ABC Corp" --mutual true

# Output: /contracts/signed/abc-corp-nda.pdf
```

### Step 4: Generate SOW (3 min)
// turbo
```bash
# Create Statement of Work from proposal
mekong legal:sow --client "ABC Corp" --project "CRM Migration"

# SOW includes:
# - Deliverables
# - Timeline
# - Acceptance criteria
# - Change management
```

## 📋 Contract Templates

### Payment Terms
```yaml
payment_terms:
  retainer: "50% upfront, 50% on completion"
  project: "30/30/40 milestone split"
  hourly: "Net 15 payment terms"
```

### IP Assignment
```yaml
ip_assignment:
  work_product: "Client owns upon payment"
  pre_existing: "Agency retains pre-existing IP"
  tools: "License-back for agency use"
```

## ✅ Success Criteria
- [ ] MSA template customized
- [ ] NDA template ready
- [ ] SOW generator working
- [ ] Signed contracts organized

## 🔗 Next Workflow
After legal contracts: `/client-onboarding`

## 🏯 Binh Pháp Alignment
"不戰而勝" (Win without fighting) - Clear contracts prevent disputes.
