# 🎮 Command Reference

> All commands you need. No prompts required.
> IDE-friendly for AgencyEr

---

## Quick Reference Card

```
╔════════════════════════════════════════════════════════════╗
║  🧪 TESTING                                                ║
╠════════════════════════════════════════════════════════════╣
║  /test              Run all tests                          ║
║  /test:wow          AntigravityKit WOW tests               ║
║  /test:quick        Fast smoke test                        ║
║  /test:coverage     Generate coverage report               ║
╠════════════════════════════════════════════════════════════╣
║  🍳 DEVELOPMENT                                            ║
╠════════════════════════════════════════════════════════════╣
║  /cook              Start dev server                       ║
║  /cook:fast         Fast mode (no type check)              ║
║  /cook:backend      Python backend only                    ║
║  /cook:frontend     Next.js frontend only                  ║
║  /cook:browser      Open browser automatically             ║
╠════════════════════════════════════════════════════════════╣
║  🚀 DEPLOYMENT                                             ║
╠════════════════════════════════════════════════════════════╣
║  /ship "msg"        Commit + Push + Deploy                 ║
║  /ship:commit       Just commit (no push)                  ║
║  /ship:staging      Deploy to staging                      ║
║  /ship:prod         Deploy to production                   ║
║  /ship:quick        Emergency hotfix (skip tests)          ║
╠════════════════════════════════════════════════════════════╣
║  🔄 SYNC                                                   ║
╠════════════════════════════════════════════════════════════╣
║  /antigravity-sync  Sync with AntigravityKit               ║
║  /version           Check all versions                     ║
╠════════════════════════════════════════════════════════════╣
║  📊 ANALYTICS                                              ║
╠════════════════════════════════════════════════════════════╣
║  /vc:metrics        Show VC readiness                      ║
║  /franchise:stats   Franchise network stats                ║
║  /content:generate  Generate 30 content ideas              ║
╚════════════════════════════════════════════════════════════╝
```

---

## Detailed Commands

### /test - Run Tests
```bash
# Run all tests
/test

# Run WOW test suite (AntigravityKit modules)
/test:wow

# Quick smoke test
/test:quick

# With coverage
/test:coverage
```

### /cook - Development
```bash
# Full development mode
/cook
# Starts: Backend :8000, Frontend :3000

# Fast mode (skip type checking)
/cook:fast

# Backend only
/cook:backend

# Frontend only
/cook:frontend
```

### /ship - Deploy
```bash
# Full deploy (commit + push + deploy)
/ship "feat: new feature"

# Just commit
/ship:commit "fix: bug fix"

# To staging first
/ship:staging

# To production
/ship:prod

# Emergency (skip tests)
/ship:quick "hotfix: urgent"
```

### /antigravity-sync - Sync
```bash
# Sync with latest AntigravityKit
/antigravity-sync

# Check versions
/version
```

---

## Commit Message Format

```
<type>: <description>

Types:
├── feat     New feature
├── fix      Bug fix
├── docs     Documentation
├── style    Formatting
├── refactor Code restructure
├── test     Adding tests
└── chore    Maintenance
```

### Examples
```bash
/ship "feat: add VCMetrics dashboard"
/ship "fix: resolve royalty calculation"
/ship "docs: update README"
```

---

## Daily Workflow

```
Morning:
  /test:wow              # Check everything works

Development:
  /cook                  # Start coding
  /test:quick            # Quick tests during dev

End of Day:
  /test                  # Full test suite
  /ship "feat: today's work"  # Deploy
```

---

🏯 **Dễ như ăn kẹo** - Easy as candy!
