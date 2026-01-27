---
description: description: "🏯 Binh Pháp Auto-Dispatch - Routes tasks to optimal execution syst
---

# Claudekit Command: /binh-phap

> Imported from claudekit-engineer

# /binh-phap - Unified Orchestration Dispatcher

## USAGE

```
/binh-phap [task description]
```

## AUTO-ROUTING LOGIC

### 1. ANALYZE REQUEST

- Count required agents
- Check if consensus needed
- Measure complexity (LOC, components, dependencies)

### 2. ROUTE TO OPTIMAL SYSTEM

| Complexity                | System            | Command                   |
| ------------------------- | ----------------- | ------------------------- |
| **Simple** (1 agent)      | CC CLI            | `/delegate "[task]"`      |
| **Moderate** (2-3 agents) | CC CLI Parallel   | Multiple `/delegate`      |
| **Complex** (4+ agents)   | Claude Flow Swarm | `claude-flow swarm start` |
| **Tracking**              | CLEO              | `cleo add "[task]"`       |

### 3. EXECUTE WITH OPTIMAL STRATEGY

**For Product Building:**

```bash
/delegate "Create [Product] ($XX) - [features]"
# Fast, sequential, stable
```

**For Complex Coordination:**

```bash
claude-flow swarm start --objective "[goal]" --strategy development
# Parallel, multi-agent, consensus
```

**For Task Tracking:**

```bash
cleo add "[task]" --priority high
cleo list --human
```

## EXAMPLES

### Build Single Product:

```
/binh-phap Create Image Optimization Kit ($27)
→ Routes to: /delegate (CC CLI Factory)
```

### Build Entire System:

```
/binh-phap Build full e-commerce platform with 15 microservices
→ Routes to: claude-flow swarm (15-agent mesh)
```

### Research Task:

```
/binh-phap Research competitors and document findings
→ Routes to: CLEO + Web Search + Memory
```

## DECISION MATRIX

```
                    ┌─────────────────────────────────────┐
                    │          TASK COMPLEXITY            │
                    ├─────────┬───────────┬───────────────┤
                    │  LOW    │  MEDIUM   │    HIGH       │
          ┌─────────┼─────────┼───────────┼───────────────┤
URGENCY   │  HIGH   │ CC CLI  │  CC CLI   │ Claude Flow   │
          │         │/delegate│  Parallel │   Swarm       │
          ├─────────┼─────────┼───────────┼───────────────┤
          │  LOW    │  CLEO   │ CC CLI    │ Claude Flow   │
          │         │  Queue  │ /delegate │   Swarm       │
          └─────────┴─────────┴───────────┴───────────────┘
```

## CURRENT STATE

- CC CLI Factory: ✅ Active (2 agents building)
- Claude Flow: ✅ Daemon running, Swarm initialized
- CLEO: ✅ v0.68.0 active
- Auto-Update: ✅ 10AM daily cron

