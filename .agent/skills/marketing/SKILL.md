---
name: marketing
description: SEO, content marketing, email automation, analytics, social media, paid ads. Use for marketing strategy, campaign management, funnel optimization, attribution.
license: MIT
version: 1.0.0
---

# Marketing Skill

Plan and execute marketing strategies with SEO, content, email automation, analytics, and paid advertising.

## When to Use

- SEO strategy and technical SEO audits
- Content marketing planning and execution
- Email marketing automation and sequences
- Marketing analytics and attribution setup
- Social media strategy and scheduling
- Paid advertising (Google Ads, Meta Ads)
- Landing page optimization and CRO
- Marketing funnel design and optimization
- Brand awareness and PR campaigns
- Marketing tech stack selection and integration

## Tool Selection

| Need | Choose |
|------|--------|
| SEO research | Ahrefs v3, SEMrush, DataForSEO (API-first) |
| Email automation | Resend (dev-first), Klaviyo, Loops.so (SaaS) |
| Analytics | PostHog (open-source), Amplitude, Mixpanel |
| CDP/Data | Segment (Track/Identify → 100+ destinations) |
| Content CMS | Sanity.io (GROQ + AI), Strapi v5, Webflow |
| Social scheduling | Buffer, Hootsuite, Later |
| Landing pages | Webflow, Framer, Unbounce |
| Ad management | Google Ads API, Meta CAPI |
| Marketing automation | ActiveCampaign, Mailchimp, HubSpot |
| Attribution | PostHog, Rockerbox, Triple Whale |

## Marketing Funnel

```
TOFU (Awareness)          MOFU (Consideration)        BOFU (Decision)
┌─────────────────┐      ┌──────────────────┐       ┌─────────────────┐
│ SEO/Blog content│      │ Case studies     │       │ Free trial      │
│ Social media    │─────▶│ Webinars         │──────▶│ Demo/consult    │
│ Paid ads        │      │ Email nurture    │       │ Pricing page    │
│ PR/Guest posts  │      │ Comparison pages │       │ Proposal/quote  │
└─────────────────┘      └──────────────────┘       └─────────────────┘
    Metric: Traffic          Metric: MQLs             Metric: SQLs/Revenue
```

## SEO Technical Checklist

```yaml
on_page:
  - [ ] Title tags: <60 chars, keyword-first
  - [ ] Meta descriptions: <155 chars, CTA included
  - [ ] H1: one per page, includes primary keyword
  - [ ] Internal linking: 3-5 contextual links per page
  - [ ] Image alt text: descriptive, keyword-relevant
  - [ ] Schema markup: Article, Product, FAQ, HowTo

technical:
  - [ ] Core Web Vitals: LCP <2.5s, INP <200ms, CLS <0.1
  - [ ] Mobile-first indexing verified
  - [ ] XML sitemap submitted and auto-updated
  - [ ] Robots.txt properly configured
  - [ ] Canonical tags on all pages
  - [ ] HTTPS enforced, no mixed content
  - [ ] Page speed: <3s load time

content:
  - [ ] Keyword research: volume + intent + difficulty
  - [ ] Content clusters: pillar page + supporting articles
  - [ ] E-E-A-T signals: author bios, citations, expertise
  - [ ] Regular content audits: update/prune every 6 months
```

## Email Automation Patterns

```typescript
// Resend: Welcome sequence with behavioral triggers
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

// Day 0: Welcome email
await resend.emails.send({
  from: 'team@company.com',
  to: user.email,
  subject: 'Welcome to [Product]',
  react: WelcomeEmail({ name: user.name }),
});

// Day 1: If no core action → onboarding nudge
// Day 3: Feature highlight based on user segment
// Day 7: Case study / social proof
// Day 14: If inactive → re-engagement offer
```

## Key Metrics

| Metric | Target | Purpose |
|--------|--------|---------|
| Organic Traffic | +10% MoM | SEO effectiveness |
| Domain Authority | > 40 | SEO strength |
| Email Open Rate | > 25% | Subject line quality |
| Email Click Rate | > 3% | Content relevance |
| MQL to SQL Rate | > 25% | Lead quality |
| CAC by Channel | Varies | Channel efficiency |
| ROAS (paid) | > 3:1 | Ad profitability |

## Key Best Practices (2026)

**AI-Native Orchestration:** Agentic flows replace static if/then rules — AI picks channel + timing
**Server-Side GTM:** Bypass iOS17/ad-blocker restrictions for accurate attribution
**Meta CAPI:** Server-to-server ad event matching (replaces pixel for better attribution)
**Composable CDP:** Hightouch/Census reverse ETL from data warehouse into marketing tools
**Content Velocity:** AI-assisted drafting → human editing → programmatic distribution

## References

- `references/seo-technical-audit-guide.md` - Ahrefs, Core Web Vitals, schema markup
- `references/email-automation-sequences.md` - Resend, Klaviyo, lifecycle email patterns
