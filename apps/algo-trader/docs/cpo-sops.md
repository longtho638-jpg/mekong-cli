# CPO SOPs — Standard Operating Procedures

> Chief Product Officer — Product roadmap, feature prioritization, releases, user feedback.
> "CTO = HOW to build. CPO = WHAT to build. CEO = WHY to build."

---

## Hierarchy

```
CEO SOPs              ← Tầm nhìn, portfolio, business model
    ↓
CPO SOPs (this file)  ← Product roadmap, features, releases
    ↓
CTO SOPs              ← Architecture, tech debt, performance
    ↓
CXO SOPs              ← User experience, onboarding, A2UI
```

**CPO KHÔNG code. CPO KHÔNG design UI. CPO QUYẾT ĐỊNH BUILD GÌ.**

---

## SOP-P00: CPO vs CTO vs CXO

```
CPO                     CTO                      CXO
──────────────────────────────────────────────────────────────
WHAT to build           HOW to build             HOW users feel
Feature priority        Architecture             UX quality
Product roadmap         Tech debt                Onboarding
Release planning        Performance              A2UI events
User feedback           Build pipeline           Friction points
Impact vs Effort        Code standards           CLI output
```

---

## SOP-P01: Product Roadmap Governance

**Ref:** `docs/project-roadmap.md`

### Roadmap Structure
```
Vision (1 year)
    ↓
Quarters (Q1-Q4)
    ↓
Milestones (monthly)
    ↓
Features (weekly sprints)
    ↓
Tasks (daily execution)
```

### Roadmap Review Cadence
| Level | Cadence | Attendees | Output |
|-------|---------|-----------|--------|
| Vision | Annually | CEO + CPO | Strategy doc |
| Quarter | Quarterly | C-Suite | OKRs |
| Milestone | Monthly | CPO + CTO + CXO | Sprint plan |
| Feature | Weekly | CPO + Dev | Task list |

### Roadmap Categories
| Category | % Allocation | Examples |
|----------|-------------|----------|
| Core Trading | 40% | New strategies, signals, execution |
| Safety & Risk | 25% | Circuit breakers, risk models |
| Stealth & Edge | 15% | Anti-detection, arb, speed |
| Platform & UX | 15% | CLI, reports, onboarding |
| Infra & Ops | 5% | CI/CD, monitoring, docs |

---

## SOP-P02: Feature Prioritization (ICE Framework)

### ICE Scoring
| Factor | Weight | Scale | Question |
|--------|--------|-------|----------|
| Impact | 40% | 1-10 | How much will this improve trading performance? |
| Confidence | 30% | 1-10 | How sure are we this will work? |
| Ease | 30% | 1-10 | How easy to implement? (10=trivial, 1=months) |

### ICE Score = (Impact×0.4 + Confidence×0.3 + Ease×0.3)

### Prioritization Matrix
| ICE Score | Priority | Action |
|-----------|----------|--------|
| 8-10 | 🔴 P0 — Do Now | Sprint immediately |
| 6-7.9 | 🟡 P1 — Next Sprint | Queue for next sprint |
| 4-5.9 | 🟢 P2 — Backlog | Add to backlog |
| <4 | ⚪ P3 — Maybe Later | Park for review |

### Feature Request Template
```
Feature: [name]
Requester: [CEO/Founder/User/CTO]
Problem: [what pain point]
Solution: [proposed approach]
ICE: Impact=X, Confidence=X, Ease=X → Score=X.X
Dependencies: [other features/modules needed]
Estimated effort: [hours/days]
```

---

## SOP-P03: Release Management

### Release Types
| Type | Cadence | Scope | Testing |
|------|---------|-------|---------|
| Patch | As needed | Bug fixes, security | Unit tests |
| Minor | Weekly | New features, improvements | Full test suite |
| Major | Monthly | Breaking changes, new modules | Full + manual QA |
| Emergency | ASAP | Critical bugs, exploits | Targeted tests |

### Release Checklist
1. [ ] All tests pass (1216+ tests)
2. [ ] No new `any` types or `@ts-ignore`
3. [ ] No `console.log` in production code
4. [ ] Performance benchmarks pass
5. [ ] Documentation updated
6. [ ] Changelog entry added
7. [ ] Version bumped
8. [ ] CI/CD GREEN
9. [ ] Production HTTP 200

### Changelog Format
```markdown
## [version] — YYYY-MM-DD

### Added
- Feature description

### Changed
- Improvement description

### Fixed
- Bug fix description

### Security
- Security update description
```

---

## SOP-P04: User Feedback Loop

### Feedback Sources
| Source | Channel | Frequency |
|--------|---------|-----------|
| GitHub Issues | `github.com/repo/issues` | Continuous |
| Discord community | `#feedback` channel | Daily |
| CLI telemetry | Error reports, usage stats | Automated |
| Internal dogfooding | Team using own product | Daily |
| Backtest results | Strategy performance data | Per run |

### Feedback → Feature Pipeline
```
1. COLLECT — Gather from all sources
2. CATEGORIZE — Bug / Feature / Improvement / Question
3. DEDUPLICATE — Merge similar requests
4. SCORE — Apply ICE framework (SOP-P02)
5. PRIORITIZE — Rank in backlog
6. SCHEDULE — Assign to sprint
7. BUILD — CTO team implements
8. SHIP — Release per SOP-P03
9. CLOSE LOOP — Notify requester
```

---

## SOP-P05: Product Metrics

### North Star Metrics
| Metric | Definition | Target |
|--------|-----------|--------|
| Active strategies | Strategies generating signals daily | ≥4 |
| Win rate | % profitable trades | >55% |
| Uptime | System availability | >99% |
| Time to first trade | New user → first backtest | <15 min |
| Monthly active users | Users running bot monthly | Growth |

### Feature Success Criteria
| Criteria | Measurement |
|----------|------------|
| Adoption | >50% of users use feature within 30 days |
| Retention | Feature usage sustained after 90 days |
| Performance | No regression in trading metrics |
| Satisfaction | Positive feedback / no complaints |

---

## SOP-P06: CPO Checklist

### Daily
- [ ] Review new GitHub issues/feedback
- [ ] Check feature pipeline status
- [ ] Monitor product metrics dashboard

### Weekly
- [ ] Feature prioritization review (ICE scoring)
- [ ] Sprint planning with CTO
- [ ] Update roadmap progress

### Monthly
- [ ] Release planning (major/minor)
- [ ] Product metrics review
- [ ] User feedback synthesis
- [ ] Report to CEO: product health, roadmap progress

### Quarterly
- [ ] Roadmap revision with CEO
- [ ] Feature retrospective (shipped vs impact)
- [ ] Competitive product analysis
- [ ] OKR review and reset
