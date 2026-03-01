---
phase: 2
title: "Agent Registry & CLI Commands"
status: pending
priority: P1
effort: 8h
depends_on: [phase-01]
---

# Phase 2: Agent Registry & CLI Commands

## Context Links

- Phase 1 DNA Standard: [phase-01-agent-dna-standard.md](./phase-01-agent-dna-standard.md)
- Existing RecipeRegistry: `src/core/registry.py`
- Existing CLI: `src/main.py` (Typer app)
- Agent hubs: `packages/agents/hubs/` (18 department hubs)
- AGENT_REGISTRY dict: `src/agents/__init__.py`
- AIforWork Department/Role/Task model: [research](./research/researcher-aiforwork-model.md)

## Overview

Xay dung Agent Registry to chuc theo Department/Role/Task (nhu AIforWork nhung executable). Them CLI commands: `mekong agent list`, `mekong agent info`, `mekong agent run`, `mekong agent install`.

**Tai sao:** User can discover + run agents tu CLI. Khong co registry = khong co marketplace.

## Key Insights

- `RecipeRegistry` (`src/core/registry.py`) da co pattern scan + search + get — tai su dung logic
- `load_agents_dynamic()` da scan `src/agents/` va `plugins/` -> mo rong them `agents/` top-level dir
- 93 agents da co trong `packages/agents/` -> migrate dan, khong bat buoc tat ca ngay
- CLI da dung Typer sub-commands pattern (swarm, schedule, memory, etc.) -> them `agent` sub-app

## Requirements

### Functional
- FR-REG-01: Scan `agents/` directory de tim tat ca agent.yaml manifests
- FR-REG-02: Index agents theo department/role hierarchy
- FR-REG-03: Search agents theo keyword, department, tag, capability
- FR-REG-04: CLI `mekong agent list` — hien thi tat ca agents theo department
- FR-REG-05: CLI `mekong agent info <name>` — chi tiet 1 agent
- FR-REG-06: CLI `mekong agent run <name> <goal>` — chay agent voi goal
- FR-REG-07: CLI `mekong agent search <query>` — tim agent theo keyword

### Non-Functional
- NFR-REG-01: Scan 100 agents < 500ms
- NFR-REG-02: Search results ranked theo relevance (name > description > tags)

## Architecture

### Directory Structure

```
agents/                              # Top-level agent directory
  marketing/
    content-marketer/
      agent.yaml                     # AgentManifest
      README.md                      # Human docs (optional)
    seo-specialist/
      agent.yaml
  sales/
    lead-hunter/
      agent.yaml
  engineering/
    fullstack-developer/
      agent.yaml
    code-reviewer/
      agent.yaml
    devops-engineer/
      agent.yaml
  ...
```

### AgentRegistry Class

```python
# src/core/agent_registry.py

class AgentRegistryEntry:
    """Index entry for a registered agent."""
    name: str
    department: str
    role: str
    description: str
    capabilities: list[str]
    tags: list[str]
    pricing_tier: str
    manifest_path: Path
    manifest: AgentManifest

class AgentRegistry:
    """Scans agents/ directory, indexes by department/role."""

    def __init__(self, agents_dir: Path = Path("agents")):
        ...

    def scan(self) -> list[AgentRegistryEntry]:
        """Scan all agent.yaml files."""

    def list_by_department(self, department: str) -> list[AgentRegistryEntry]:
        """Filter agents by department."""

    def search(self, query: str) -> list[AgentRegistryEntry]:
        """Keyword search across name, description, tags, capabilities."""

    def get(self, name: str) -> AgentRegistryEntry | None:
        """Get agent by exact name."""

    def run_agent(self, name: str, goal: str) -> Any:
        """Load + execute agent with goal."""
```

### CLI Sub-commands

```python
# Them vao src/main.py

agent_app = typer.Typer(help="Agent: Super Agent marketplace")
app.add_typer(agent_app, name="agent")

@agent_app.command(name="list")
def agent_list(department: str = None):
    """List available Super Agents"""

@agent_app.command(name="info")
def agent_info(name: str):
    """Show agent details"""

@agent_app.command(name="run")
def agent_run(name: str, goal: str):
    """Run a Super Agent with a goal"""

@agent_app.command(name="search")
def agent_search(query: str):
    """Search agents by keyword"""
```

### Agent Execution Flow

```
mekong agent run content-marketer "Write blog post about AI agents"
  |
  v
AgentRegistry.get("content-marketer")
  |
  v
Load AgentManifest from agents/marketing/content-marketer/agent.yaml
  |
  v
Check: agent_class set?
  |-- Yes --> Instantiate Python class, call .run(goal)
  |-- No  --> Use entry_command ("/cook") with skills activated
  v
RecipeOrchestrator.run_from_goal(goal, skills=manifest.skills)
  |
  v
Result (success/fail + output)
```

## Related Code Files

### Files Can Tao Moi
- `src/core/agent_registry.py` — AgentRegistry class
- `src/cli/agent_commands.py` — Typer CLI commands cho agent sub-app
- `tests/test_agent_registry.py` — Unit tests

### Files Can Sua
- `src/main.py` — Import + register agent_app sub-typer
- `src/core/registry.py` — Optional: share utility functions voi AgentRegistry

### Directories Can Tao
- `agents/` — Top-level directory chua agent manifests (5 sample tu Phase 1)

## Implementation Steps

1. **Tao `src/core/agent_registry.py`**
   - Class `AgentRegistryEntry` (dataclass)
   - Class `AgentRegistry` voi scan(), list_by_department(), search(), get()
   - Method `run_agent()` — orchestrate agent execution
   - Support ca 2 mode: Python class va entry_command

2. **Tao `src/cli/agent_commands.py`**
   - `agent list` — Rich table hien thi agents, group by department
   - `agent list --department=marketing` — filter
   - `agent info <name>` — Rich panel hien thi chi tiet manifest
   - `agent run <name> <goal>` — chay agent, hien thi ket qua
   - `agent search <query>` — search results table

3. **Update `src/main.py`**
   - Import agent_commands
   - Register agent sub-app: `app.add_typer(agent_app, name="agent")`

4. **Tao `agents/` directory voi 5 sample agents tu Phase 1**
   - `agents/marketing/content-marketer/agent.yaml`
   - `agents/engineering/fullstack-developer/agent.yaml`
   - `agents/engineering/code-reviewer/agent.yaml`
   - `agents/sales/lead-hunter/agent.yaml`
   - `agents/engineering/devops-engineer/agent.yaml`

5. **Viet tests**
   - Test scan agents directory
   - Test search by keyword
   - Test list by department
   - Test get agent by name
   - Test run agent (mock execution)

## Todo List

- [ ] Tao `src/core/agent_registry.py`
- [ ] Tao `src/cli/agent_commands.py`
- [ ] Tao `agents/` directory voi 5 sample manifests
- [ ] Update `src/main.py` register agent sub-app
- [ ] Viet `tests/test_agent_registry.py`
- [ ] Manual test: `python3 -m mekong agent list`
- [ ] Manual test: `python3 -m mekong agent info content-marketer`
- [ ] Verify: `python3 -m pytest` — all PASS

## Success Criteria

- [ ] `mekong agent list` hien thi 5 agents group by department
- [ ] `mekong agent search "content"` tra ve content-marketer
- [ ] `mekong agent info content-marketer` hien thi full manifest
- [ ] `mekong agent run content-marketer "Write blog post"` execute thanh cong
- [ ] All tests PASS

## Risk Assessment

| Risk | Xac Suat | Anh Huong | Giam Thieu |
|------|---------|-----------|------------|
| Scan cham voi nhieu agents | Thap | Trung binh | Cache index, lazy load manifests |
| CLI conflict voi `mekong agent` hien co | Trung binh | Cao | Kiem tra existing commands truoc |
| Agent execution fails | Trung binh | Trung binh | Fallback sang /cook default |

## Security Considerations

- `run_agent()` chi cho phep tools duoc khai bao trong manifest
- Khong cho phep agent chay Bash tuy y tru khi manifest explicit declare
- Goal input sanitize truoc khi pass vao orchestrator

## Next Steps

-> Phase 3: Agent Factory (dung registry de test agents moi tao)
-> Phase 4: RaaS Execution Layer (wrap registry trong API)
