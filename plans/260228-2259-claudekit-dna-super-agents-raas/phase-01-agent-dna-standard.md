---
phase: 1
title: "Agent DNA Standard"
status: pending
priority: P1
effort: 8h
---

# Phase 1: Agent DNA Standard

## Context Links

- Research AIforWork: [researcher-aiforwork-model.md](./research/researcher-aiforwork-model.md)
- Research ClaudeKit DNA: [researcher-claudekit-dna-patterns.md](./research/researcher-claudekit-dna-patterns.md)
- AgentBase hien tai: `src/core/agent_base.py`
- ClaudeKit SKILL.md pattern: `.claude/skills/*/SKILL.md`
- Existing agent hubs: `packages/agents/hubs/` (18 hubs)
- Existing mekongAgents: `packages/agents/mekongAgent/` (41 agents)

## Overview

Dinh nghia chuan format cho Super Agents — mo rong tu ClaudeKit SKILL.md pattern hien tai. Moi Super Agent = 1 YAML manifest + N skills + M commands + guardrails (anti-patterns/sharp-edges).

**Tai sao phase nay truoc:** Moi phase sau phu thuoc vao format nay. Khong co DNA standard = khong the build registry, factory, hay marketplace.

## Key Insights

- ClaudeKit da co pattern tot: YAML frontmatter + Role + Capabilities + Patterns + Anti-Patterns + Sharp Edges + Related Skills
- `packages/agents/` da co 93 agent markdown files (18 hubs + 41 mekongAgent + 34 ops) -> can chuan hoa, khong tao tu dau
- AgentBase Python class (`src/core/agent_base.py`) da co Plan-Execute-Verify -> DNA standard phai map duoc sang class nay
- AIforWork: Department/Role/Task hierarchy = naming convention cho agent registry

## Requirements

### Functional
- FR-DNA-01: Agent manifest YAML schema voi cac truong bat buoc: name, department, role, description, skills, capabilities
- FR-DNA-02: Truong tuy chon: pricing, anti_patterns, sharp_edges, related_agents, test_suite
- FR-DNA-03: Manifest validate duoc bang Pydantic model
- FR-DNA-04: Backward compatible voi format hien tai cua `packages/agents/` (YAML frontmatter + markdown body)

### Non-Functional
- NFR-DNA-01: Schema < 30 truong (KISS)
- NFR-DNA-02: Validate 1 manifest < 50ms
- NFR-DNA-03: Human-readable (YAML, khong JSON Schema phuc tap)

## Architecture

### Agent Manifest Schema (v0.1)

```yaml
# File: agents/marketing/content-marketer/agent.yaml
---
name: content-marketer
version: "0.1.0"
department: marketing          # Top-level category
role: content-marketer         # Job role within department
description: "Tao noi dung SEO-optimized, content calendar, distribution strategy"

# DNA Composition
skills:                        # ClaudeKit skill atoms to activate
  - copywriting
  - seoops
  - content-factory

capabilities:                  # What this agent CAN do (for auto-routing)
  - "Tao blog posts SEO-optimized"
  - "Lap content calendar"
  - "Phan tich content performance"

# Execution
entry_command: "/cook"         # ClaudeKit command to invoke
agent_class: "ContentWriter"   # Python AgentBase subclass (optional)
tools:                         # CC CLI tools allowed
  - Read
  - Write
  - Edit
  - WebSearch

# Quality Gates (Binh Phap)
anti_patterns:                 # What this agent MUST NOT do
  - "Khong copy noi dung tu nguon khac"
  - "Khong tao content khong co CTA"
sharp_edges:                   # Known risks
  - issue: "Tone inconsistency"
    severity: medium
    solution: "Luan cung cap brand voice guide"

# Metadata
tags: [content, seo, marketing, writing]
pricing_tier: free             # free | agency | enterprise
author: "agencyos"
license: "Apache-2.0"
---
```

### Department Taxonomy (tu AIforWork mapping)

```
departments/
  marketing/       # Marketing & Sales (SEO, content, ads, social)
  sales/           # Sales (lead gen, outreach, CRM)
  engineering/     # Engineering & DevOps (code review, CI/CD, security)
  finance/         # Finance & Accounting
  hr/              # Human Resources
  legal/           # Legal & Compliance
  ops/             # Operations & Support
  design/          # Design & Creative
  data/            # Data & Analytics
  ecommerce/       # E-commerce (84tea, anima119 patterns)
```

### Pydantic Model

```python
# src/core/agent_manifest.py
class SharpEdge(BaseModel):
    issue: str
    severity: Literal["low", "medium", "high", "critical"]
    solution: str

class AgentManifest(BaseModel):
    name: str                              # kebab-case unique ID
    version: str = "0.1.0"
    department: str                        # from taxonomy
    role: str                              # job role
    description: str

    skills: list[str] = []                 # ClaudeKit skill names
    capabilities: list[str] = []           # human-readable abilities

    entry_command: str = "/cook"           # default ClaudeKit command
    agent_class: str | None = None         # optional Python class
    tools: list[str] = []                  # CC CLI tools

    anti_patterns: list[str] = []          # guardrails
    sharp_edges: list[SharpEdge] = []      # risk table

    tags: list[str] = []
    pricing_tier: Literal["free", "agency", "enterprise"] = "free"
    author: str = "agencyos"
    license: str = "Apache-2.0"
```

## Related Code Files

### Files Can Tao Moi
- `src/core/agent_manifest.py` — Pydantic model cho AgentManifest + validate + load
- `src/core/department_taxonomy.py` — Department enum + validation
- `tests/test_agent_manifest.py` — Unit tests cho manifest schema

### Files Can Sua
- `src/core/agent_base.py` — Them method `from_manifest()` de load AgentBase tu YAML
- `src/core/registry.py` — Them `AgentManifestRegistry` class (scan YAML files)

## Implementation Steps

1. **Tao `src/core/agent_manifest.py`**
   - Dinh nghia Pydantic models: `SharpEdge`, `AgentManifest`
   - Implement `load_manifest(path: Path) -> AgentManifest` (doc YAML frontmatter)
   - Implement `validate_manifest(manifest: AgentManifest) -> list[str]` (tra ve errors)
   - Implement `save_manifest(manifest: AgentManifest, path: Path)` (ghi YAML)

2. **Tao `src/core/department_taxonomy.py`**
   - Enum `Department` voi 10 departments
   - Function `validate_department(name: str) -> bool`
   - Function `list_departments() -> list[str]`

3. **Update `src/core/agent_base.py`**
   - Them classmethod `AgentBase.from_manifest(manifest: AgentManifest) -> AgentBase`
   - Cho phep instantiate agent tu YAML manifest thay vi hardcode

4. **Migrate 5 agents lam mau**
   - Chon 5 agents tu `packages/agents/mekongAgent/` da co san
   - Tao YAML manifest cho moi agent theo schema moi
   - Dat vao `agents/` directory moi (top-level)
   - Agents: content-marketer, fullstack-developer, code-reviewer, lead-hunter, devops-engineer

5. **Viet tests**
   - Test load manifest tu YAML
   - Test validate manifest (missing fields, wrong department, etc.)
   - Test backward compat voi format hien tai
   - Test AgentBase.from_manifest()

## Todo List

- [ ] Tao `src/core/agent_manifest.py` voi Pydantic models
- [ ] Tao `src/core/department_taxonomy.py`
- [ ] Update `src/core/agent_base.py` voi `from_manifest()`
- [ ] Tao 5 sample agent YAML manifests
- [ ] Viet `tests/test_agent_manifest.py`
- [ ] Verify: `python3 -m pytest tests/test_agent_manifest.py` PASS

## Success Criteria

- [ ] AgentManifest Pydantic model validate duoc YAML manifest
- [ ] 5 sample agents load thanh cong tu YAML
- [ ] `python3 -m pytest` — tat ca tests PASS
- [ ] Schema doc < 30 fields
- [ ] Backward compat: existing agents trong `packages/agents/` van load duoc

## Risk Assessment

| Risk | Xac Suat | Anh Huong | Giam Thieu |
|------|---------|-----------|------------|
| Schema qua phuc tap | Trung binh | Cao | Giu < 30 fields, iterate sau |
| Break existing agents | Thap | Cao | Backward compat: cu format van hoat dong |
| Pydantic version conflict | Thap | Trung binh | Pin version trong requirements.txt |

## Security Considerations

- Agent manifest KHONG chua secrets (API keys, tokens)
- `tools` field restrict CC CLI capabilities — khong cho phep Bash tuy y
- `anti_patterns` section = guardrails chong prompt injection

## Next Steps

-> Phase 2: Agent Registry & CLI (phu thuoc Phase 1 hoan thanh)
