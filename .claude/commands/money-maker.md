---
description: 💰 Generate quotes and manage revenue pipeline
argument-hint: [quote|status|autopilot] [client]
---

## Mission

Revenue autopilot using the Money Maker Agent for quote generation, lead qualification, and pipeline management.

## Subcommands

### `/money-maker quote <client> <tier>`

Generate a quote with Binh Pháp pricing.

**Arguments:**
- `client`: Client company name
- `tier`: warrior | general | tuong_quan

**Example:**
```
/money-maker quote "ABC Corp" warrior
```

### `/money-maker status`

View current pipeline and stats.

### `/money-maker autopilot`

Enable auto-qualification mode.

## Workflow

1. **Parse Arguments** - Extract client and tier
2. **Invoke Agent** - Use `money-maker` agent
3. **Execute Python**

```bash
# turbo
python -c "
from antigravity.core.money_maker import MoneyMaker, ServiceTier

mm = MoneyMaker()

# Show pricing menu
print(mm.get_pricing_menu())

# Generate sample quote
quote = mm.generate_quote('$CLIENT', [1, 3, 5], ServiceTier.${TIER})
print(mm.format_quote(quote))

# Validate WIN-WIN-WIN
win3 = mm.validate_win3(quote)
print(f'\\n✅ WIN-WIN-WIN: {\"VALID\" if win3.is_valid else \"INVALID\"} ({win3.alignment_score}/100)')
"
```

4. **Output** - Display formatted quote with WIN-WIN-WIN validation

## Output Format

```
╔═══════════════════════════════════════════════════════════╗
║  🏯 BINH PHÁP 13-CHAPTER PRICING MENU                     ║
╠═══════════════════════════════════════════════════════════╣
║   1️⃣ Kế Hoạch   │ Strategy Assessment      │     $5,000 ║
║   3️⃣ Mưu Công   │ Win-Without-Fighting     │     $8,000 ║
║   5️⃣ Thế Trận   │ Growth Consulting        │  $5,000/mo ║
╚═══════════════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════════╗
║  📜 QUOTE #0001                                           ║
║  Client: ABC Corp                                         ║
║  Tier: WARRIOR                                            ║
╠═══════════════════════════════════════════════════════════╣
║  PROJECT TOTAL:                               $13,000     ║
║  RECURRING MONTHLY:                            $7,000     ║
║  EQUITY:                                         6.5%     ║
╠═══════════════════════════════════════════════════════════╣
║  WIN-WIN-WIN ALIGNMENT:                     ✅ VALID     ║
║  Score: 95/100                                            ║
╚═══════════════════════════════════════════════════════════╝
```

---

💰 **"Kiếm tiền dễ như ăn kẹo"** - Making money as easy as eating candy
