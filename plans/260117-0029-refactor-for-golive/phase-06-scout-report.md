# Phase 6 Scout Report: .claude Infrastructure Analysis

## Executive Summary

**Status**: Infrastructure largely aligned, but critical issues found in hooks and config management.

**Critical Issues**: 3
**High Priority**: 2
**Medium Priority**: 3
**Low Priority**: 8

---

## 1. Workflow-to-Implementation Mapping

| Workflow File | Python Implementation | Status | Priority |
|---------------|----------------------|--------|----------|
| primary-workflow.md | antigravity/core/agent_orchestrator/engine.py | ✅ Aligned | Low |
| revenue-workflow.md | antigravity/core/revenue/engine.py | ✅ Aligned | Low |
| crm-workflow.md | antigravity/core/client_magnet/engine.py | ✅ Aligned | Low |
| code-review-workflow.md | antigravity/core/code_guardian/guardian.py | ✅ Aligned | Low |
| deployment-workflow.md | antigravity/core/ops/engine.py | ✅ Aligned | Low |
| kanban.md | antigravity/core/kanban/board_manager.py | ✅ Aligned | Low |
| testing-workflow.md | antigravity/core/vibe_workflow.py | ⚠️ Partial | Low |
| help-workflow.md | antigravity/core/scout/engine.py | ✅ Aligned | Low |
| new-project.md | antigravity/core/bizplan/generator.py | ⚠️ Partial | Medium |
| auto-publish.md | antigravity/core/content_factory/distribution.py | ⚠️ Partial | Medium |
| build-workflow.md | antigravity/core/ops/engine.py | ❓ Implicit | Low |
| gumroad-automation.md | antigravity/core/sales_pipeline.py | ❌ Deprecated | Low |

### Critical Findings - Workflows

1. **Duplicate Revenue Engine** (High Priority)
   - File: `antigravity/core/revenue_engine.py`
   - Issue: Deprecated proxy, logic moved to `antigravity/core/revenue/engine.py`
   - Action: Delete deprecated file

2. **Missing Build Engine** (Medium Priority)
   - `build-workflow.md` has no dedicated BuildEngine
   - Appears procedural via OpsEngine
   - Decision needed: Dedicated engine or keep procedural?

3. **Gumroad Logic Dispersed** (Medium Priority)
   - `gumroad-automation.md` references deprecated sales_pipeline.py
   - Logic scattered across ContentFactory, SalesPipeline, Observability
   - Action: Consolidate into revenue-workflow.md, delete gumroad-automation.md

---

## 2. Skills Integration Analysis

| Skill Name | CLI/Core Integration | Standalone Scripts | Priority |
|------------|---------------------|-------------------|----------|
| antibridge | antigravity/core/control.py | None found | Low |
| research | antigravity/core/scout/engine.py | None found | Low |
| mcp-management | antigravity/core/mcp_manager.py | None found | Low |
| payment-integration | **Missing core logic** | Template only | Medium |
| media-processing | **Missing core logic** | Template only | Medium |
| content-factory | antigravity/core/content_factory.py | None found | Low |
| vietnamese-agency | antigravity/core/client_magnet.py | None found | Low |

### Key Observations - Skills

- ✅ **Clean Architecture**: Skills = definitions (.md), Core = logic (.py), CLI = interface
- ✅ **No Redundant Scripts**: All 40+ skill dirs follow definition-only pattern
- ⚠️ **Empty Scaffolding**: Most skills have empty `docs/`, `scripts/`, `tests/` folders
- 🔨 **Placeholders Need Implementation**: Payment and Media skills need core modules

### Recommendations - Skills

- No cleanup needed (no redundant scripts exist)
- Implement placeholder skills in `antigravity/core/` (not `.claude/skills/`)
- Update generic SKILL.md files to reference future core modules

---

## 3. Hooks Integration Analysis

| Hook File | Python Integration | Status | Priority |
|-----------|-------------------|--------|----------|
| win-win-win-gate.cjs | ✅ Mapped (pre_revenue) | Active | Low |
| dev-rules-reminder.cjs | ✅ Mapped (pre_code) | Active | Low |
| privacy-block.cjs | ✅ Mapped but **duplicated logic** | **Critical** | **Critical** |
| scout-block.cjs | ✅ Mapped (pre_research) | Active | Low |
| session-init.cjs | ✅ Mapped (session_start) | Active | Low |
| subagent-init.cjs | ✅ Mapped (spawn_subagent) | Active | Low |
| model-router.cjs | ❌ **Not in registry** | **Orphaned** | **Critical** |

### Critical Findings - Hooks

1. **Orphaned Hook: model-router.cjs** (CRITICAL)
   - Exists in `.claude/hooks/` but missing from `hook_registry.py`
   - Model routing hardcoded in `config.py` (DEFAULT_MODEL)
   - Decision: Integrate hook into registry or delete if superseded

2. **Duplicate Privacy Logic** (CRITICAL)
   - JS implementation: `privacy-block.cjs`
   - Python implementation: `hook_executor.py` → `check_privacy_block()`
   - Risk: Updates must sync across 2 implementations
   - Action: Single source of truth - choose JS or Python

---

## 4. Configuration Duplication Analysis

| Config Source | Duplicate in | Issue | Priority |
|---------------|-------------|-------|----------|
| `antigravity/core/config.MAX_FILE_LINES` | `.claude/rules/development-rules.md` | SSOT violation | Medium |
| `antigravity/core/config.DEFAULT_MODEL` | `model-router.cjs` | Hardcoded vs dynamic | High |
| `antigravity/core/config.AI_PROXY_*` | `.claude/config/` (implied) | Proxy split Py/JS | High |

### Critical Findings - Config

1. **Model Routing Split** (High Priority)
   - Python: `config.py` has hardcoded DEFAULT_MODEL
   - JS: `model-router.cjs` has routing logic
   - Result: Routing decisions split across languages
   - Action: Unify into single system (preferably Python)

2. **Dev Standards Fragmentation** (Medium Priority)
   - `MAX_FILE_LINES` defined in both Python config and Markdown rules
   - Risk: Inconsistency when values diverge
   - Action: Python config = source, Markdown = documentation reference

3. **Proxy Configuration Split** (High Priority)
   - AI proxy settings implied in both `.claude/config/` and `antigravity/core/config.py`
   - No clear SSOT
   - Action: Audit and consolidate

---

## 5. Priority Action Items

### CRITICAL (Immediate)

1. **Resolve model-router.cjs orphan**
   - Integrate into hook_registry.py OR delete if deprecated
   - Unify model routing logic (Python preferred)

2. **Consolidate privacy-block logic**
   - Choose: Keep JS hook OR Python executor (not both)
   - Recommended: Python (better testability, type safety)

### HIGH (Phase 6)

3. **Delete deprecated revenue_engine.py**
   - Safe deletion, logic in revenue/engine.py

4. **Unify model routing config**
   - Move all routing to `config.py` or dedicated router class
   - Update workflows to reference single source

5. **Consolidate AI proxy config**
   - Audit `.claude/config/` vs `antigravity/core/config.py`
   - Document SSOT for proxy settings

### MEDIUM (Phase 6)

6. **Gumroad workflow consolidation**
   - Merge into revenue-workflow.md
   - Delete gumroad-automation.md

7. **Build workflow clarification**
   - Document: Dedicated BuildEngine needed? Or keep procedural?

8. **Config documentation sync**
   - MAX_FILE_LINES: Python = source, Markdown = reference
   - Add comment in .md pointing to Python config

---

## 6. Unresolved Questions

1. **Build Engine**: Should `build-workflow.md` get dedicated BuildEngine class, or remain procedural via OpsEngine?

2. **Gumroad Scope**: Should Gumroad logic be:
   - Fully in RevenueEngine?
   - Split between Revenue + ContentFactory?
   - Standalone GumroadEngine?

3. **Hook Language Choice**: Privacy-block duplication - delete JS or Python version?
   - Recommendation: Delete JS, keep Python (easier testing, type safety)

4. **Model Router Fate**: Is `model-router.cjs` deprecated, or needs integration?
   - If deprecated: Delete
   - If active: Integrate into hook_registry.py + unify with config.py

5. **Placeholder Skills Timeline**: When to implement Payment/Media core modules?
   - Phase 8 (Core Logic) or separate feature work?

---

## 7. File-Level Recommendations

### Delete Candidates
- `antigravity/core/revenue_engine.py` (deprecated proxy)
- `.claude/workflows/gumroad-automation.md` (merge into revenue-workflow.md)
- `model-router.cjs` (if confirmed deprecated)
- `privacy-block.cjs` OR Python equivalent (choose one)

### Refactor Candidates
- `antigravity/core/config.py` - absorb model routing logic
- `hook_registry.py` - add model-router if keeping
- `.claude/rules/development-rules.md` - add Python config references

### Create Candidates
- `antigravity/core/payment/engine.py` (for payment-integration skill)
- `antigravity/core/media/processor.py` (for media-processing skill)
- Architecture alignment map (if not exists)

---

## Success Metrics

- [ ] Zero orphaned hooks
- [ ] Single source of truth for all configs
- [ ] All workflows reference Python implementations
- [ ] No duplicate logic across JS/Python boundaries
- [ ] Skills point to existing core modules (or documented as templates)
