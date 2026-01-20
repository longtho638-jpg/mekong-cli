# Plan: Batch 4 Modularization & Refactoring

## Overview
- **Title**: Batch 4 Modularization
- **Status**: In Progress
- **Priority**: High
- **Effort**: Medium
- **Branch**: main
- **Tags**: refactor, modularization, core, infrastructure
- **Created**: 2026-01-20

## Goal
Achieve 100% modularization for core components and ensure all files are well under the 200-line limit, specifically focusing on agent memory, orchestration, and queue management.

## Targets
### Architectural Refactors (Requested)
1. **antigravity/core/agent_memory/storage.py** (128 LOC) -> Split into `backends/`, `compression.py`, `retrieval.py`.
2. **antigravity/core/agent_orchestrator/engine.py** (138 LOC) -> Split into `engine.py`, `delegator.py`, `monitor.py`.
3. **antigravity/infrastructure/distributed_queue/queue_manager.py** (147 LOC) -> Split into `producer.py`, `consumer.py`, `manager.py`.

### Size-based Refactors (>200 LOC)
4. **backend/services/agentops/service.py** (205 LOC) -> Modularize business logic.
5. **backend/agents/isrops/activity_tracker_agent.py** (206 LOC) -> Modularize agent logic.
6. **backend/agents/legalops/compliance_agent.py** (205 LOC) -> Modularize validation logic.
7. **backend/agents/seops/poc_tracker_agent.py** (205 LOC) -> Modularize tracking logic.
8. **backend/agents/ppcops/bid_manager_agent.py** (202 LOC) -> Modularize bidding logic.

## Logic for core/security/validate_phase2_fixes.py
- Already refactored to 20 lines. No further action needed.

## Success Criteria
- All target files refactored into smaller, focused modules.
- New files are < 200 LOC.
- All existing tests pass.
- Deprecation proxies created where necessary to maintain backward compatibility.

## Implementation Steps
1. Create directory structures for modularized components.
2. Extract logic into specific module files.
3. Update main engine/storage files to act as facades/orchestrators.
4. Verify functionality with tests.
5. Final sweep for any other files > 200 LOC.
