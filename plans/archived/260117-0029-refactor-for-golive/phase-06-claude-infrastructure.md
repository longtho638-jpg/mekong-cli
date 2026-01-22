# Phase 06: .claude Infrastructure Refactoring

**Timeline:** Phase 6 (Week 2)
**Impact:** Infrastructure maintainability + architectural alignment
**Priority:** P1

---

## 📋 CONTEXT

**Parent Plan:** `/Users/macbookprom1/mekong-cli/plans/260117-0029-refactor-for-golive/plan.md`
**Dependencies:** None (infrastructure foundation)
**Related Docs:** `.claude/rules/development-rules.md`, `CLAUDE.md`

---

## 🎯 OVERVIEW

**Date:** 2026-01-19
**Description:** Optimize .claude infrastructure for scalability, eliminate duplication, clarify config precedence
**Priority:** P1
**Status:** DONE ✅
**Completed:** 2026-01-19 23:05

---

## 🔑 KEY INSIGHTS

From research reports:

1. **Duplication Detected**: scout.md exists in both `/commands/scout.md` (32 lines) AND `/agents/scout.md` (108 lines)
2. **Config Precedence Unclear**: Rules in `.claude/rules/` vs `$HOME/.claude/workflows/` - no documented hierarchy
3. **Skill Storage**: ~50MB duplication between `.claude/skills/` and `.agencyos/skills/`
4. **Workflow Fragmentation**: Multiple kanban workflow files (kanban-workflow.md, kanban-agent-flow.md) with unclear relationships

---

## 📊 REQUIREMENTS

### Deliverables

1. **Unified Command/Agent Separation**
   - Clarify `/commands/` (user-facing slash commands) vs `/agents/` (execution logic)
   - Resolve scout.md duplication
   - Document naming conventions

2. **Config Precedence Documentation**
   - `.claude/rules/` (project-specific) OVERRIDES `$HOME/.claude/workflows/` (global)
   - Create config hierarchy diagram
   - Add validation for conflicting configs

3. **Skill Storage Optimization**
   - Evaluate symlink strategy vs consolidation
   - Reduce 50MB duplication
   - Maintain backward compatibility

4. **Workflow Consolidation**
   - Merge or clarify kanban workflow files
   - Create workflow relationship map
   - Remove deprecated workflows

---

## 🏗️ ARCHITECTURE

### Current Structure
```
.claude/
├── commands/          # User-facing slash commands
│   └── scout.md       # 32 lines - DUPLICATE
├── agents/            # Agent execution logic
│   └── scout.md       # 108 lines - DUPLICATE
├── rules/             # Project-specific rules
├── skills/            # Skill definitions
│   └── ai-multimodal/ # ~25MB - DUPLICATE in .agencyos
└── workflows/         # Project workflows
```

### Target Structure
```
.claude/
├── commands/          # Slash commands ONLY (user interface)
│   └── scout.md       # Simplified command definition
├── agents/            # Agent logic (referenced by commands)
│   └── scout/
│       ├── agent.md   # Agent configuration
│       └── logic.py   # Execution implementation
├── config/            # NEW: Config hierarchy
│   ├── precedence.md  # Documented precedence rules
│   └── schema.json    # Config validation schema
├── skills/            # Symlink to .agencyos/skills
└── workflows/         # Consolidated workflows
    └── kanban.md      # Unified kanban workflow
```

---

## 📂 RELATED CODE FILES

| File | Lines | Issues |
|------|-------|--------|
| `.claude/commands/scout.md` | 32 | Duplicate definition |
| `.claude/agents/scout.md` | 108 | Duplicate definition |
| `.claude/workflows/kanban-workflow.md` | 62 | Fragmentation |
| `.claude/workflows/kanban-agent-flow.md` | ~40 | Relationship unclear |
| `.claude/skills/ai-multimodal/*` | ~25MB | Storage duplication |
| `.agencyos/skills/ai-multimodal/*` | ~25MB | Storage duplication |

---

## 🛠️ IMPLEMENTATION STEPS

### Step 1: Resolve Command/Agent Duplication (4h)

1. **Analyze scout.md differences**
   ```bash
   diff .claude/commands/scout.md .claude/agents/scout.md
   ```

2. **Establish separation pattern**
   - Commands: Define user interface (args, description, usage)
   - Agents: Implement execution logic (prompts, tools, context)

3. **Refactor scout example**
   ```markdown
   # .claude/commands/scout.md (user interface)
   /scout [query] - Explore codebase intelligently
   → Delegates to: .claude/agents/scout/agent.md

   # .claude/agents/scout/agent.md (execution logic)
   Agent: Scout
   Purpose: Codebase exploration with 3-agent parallel strategy
   Tools: Glob, Grep, Read
   ```

4. **Apply pattern to all duplicates**

### Step 2: Document Config Precedence (2h)

1. **Create precedence hierarchy**
   ```
   Priority (highest to lowest):
   1. .claude/config/ (project overrides)
   2. .claude/rules/ (project defaults)
   3. $HOME/.claude/workflows/ (global defaults)
   4. Built-in defaults
   ```

2. **Add validation script**
   ```python
   # .claude/config/validate.py
   def check_conflicts():
       # Detect conflicting configs
       # Warn on precedence issues
   ```

3. **Update CLAUDE.md**
   - Document precedence rules
   - Add troubleshooting guide

### Step 3: Optimize Skill Storage (3h)

1. **Evaluate consolidation strategy**
   - Option A: Symlink `.claude/skills` → `.agencyos/skills`
   - Option B: Single source in `.agencyos`, import in `.claude`
   - **Recommended:** Option A (symlink)

2. **Implement symlink strategy**
   ```bash
   # Backup existing
   mv .claude/skills .claude/skills.backup

   # Create symlink
   ln -s ../.agencyos/skills .claude/skills

   # Verify access
   ls .claude/skills/ai-multimodal
   ```

3. **Update references**
   - Check all skill imports
   - Update documentation paths

4. **Test backward compatibility**

### Step 4: Consolidate Workflows (3h)

1. **Analyze workflow relationships**
   ```bash
   # Find all kanban workflows
   fd kanban .claude/workflows
   ```

2. **Merge kanban workflows**
   - Combine `kanban-workflow.md` + `kanban-agent-flow.md`
   - Create single source of truth
   - Archive deprecated versions

3. **Create workflow map**
   ```markdown
   # .claude/workflows/README.md

   ## Workflow Hierarchy
   - primary-workflow.md (orchestration)
     ├── kanban.md (task management)
     ├── development-rules.md (coding standards)
     └── documentation-management.md (docs)
   ```

4. **Remove deprecated files**

---

## ✅ TODO

### Analysis
- [ ] Identify all command/agent duplications
- [ ] Map config precedence conflicts
- [ ] Calculate exact skill storage savings

### Implementation
- [ ] Refactor scout.md separation
- [ ] Create config precedence documentation
- [ ] Implement symlink strategy for skills
- [ ] Consolidate kanban workflows
- [ ] Update all references

### Validation
- [ ] Test command execution after refactor
- [ ] Verify config precedence behavior
- [ ] Check skill access after symlinking
- [ ] Validate workflow consolidation

### Documentation
- [ ] Update CLAUDE.md with precedence rules
- [ ] Create workflow relationship map
- [ ] Document command/agent separation pattern

---

## 📊 SUCCESS CRITERIA

### Measurable Goals
- ✅ Zero duplicate command/agent files
- ✅ Documented config precedence (precedence.md exists)
- ✅ Storage reduction: 50MB → 0MB duplication
- ✅ Workflow files: 10+ → 6 consolidated files

### Quality Metrics
- ✅ All commands execute correctly after refactor
- ✅ Config validation script catches conflicts
- ✅ Symlink strategy maintains backward compatibility
- ✅ Workflow map covers 100% of relationships

---

## ⚠️ RISK ASSESSMENT

**Medium Risk:**
- Symlink strategy may break on Windows systems
- Config precedence changes could affect existing behavior
- Command/agent separation requires comprehensive testing

**Mitigation:**
- Test on macOS/Linux/Windows before deployment
- Feature flag config precedence changes
- Maintain legacy command paths during transition
- Create rollback script for symlink strategy

---

## 🔒 SECURITY CONSIDERATIONS

**Low Risk:** Infrastructure refactoring only

**Checks:**
- Ensure symlinks don't expose sensitive files
- Validate config precedence doesn't bypass security rules
- Review skill access permissions after consolidation

---

## 🚀 NEXT STEPS

1. **Immediate:** Analyze command/agent duplications (2h)
2. **Week 2 Day 1:** Implement scout.md separation pattern (4h)
3. **Week 2 Day 2:** Create config precedence docs + validation (4h)
4. **Week 2 Day 3:** Deploy symlink strategy + consolidate workflows (4h)

**Total Effort:** 12 hours over 3 days

---

_Phase 6: Infrastructure foundation for scalable .claude architecture_
