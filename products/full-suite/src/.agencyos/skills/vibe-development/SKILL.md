---
name: vibe-development
description: Use when implementing features with VIBE development standards (YAGNI/KISS/DRY, 200-line limit, Vietnamese-first).
license: MIT
---

# VIBE Development Standards

Development guidelines for AntigravityKit projects following ClaudeKit patterns.

## When to Use

Use this skill when:
- Implementing new features
- Writing code in antigravity/ projects
- Following VIBE development workflow
- Need Vietnamese-first comments

## Core Principles

Always honor the trinity:
- **YAGNI**: You Aren't Gonna Need It
- **KISS**: Keep It Simple, Stupid
- **DRY**: Don't Repeat Yourself

## File Standards

| Rule | Standard |
|------|----------|
| File naming | kebab-case with descriptive names |
| Max lines | 200 lines per file |
| Splitting | Extract utilities, services, components |
| Composition | Prefer composition over inheritance |

## Code Quality

- Write clean, readable, maintainable code
- Follow established architectural patterns
- Handle edge cases and error scenarios
- Use try-catch error handling
- Cover security standards

## Vietnamese-First Comments

```python
# Tính toán doanh thu hàng tháng
def calculate_mrr(clients: list) -> float:
    """
    Tính MRR (Monthly Recurring Revenue).
    
    Args:
        clients: Danh sách khách hàng
    
    Returns:
        Tổng doanh thu hàng tháng
    """
    return sum(c.monthly_revenue for c in clients)
```

## Pre-Commit Rules

- Run linting before commit
- Run tests before push
- Keep commits focused
- Use conventional commit format
- **NEVER** commit API keys or credentials

## Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## References

- `./docs/development-rules.md` for project-specific rules
- `.claude/rules/development-rules.md` for ClaudeKit standards

---

🏯 **"Làm đúng từ đầu"** - Do it right from the start
