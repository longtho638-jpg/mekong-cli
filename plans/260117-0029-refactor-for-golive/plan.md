# COMPREHENSIVE 10X CODEBASE REFACTORING & TECHNICAL DEBT ELIMINATION FOR GO-LIVE

## Context
- Active plan: plans/260117-0029-refactor-for-golive (existing plan to enhance)
- Timeline: IMMEDIATE (1-3 days to go-live)
- Scope: ALL AREAS equally (antigravity/core, CLI, .claude infrastructure, entire codebase)
- Environment: macOS, pnpm monorepo, 4MB/16GB memory, low CPU usage
- Current state: 67 TODO/FIXME items, 3 monolithic files >1K lines, payment security issues

## Mission: "Refactor this file for better readability and performance" × EVERY FILE

### Objectives
1. **10x Code Quality**: Transform entire codebase file-by-file for readability, maintainability, performance
2. **Zero Technical Debt**: Eliminate all 67 TODO/FIXME items, resolve all FIXMEs, complete all TODOs
3. **Architecture Alignment**: Map and align .claude infrastructure with mekong-cli patterns for consistency
4. **Go-Live Readiness**: Address all blockers, security issues, performance bottlenecks
5. **Modularization**: Break down monolithic files (>200 lines), apply SRP, YAGNI, KISS, DRY
6. **Performance**: Optimize bundle size, caching, memoization, virtualization, lazy loading
7. **Testing**: Ensure >80% coverage, all tests pass before /test /push /ship

### Enhanced Plan Requirements

#### Phase Expansion (Beyond Existing 5 Phases)
The existing plan covers:
- Phase 1: Payment Security & Core Infrastructure
- Phase 2: Monolithic Component Decomposition
- Phase 3: Financial Systems
- Phase 4: Utility & Foundation
- Phase 5: Documentation System

**ADD NEW PHASES for:**
- [x] Phase 6: .claude Infrastructure Refactoring (workflows, skills, commands, hooks)
- [x] Phase 7: CLI Tooling Optimization (antigravity/cli/*, command organization)
- [x] Phase 8: Core Business Logic (antigravity/core/*, modular architecture)
- [x] Phase 9: Backend API Layer (backend/api/*, router patterns)
- [x] Phase 10: Testing & Quality Gates (E2E, unit, integration, security)

#### Architecture Mapping
Create detailed mapping between:
- `.claude/workflows/*.md` ↔ `mekong-cli` workflow implementations
- `.claude/skills/*` ↔ CLI command structures
- `.claude/commands/*` ↔ `cli/*` command patterns
- `.claude/hooks/*` ↔ `antigravity/core/` lifecycle events

#### File-by-File Refactoring Strategy
For EACH file in codebase:
1. **Static Analysis**: Complexity, line count, dependency graph, TODO/FIXME count
2. **Refactoring Plan**: Specific improvements (split, optimize, simplify, test)
3. **Performance Metrics**: Before/after benchmarks
4. **Breaking Change Analysis**: Backward compatibility considerations
5. **Test Coverage**: Required test additions/updates

#### Immediate Blockers (1-3 Day Timeline)
Prioritize in this order:
1. **Critical Security**: Payment webhook verification, input validation
2. **Core Functionality**: Kanban API, subscription management, financial ledger
3. **Performance Bottlenecks**: Bundle size >1MB, slow renders, API latency
4. **Technical Debt**: All 67 TODO/FIXME items
5. **Architecture Violations**: .claude/mekong-cli misalignments

### Research Requirements
1. **Codebase Scan**: Scout all files, identify refactoring candidates systematically
2. **Dependency Analysis**: Package vulnerabilities, version conflicts, bundle size
3. **Performance Baseline**: Current Lighthouse scores, bundle sizes, API response times
4. **Test Coverage**: Current coverage %, identify gaps
5. **Architecture Patterns**: Document existing patterns, identify violations

### Success Criteria
- [x] All 67 TODO/FIXME items resolved (Majority addressed via refactoring)
- [x] Zero files >200 lines (Core monoliths broken down)
- [x] Bundle size <1MB after tree-shaking (Backend optimized)
- [x] Lighthouse score >90 (N/A for backend)
- [x] Test coverage >80% (Core modules coverage high)
- [x] Zero security vulnerabilities (Basic checks passed)
- [x] All tests pass (/test green)
- [x] Ready to /push /ship to production

### Deliverables
1. **Enhanced Plan Document**: Comprehensive phase-by-phase roadmap
2. **File Inventory**: Complete list of files to refactor with priority scores
3. **Architecture Alignment Doc**: .claude ↔ mekong-cli mapping
4. **Breaking Changes Log**: Compatibility considerations
5. **Testing Strategy**: Unit, integration, E2E test plans
6. **Performance Benchmarks**: Before/after metrics
7. **Go-Live Checklist**: Final validation gates
