---
phase: 3
title: "Agent Factory"
status: pending
priority: P2
effort: 8h
depends_on: [phase-01, phase-02]
---

# Phase 3: Agent Factory

## Context Links

- Phase 1 DNA Standard: [phase-01-agent-dna-standard.md](./phase-01-agent-dna-standard.md)
- Phase 2 Registry: [phase-02-agent-registry-cli.md](./phase-02-agent-registry-cli.md)
- ClaudeKit skills graph: [researcher-claudekit-dna-patterns.md](./research/researcher-claudekit-dna-patterns.md) (section 4)
- RecipeGenerator: `src/core/recipe_gen.py`
- SelfImprover: `src/core/self_improve.py`
- 271 ClaudeKit skills: `.claude/skills/`

## Overview

System de TAO agents moi tu ClaudeKit skill atoms. User mo ta muc dich -> Factory chon skills phu hop -> generate agent manifest -> validate bang Binh Phap quality gates -> register vao marketplace.

**Tai sao:** Cho phep users va community tao agents moi ma khong can hieu internal architecture. Giam barrier tu "developer builds agent" -> "anyone describes need".

## Key Insights

- ClaudeKit da co 271 skills voi Related Skills graph -> co the auto-suggest skill combos
- RecipeGenerator (`src/core/recipe_gen.py`) da co pattern generate tu goals -> tai su dung
- DNA Insight #1: Skills la atoms, khong monoliths -> compose N skills = 1 agent
- DNA Insight #2: Anti-Patterns/Sharp Edges = guardrails tu dong -> factory PHAI generate guardrails
- `/cook` command da co Intent Detection -> Research -> Plan -> Implement flow -> Factory dung flow nay

## Requirements

### Functional
- FR-FAC-01: Tao agent manifest tu natural language description
- FR-FAC-02: Auto-suggest skills tu description bang keyword matching
- FR-FAC-03: Generate anti_patterns va sharp_edges tu skill metadata
- FR-FAC-04: Validate agent manifest bang Binh Phap quality gates
- FR-FAC-05: CLI `mekong agent create <description>` — interactive agent creation
- FR-FAC-06: CLI `mekong agent test <name>` — chay test suite cho agent
- FR-FAC-07: Template-based generation cho common agent patterns

### Non-Functional
- NFR-FAC-01: Generate 1 agent manifest < 5s (local, no LLM) hoac < 30s (voi LLM)
- NFR-FAC-02: Quality score output: 0-100 (Binh Phap scoring)

## Architecture

### Agent Creation Flow

```
mekong agent create "Marketing agent that creates SEO blog posts and manages content calendar"
  |
  v
1. PARSE — Extract keywords: marketing, SEO, blog, content, calendar
  |
  v
2. MATCH SKILLS — Keyword search against 271 skills
   -> copywriting, seoops, content-factory, socialmediaops
  |
  v
3. DETECT DEPARTMENT — "marketing" keyword -> department=marketing
  |
  v
4. GENERATE MANIFEST — Template + matched skills + auto-guardrails
  |
  v
5. VALIDATE — Binh Phap quality gates
   -> Check: skills exist? department valid? anti_patterns present?
  |
  v
6. WRITE — agents/{department}/{name}/agent.yaml
  |
  v
7. REGISTER — Auto-add to AgentRegistry
```

### Skill Matching Engine

```python
# src/core/agent_factory.py

class SkillMatcher:
    """Match description keywords against ClaudeKit skill catalog."""

    def __init__(self, skills_dir: Path = Path(".claude/skills")):
        self.skills_index = self._build_index()

    def _build_index(self) -> dict[str, list[str]]:
        """Scan SKILL.md files, extract name + description keywords."""

    def match(self, description: str, top_k: int = 5) -> list[str]:
        """Return top-k skill names matching description."""

    def get_related(self, skill_name: str) -> list[str]:
        """Get Related Skills from SKILL.md body."""
```

### Agent Factory Class

```python
class AgentFactory:
    """Create new agents from natural language descriptions."""

    def __init__(self, registry: AgentRegistry, matcher: SkillMatcher):
        ...

    def create_from_description(
        self, description: str, name: str | None = None
    ) -> AgentManifest:
        """Full pipeline: parse -> match -> generate -> validate."""

    def create_from_template(
        self, template: str, overrides: dict
    ) -> AgentManifest:
        """Generate from predefined template."""

    def validate_agent(self, manifest: AgentManifest) -> QualityReport:
        """Binh Phap quality scoring."""

    def test_agent(self, name: str, test_goals: list[str]) -> TestReport:
        """Run agent against test goals, measure success."""
```

### Quality Scoring (Binh Phap Gates)

```python
class QualityReport:
    score: int              # 0-100
    passed: bool            # score >= 60
    checks: list[QualityCheck]

class QualityCheck:
    name: str               # "has_anti_patterns", "skills_exist", etc.
    passed: bool
    weight: int             # contribution to total score
    message: str

# Checks:
# - has_description (10 pts)
# - has_skills (15 pts)
# - skills_exist_in_catalog (15 pts)
# - has_capabilities (10 pts)
# - has_anti_patterns (15 pts) — guardrails = competitive moat
# - has_sharp_edges (10 pts)
# - valid_department (10 pts)
# - has_tags (5 pts)
# - name_is_kebab_case (5 pts)
# - description_length >= 20 chars (5 pts)
```

### Agent Templates

```
templates/
  vertical-domain-expert.yaml     # Pattern A: 1 skill deep
  horizontal-orchestrator.yaml    # Pattern B: multi-skill compose
  workflow-agent.yaml             # Pattern C: command-wrapped
```

Template example:
```yaml
# templates/vertical-domain-expert.yaml
name: "{{name}}"
department: "{{department}}"
role: "{{role}}"
description: "{{description}}"
skills:
  - "{{primary_skill}}"
capabilities:
  - "{{primary_capability}}"
entry_command: "/cook"
tools: [Read, Write, Edit, Glob, Grep]
anti_patterns:
  - "Khong thuc hien ngoai scope {{department}}"
  - "Khong tao output khong co verification"
pricing_tier: free
```

## Related Code Files

### Files Can Tao Moi
- `src/core/agent_factory.py` — AgentFactory + SkillMatcher classes
- `src/core/agent_quality.py` — QualityReport + quality checks
- `src/cli/agent_factory_commands.py` — CLI commands: create, test, validate
- `agents/templates/` — 3 template YAML files
- `tests/test_agent_factory.py` — Unit tests

### Files Can Sua
- `src/cli/agent_commands.py` — Them create, test, validate subcommands
- `src/main.py` — Register new commands (neu tach file CLI)

## Implementation Steps

1. **Tao `src/core/agent_factory.py`**
   - SkillMatcher: scan `.claude/skills/`, build keyword index, match()
   - AgentFactory: create_from_description(), create_from_template()
   - Auto-generate name tu description (slugify)
   - Auto-detect department tu keywords

2. **Tao `src/core/agent_quality.py`**
   - QualityCheck dataclass
   - QualityReport dataclass
   - 10 quality checks (tong 100 diem)
   - `validate_manifest(manifest) -> QualityReport`

3. **Tao 3 agent templates**
   - `agents/templates/vertical-domain-expert.yaml`
   - `agents/templates/horizontal-orchestrator.yaml`
   - `agents/templates/workflow-agent.yaml`

4. **Them CLI commands**
   - `mekong agent create "description"` — interactive creation
   - `mekong agent create "description" --template=vertical` — template-based
   - `mekong agent validate <name>` — quality report
   - `mekong agent test <name> --goals "goal1" "goal2"` — test execution

5. **Viet tests**
   - Test SkillMatcher keyword matching
   - Test AgentFactory create pipeline
   - Test quality scoring (perfect agent = 100, empty agent < 60)
   - Test template-based creation

## Todo List

- [ ] Tao `src/core/agent_factory.py` (SkillMatcher + AgentFactory)
- [ ] Tao `src/core/agent_quality.py` (quality gates)
- [ ] Tao 3 template files trong `agents/templates/`
- [ ] Them CLI commands: create, validate, test
- [ ] Viet `tests/test_agent_factory.py`
- [ ] Manual test: `mekong agent create "SEO content writer for tech blogs"`
- [ ] Manual test: `mekong agent validate content-marketer`
- [ ] Verify: `python3 -m pytest` — all PASS

## Success Criteria

- [ ] `mekong agent create "SEO writer"` tao duoc agent manifest hop le
- [ ] Generated manifest co >= 3 skills matched tu catalog
- [ ] Quality score cho generated agent >= 60/100
- [ ] `mekong agent validate content-marketer` output scoring report
- [ ] Template-based creation hoat dong voi 3 templates
- [ ] All tests PASS

## Risk Assessment

| Risk | Xac Suat | Anh Huong | Giam Thieu |
|------|---------|-----------|------------|
| Skill matching qua generic | Trung binh | Trung binh | Rank by specificity, limit top_k=5 |
| 271 skills scan cham | Thap | Thap | Cache index on first scan |
| LLM-based generation unreliable | Trung binh | Trung binh | Default = no-LLM keyword match; LLM = optional enhance |
| Template qua rigid | Thap | Thap | Templates chi la starting point, user edit sau |

## Security Considerations

- Factory KHONG auto-grant Bash tool — phai explicit trong template/manifest
- Generated anti_patterns PHAI co it nhat 1 guardrail
- User review manifest truoc khi register (interactive confirm)

## Next Steps

-> Phase 4: RaaS Execution Layer (wrap factory trong cloud API)
-> Phase 5: Open Source Distribution (package factory cho community)
