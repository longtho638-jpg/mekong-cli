## Phase 5: Integration + Tests + Commit

### Context
- Parent: [plan.md](plan.md)
- Dependency: Phases 1-4 completed

### Overview
- Date: 2026-03-01
- Priority: P2
- Description: Wire all new modules into package exports, write comprehensive tests, update docs, commit.
- Implementation status: pending
- Review status: pending

### Requirements
- All 4 new modules exported from `@agencyos/vibe-arbitrage-engine`
- Test coverage for each module
- README updated with new capabilities
- Clean build (`tsc --noEmit`)
- All tests passing

### Related Code Files
- EDIT: `packages/vibe-arbitrage-engine/index.ts` — add all exports
- EDIT: `apps/algo-trader/README.md` — document new patterns
- NEW: `apps/algo-trader/src/arbitrage/N8nPatterns.test.ts` — test suite

### Implementation Steps
1. Update `index.ts` with all new exports
2. Write tests: WorkflowPipelineBuilder, ErrorWorkflowHandler, CredentialVault, MetricsCollector
3. Run `tsc --noEmit` — 0 errors
4. Run `jest` — all pass
5. Update README
6. Commit: `feat(algo-trader): add n8n-inspired patterns — workflow nodes, error handler, credential vault, metrics`

### Todo
- [ ] Update package exports
- [ ] Write test suite (target: 20+ new tests)
- [ ] Build verification
- [ ] Full test suite pass
- [ ] README update
- [ ] Commit

### Success Criteria
- Build: 0 TS errors
- Tests: all pass (existing + new)
- Commit: clean conventional commit message
