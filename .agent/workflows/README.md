# Workflow Relationship Map

**Last Updated:** 2026-01-19
**Version:** 1.0

---

## 🎯 Overview

This document maps the relationships between all workflows in `.claude/workflows/` to provide clarity on which workflows to use and when.

---

## 📊 Workflow Hierarchy

```
primary-workflow.md (ORCHESTRATION)
├── development-rules.md (CODING STANDARDS)
├── documentation-management.md (DOCS)
├── orchestration-protocol.md (AGENT COORDINATION)
├── kanban.md (TASK MANAGEMENT) [NEW: Consolidated]
├── testing-workflow.md (TESTING)
├── deployment-workflow.md (DEPLOYMENT)
├── code-review-workflow.md (CODE REVIEW)
├── revenue-workflow.md (REVENUE TRACKING)
├── build-workflow.md (BUILD PROCESS)
├── help-workflow.md (HELP/SUPPORT)
├── crm-workflow.md (CRM)
├── auto-publish.md (AUTO PUBLISHING)
└── new-project.md (PROJECT INITIALIZATION)
```

---

## 🔍 Workflow Purposes

### Core Workflows (Always Active)

| Workflow | Purpose | Used By | Depends On |
|----------|---------|---------|------------|
| `primary-workflow.md` | Main orchestration | All agents | - |
| `development-rules.md` | Coding standards | Fullstack Developer, Code Reviewer | - |
| `documentation-management.md` | Docs lifecycle | All agents | - |
| `orchestration-protocol.md` | Agent coordination | All agents | primary-workflow.md |

### Feature Workflows (On-Demand)

| Workflow | Purpose | Trigger | Depends On |
|----------|---------|---------|------------|
| `kanban.md` | Task board management | `/kanban` command | - |
| `testing-workflow.md` | Test execution | `/test` command | development-rules.md |
| `deployment-workflow.md` | Deploy to prod | `/ship` command | testing-workflow.md, build-workflow.md |
| `code-review-workflow.md` | Code review process | `/code:review` | development-rules.md |
| `revenue-workflow.md` | Revenue tracking | `/revenue` | - |
| `build-workflow.md` | Build artifacts | `/build` | development-rules.md |
| `help-workflow.md` | Help system | `/ck-help` | - |
| `crm-workflow.md` | CRM operations | `/crm` | - |
| `auto-publish.md` | Auto publishing | Automated | deployment-workflow.md |
| `new-project.md` | New project setup | `/bootstrap` | - |

---

## 🔄 Workflow Relationships

### 1. Primary Workflow → All Others

`primary-workflow.md` is the entry point. All other workflows are invoked by it based on context.

```
primary-workflow.md
  → analyzes task
  → routes to appropriate workflow(s)
  → coordinates execution
  → ensures completion
```

### 2. Development → Code Review → Deployment

The standard development pipeline:

```
development-rules.md (code)
  → code-review-workflow.md (review)
    → testing-workflow.md (test)
      → build-workflow.md (build)
        → deployment-workflow.md (deploy)
```

### 3. Kanban ↔ All Workflows

`kanban.md` tracks tasks for all workflows:

```
kanban.md (task board)
  ↔ primary-workflow.md (orchestration)
  ↔ development-rules.md (dev tasks)
  ↔ testing-workflow.md (test tasks)
  ↔ deployment-workflow.md (deploy tasks)
```

### 4. Documentation ← All Workflows

All workflows generate documentation:

```
All workflows
  → documentation-management.md (generate/update docs)
```

---

## 🚀 Usage Examples

### Example 1: Feature Development

**User Request:** "Implement login feature"

**Workflow Path:**
1. `primary-workflow.md` - Routes to development
2. `development-rules.md` - Sets coding standards
3. `kanban.md` - Tracks subtasks
4. `testing-workflow.md` - Runs tests
5. `code-review-workflow.md` - Reviews code
6. `documentation-management.md` - Updates docs
7. `deployment-workflow.md` - Deploys to prod

### Example 2: Bug Fix

**User Request:** "/fix login timeout"

**Workflow Path:**
1. `primary-workflow.md` - Routes to debugging
2. `development-rules.md` - Applies fix
3. `testing-workflow.md` - Verifies fix
4. `kanban.md` - Tracks progress
5. `deployment-workflow.md` - Hotfix deploy

### Example 3: Documentation Update

**User Request:** "/docs:update"

**Workflow Path:**
1. `primary-workflow.md` - Routes to docs
2. `documentation-management.md` - Analyzes changes
3. `kanban.md` - Tracks docs tasks
4. `deployment-workflow.md` - Publishes docs

---

## 📁 Deprecated Workflows

The following workflows have been deprecated and moved to `.claude/workflows/deprecated/`:

| Workflow | Reason | Replaced By |
|----------|--------|-------------|
| `kanban-workflow.md` | Fragmented functionality | `kanban.md` |
| `kanban-agent-flow.md` | Duplication | `kanban.md` |

---

## ✅ Workflow Selection Guide

**Use `primary-workflow.md`** when:
- Starting any new task
- Need orchestration across multiple workflows
- Unsure which workflow to use

**Use `development-rules.md`** when:
- Writing code
- Modifying existing code
- Need coding standards reference

**Use `kanban.md`** when:
- Managing tasks
- Tracking progress
- Coordinating multi-step features

**Use `testing-workflow.md`** when:
- Running tests
- Debugging test failures
- Adding new tests

**Use `deployment-workflow.md`** when:
- Deploying to production
- Creating releases
- Managing environments

**Use `documentation-management.md`** when:
- Creating documentation
- Updating docs
- Syncing code changes to docs

**Use `code-review-workflow.md`** when:
- Reviewing pull requests
- Checking code quality
- Ensuring standards compliance

---

## 🔧 Workflow Configuration

Workflows can be customized via `.claude/config/` (see `precedence.md` for details):

```json
{
  "workflows": {
    "testing": {
      "auto_run": true,
      "coverage_threshold": 80
    },
    "deployment": {
      "require_approval": true,
      "environments": ["staging", "production"]
    }
  }
}
```

---

## 📚 Related Documentation

- [Configuration Precedence](../config/precedence.md)
- [Development Rules](../rules/development-rules.md)
- [Orchestration Protocol](../rules/orchestration-protocol.md)
- [Agent Skills Spec](../skills/agent_skills_spec.md)

---

_Generated by Binh Pháp Framework | AgencyOS v3.0_
