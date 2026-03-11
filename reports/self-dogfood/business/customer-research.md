# Customer Research — Ideal Customer Profile
*Mekong CLI v5.0 | March 2026*

## ICP Summary

**Primary ICP:** Technical founder or senior dev at a 1–10 person company who:
- Is comfortable in terminal
- Runs multiple SaaS tools that don't talk to each other
- Has tried LLM APIs but found raw prompting insufficient for business workflows
- Values automation over UI — prefers `mekong cook` over clicking dashboards

---

## ICP Profiles

### ICP-1: Solo Technical Founder (Highest Volume)

| Attribute | Detail |
|-----------|--------|
| Role | CTO-of-one, indie hacker, bootstrapped founder |
| Company size | 1 person |
| Tech comfort | High (writes code daily) |
| Pain | Wears 8 hats, repeatable tasks eat 40% of time |
| Budget | $49–$149/mo without approval needed |
| Decision speed | Same day |
| Discovery | Twitter/X, HN, GitHub trending |
| Win condition | Show them `mekong annual` → OKR plan in 3 minutes |

**Quote archetype:** "I'm the CEO, dev, marketer, and support agent. I need to automate the boring stuff so I can focus on product."

---

### ICP-2: Dev Agency Owner (Highest ARPU)

| Attribute | Detail |
|-----------|--------|
| Role | Agency owner/CTO, 2–10 team members |
| Company size | 2–15 |
| Tech comfort | High |
| Pain | Context switching between client projects, billing ops, sprint tracking |
| Budget | $149–$499/mo, expense reimbursable |
| Decision speed | 1–2 weeks (needs team buy-in) |
| Discovery | LinkedIn, dev conferences, word of mouth |
| Win condition | ROI story: "Saved 10 hrs/week × $150/hr = $6K/mo saved" |

**Quote archetype:** "We use 12 different tools across clients. I want one CLI that handles all of it."

---

### ICP-3: OSS Contributor / Power User (Lowest ARPU, High Advocacy)

| Attribute | Detail |
|-----------|--------|
| Role | Senior engineer, open source maintainer |
| Company size | Any (personal project) |
| Tech comfort | Very high |
| Pain | Wants to automate project management, release workflows, contributor ops |
| Budget | $0 (self-host) or $49/mo |
| Decision speed | Immediate (self-serve) |
| Discovery | GitHub, Dev.to, HN |
| Win condition | Good first issues, CONTRIBUTING.md, real code quality |

**Value:** Not revenue-primary — drives GitHub stars, organic referrals, and ecosystem integrations.

---

### ICP-4: Platform Builder (Enterprise, Lowest Volume)

| Attribute | Detail |
|-----------|--------|
| Role | VP Engineering, Head of Platform, CTO |
| Company size | 50–500 |
| Tech comfort | High, delegates execution |
| Pain | Internal tooling fragmentation, LLM integration without vendor lock-in |
| Budget | $499–$2K/mo, procurement process |
| Decision speed | 1–3 months (security review, legal) |
| Discovery | Industry reports, analyst recommendations, LinkedIn |
| Win condition | Security scan results, SOC2 roadmap, SLA, dedicated support |

---

## Customer Jobs-to-Be-Done

| Job | Frequency | Mekong Solution |
|-----|-----------|-----------------|
| Plan quarterly OKRs | Quarterly | `mekong okr` |
| Run daily dev sprints | Daily | `mekong sprint` |
| Write and ship blog posts | Weekly | `mekong content` |
| Review code before merge | Per PR | `mekong review` |
| Generate financial reports | Monthly | `mekong finance` |
| Onboard new team members | Per hire | `mekong hr` |
| Deploy new features | Per sprint | `mekong deploy` |

---

## Anti-ICPs (Do Not Target)

| Segment | Why Not |
|---------|---------|
| Non-technical managers | Can't use CLI, need GUI |
| Enterprise with strict procurement (>500 staff) | 6-month sales cycle, not worth it at current stage |
| Consumers (B2C) | Wrong price point, wrong value prop |
| LLM researchers | Want raw API access, not orchestration |

---

## Key Insights

1. **Terminal comfort is the primary qualifier** — anyone who says "I use Zsh with plugins" is a potential user
2. **The buy decision is emotional as much as rational** — they want to feel like they have a CTO-level system even as a solo founder
3. **Show, don't tell** — live demos convert 3x better than landing page copy
4. **Open source is a trust signal**, not a revenue blocker — ICP-1 and ICP-3 trust OSS more than SaaS black boxes
5. **289 commands is a marketing number, not a UX number** — lead with 5 hero workflows in demos
