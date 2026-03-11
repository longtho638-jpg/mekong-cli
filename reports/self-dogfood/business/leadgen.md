# Lead Generation — Mekong CLI

**Model:** Inbound-only, zero paid spend | **Target:** 500 trial signups by Jun 30, 2026

---

## Ideal Customer Profile (ICP)

**Primary ICP: The Automation-Hungry Solo Founder**

| Attribute | Description |
|-----------|-------------|
| Role | Solo founder or 1–3 person startup |
| Tools | Uses Cursor, Claude, ChatGPT daily |
| Pain | Spends 30%+ time on non-coding ops (writing, planning, admin) |
| Terminal comfort | 4–5 / 5 (runs npm, git, pip regularly) |
| Budget | $49–$149/mo for tools that save 5+ hrs/week |
| Where found | Twitter/X, IndieHackers, HN, r/SideProject |

**Secondary ICP: The Automation-Seeking Dev Lead**

| Attribute | Description |
|-----------|-------------|
| Role | Engineering lead at 5–20 person startup |
| Pain | Team spends time on repetitive business tasks |
| Terminal comfort | 5/5 |
| Budget | $149–$499/mo for team tooling |
| Where found | LinkedIn, HN, Dev.to |

---

## Lead Gen Channels

### Channel 1: GitHub (Organic)
**Mechanic:** Stars → visibility → installs → signups

| Action | Expected leads/mo |
|--------|-----------------|
| Show HN post | 50–200 one-time |
| Product Hunt launch | 30–100 one-time |
| GitHub trending (if starred enough) | 50–500 one-time |
| Ongoing organic from README | 10–30/mo |

### Channel 2: Content (Compounding)
**Mechanic:** Articles rank → developer finds article → visits GitHub → installs

| Source | Expected leads/mo (steady state) |
|--------|----------------------------------|
| Dev.to articles (12 published) | 30–80/mo |
| Hashnode articles | 20–50/mo |
| Twitter threads | 10–30/mo |

### Channel 3: Community Participation
**Mechanic:** Answer questions helpfully → mention Mekong CLI naturally

| Community | Approach | Expected leads/mo |
|-----------|----------|-----------------|
| r/SideProject | Share builds, answer questions | 5–20/mo |
| r/MachineLearning | Technical posts | 3–10/mo |
| IndieHackers | Milestone posts | 5–15/mo |
| HN comments | Helpful technical answers | 3–10/mo |
| Dev Discord servers | Lurk → help → mention | 5–20/mo |

---

## Lead Capture Funnel

```
Visitor discovers Mekong CLI (GitHub / article / community)
        ↓
Reads README → "Interesting — let me try it"
        ↓
pip install mekong-cli
        ↓
Runs first command (mekong cook "...")
        ↓
Hits free limit OR sees credit model → visits agencyos.network
        ↓
Signs up for Starter ($49) via Polar.sh
```

**Conversion bottleneck:** Install → first command run. Must be < 2 min from install to first output.

---

## Lead Nurture (Pre-Purchase)

No email drip possible without email capture. Current model: GitHub star → return visit.

**Improve with:**
- [ ] Email capture on docs site ("Get weekly AI automation tips")
- [ ] GitHub release notifications (star → watch → email on new release)
- [ ] Discord community (install → join → engage → upgrade)

---

## Founder-Led Sales (First 10 Customers)

For first 10 paying customers, do things that don't scale:
1. DM everyone who stars the repo and opens an issue
2. Offer free 30-min onboarding call
3. Ask for testimonial after first successful mission
4. Use their feedback to fix top 3 friction points

---

## Lead Quality Filter

**High quality signal:** Opens GitHub issue, asks technical question, stars + forks
**Low quality signal:** One-time visit, no install, bounced from README

Focus energy on high-quality leads. Don't chase traffic metrics.
