---
title: "Workflow Chain Workflow"
description: "VoltAgent workflow chain pattern for automation"
section: "workflows"
order: 17
published: true
ai_executable: true
estimated_time: "12 minutes"
---

# ⛓️ Workflow Chain Workflow

> **WIN-WIN-WIN**: Client WIN (automation) → Agency WIN (efficiency) → Owner WIN (margins)

---

## 🤖 Quick Execute

```
Execute workflow: https://agencyos.network/docs/workflows/workflow-chain
```

---

## ⚡ Step-by-Step Execution

### Step 1: Create Workflow Chain (5 min)
```bash
cat > src/workflows/onboarding.ts << 'EOF'
import { createWorkflowChain } from "@voltagent/core";

export const onboardingChain = createWorkflowChain({
  id: "client-onboarding",
  name: "Client Onboarding",
})
.andThen({
  id: "create-workspace",
  execute: async ({ data }) => {
    // Create client workspace
    return { ...data, workspaceId: "ws-123" };
  },
})
.andThen({
  id: "send-welcome",
  execute: async ({ data }) => {
    // Send welcome email
    return { ...data, welcomed: true };
  },
});
EOF

# Expected: ✅ Workflow chain created
```

### Step 2: Register Workflow (3 min)
```bash
mekong workflow:register onboarding

# Expected: ✅ Workflow registered
```

### Step 3: Test Chain (2 min)
```bash
mekong workflow:run onboarding --client "ABC Corp"

# Expected: ✅ All steps completed
```

### Step 4: Monitor Executions (2 min)
```bash
mekong workflow:status onboarding

# Shows: Step progress, success rate, avg time
```

---

## ✅ Success Criteria

- [ ] Workflow chain defined
- [ ] All steps connected
- [ ] Error handling in place
- [ ] Monitoring active

---

**🏯 "Họ WIN → Mình WIN"**
