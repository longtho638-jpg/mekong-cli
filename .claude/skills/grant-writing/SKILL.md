# Grant Writing — Proposal Automation & Compliance

Automates grant proposal creation, tracks compliance requirements, manages budgets, and generates reporting templates for government, foundation, and corporate grants.

## When to Use
- Drafting or structuring grant proposals (SBIR, NIH, EU Horizon, foundation grants)
- Tracking grant compliance, deliverables, and reporting deadlines
- Building grant budget justifications and indirect cost calculations
- Managing multi-grant portfolios across funding sources

## Key Concepts
- **Grant Types**: Federal (SBIR/STTR, NSF, NIH), Foundation (private, community), Corporate (CSR), EU (Horizon Europe, EIC)
- **Proposal Sections**: Executive Summary, Problem Statement, Objectives, Methodology, Evaluation Plan, Budget, Sustainability
- **Compliance Tracking**: Allowable costs, matching requirements, reporting frequency, audit readiness (2 CFR 200)
- **Budget Categories**: Personnel (fringe rates), Consultants, Equipment, Travel, Indirect (F&A rate)
- **Reporting Cadence**: Progress reports (quarterly/semi-annual), Financial reports, Final report with outcomes
- **Evaluation Criteria**: Significance, Innovation, Approach, Investigator qualifications, Environment (NIH scoring rubric)

## Implementation Patterns

```yaml
# Grant tracking schema
grant:
  id: string
  funder: string
  program: string          # SBIR Phase I, NIH R01, etc.
  award_amount: number
  start_date: date
  end_date: date
  status: draft|submitted|awarded|active|closed|rejected
  compliance:
    reporting_schedule: quarterly|semi-annual|annual
    next_report_due: date
    matching_required: boolean
    matching_pct: number
  deliverables:
    - milestone: string
      due_date: date
      status: pending|complete
```

```python
# Budget builder with indirect cost
def calculate_budget(personnel, consultants, equipment, travel, indirect_rate):
    direct_costs = personnel + consultants + equipment + travel
    # F&A typically applied to Modified Total Direct Costs (MTDC)
    mtdc = direct_costs - equipment  # equipment often excluded
    indirect = mtdc * indirect_rate
    return {
        "direct_costs": direct_costs,
        "indirect_costs": indirect,
        "total": direct_costs + indirect
    }
```

```markdown
# Proposal Section Template: Specific Aims (NIH style)
## Problem: [1 sentence — what gap exists?]
## Significance: [why does solving this matter?]
## Innovation: [what is novel about our approach?]
## Aim 1: [verb + outcome] — Hypothesis: ...
## Aim 2: [verb + outcome] — Hypothesis: ...
## Expected Outcomes: [if successful, what changes?]
```

## References
- Grants.gov Applicant Resources: https://www.grants.gov/applicants/
- 2 CFR 200 Uniform Guidance: https://www.ecfr.gov/current/title-2/part-200
- NIH Peer Review Criteria: https://grants.nih.gov/grants/peer-review/criteria.htm
