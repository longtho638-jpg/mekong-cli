---
title: "Supervisor Pattern Workflow"
description: "Multi-agent coordination with VoltAgent supervisor pattern"
section: "workflows"
order: 16
published: true
ai_executable: true
estimated_time: "15 minutes"
---

# 🤖 Supervisor Pattern Workflow

> **WIN-WIN-WIN**: Client WIN (efficiency) → Agency WIN (scale) → Owner WIN (leverage)

---

## 🤖 Quick Execute

```
Execute workflow: https://agencyos.network/docs/workflows/supervisor-pattern
```

---

## ⚡ Step-by-Step Execution

### Step 1: Initialize VoltAgent (3 min)
```bash
npx create-voltagent-app@latest my-agents
cd my-agents
npm install

# Expected: ✅ VoltAgent project created
```

### Step 2: Create Supervisor Agent (5 min)
```bash
cat > src/agents/supervisor.ts << 'EOF'
import { Agent } from "@voltagent/core";

export const supervisor = new Agent({
  name: "supervisor",
  instructions: "Route tasks to specialized agents",
  subAgents: ["scout", "editor", "director"],
});
EOF

# Expected: ✅ Supervisor agent created
```

### Step 3: Create Sub-Agents (5 min)
```bash
mekong agent:create scout --purpose "research"
mekong agent:create editor --purpose "content"
mekong agent:create director --purpose "video"

# Expected: ✅ 3 sub-agents created
```

### Step 4: Test Multi-Agent (2 min)
```bash
npm run dev
# Test: "Create a blog post about sales pipelines"

# Expected: Scout researches → Editor writes → Complete
```

---

## ✅ Success Criteria

- [ ] VoltAgent installed
- [ ] Supervisor agent configured
- [ ] 3+ sub-agents connected
- [ ] Tasks routing correctly

---

**🏯 "Họ WIN → Mình WIN"**
