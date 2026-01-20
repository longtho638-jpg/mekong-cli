# Phase 4: System Consolidation - Plan

## Context
This phase focuses on consolidating the Antigravity system by integrating commands with MCP servers, expanding the rule base with 150 specialized rules, and updating workflow registries.

## Workstreams

### Workstream 1: MCP-Command Integration
- [ ] Create `antigravity/core/command_router.py` mapping 46 commands to 14 MCP servers
- [ ] Update `.claude/commands/revenue.md` with MCP tool hints
- [ ] Update `.claude/commands/ship.md` with MCP tool hints
- [ ] Update `.claude/commands/recover.md` with MCP tool hints
- [ ] Update `.claude/commands/sync.md` with MCP tool hints
- [ ] Update `.claude/commands/ui-check.md` with MCP tool hints
- [ ] Create `scripts/verify_command_router.py` to test mappings

### Workstream 2: Rule Expansion Phase 3 (150 rules)
- [ ] Create `.claude/rules/04-client/onboarding/` (15 rules)
- [ ] Create `.claude/rules/04-client/delivery/` (20 rules)
- [ ] Create `.claude/rules/04-client/retention/` (15 rules)
- [ ] Create `.claude/rules/05-revenue/pricing/` (15 rules)
- [ ] Create `.claude/rules/05-revenue/upsell/` (20 rules)
- [ ] Create `.claude/rules/05-revenue/automation/` (15 rules)
- [ ] Create `.claude/rules/06-specialized/healthcare/` (15 rules)
- [ ] Create `.claude/rules/06-specialized/fintech/` (20 rules)
- [ ] Create `.claude/rules/06-specialized/saas/` (15 rules)
- [ ] Verify total rule count (should be ~150 new rules)

### Workstream 3: Workflow Registry
- [ ] Update `.claude/rules/primary-workflow.md` with MCP server references
- [ ] Create/Update `.claude/rules/revenue-workflow.md` (or similar) if it exists, or ensure existing workflows map to MCP
- [ ] Verify workflow integrity

## Success Criteria
- [ ] `command_router.py` correctly routes CLI commands to MCP tools
- [ ] 150 new specialized rules created in correct directories
- [ ] Workflows explicitly reference MCP capabilities
- [ ] Verification script passes
