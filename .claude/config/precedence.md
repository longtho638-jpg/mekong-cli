# Configuration Precedence Rules

**Last Updated:** 2026-01-19
**Status:** Active
**Owner:** Infrastructure Team

---

## 🎯 Overview

This document defines the configuration hierarchy for Claude Code / AgencyOS to resolve conflicts between project-specific and global settings.

---

## 📊 Precedence Hierarchy (Highest → Lowest)

```
┌─────────────────────────────────────────────────────┐
│ 1. .claude/config/ (Project Overrides)             │ ← HIGHEST
├─────────────────────────────────────────────────────┤
│ 2. .claude/rules/ (Project Defaults)                │
├─────────────────────────────────────────────────────┤
│ 3. $HOME/.claude/workflows/ (Global Defaults)       │
├─────────────────────────────────────────────────────┤
│ 4. Built-in Defaults (System)                       │ ← LOWEST
└─────────────────────────────────────────────────────┘
```

### Precedence Logic

1. **Project Overrides** (`.claude/config/`)
   - Highest priority
   - Used for project-specific customizations
   - Overrides ALL lower levels
   - Example: Custom agent behavior for this specific project

2. **Project Defaults** (`.claude/rules/`)
   - Project-wide rules
   - Applies to all agents/commands in this project
   - Can be overridden by `.claude/config/`
   - Example: `development-rules.md`, `orchestration-protocol.md`

3. **Global Defaults** (`$HOME/.claude/workflows/`)
   - User-wide settings across ALL projects
   - Applies when no project-specific config exists
   - Example: Personal coding style preferences

4. **Built-in Defaults**
   - System defaults from Claude Code
   - Only used when no custom config exists

---

## 🔍 Resolution Algorithm

When Claude loads configuration:

```python
def resolve_config(key: str) -> Any:
    # 1. Check project overrides
    if exists(f".claude/config/{key}"):
        return load(f".claude/config/{key}")

    # 2. Check project rules
    if exists(f".claude/rules/{key}"):
        return load(f".claude/rules/{key}")

    # 3. Check global workflows
    if exists(f"$HOME/.claude/workflows/{key}"):
        return load(f"$HOME/.claude/workflows/{key}")

    # 4. Use built-in default
    return BUILTIN_DEFAULTS[key]
```

---

## 📁 Directory Purposes

### `.claude/config/` - Project Overrides
**When to Use:**
- Override global settings for THIS project only
- Project-specific agent configurations
- Custom validation rules

**Examples:**
- `agent-overrides.json` - Custom agent behavior
- `precedence.md` - This file
- `schema.json` - Config validation schema

### `.claude/rules/` - Project Defaults
**When to Use:**
- Define project-wide standards
- Team collaboration rules
- Default behavior for all agents

**Examples:**
- `development-rules.md` - Coding standards
- `orchestration-protocol.md` - Agent coordination
- `documentation-management.md` - Docs workflow

### `$HOME/.claude/workflows/` - Global Defaults
**When to Use:**
- Personal preferences across ALL projects
- Reusable workflows
- Default templates

**Examples:**
- `primary-workflow.md` - Personal workflow template
- `testing-workflow.md` - Testing approach

---

## ⚠️ Common Pitfalls

### Pitfall 1: Conflicting Rules
**Problem:**
- `.claude/rules/development-rules.md` says "use tabs"
- `$HOME/.claude/workflows/primary-workflow.md` says "use spaces"

**Resolution:**
- Project rules (`.claude/rules/`) WIN
- Global workflows are ignored for this setting

### Pitfall 2: Unexpected Overrides
**Problem:**
- Changed `.claude/config/agent-overrides.json`
- Agent behavior didn't change

**Debug:**
```bash
# Verify file exists and is valid JSON
cat .claude/config/agent-overrides.json | jq .

# Check if there's a higher priority config
ls -la .claude/config/
```

### Pitfall 3: Missing Inheritance
**Problem:**
- Expected global workflow to apply
- But project rules blocked it

**Resolution:**
- Use `.claude/config/` to explicitly inherit global settings
- Example: `source: $HOME/.claude/workflows/testing-workflow.md`

---

## 🛠️ Validation

### Manual Validation
```bash
# Check for conflicting configs
.claude/config/validate.py

# View effective configuration
.claude/config/show-effective-config.sh
```

### Automated Validation
- Runs on every command execution
- Warns about conflicting settings
- Suggests resolution path

---

## 📖 Examples

### Example 1: Override Agent Model

**Global Default** (`$HOME/.claude/workflows/primary-workflow.md`):
```markdown
Default model: claude-sonnet-4
```

**Project Override** (`.claude/config/agent-overrides.json`):
```json
{
  "scout": {
    "model": "haiku"
  }
}
```

**Result:** Scout agent uses `haiku` in this project, but `claude-sonnet-4` in other projects.

### Example 2: Project-Specific Rules

**Project Rules** (`.claude/rules/development-rules.md`):
```markdown
- Use TypeScript strict mode
- Max line length: 100
- Use Biome for linting
```

**Global Workflow** (`$HOME/.claude/workflows/primary-workflow.md`):
```markdown
- Max line length: 80
- Use ESLint
```

**Result:** This project uses 100-char lines + Biome. Other projects use 80-char + ESLint.

### Example 3: Inherit + Override

**Project Config** (`.claude/config/testing.json`):
```json
{
  "inherit": "$HOME/.claude/workflows/testing-workflow.md",
  "overrides": {
    "test_timeout": 60000
  }
}
```

**Result:** Inherits global testing workflow but increases timeout to 60s.

---

## 🔒 Security Considerations

### Access Control
- `.claude/config/` is project-specific (committed to repo)
- `$HOME/.claude/workflows/` is user-specific (NOT committed)
- Sensitive data should ONLY be in `$HOME/.claude/`

### Validation
- All configs are validated against schema
- Invalid configs are rejected with clear error messages
- No silent failures

---

## 📚 Related Documentation

- [Development Rules](../rules/development-rules.md)
- [Orchestration Protocol](../rules/orchestration-protocol.md)
- [Agent Skills Spec](../skills/agent_skills_spec.md)

---

## ✅ Checklist: When to Use Each Level

**Use `.claude/config/`** when:
- [ ] Overriding project rules for specific edge cases
- [ ] Testing new agent configurations
- [ ] Debugging configuration issues

**Use `.claude/rules/`** when:
- [ ] Defining team standards
- [ ] Setting project-wide defaults
- [ ] Documenting coding conventions

**Use `$HOME/.claude/workflows/`** when:
- [ ] Creating personal templates
- [ ] Defining cross-project preferences
- [ ] Storing reusable workflows

---

_Generated by Binh Pháp Framework | AgencyOS v3.0_
