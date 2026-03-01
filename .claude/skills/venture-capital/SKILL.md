# Venture Capital — Deal Flow & Fund Management

VC operations skill covering deal flow pipeline, cap table management, term sheet generation, due diligence automation, and fund reporting.

## When to Use
- Managing VC deal pipeline from sourcing to close
- Generating or reviewing term sheets, SAFEs, convertible notes
- Building cap table models and dilution scenarios
- Automating LP reporting and portfolio performance tracking

## Key Concepts
- **Deal Flow Stages**: Sourcing → Screening → Diligence → IC Memo → Term Sheet → Close → Portfolio
- **Cap Table**: Pre/post-money ownership, option pool, anti-dilution (broad-based WA vs. full ratchet)
- **Term Sheet**: Valuation cap, discount rate, pro-rata rights, information rights, board seats, liquidation preference
- **SAFE/Convertible Note**: MFN clause, conversion triggers, maturity, interest accrual
- **Portfolio KPIs**: IRR, TVPI, DPI, RVPI, MOIC per company and fund-level
- **Due Diligence Checklist**: Legal (cap table, IP, contracts), Financial (unit economics, burn, runway), Team, Market TAM/SAM/SOM

## Implementation Patterns

```python
# Cap table dilution calculator
def post_money_ownership(pre_shares, new_shares, option_pool_pct):
    total = pre_shares + new_shares + (option_pool_pct * (pre_shares + new_shares))
    return {
        "founders": pre_shares / total,
        "investors": new_shares / total,
        "option_pool": (option_pool_pct * (pre_shares + new_shares)) / total
    }
```

```yaml
# Deal pipeline schema
deal:
  company: string
  stage: sourcing|screening|diligence|ic_memo|term_sheet|closed|passed
  check_size: number
  valuation_cap: number
  lead_partner: string
  next_action_date: date
  diligence_items: string[]   # IP, legal, financial, reference checks
```

```markdown
# IC Memo Template
## Company: [Name] | Round: [Seed/Series A] | Ask: $[X]M
### Thesis Fit — why this? why now? why us?
### Market: TAM $[X]B, SAM $[Y]M, why winner-take-most?
### Team: [backgrounds, prior exits, domain depth]
### Financials: MRR $[X], burn $[Y]/mo, runway [Z] months
### Risks & Mitigations: [top 3 risks]
### Terms: $[X]M at $[Y]M cap, [Z]% pro-rata, [board/observer]
### Recommendation: INVEST / PASS
```

## References
- NVCA Model Legal Documents: https://nvca.org/model-legal-documents/
- Carta Cap Table Standards: https://carta.com/learn/
- YC SAFE Standard: https://www.ycombinator.com/documents/
