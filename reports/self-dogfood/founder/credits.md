# Startup Credit Programs — Mekong CLI

**Goal:** Maximize free infrastructure credits to extend zero-cost runway
**Updated:** March 2026

---

## Priority Applications

| Provider | Program | Credits | Status | Apply At |
|----------|---------|---------|--------|----------|
| AWS Activate | Startup tier | $5,000–$25,000 | Not applied | aws.amazon.com/activate |
| Google Cloud | Startup program | $2,000–$200,000 | Not applied | cloud.google.com/startup |
| Cloudflare | Already on free | Workers/Pages free | Active | — |
| Vercel | OSS sponsorship | Pro plan free | Not applied | vercel.com/oss |
| OpenRouter | — | No credit program | N/A | — |
| Anthropic | API credits for startups | $500–$5,000 | Not applied | console.anthropic.com |
| Fly.io | OSS free tier | $10/mo free | Partial | fly.io/docs/about/open-source |
| Supabase | OSS plan | Pro plan free | Not applied | supabase.com/oss |
| GitHub | Open Source | Actions minutes free | Active | — |
| Stripe Atlas | Incorporation | $500 AWS + perks | Not applied | stripe.com/atlas |

---

## High-Value Targets

### AWS Activate ($5K–$25K)
- Requires: Incorporated company OR accelerator affiliation
- Best path: Apply after Delaware C-Corp formed
- Use for: EC2 if we ever need dedicated compute, S3 for assets
- **Priority:** Medium (CF + Vercel covers most needs)

### Google Cloud for Startups ($2K–$200K)
- Requires: < 5 years old, < Series A
- Tier 1 ($2K) available without accelerator
- Use for: Vertex AI API, BigQuery for analytics
- **Priority:** High — GCP credits useful for LLM fallback

### Anthropic API Credits
- Direct startup program via console
- $500 for new startups, more with traction proof
- Most useful credit given Claude is primary LLM
- **Priority:** High — apply immediately

### Vercel OSS Sponsorship
- Public OSS repos qualify for Pro plan ($20/mo value)
- Apply at vercel.com/oss with GitHub repo link
- **Priority:** High — free, easy, immediate value

### Supabase OSS
- Requires: Public OSS project
- Pro plan ($25/mo) free for qualifying projects
- Removes row limits and adds daily backups
- **Priority:** High — apply with GitHub repo

---

## Credit Stacking Strategy

```
Infrastructure zero-cost stack:
├── Frontend:   Cloudflare Pages (free forever)
├── Edge API:   Cloudflare Workers (free 100K req/day)
├── App:        Vercel OSS (apply → free Pro)
├── Backend:    Fly.io (free hobby + AWS credits if needed)
├── Database:   Supabase OSS (apply → free Pro)
├── Storage:    Cloudflare R2 (free 10GB)
├── LLM:        Anthropic credits + OpenRouter PAYG
└── CI/CD:      GitHub Actions (free for OSS)
```

Total monthly cost target after credits: **< $5/mo**

---

## Application Checklist

- [ ] Form Delaware C-Corp (unlocks AWS Activate, Stripe Atlas perks)
- [ ] Apply Vercel OSS (repo is public, takes 5 min)
- [ ] Apply Supabase OSS (same)
- [ ] Apply Anthropic startup credits (console.anthropic.com)
- [ ] Apply AWS Activate after incorporation
- [ ] Apply GCP Startups after first revenue
- [ ] Explore YC startup deals (if accepted W2027)
