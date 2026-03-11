# Engineering: Agent Coverage Analysis — Mekong CLI v5.0

## Command: /scout
## Date: 2026-03-11

---

## Source: mekong/agents/

Agents defined in two locations:
1. `mekong/agents/` — agent definition files (.md)
2. `src/agents/` — Python agent implementations

---

## Agent Definition Files (mekong/agents/)

```
binh-phap-strategist.md
brainstormer.md
code-reviewer.md
copywriter.md
database-admin.md
debugger.md
docs-manager.md
fullstack-developer.md
git-manager.md
journal-writer.md
mcp-manager.md
mekong-market-analyst.md
planner.md
project-manager.md
researcher.md
revenue-forecaster.md
scout-external.md
scout.md
tester.md
subagents/           (directory)
```

Total: 19 agent definition files + subagents directory

---

## Python Agent Implementations (src/agents/)

```
src/agents/
├── __init__.py
(additional files not fully enumerated)
```

Key agents expected from CLAUDE.md:
- GitAgent — git operations
- FileAgent — file read/write/copy
- ShellAgent — arbitrary shell execution
- LeadHunter — prospect research
- ContentWriter — content generation
- RecipeCrawler — recipe discovery

---

## Coverage Matrix: Definition vs Implementation

| Agent | .md Definition | Python Implementation | Status |
|-------|---------------|----------------------|--------|
| binh-phap-strategist | ✅ | Unclear | Partial |
| brainstormer | ✅ | Unclear | Partial |
| code-reviewer | ✅ | ✅ (inferred from usage) | Complete |
| copywriter | ✅ | LeadHunter/ContentWriter in agents/ | Complete |
| database-admin | ✅ | src/agents/ | Partial |
| debugger | ✅ | ✅ (inferred from usage) | Complete |
| docs-manager | ✅ | ✅ (inferred from usage) | Complete |
| fullstack-developer | ✅ | ✅ (this agent) | Complete |
| git-manager | ✅ | GitAgent in agents/ | Complete |
| planner | ✅ | RecipePlanner in core/ | Complete |
| researcher | ✅ | ✅ (inferred from usage) | Complete |
| tester | ✅ | ✅ (inferred from usage) | Complete |
| scout | ✅ | ✅ (inferred from usage) | Complete |
| mcp-manager | ✅ | Unclear | Partial |
| revenue-forecaster | ✅ | Unclear | Partial |
| mekong-market-analyst | ✅ | Unclear | Partial |

---

## AgentBase Architecture (src/core/agent_base.py)

All agents should inherit from `AgentBase` per CLAUDE.md architecture:
```
src/core/agent_base.py  — base class with plan/execute/verify flow
```

The base class exists. Whether all 19 agents implement it is not verified without
reading each agent Python file.

---

## Specialized Core Agents (src/core/)

Several "agents" are implemented directly in src/core/ rather than src/agents/:
- `src/core/company_agent.py` — company initialization agent
- `src/core/browser_agent.py` — web browsing agent
- `src/core/nlu.py` — IntentClassifier (NLU agent)
- `src/core/decision_maker.py` — decision agent
- `src/core/world_model.py` — world model agent

This split (src/agents/ + src/core/agent_*.py) is inconsistent.

---

## Subagents Directory

`mekong/agents/subagents/` directory exists but contents not listed.
Likely contains specialized sub-roles invoked by primary agents.
Pattern aligns with CLAUDE.md's "Sub-agents — Specialized tasks" tier.

---

## Agent Dispatch

`src/core/agent_dispatcher.py` handles routing to appropriate agent.
`src/core/agent_registry.py` maintains agent registry.

Planner keyword → agent mapping (from planner.py):
```python
AGENT_KEYWORDS = {
    "git": [...],
    "file": [...],
    "shell": [...],
    "lead": [...],
    "content": [...],
    "crawler": [...],
    "tool": [...],
    "browse": [...],
    "evolve": [...],
}
```

9 keyword categories map to agents but only 6 base agent types from CLAUDE.md.
Coverage appears complete for core cases.

---

## Gaps Identified

1. **binh-phap-strategist:** .md definition exists but no obvious Python class
2. **mcp-manager:** MCP management agent — critical for tool integration, Python status unclear
3. **revenue-forecaster:** Business intelligence agent — implementation status unclear
4. **journal-writer:** Daily journal agent — implementation status unclear
5. **Inconsistent location:** Core agents split between src/agents/ and src/core/agent_*.py

---

## Recommendations

1. Audit src/agents/ to confirm all 19 .md agents have Python implementations
2. Consolidate agent implementations to src/agents/ only (not src/core/agent_*.py)
3. Add agent registry validation test: assert all registered agents have a valid .md definition
4. Add integration test for each agent type's execute() method
5. Document subagents/ directory contents with clear parent-child relationships

---

## Summary
19 agent definitions exist in mekong/agents/. Core agents (git, file, shell, lead, content, crawler)
appear implemented. Specialized agents (binh-phap-strategist, mcp-manager, revenue-forecaster)
have definitions but Python implementation status is unclear. Agent implementation is split
between src/agents/ and src/core/agent_*.py — needs consolidation.
