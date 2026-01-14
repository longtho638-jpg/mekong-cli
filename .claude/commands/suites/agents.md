---
description: 🤖 Agent Dashboard - View and manage all 26 agents
argument-hint: [:list|:chain|:stats|:run]
---

## Mission

Unified agent management hub. View, run, and monitor agents.

## Subcommands

| Command | Description |
|---------|-------------|
| `/agents` | List all 26 agents |
| `/agents:chain dev` | Show dev suite chain |
| `/agents:stats` | Agent utilization stats |
| `/agents:run dev:cook` | Run specific chain |

## Quick Examples

```bash
/agents               # List all agents
/agents:chain dev     # Show dev chain
/agents:chain revenue # Show revenue chain
/agents:stats         # Utilization stats
```

## Agent Categories

| Category | Count | Examples |
|----------|-------|----------|
| Development | 8 | fullstack-developer, tester, debugger |
| Business | 8 | money-maker, deal-closer, client-magnet |
| Content | 5 | copywriter, content-factory, docs-manager |
| Design | 3 | ui-ux-designer, flow-expert |
| External | 2 | brainstormer, scout-external |

## Python Integration

```python
# turbo
from antigravity.core.agent_chains import AGENT_INVENTORY, get_chain_summary
from antigravity.core.agent_orchestrator import AgentOrchestrator

# List agents
for agent in AGENT_INVENTORY:
    print(agent)

# Show chain
print(get_chain_summary("dev", "cook"))

# Run chain
orchestrator = AgentOrchestrator()
result = orchestrator.run("dev", "cook", {"task": "build auth"})
print(f"Success: {result.success}")

# Dashboard
orchestrator.print_dashboard()
```

## Workflow

```bash
# View available agents
/agents

# Check chain before running
/agents:chain dev

# Run with auto-orchestration
/dev:cook auth

# Check stats after
/agents:stats
```

---

🤖 **26 agents × Auto-orchestration × Max Level WOW**
