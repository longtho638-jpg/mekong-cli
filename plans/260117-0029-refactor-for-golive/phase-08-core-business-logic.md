# Phase 8: Core Business Logic Refactoring

## Context
- **Plan**: Refactor for Go-Live
- **Goal**: Refactor `antigravity/core/*` modules to ensure modularity, scalability, and adherence to SOLID principles. Break down monolithic files.
- **Reference**: `docs/architecture-alignment-map.md`

## Objectives
1.  **Modularization**: Decompose files larger than 200 lines into smaller, focused modules.
2.  **Type Safety**: Ensure comprehensive Pydantic models and type hinting.
3.  **Pattern Standardization**: Apply consistent patterns (Factory, Strategy, Observer) across engines.
4.  **Performance**: Optimize hot paths in core logic.

## Tasks

### 8.1 Analysis & Discovery
- [ ] Scan `antigravity/core/` for files > 200 lines.
- [ ] Identify circular dependencies.
- [ ] Map dependencies for `MasterDashboard`, `AgentSwarm`, and `AgencyDNA`.

### 8.2 Core Refactoring
- [ ] **Master Dashboard**: Refactor `antigravity/core/master_dashboard.py` -> `antigravity/core/dashboard/` (Service + UI separation).
- [ ] **Agent Swarm**: Refactor `antigravity/core/agent_swarm.py` -> `antigravity/core/swarm/` (Logic + State).
- [ ] **Agency DNA**: Refactor `antigravity/core/agency_dna.py` to ensure it's a lightweight config loader.
- [ ] **Orchestrator**: Ensure `vibe_orchestrator.py` is streamlined and relies on `claude-flow` patterns where applicable.

### 8.3 Engine Optimization
- [ ] Review `RevenueEngine` for performance optimizations.
- [ ] Review `OpsEngine` for error handling robustness.

### 8.4 Testing
- [ ] Run unit tests for refactored core modules.
- [ ] Verify no regression in CLI commands dependent on core.

## Deliverables
- Modularized `antigravity/core` structure.
- Reduced cyclomatic complexity.
- 100% Type hinted core.
