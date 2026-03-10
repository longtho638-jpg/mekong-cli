# IP & Patent — Intellectual Property Management

Manages the full IP lifecycle: prior art search, patent application workflow, portfolio tracking, licensing deal structuring, and IP valuation.

## When to Use
- Filing or managing patent applications (provisional, utility, PCT, design)
- Conducting prior art searches and freedom-to-operate (FTO) analysis
- Structuring IP licensing agreements (exclusive, non-exclusive, cross-license)
- Building IP portfolio strategy and valuation for M&A or fundraising

## Key Concepts
- **Patent Types**: Utility (20yr), Design (15yr), Provisional (12-month placeholder), PCT (international)
- **Filing Stages**: Invention Disclosure → Prior Art Search → Provisional → Utility Application → Examination → Grant
- **Prior Art Search**: USPTO, EPO Espacenet, Google Patents, WIPO PatentScope, non-patent literature
- **Claims Structure**: Independent claims (broadest scope), dependent claims, claim differentiation principle
- **FTO Analysis**: Identify blocking patents, assess design-around options, file IPR if needed
- **Licensing Terms**: Royalty rate (% net sales), upfront fee, milestone payments, exclusivity scope, sublicensing rights, field-of-use

## Implementation Patterns

```yaml
# IP portfolio tracker schema
patent:
  id: string                   # Internal ref e.g. IP-2024-001
  title: string
  inventors: string[]
  type: utility|design|provisional|pct
  status: disclosure|provisional|filed|examination|granted|abandoned
  filing_date: date
  priority_date: date          # Earliest provisional or foreign filing
  expiry_date: date
  jurisdictions: string[]      # US, EP, CN, JP, etc.
  licensing:
    status: unlicensed|licensed|for_sale
    licensees: string[]
    royalty_rate: number
  annuity_due_date: date       # Maintenance fee deadline
```

```python
# Prior art search query builder
def build_search_query(invention_keywords, ipc_classes):
    # IPC = International Patent Classification (e.g., G06F 40/30)
    keyword_block = " AND ".join(f'"{k}"' for k in invention_keywords)
    class_block = " OR ".join(ipc_classes)
    return f"({keyword_block}) AND ({class_block}) AND (pd:[2010 TO *])"

# Royalty valuation — 25% rule of thumb
def estimate_royalty(operating_profit_margin, industry_rate=0.25):
    return operating_profit_margin * industry_rate
```

```markdown
# Invention Disclosure Template
## Title: [Brief description]
## Problem Solved: [Technical problem addressed]
## Prior Solutions & Limitations: [What exists, why it falls short]
## Novel Approach: [Step-by-step description of invention]
## Preferred Embodiments: [Variations, best mode]
## Claims Draft (Informal): [Broadest claim + 2-3 narrower claims]
## Inventors & Contribution %: [Name, dept, % contribution]
## Disclosure Date: [YYYY-MM-DD — establishes prior art date]
```

## References
- USPTO Patent Full-Text: https://patents.google.com/
- WIPO PCT Guide: https://www.wipo.int/pct/en/guide/
- EPO Espacenet: https://worldwide.espacenet.com/
