# Phase 7: CLI Tooling Optimization

## Context
- **Plan**: Refactor for Go-Live
- **Goal**: Optimize `antigravity/cli/*` and command organization to ensure a robust, user-friendly, and performant CLI experience.
- **Reference**: `docs/architecture-alignment-map.md`

## Objectives
1.  **Command Standardization**: Ensure all CLI commands in `cli/commands/` follow a consistent pattern (Typer/Click).
2.  **Performance Optimization**: Reduce CLI startup time (lazy imports in `cli/entrypoint.py`).
3.  **Architecture Alignment**: Align CLI commands with `antigravity/core/` logic as per the Architecture Map.
4.  **Error Handling**: Implement consistent error handling and logging across the CLI.

## Tasks

### 7.1 CLI Structure Analysis & Cleanup
- [ ] Audit `cli/` directory structure.
- [ ] Identify and remove unused/deprecated CLI code.
- [ ] Ensure `cli/__init__.py` and `cli/entrypoint.py` are optimized.

### 7.2 Command Implementation & Refactoring
- [ ] **Revenue Command**: Refactor/Implement `cli/commands/revenue.py` (align with `revenue_engine.py`).
- [ ] **Deploy Command**: Refactor/Implement `cli/commands/deploy.py` (align with `ops_engine.py`).
- [ ] **Test Command**: Refactor/Implement `cli/commands/test.py` (align with `code_guardian.py`).
- [ ] **Plan Command**: Refactor/Implement `cli/commands/plan.py` (align with `vibe_orchestrator.py`).
- [ ] **Start/Onboard**: Verify `cli/entrypoint.py` and `cli/onboard.py`.

### 7.3 Performance Optimization
- [ ] Implement lazy loading for heavy imports in `cli/entrypoint.py`.
- [ ] Profile CLI startup time.

### 7.4 Testing
- [ ] Verify each CLI command executes correctly.
- [ ] Ensure help messages (`--help`) are clear and consistent.

## Deliverables
- Optimized `cli/` directory.
- Consistent and performant CLI commands.
- Updated `cli/entrypoint.py`.
