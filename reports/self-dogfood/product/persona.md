# User Personas — Mekong CLI

**Date:** March 2026 | **Method:** Hypothesis-driven (pre-customer, inferred from market research)

---

## Persona 1: Solo Founder "Minh"

**Title:** Technical co-founder / solo founder
**Age:** 28–38
**Location:** Southeast Asia, Eastern Europe, Latin America (price-sensitive markets with strong dev talent)

### Background
Minh has been a developer for 5+ years. Left a full-time job to build a SaaS product. Has no co-founder, no budget for agencies. Can code but gets stuck in the "do everything" trap — writes code Monday, does customer support Tuesday, writes marketing copy Wednesday.

### Goals
- Ship product faster without hiring
- Stop context-switching between code and business tasks
- Validate startup idea before running out of savings
- Look bigger than a 1-person team

### Frustrations
- Cursor helps with code but doesn't help write the pitch deck or plan the sprint
- Hiring freelancers for small tasks is slow and expensive
- ChatGPT gives generic advice, not executable plans
- Every AI tool requires him to do the actual work after the AI "helps"

### How Minh Uses Mekong
```bash
mekong plan "user auth with social login"      # Monday AM
mekong cook "implement the auth plan"          # Monday PM
mekong brainstorm "pricing models for B2B SaaS"  # Tuesday
mekong pitch "my idea in 5 slides"             # Wednesday
mekong deploy                                  # Thursday
```

### Willingness to Pay
- Currently pays for: Cursor ($20), GitHub Copilot ($10), ChatGPT Plus ($20) = $50/mo on AI
- Would swap all three for Mekong at $49/mo if it genuinely executes, not just suggests
- **Price sensitivity:** Medium. Will churn if MCU runs out before month-end.

### Key Message for Minh
"Stop switching between AI tools. One CLI that plans, executes, deploys — and runs your company strategy."

---

## Persona 2: Agency Owner "Sarah"

**Title:** Founder, digital agency (5–15 person team)
**Age:** 32–45
**Location:** US, UK, Australia (English-first markets)

### Background
Sarah runs a boutique digital agency delivering web apps, landing pages, and marketing automation for SMB clients. Revenue: $300K–$1M ARR. Margin is squeezed — developers are expensive, client scopes creep, same boilerplate gets rebuilt for every client.

### Goals
- Reduce time on repetitive client deliverables (auth, payments, CMS, CI/CD setup)
- Scale without proportional headcount growth
- Offer "AI-accelerated delivery" as a premium service
- Standardize quality across client projects

### Frustrations
- Rebuilding the same auth + payment integration for every client from scratch
- Junior developers spend 20% of time on boilerplate the AI could generate
- Clients don't understand why simple features take weeks
- Can't justify Devin's $500/dev/mo across a 10-dev team

### How Sarah Uses Mekong
```bash
# New client project kickoff:
mekong cook "Next.js app with auth, Stripe, and admin dashboard"
mekong deploy                         # Auto-provision CI/CD
mekong review                         # QA pass before client review
mekong sprint "Q2 deliverables list"  # Project planning

# Monthly ops:
mekong audit                          # Security report for client
mekong status                         # Health check across all projects
```

### Willingness to Pay
- Would pay Pro ($149) for her own use
- Would pay Enterprise ($499) if white-label available for client-facing ops
- **Price sensitivity:** Low if ROI is clear. If Mekong saves 4 hours/week per developer, it pays for itself in minutes.
- Will require onboarding call before signing Enterprise

### Key Message for Sarah
"White-label AI execution for your agency. Your brand, your clients, your profit margin."

---

## Persona 3: Dev Team Lead "Alex"

**Title:** Senior developer / tech lead at a startup (Series A/B)
**Age:** 30–42
**Location:** US, Europe, Singapore

### Background
Alex leads a 5–20 person engineering team. Has Cursor for code completion. Has GitHub Actions for CI/CD. But the team still does a lot of manual orchestration — sprint planning, code reviews, architecture decisions, deployment coordination. Alex wants to automate the "meta-work" of running an engineering team.

### Goals
- Automate recurring engineering ceremonies (PR reviews, dependency audits, performance reports)
- Generate architecture documentation automatically
- Reduce time on boilerplate tasks so senior devs focus on hard problems
- Evaluate AI tools for the team without introducing security risk (prefers local LLM option)

### Frustrations
- Cursor is great for individual developers but doesn't help with team-level workflows
- AI-generated code reviews from GitHub Copilot are shallow
- Doesn't want to give OpenAI/Anthropic access to proprietary codebase
- Most AI tools require individual accounts, not team usage

### How Alex Uses Mekong
```bash
# Weekly ops:
mekong review src/             # Full codebase review pass
mekong audit                   # Security + dependency audit
mekong health                  # Infrastructure status report

# Architecture work:
mekong arch "design a caching layer for our API"
mekong plan "migrate from REST to GraphQL"

# Using local LLM (security-conscious):
export OLLAMA_BASE_URL=http://localhost:11434/v1
export LLM_MODEL=qwen2.5-coder
mekong cook "refactor auth module"   # Zero data leaves company network
```

### Willingness to Pay
- Pro tier ($149) for personal/team use
- Would push for team plan if available (5 seats at $599/mo)
- **Price sensitivity:** Medium-low. Decision is company budget, not personal spend.
- Needs security documentation before procurement approval

### Key Message for Alex
"The only AI execution layer that works fully on-premise. Run it on your local LLM, keep your code in your network."

---

## Persona Comparison

| Dimension | Minh (Solo Founder) | Sarah (Agency) | Alex (Dev Lead) |
|-----------|--------------------|--------------|-----------------|
| Primary value | Do more with no team | Scale without headcount | Automate team meta-work |
| Tier likely | Starter ($49) | Enterprise ($499) | Pro ($149) / Team |
| LLM preference | OpenRouter / cheap cloud | Cloud (quality matters) | Local / on-prem |
| Decision speed | Fast (self-serve) | Slow (needs demo) | Medium (needs security review) |
| Churn risk | High (budget-sensitive) | Low (agency economics) | Medium (company renewal) |
| Support need | Low (self-serve) | High (onboarding) | Medium (documentation) |

---

## Implications for Product

1. **Minh** drives self-serve design — onboarding must work without human help
2. **Sarah** drives white-label API and agency pricing (Q3 roadmap)
3. **Alex** drives local LLM reliability and security documentation
4. All three benefit from the 5-layer cascade — but entry point differs (Engineer layer for Minh/Alex, Business layer for Sarah)

---

## Acquisition Channel by Persona

| Persona | Channel | Message |
|---------|---------|---------|
| Minh | Indie Hackers, Product Hunt, X/Twitter | "Replace your entire AI tool stack with one CLI" |
| Sarah | Agency communities, LinkedIn, cold email | "White-label AI execution for digital agencies" |
| Alex | Hacker News, r/programming, dev conferences | "Autonomous engineering workflows, runs on your LLM" |
