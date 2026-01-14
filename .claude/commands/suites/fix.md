---
description: 🐛 Fix Suite - Bug fixing commands
argument-hint: [:fast|:hard|:ci|:test|:ui|:types]
---

## Mission

Unified bug fixing command hub.

## Subcommands

| Command | Description | Agent |
|---------|-------------|-------|
| `/fix:fast` | Quick fix | `debugger` |
| `/fix:hard` | Deep analysis | `debugger` |
| `/fix:ci` | Fix CI failures | `debugger` |
| `/fix:test` | Fix failing tests | `tester` |
| `/fix:ui` | Fix UI issues | `ui-ux-designer` |
| `/fix:types` | Fix TypeScript | `fullstack-developer` |

## Quick Examples

```bash
/fix                  # Smart fix (auto-select)
/fix:fast login       # Quick fix login
/fix:hard auth        # Deep analysis
/fix:ci               # Fix CI failures
```

---

🐛 **One suite. All fix operations.**
