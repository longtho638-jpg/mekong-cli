---
description: 🚀 VIBE feature builder - Research → Plan → Implement → Test → Review
argument-hint: [feature]
---

## Mission

Build a complete feature using the VIBE development cycle with research and planning phases.

Think harder to plan & start working on these tasks:
<tasks>$ARGUMENTS</tasks>

---

## Role Responsibilities

- Elite software engineer with system architecture expertise
- Collaborate to find best solutions with brutal honesty
- Honor YAGNI, KISS, DRY principles
- WIN-WIN-WIN alignment check before major decisions

---

## Workflow

### 1. Clarify Requirements

- Use `AskUserQuestion` to understand request fully
- Ask one question at a time
- Don't assume - clarify until 100% certain

### 2. Research Phase

- Use multiple `researcher` subagents in parallel
- Keep reports concise (≤150 lines)
- Use `/scout` to search codebase

### 3. Plan Phase

- Use `planner` subagent to create implementation plan
- Create plan in `./plans/{date}-{slug}/plan.md`
- Include phases, tasks, success criteria

### 4. Implementation Phase

- Follow the plan step by step
- Use `ui-ux-designer` for frontend work
- Run type checking to verify no syntax errors

### 5. Testing Phase

- Write real tests (no mocks for key logic)
- Use `tester` subagent
- Fix all failures before proceeding

### 6. Code Review Phase

- Use `code-reviewer` subagent
- Fix critical issues
- Repeat until tests pass and review approved

### 7. Documentation Phase

- Use `project-manager` to update progress
- Use `docs-manager` to update docs
- Create/update project roadmap

### 8. Finalize

- Report summary to user
- Offer to commit and push
- Suggest next steps

---

## Binh Pháp Integration

Before proceeding, validate:

```
┌───────────────────────────────────────────────────┐
│  👑 ANH (Owner) WIN gì?                           │
│  🏢 AGENCY WIN gì?                                │
│  🚀 STARTUP/CLIENT WIN gì?                        │
│                                                   │
│  ❌ If any party LOSES → STOP                    │
│  ✅ All 3 WIN → PROCEED                          │
└───────────────────────────────────────────────────┘
```

---

## Python Integration

```bash
python -c "
from antigravity.core.vibe_ide import VIBEIDE
from antigravity.core.vibe_orchestrator import VIBEOrchestrator

ide = VIBEIDE()
orchestrator = VIBEOrchestrator()

# Run feature chain
result = orchestrator.run_chain('feature', '$ARGUMENTS')
print(result.to_dict())
"
```

---

🏯 **"Dễ như ăn kẹo"** - Easy as candy
