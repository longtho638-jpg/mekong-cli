# 🎬 AgencyOS - Investor Demo Script

## Pre-Demo Checklist

- [ ] Localhost running on port 3000
- [ ] Demo account logged in
- [ ] Mock data seeded
- [ ] Browser in incognito mode
- [ ] Screen recording ready
- [ ] Stable internet connection

---

## Demo Flow (15 minutes)

### Introduction (1 min)

```
"Hi, I'm [Name], CEO of AgencyOS. 
Today I'll show you how we're building the operating system 
for the $4.2 billion Southeast Asian agency market."
```

---

### 1️⃣ Dashboard Overview (2 min)

**Navigate to:** `/en/dashboard`

**Key Points:**
- "This is the command center. Real-time KPIs at a glance."
- "Notice the 18 AI agents ready to deploy."
- "All data is tenant-isolated with enterprise-grade security."

**Action:** Click through the top KPI cards

---

### 2️⃣ Agent Hub (2 min)

**Navigate to:** `/en/hub`

**Key Points:**
- "161 specialized agents across 22 departments."
- "Each agent handles a specific business function."
- "Agencies save 15+ hours per week."

**Action:** Open one agent (e.g., "Content Agent")

---

### 3️⃣ Analytics & VC Metrics (3 min)

**Navigate to:** `/en/analytics`

**Key Points:**
- "Real-time MRR tracking - currently at $7,800."
- "LTV/CAC ratio of 13.3x - best in class."
- "Cohort analysis shows 115% NRR."

**Action:** 
1. Point to MRR chart
2. Show customer breakdown
3. Highlight growth metrics

---

### 4️⃣ Billing & Pricing (2 min)

**Navigate to:** `/en/pricing`

**Key Points:**
- "Three tiers: Free, Pro ($49), Enterprise ($199)."
- "7 currencies supported for SEA markets."
- "Annual option saves 17%."

**Action:** 
1. Switch currency to VND
2. Toggle to yearly pricing
3. Click "Upgrade to Pro" (show checkout)

---

### 5️⃣ Team Management (2 min)

**Navigate to:** `/en/team`

**Key Points:**
- "5-tier role hierarchy for enterprise."
- "Easy invitation system with email."
- "Full activity audit logging."

**Action:**
1. Show member list
2. Open invite modal
3. Show role selector

---

### 6️⃣ Multi-Language Demo (1 min)

**Navigate to:** Language switcher

**Key Points:**
- "5 languages: English, Vietnamese, Thai, Indonesian, Filipino."
- "Native translations, not machine."

**Action:** Switch to Thai, show translated UI

---

### 7️⃣ Security & Compliance (1 min)

**Key Points:**
- "PDPA compliant for Thailand."
- "GDPR ready for European clients."
- "Rate limiting, input sanitization, CSP headers."

**Action:** (No navigation needed - verbal explanation)

---

### Closing (1 min)

```
"That's AgencyOS - one platform to run an entire agency.

We're raising $5M Series A to:
1. Expand to 5 SEA markets
2. Add 50+ AI agents
3. Build enterprise sales team

Questions?"
```

---

## Demo Environment URLs

| Page | URL |
|------|-----|
| Dashboard | http://localhost:3000/en/dashboard |
| Hub | http://localhost:3000/en/hub |
| Analytics | http://localhost:3000/en/analytics |
| Pricing | http://localhost:3000/en/pricing |
| Team | http://localhost:3000/en/team |
| Settings | http://localhost:3000/en/settings |

---

## Mock Data to Seed

Run before demo:

```bash
npm run seed:demo
```

This seeds:
- 5 team members with different roles
- 50 projects
- 12 months of usage events
- MRR history with growth curve

---

## Common VC Questions & Answers

### "What's your defensibility?"

"Three moats:
1. Network effects - agency community
2. Data moat - 161 trained agents
3. Local depth - 4 payment gateways, 5 languages"

### "Why not just use Monday.com?"

"Monday is $72+/user, no AI, no SEA payments.
We're $49 flat, 18 AI agents, 4 local gateways."

### "What's your CAC?"

"$180 blended. $50 for organic, $300 for paid.
LTV/CAC is 13.3x with 3.7 month payback."

### "How do you acquire customers?"

"Three channels:
1. Agency network referrals (40%)
2. Content marketing (35%)
3. Paid ads (25%)"

---

## Demo Tips

1. **Speak slowly** - VCs are processing lots of info
2. **Use numbers** - "$7.8K MRR, 115% NRR, 13x LTV/CAC"
3. **Show, don't tell** - Let the product speak
4. **Leave time for Q&A** - They will have questions
5. **Energy level** - Be excited but not manic

---

*Demo script v1.0 - 2026-01-05*
