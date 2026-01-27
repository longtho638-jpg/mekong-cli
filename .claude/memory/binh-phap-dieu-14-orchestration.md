# 🏯 BINH PHÁP ĐIỀU 14: UNIFIED ORCHESTRATION LAYER

> **"統一指揮，萬眾一心"** - Unified command, all move as one

---

## ARCHITECTURE v2.0

```
┌─────────────────────────────────────────────────────────────────────┐
│                      👤 CHỦ TỊCH (Chairman)                         │
│                     Antigravity CLI (Port 8080)                     │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              │ Single Entry Point
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    🧠 BINH PHÁP DISPATCHER                          │
│                  (.claude/commands/dispatch.md)                     │
│                                                                     │
│   /plan-auto → Auto-detect và route request:                        │
│   ┌────────────────────────────────────────────────────────────┐   │
│   │ IF simple_task (1 agent) → CC CLI /delegate                │   │
│   │ IF complex_task (multi-agent) → Claude Flow Swarm          │   │
│   │ IF research_task → CLEO + Web Search                       │   │
│   │ IF background_task → Queue + Cron                          │   │
│   └────────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   🏭 CC CLI     │  │   🐝 CLAUDE     │  │   📋 CLEO      │
│    FACTORY      │  │    FLOW V3     │  │    TASKS       │
│                 │  │                 │  │                 │
│  /delegate      │  │  swarm start    │  │  cleo add      │
│  Single agent   │  │  15-agent mesh  │  │  Track + Log   │
│  Sequential     │  │  Parallel       │  │  Persist       │
│  Fast build     │  │  Complex coord  │  │  Memory        │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     📦 OUTPUT LAYER                                 │
│                                                                     │
│  • Products → /products/paid/products/                             │
│  • Memory → /.claude/memory/                                       │
│  • Tasks → CLEO registry                                           │
│  • Logs → /.claude-flow/logs/                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## ROUTING RULES

### 1️⃣ CC CLI Factory (Simple Tasks)

```
USE WHEN:
- Build single product
- Code generation
- File operations
- Quick fixes

COMMAND: /delegate "Build [product]"
AGENTS: fullstack-developer, backend, frontend
TIME: 5-30 minutes
```

### 2️⃣ Claude Flow V3 Swarm (Complex Tasks)

```
USE WHEN:
- Multi-component system
- Parallel research
- Consensus needed
- Complex coordination

COMMAND: claude-flow swarm start --objective "[goal]" --strategy development
AGENTS: 8-15 agents (coordinator, architect, coders, testers, reviewers)
TIME: 30-120 minutes
```

### 3️⃣ CLEO Task Management (Persistence)

```
USE WHEN:
- Track all tasks
- Cross-session memory
- Progress reporting
- Task delegation

COMMAND: cleo add "[task]" --priority high
AGENTS: None (tracking only)
TIME: Instant
```

---

## OPTIMAL CONFIGURATION

### For Product Building (Current):

```bash
# Best: CC CLI Factory with /delegate
/delegate "Create [Product Kit] ($XX) - [features]"
```

**Lý do:** Nhanh, đơn giản, sequential = stable

### For Complex Projects:

```bash
# Best: Claude Flow V3 Swarm with multi-agent
claude-flow swarm start \
  --objective "Build [complex system]" \
  --strategy development \
  --max-agents 8
```

**Lý do:** Parallel coordination, distributed tasks

### For Task Tracking:

```bash
# Best: CLEO for persistence
cleo add "Complete [10 products today]" --deadline "17:00"
cleo list --human
```

**Lý do:** Cross-session memory, status tracking

---

## AUTO-DISPATCH LOGIC

```javascript
function dispatch(request) {
    // Analyze request complexity
    const complexity = analyze(request);

    if (complexity.agents <= 1) {
        return CC_CLI_DELEGATE; // Simple: /delegate
    }

    if (complexity.agents <= 3 && !complexity.needsConsensus) {
        return CC_CLI_PARALLEL; // Moderate: multiple /delegate
    }

    if (complexity.agents > 3 || complexity.needsConsensus) {
        return CLAUDE_FLOW_SWARM; // Complex: swarm coordinate
    }

    // Always track with CLEO
    CLEO.add(request.title);
    return result;
}
```

---

## CURRENT OPTIMAL STATE

### ✅ ACTIVE NOW:

| System             | Use Case           | Status              |
| ------------------ | ------------------ | ------------------- |
| CC CLI Factory     | Product building   | ✅ 2 agents running |
| CLEO               | Task tracking      | ✅ v0.68.0 ready    |
| Claude Flow Daemon | Background workers | ✅ PID 74369        |

### ⚠️ ON STANDBY:

| System            | Use Case             | Status                   |
| ----------------- | -------------------- | ------------------------ |
| Claude Flow Swarm | Complex coordination | Initialized, not started |

---

## RECOMMENDATION

**Cho factory building 30 products:** Dùng CC CLI `/delegate`

- Đơn giản, stable, proven
- 1 agent per product = less coordination overhead
- Current: 28/30 products built successfully

**Cho future complex tasks:** Enable Claude Flow Swarm

- When building entire systems
- When need parallel research
- When consensus required across components

---

**Created:** 2026-01-26
**Version:** Binh Pháp v7.0 - ĐIỀU 14
