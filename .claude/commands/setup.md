---
description: 🔧 Setup AgencyOS shell aliases for easy CLI access
argument-hint: 
---

## Mission

Set up shell aliases to make AgencyOS CLI accessible from anywhere.

## Quick Execute

```bash
# turbo
bash /Users/macbookprom1/mekong-cli/.claude/scripts/setup-aliases.sh && source ~/.zshrc
```

## What This Does

1. Adds `agencyos` alias to `~/.zshrc`
2. Adds `aos` shortcut
3. Adds `aos-test` and `aos-ship` helpers

## Aliases Created

| Alias | Command | Purpose |
|-------|---------|---------|
| `agencyos` | Full CLI | Main entry point |
| `aos` | Same as agencyos | Short version |
| `aos-test` | Run test_wow.py | Quick testing |
| `aos-ship` | Git commit + push | Quick deploy |

## After Setup

```bash
# Verify installation
agencyos help

# Start using
agencyos binh-phap "My idea"
agencyos cook "new feature"
agencyos test
agencyos ship
```

## Manual Alternative

If you prefer manual setup, add to `~/.zshrc`:

```bash
alias agencyos='cd /Users/macbookprom1/mekong-cli && PYTHONPATH=. python3 cli/main.py'
alias aos='agencyos'
```

Then run `source ~/.zshrc`

---

🔧 **One-time setup. Use forever.**
