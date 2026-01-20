---
description: Run React component audit with best practices
---

# /code/review - React Best Practices Audit

> **Vercel Agent Skills** - 40+ React optimization rules

## Quick Audit

// turbo

```bash
# Audit dashboard components
python3 scripts/vibeos/security_armor.py

# Full security armor check
python3 scripts/vibeos/security_armor.py --ruff
python3 scripts/vibeos/security_armor.py --typescript
python3 scripts/vibeos/security_armor.py --pytest
```

## React Best Practices Checks

| Category          | Checks                                       |
| ----------------- | -------------------------------------------- |
| **Performance**   | Virtualization, layout thrashing, preconnect |
| **Accessibility** | aria-labels, semantic HTML                   |
| **Forms**         | Autocomplete, validation, error handling     |
| **Media**         | Image sizes, lazy loading, alt text          |
| **UX**            | Dark mode, i18n, touch patterns              |

## Example Usage

When reviewing a React component, the Agent will:

1. Analyze for 40+ performance rules
2. Check accessibility (WCAG)
3. Suggest refactoring patterns
4. Flag anti-patterns

## Integration

This command integrates with:

- `security_armor.py` - Pre-deploy gates
- `vercel-labs/agent-skills` - React best practices skill

## 🏯 Binh Pháp

> "Phòng mà không sơ hở" - Defense without gaps.
