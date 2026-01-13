---
title: "AI Agents"
description: "18 AI agents powering AgencyOS automation"
section: "docs"
ai_executable: true
---

# 🤖 AgencyOS AI Agents

> **18 specialized AI agents for agency automation**
> **Paste URL to IDE → Agent activates → WIN**

---

## 🤖 Quick Execute

**Paste to your IDE:**
```
Execute: https://agencyos.network/docs/agents
```

---

## 🎯 Start Here: Pick Your Agent

| You Need To... | Use This Agent | Command |
|----------------|----------------|---------|
| Plan a project | [Planner](#planner) | `mekong agent:planner` |
| Write code | [Fullstack Dev](#fullstack-developer) | `mekong agent:fullstack` |
| Fix bugs | [Debugger](#debugger) | `mekong agent:debugger` |
| Create content | [Copywriter](#copywriter) | `mekong agent:copywriter` |
| Design UI | [UI/UX Designer](#uiux-designer) | `mekong agent:designer` |
| Research market | [Scout](#scout) | `mekong agent:scout` |

---

## ⚡ Quick Commands

### Check All Agents
```bash
mekong agents --list

# Output:
# 🤖 AgencyOS AI Agents (18 ready)
# ├── Core: planner, fullstack, debugger, tester
# ├── Content: copywriter, docs, journal
# ├── Ops: git, reviewer, database, mcp
# └── Strategy: scout, researcher, project-manager
```

### Activate an Agent
```bash
# Start planner agent
mekong agent:planner --task "Create sales pipeline"

# Start fullstack agent
mekong agent:fullstack --task "Build landing page"

# Start scout agent
mekong agent:scout --topic "AI productivity tools"
```

### Check Agent Status
```bash
mekong agent:status

# Output:
# planner      ✅ Ready
# fullstack    ✅ Ready
# debugger     ✅ Ready
```

---

## 📋 All 18 Agents

### Core Development (4)

| Agent | Command | Purpose |
|-------|---------|---------|
| [Planner](/docs/agents/planner) | `mekong agent:planner` | Create implementation plans |
| [Fullstack](/docs/agents/fullstack-developer) | `mekong agent:fullstack` | Write code |
| [Debugger](/docs/agents/debugger) | `mekong agent:debugger` | Fix bugs |
| [Tester](/docs/agents/tester) | `mekong agent:tester` | Write tests |

### Content & Docs (3)

| Agent | Command | Purpose |
|-------|---------|---------|
| [Copywriter](/docs/agents/copywriter) | `mekong agent:copywriter` | Marketing copy |
| [Docs Manager](/docs/agents/docs-manager) | `mekong agent:docs` | Documentation |
| [Journal Writer](/docs/agents/journal-writer) | `mekong agent:journal` | Project journals |

### Operations (4)

| Agent | Command | Purpose |
|-------|---------|---------|
| [Git Manager](/docs/agents/git-manager) | `mekong agent:git` | Git operations |
| [Code Reviewer](/docs/agents/code-reviewer) | `mekong agent:reviewer` | Code reviews |
| [Database Admin](/docs/agents/database-admin) | `mekong agent:database` | Database ops |
| [MCP Manager](/docs/agents/mcp-manager) | `mekong agent:mcp` | MCP tools |

### Strategy (4)

| Agent | Command | Purpose |
|-------|---------|---------|
| [Scout](/docs/agents/scout) | `mekong agent:scout` | Market research |
| [Researcher](/docs/agents/researcher) | `mekong agent:researcher` | Deep research |
| [Project Manager](/docs/agents/project-manager) | `mekong agent:pm` | Project planning |
| [Brainstormer](/docs/agents/brainstormer) | `mekong agent:brainstorm` | Idea generation |

### Design (1)

| Agent | Command | Purpose |
|-------|---------|---------|
| [UI/UX Designer](/docs/agents/ui-ux-designer) | `mekong agent:designer` | Design UI |

### External (1)

| Agent | Command | Purpose |
|-------|---------|---------|
| [Scout External](/docs/agents/scout-external) | `mekong agent:scout-ext` | External research |

---

## 🎯 Quad-Agent System (Content Pipeline)

```bash
# Run full content pipeline
mekong pipeline:content --topic "agency automation"

# Flow: Scout → Editor → Director → Community
```

```
┌─────────────────────────────────────────────────┐
│  🔍 Scout → Research & analyze                 │
│       ↓                                         │
│  ✏️ Editor → Write blog + scripts              │
│       ↓                                         │
│  🎬 Director → Create video                    │
│       ↓                                         │
│  🤝 Community → Publish & engage               │
└─────────────────────────────────────────────────┘
```

---

## ✅ Success Criteria

- [ ] `mekong agents --list` shows all 18 agents
- [ ] Agent you need is ✅ Ready
- [ ] Task completes successfully
- [ ] Output matches expected

---

## 🔧 Troubleshooting

| Error | Fix |
|-------|-----|
| `Agent not found` | `mekong agents --install` |
| `Agent busy` | `mekong agent:status` |
| `API key missing` | Check `.env` for API keys |

---

## 🔗 Related

- [Workflows](/docs/workflows) - Step-by-step processes
- [Commands](/docs/commands) - All CLI commands
- [Skills](/docs/skills) - Agent knowledge modules

---

**🏯 "Họ WIN → Mình WIN"**
