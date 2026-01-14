---
description: 💰 Quick quote generator - no arguments needed
argument-hint: [client] [tier]
---

## Mission

Generate quotes instantly. No arguments = interactive wizard.

## Auto-Mode (No Arguments)

```
/quote
```

Launches wizard:
1. Ask for client name
2. Ask for tier (warrior/general/tuong_quan)
3. Show 13-chapter menu
4. Generate quote

## Direct Mode

```
/quote "ABC Corp" warrior
/quote "XYZ Ltd" general
```

## Workflow

```bash
# turbo
PYTHONPATH=. python3 -c "
from antigravity.core.money_maker import MoneyMaker, ServiceTier

mm = MoneyMaker()

# Show pricing menu
print(mm.get_pricing_menu())

# Generate quote with popular chapters
quote = mm.generate_quote('Demo Corp', [1, 3, 5], ServiceTier.WARRIOR)
print(mm.format_quote(quote))

# Validate
win3 = mm.validate_win3(quote)
print(f'✅ WIN-WIN-WIN: {win3.alignment_score}/100')
"
```

---

💰 **One command. Instant quote.**
