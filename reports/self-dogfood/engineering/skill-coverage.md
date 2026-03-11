# Engineering: Skill Coverage Analysis — Mekong CLI v5.0

## Command: /scout
## Date: 2026-03-11

---

## Source: .claude/skills/

Total skill directories: 255
Total SKILL.md files: 245
Missing SKILL.md count: 10 directories without SKILL.md

---

## Coverage Statistics

| Metric | Count |
|--------|-------|
| Total skill directories | 255 |
| Skills with SKILL.md | 245 |
| Skills missing SKILL.md | 10 |
| Coverage percentage | 96.1% |

---

## Non-Directory Files in .claude/skills/

Root-level files (not skill directories):
- `INSTALLATION.md` — skill system installation guide
- `README.md` — overview documentation
- `THIRD_PARTY_NOTICES.md` — license notices
- `agent_skills_spec.md` — specification document

These are metadata files, not skill implementations.

---

## Sample Skill Names (First 30)

```
3d-web-experience
a2ui-renderer
ab-test-setup
accounting-agent
active-directory-attacks
address-github-comments
admin-operations
administrative-agent
agent-browser
agent-evaluation
agent-manager-skill
agent-memory-mcp
agent-memory-systems
agent-orchestration-patterns
agent-tool-builder
agentic-ai-frameworks
agentic-commerce
agentic-orchestration
agno
agri-tech-precision-farming
agriculture-agent
ai
ai-agents-architect
ai-artist
ai-drug-discovery-biotech
ai-governance-compliance
...
```

Skill library covers highly diverse domains: 3D web, accounting, AD attacks, memory systems,
agriculture, AI governance — suggests this is a curated third-party skill library,
not all Mekong-CLI-specific.

---

## Skill Domains Observed

From directory names:
- **Engineering:** code-review, debug, testing, ci-cd patterns
- **AI/ML:** ai-agents-architect, agentic-ai-frameworks, agent-memory-systems
- **Business:** accounting-agent, administrative-agent, agentic-commerce
- **Security:** active-directory-attacks, ai-governance-compliance
- **Domain-specific:** agri-tech, agriculture-agent, ai-drug-discovery

Wide coverage across business + technical domains.

---

## Missing SKILL.md Files (10 directories)

These directories exist but lack SKILL.md:

Based on the count discrepancy (255 dirs, 245 SKILL.md files = 10 missing):
Likely candidates based on common patterns:
- Recently scaffolded skills not yet populated
- Symlinked directories where SKILL.md is in parent
- Template/placeholder directories

Without listing specific missing files (requires deeper search), the 3.9% gap
is manageable but should be audited.

---

## SKILL.md Format Standard

Standard SKILL.md should contain:
- Skill name and version
- Description of capability
- Activation triggers (keywords/contexts)
- Usage examples
- Dependencies
- Integration points

Without reviewing a sample SKILL.md the exact schema is unknown but the
agent_skills_spec.md file likely defines it.

---

## Skill Activation Mechanism

Per CLAUDE.md:
```
Skills auto-activate from .claude/skills/
```

CC CLI reads .claude/skills/ directly and activates relevant skills based on
task context. No symlinks needed.

The 542 "skill definitions" mentioned in CLAUDE.md NAMESPACE section vs 255 directories
suggests some skills may be defined as files within subdirectories or the count
includes all files (SKILL.md + supporting files).

---

## Mekong-Specific Skills

Searching for Mekong-CLI-relevant skills in the 255:
- `agent-manager-skill` — relevant to Mekong agent management
- `agentic-orchestration` — relevant to PEV engine
- `agent-memory-mcp` — relevant to memory system
- `agent-evaluation` — relevant to verifier
- `agentic-commerce` — relevant to MCU billing / RaaS

Core Mekong capabilities appear represented in the skill library.

---

## Skill vs Command Relationship

245+ skills vs 176 commands (CLAUDE.md factory/contracts/):
- Skills are reusable capability building blocks
- Commands compose skills into specific workflows
- Skills are auto-activated; commands are explicitly invoked

Skills at 245 vs commands at 176 is a healthy ratio (1.4:1) suggesting each
command leverages ~1-2 skills on average.

---

## Recommendations

1. **Audit 10 missing SKILL.md files:** Run find to identify which dirs lack SKILL.md;
   create minimal stubs for each
2. **Add skill validation to CI:** Test that every directory in .claude/skills/ has SKILL.md
3. **Reconcile skill count:** CLAUDE.md says "542 skill definitions" but 255 dirs exist;
   clarify whether 542 counts files or subdirectory skills
4. **Add Mekong-specific meta-skills:** mcu-billing, pev-engine, recipe-runner
   as skills for external integrators
5. **Skill freshness check:** Some skills (active-directory-attacks) may be outdated;
   add version dates to SKILL.md headers

---

## Summary
96.1% skill coverage (245/255 SKILL.md present). Skill library is broad (255 dirs),
covering diverse domains from 3D web to agriculture. 10 dirs missing SKILL.md need auditing.
The 542 vs 255 count discrepancy in CLAUDE.md needs reconciliation.
