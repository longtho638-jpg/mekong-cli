---
title: "VIBE Development Rules"
priority: P1
tags: [development, vibe, standards]
agents: [*]
---

# VIBE Development Rules

> **VIBE-specific rules extending ClaudeKit development standards**
> Tiêu chuẩn Antigravity IDE 2026

---

## Core Principles

**ALWAYS** honor:
- **YAGNI** - You Aren't Gonna Need It
- **KISS** - Keep It Simple, Stupid
- **DRY** - Don't Repeat Yourself
- **WIN-WIN-WIN** - All parties must benefit

---

## File Management

| Rule | Standard |
|------|----------|
| Naming | kebab-case with descriptive names |
| Max lines | 200 lines per file |
| Splitting | Extract utilities into separate modules |
| Comments | Vietnamese-first with English translations |

---

## 6-Step Workflow Compliance

Every implementation MUST follow:

1. **Plan Detection** → Find/select plan
2. **Analysis** → Extract tasks, map dependencies
3. **Implementation** → Execute with YAGNI/KISS/DRY
4. **Testing** → 100% pass gate
5. **Code Review** → User approval blocking
6. **Finalize** → Update docs, commit

---

## Blocking Gates

### Testing Gate
- ALL tests must pass
- No mocks for core business logic
- No fake data to pass tests
- No commented-out tests

### Code Review Gate
- User must explicitly approve
- Critical issues must be fixed
- Score should be ≥7/10

---

## Agent Delegation

### When to Delegate

| Task | Agent |
|------|-------|
| Planning | `planner` |
| Research | `researcher` |
| Testing | `tester` |
| Debugging | `debugger` |
| Code review | `code-reviewer` |
| Documentation | `docs-manager` |
| UI work | `ui-ux-designer` |

### Orchestration Patterns

**Sequential** (for dependent tasks):
```
Planning → Implementation → Testing → Review
```

**Parallel** (for independent tasks):
```
Code + Tests + Docs (non-conflicting components)
```

---

## Binh Pháp Integration

Before major decisions, validate:

```
┌───────────────────────────────────────────────────┐
│  👑 ANH (Owner) WIN gì?                           │
│  🏢 AGENCY WIN gì?                                │
│  🚀 STARTUP/CLIENT WIN gì?                        │
│                                                   │
│  ❌ If any party LOSES → STOP                    │
│  ✅ All 3 WIN → PROCEED                          │
└───────────────────────────────────────────────────┘
```

---

## Commit Standards

Format: `<type>(<scope>): <description>`

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**NEVER commit:**
- API keys
- Credentials
- .env files
- Private data

---

## Documentation

Update docs after every implementation:
- `/docs` directory for project docs
- `README.md` for getting started
- Inline comments for complex logic

---

🏯 **"Làm đúng từ đầu, đỡ sửa về sau"**
*Do it right from the start, save fixing later*
