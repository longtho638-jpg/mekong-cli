# Phase 6: .claude Infrastructure Refactoring

## Context
- **Plan**: Refactor for Go-Live
- **Goal**: Align .claude infrastructure (workflows, skills, hooks) with mekong-cli core logic to eliminate duplication and ensure consistency.
- **Reference**: `docs/architecture-alignment-map.md`

## Objectives
1. **Workflow Alignment**: Ensure `.claude/workflows/*.md` reference actual Python implementations in `antigravity/core/`.
2. **Skill Optimization**: Refactor skills to utilize `mekong-cli` commands instead of standalone scripts where applicable.
3. **Hook Consistency**: Align `.claude/hooks/` with `antigravity/core/hook_executor.py` and lifecycle events.
4. **Configuration Consolidation**: Ensure single source of truth for config between `.claude/config/` and `antigravity/core/config.py`.

## Tasks

### 6.1 Workflow Refactoring
- [ ] Refactor `revenue-workflow.md` to reference `antigravity/core/revenue_engine.py`
- [ ] Refactor `deployment-workflow.md` to reference `antigravity/core/ops_engine.py`
- [ ] Refactor `code-review-workflow.md` to reference `antigravity/core/code_guardian.py`
- [ ] Refactor `kanban.md` to reference `antigravity/core/vibe_workflow.py`

### 6.2 Skill & Command Alignment
- [ ] Update `antibridge` skill to use `antigravity/core/bridge.py`
- [ ] Verify `mcp-management` skill uses `antigravity/core/mcp_manager.py`
- [ ] Update `research` skill to utilize `antigravity/core/scout/`
- [ ] Standardize `antigravity.md` command to point to `cli/entrypoint.py`

### 6.3 Hook Logic Integration
- [ ] Review `privacy-block.cjs` against `antigravity/core/hook_executor.py`
- [ ] Review `model-router.cjs` against `antigravity/core/command_router.py`

### 6.4 Cleanup
- [ ] Remove deprecated workflows if fully superseded by Python code
- [ ] Update `CLAUDE.md` to reflect new infrastructure paths

## Deliverables
- Updated Workflow Markdown files
- Refactored Skill definitions
- Unified Configuration
