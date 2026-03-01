---
phase: 7
title: "Documentation & Examples"
priority: P2
status: pending
effort: 6h
depends_on: [6]
---

# Phase 7: Documentation & Examples

## Overview
Create public-facing documentation for PyPI. Remove all internal/Vietnamese/Binh Phap references. Provide quickstart, agent development guide, daemon configuration, and example recipes.

## Key Insights
- Current README is internal constitution (Binh Phap military metaphors, Vietnamese text)
- No public API docs exist
- ClaudeKit CLAUDE.md is private — cannot reference in public docs
- Recipe format (Markdown with YAML frontmatter) needs documentation
- Agent development requires understanding PEV pattern

## Requirements

### Functional
- F1: README.md — project overview, install, quickstart (< 200 lines)
- F2: docs/getting-started.md — install, first recipe, first agent
- F3: docs/agents.md — built-in agents + custom agent development guide
- F4: docs/recipes.md — recipe format, DAG dependencies, verification
- F5: docs/providers.md — LLM provider configuration, custom providers
- F6: docs/daemon.md — autonomous daemon setup, YAML config reference
- F7: examples/ — working example recipes and custom agents
- F8: CONTRIBUTING.md — how to contribute agents/plugins

### Non-Functional
- NF1: English only in public docs (Vietnamese in internal CLAUDE.md only)
- NF2: All code examples tested and runnable
- NF3: No references to Antigravity, Binh Phap, Tôm Hùm in public docs

## Documentation Structure

```
docs/
├── getting-started.md         # Install + quickstart
├── agents.md                  # Agent system + custom dev
├── recipes.md                 # Recipe format + DAG deps
├── providers.md               # LLM provider config
├── daemon.md                  # Autonomous daemon
├── plugins.md                 # Plugin development
└── api-reference.md           # Core API (auto-generated outline)

examples/
├── recipes/
│   ├── hello-world.md         # Simplest recipe
│   ├── git-status.md          # Git agent recipe
│   ├── parallel-build.md      # DAG parallel recipe
│   └── llm-analysis.md        # LLM step recipe
├── agents/
│   ├── hello_agent.py         # Minimal custom agent
│   └── docker_agent.py        # Real-world custom agent
└── configs/
    ├── minimal.yaml           # Minimal LLM config
    ├── multi-provider.yaml    # Multi-provider failover
    └── daemon.yaml            # Daemon config example
```

## Implementation Steps

1. Write `README.md` — badges, install, quickstart, architecture diagram, links to docs
2. Write `docs/getting-started.md` — pip install, `mekong cook "hello"`, first custom recipe
3. Write `docs/agents.md` — AgentProtocol, built-in agents table, custom agent walkthrough
4. Write `docs/recipes.md` — Markdown format, YAML frontmatter, step types (shell/llm/api), DAG dependencies
5. Write `docs/providers.md` — provider YAML config, built-in providers, custom provider guide
6. Write `docs/daemon.md` — daemon architecture, config reference, task file format
7. Write `docs/plugins.md` — entry_points guide, local plugins, example pyproject.toml
8. Create example recipes: hello-world, git-status, parallel-build, llm-analysis
9. Create example agents: hello_agent.py (minimal), docker_agent.py (real-world)
10. Create example configs with comments
11. Write `CONTRIBUTING.md` — dev setup, PR process, plugin guidelines
12. Review all docs — remove any internal references

## Success Criteria
- [ ] New user can install and run first recipe in < 5 minutes following docs
- [ ] Custom agent dev guide produces working agent in < 30 minutes
- [ ] All example recipes run successfully
- [ ] No Antigravity/Binh Phap/Vietnamese in public docs
- [ ] README has badges: PyPI version, Python versions, License, CI status

## Risk Assessment
- **Low**: Documentation is additive, no code risk
- **Medium**: Example recipes need LLM access to fully test — provide offline fallback examples
- **Decision**: Keep internal CLAUDE.md separate from public README — don't merge them

## Todo
- [ ] Write README.md
- [ ] Write getting-started.md
- [ ] Write agents.md
- [ ] Write recipes.md
- [ ] Write providers.md
- [ ] Write daemon.md
- [ ] Write plugins.md
- [ ] Create example recipes
- [ ] Create example agents
- [ ] Create example configs
- [ ] Write CONTRIBUTING.md
- [ ] Final review — no internal refs
