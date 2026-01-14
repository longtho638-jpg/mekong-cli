---
description: 📝 Generate professional proposals with Binh Pháp structure
argument-hint: <client> [--tier=warrior|general|tuong_quan]
---

## Mission

Generate professional proposals using the Proposal Generator with Binh Pháp 13-chapter structure and WIN-WIN-WIN alignment verification.

## Usage

```
/proposal "Client Name" --tier=warrior
/proposal "Client Name" --chapters=1,3,5,7
```

## Arguments

| Argument | Description | Default |
|----------|-------------|---------|
| `client` | Client company name | Required |
| `--tier` | Service tier | warrior |
| `--chapters` | Chapter IDs (1-13) | 1,3,5 |
| `--contact` | Contact person name | CEO |

## Workflow

1. **Parse Arguments** - Extract client, tier, chapters
2. **Show Chapter Menu** - Display available services
3. **Generate Quote** - Create quote with Money Maker
4. **Generate Proposal** - Build full Markdown proposal
5. **Validate WIN-WIN-WIN** - Verify alignment
6. **Save Output** - Write proposal file

## Execute

```bash
# turbo
python -c "
from antigravity.core.proposal_generator import ProposalGenerator
from antigravity.core.money_maker import MoneyMaker, ServiceTier

# Show chapter menu
pg = ProposalGenerator()
print(pg.get_chapter_menu())

# Generate proposal
mm = MoneyMaker()
quote = mm.generate_quote('$CLIENT', [1, 3, 5], ServiceTier.WARRIOR)
proposal = pg.generate_proposal(quote, 'CEO')

# Save to file
filepath = pg.save_proposal(proposal)
print(f'\\n✅ Proposal saved to: {filepath}')
print(f'\\n--- Preview (first 500 chars) ---\\n')
print(proposal.markdown_content[:500])
"
```

## Output

Full Markdown proposal file with:
- Executive Summary
- Service Package (13-chapter based)
- Pricing Breakdown
- WIN-WIN-WIN Alignment section
- Terms & Timeline
- Next Steps

---

📝 **"Bất chiến nhi khuất nhân chi binh"** - Win without fighting
