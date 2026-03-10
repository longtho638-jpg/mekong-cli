---
name: creator-marketing-hub-sdk
description: Unified creator & marketing SDK — content monetization, audience analytics, campaigns, SEO, social media. Use for creator economy, marketing automation.
license: MIT
version: 1.0.0
---

# Creator & Marketing Hub SDK Skill

Build creator economy and marketing platforms with unified monetization and campaign facades.

## When to Use

- Creator content monetization and revenue tracking
- Multi-platform audience analytics
- Marketing campaign management
- SEO auditing and optimization
- Social media and content distribution
- Email marketing campaigns

## SDK Architecture

| Sub-path | Facade | Domain |
|----------|--------|--------|
| `@agencyos/creator-marketing-hub-sdk/creator` | CreatorFacade | Monetization, IP, audience |
| `@agencyos/creator-marketing-hub-sdk/marketing` | MarketingFacade | Campaigns, SEO, social |

## Underlying Packages

| Package | Purpose |
|---------|---------|
| `@agencyos/vibe-creator-economy` | Creator monetization |
| `@agencyos/vibe-marketing` | Marketing automation |
