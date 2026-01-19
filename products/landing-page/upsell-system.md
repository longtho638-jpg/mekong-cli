# 🔄 Upsell Automation System

## Product Ladder

```
FREE                    STARTER                 GROWTH                  SCALE
┌───────────────┐      ┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│ VSCode Pack   │ ───▶ │ AI Skills $27 │ ───▶  │ Pro $197      │ ───▶  │ Enterprise    │
│ $0            │      │ Auth $27      │       │ Dashboard $47 │       │ $497          │
└───────────────┘      │ FastAPI $37   │       └───────────────┘       └───────────────┘
                       └───────────────┘
```

## Email Sequences

### Sequence 1: Free → Starter (7 days)

| Day | Email                               | CTA                  |
| --- | ----------------------------------- | -------------------- |
| 0   | Welcome + Setup Guide               | Setup VSCode         |
| 1   | Top 5 Extensions Deep Dive          | Read Blog            |
| 3   | "Missing This?" - AI Skills Preview | View AI Skills ($27) |
| 5   | Case Study: 10x Productivity        | Get AI Skills        |
| 7   | Limited Offer: 20% off Starter      | Buy Now              |

### Sequence 2: Starter → Growth (14 days)

| Day | Email                            | CTA             |
| --- | -------------------------------- | --------------- |
| 0   | Thanks + Quick Start             | Get Started     |
| 3   | Advanced Tips Video              | Watch           |
| 7   | "Ready for More?" - Pro Features | View Pro ($197) |
| 10  | Customer Spotlight               | Read Story      |
| 14  | Upgrade Offer: $50 off Pro       | Upgrade         |

### Sequence 3: Growth → Scale (30 days)

| Day | Email                       | CTA         |
| --- | --------------------------- | ----------- |
| 0   | Welcome to Pro              | Setup Guide |
| 7   | ROI Calculator              | Calculate   |
| 14  | Enterprise Features Preview | Learn More  |
| 21  | "Scaling Your Agency?"      | Book Call   |
| 30  | Enterprise Trial Offer      | Start Trial |

## Discount Codes

| Code          | Discount | Valid For       |
| ------------- | -------- | --------------- |
| WELCOME20     | 20%      | New subscribers |
| UPGRADE50     | $50 off  | Pro upgrade     |
| ENTERPRISE100 | $100 off | Enterprise      |
| BINH_PHAP     | 15%      | All products    |

## Cross-sell Rules

```javascript
// When customer buys X, recommend Y
const crossSell = {
    "vscode-starter": ["ai-skills-pack", "auth-starter"],
    "ai-skills-pack": ["admin-dashboard-lite", "fastapi-starter"],
    "auth-starter": ["admin-dashboard-lite", "landing-page-kit"],
    "admin-dashboard-lite": ["agencyos-pro"],
    "agencyos-pro": ["agencyos-enterprise"],
};
```

## Implementation

1. **Gumroad Workflows**: Enable post-purchase emails
2. **ConvertKit/Mailchimp**: Setup sequences
3. **Discount Codes**: Create in Gumroad admin
4. **Analytics**: Track conversion rates
