# Research Report: Trending Business/Tech Domains 2026 — New Skills & SDKs

**Date:** 2026-03-01
**Purpose:** Identify 5-8 NEW domains for `.claude/skills/` + `@agencyos/vibe-*` SDK packages
**Method:** Gemini web research (2 parallel queries) + skills gap analysis (406 existing skills scanned)

---

## Executive Summary

Scanned 406 existing skills. Most obvious 2026 domains (AI agents, legal, creator economy, climate, quantum, cybersec, space, HR-tech) are ALREADY covered. After cross-referencing skills catalog, 7 genuinely uncovered high-growth domains identified. Best bets: **sports-tech**, **gig-economy/talent-marketplace**, **geospatial-location-tech**, **community-platform**, **on-device-ai**, **care-economy**, and **loyalty-rewards-commerce**.

---

## Gap Analysis — What's Already Covered

| Domain | Existing Skill |
|---|---|
| AI governance | `ai-governance-compliance` |
| Embedded finance / BaaS | `embedded-finance-baas` |
| Composable commerce | `composable-commerce-mach` |
| Ambient computing | `ambient-computing` |
| Digital twin | `digital-twin-simulation` |
| Synthetic data | `synthetic-data-generation` |
| Trust & safety | `trust-safety-content-moderation` |
| Creator economy | `creator-economy`, `content-creator` |
| Legal tech | `legaltech-contract-intelligence`, `legal-compliance` |
| Climate/carbon | `climate-tech`, `carbon-accounting-api` |
| Space tech | `space-tech-ops` |
| Cybersecurity | `cybersecurity-ops-agent` |
| Quantum | `quantum-computing` |
| HR tech | `hr-people-ops`, `workforce-management` |
| Live commerce | `live-commerce` |
| Pet care | `pet-care-tech` |
| Neurotechnology | `neuroscience-bci` |
| Proptech | `property-proptech` |
| Vertical SaaS | `vertical-saas` |

---

## 7 NEW Domains — Not Yet Covered

---

### 1. sports-tech

**Why trending 2026:**
Global sports tech market: $29.6B in 2026 → $65B by 2030 (CAGR ~22%). Driven by: wearable performance tracking, fan engagement apps, sports betting legalization expansion (40+ US states + EU), real-time data APIs, athlete health monitoring, stadium IoT. Major investment from PE/VC (Softbank, Andreessen Horowitz). Sports betting market alone: $125B globally 2026.

**Technical capabilities to cover:**
1. Real-time sports data APIs (Sportradar, Genius Sports, Stats Perform) — event streaming, odds feeds, live score webhooks
2. Athlete performance analytics — wearable data ingestion (GPS, heart rate, biomechanics), ML prediction models
3. Fan engagement platforms — ticketing NFTs, loyalty points, gamification, second-screen experiences
4. Sports betting integration — odds calculation, regulatory compliance (KYC, responsible gambling), payment flows

**SDK:** `@agencyos/vibe-sports-tech`

---

### 2. gig-economy-talent-marketplace

**Why trending 2026:**
Gig economy workforce: 86M US workers by 2027 (40% US workforce). Platforms: Upwork, Fiverr, Toptal growing 15%+ YoY. AI-matching talent platforms exploding. Freelance management systems (FMS) market: $7.2B. Key driver: companies cutting FTEs, using fractional/contract talent. Developer need: build compliant, scalable platforms fast.

**Technical capabilities to cover:**
1. Talent matching algorithms — skills ontology, availability calendars, AI-powered matching, reputation scoring
2. Contractor compliance — 1099/W-8BEN forms, multi-jurisdiction tax rules, worker classification checks, IR35
3. Payment & escrow flows — milestone billing, dispute resolution, international payouts (Stripe Connect, Wise API)
4. Time tracking & deliverables — project milestones, time entry, invoice generation, contract lifecycle

**SDK:** `@agencyos/vibe-talent-marketplace`

---

### 3. geospatial-location-tech

**Why trending 2026:**
Geospatial analytics market: $105B by 2030 (CAGR 14.7%). Driven by: autonomous vehicles needing HD maps, precision agriculture, urban planning AI, climate monitoring, last-mile logistics optimization, drone corridors. Major platforms: Google Maps Platform, AWS Location, HERE, Mapbox, Esri. Every industry now has location component. Still underrepresented in dev tooling skills.

**Technical capabilities to cover:**
1. Mapping & visualization — Mapbox/Google Maps APIs, deck.gl, Leaflet, WebGL tile rendering, real-time asset tracking
2. Geospatial data processing — PostGIS queries, H3 hexagonal indexing, S2 library, spatial joins, GeoJSON/shapefile parsing
3. Location intelligence — proximity search, route optimization (OSRM, Valhalla), isochrone analysis, heatmaps
4. Real-time tracking — WebSocket location streams, geofencing triggers, fleet tracking, last-mile delivery orchestration

**SDK:** `@agencyos/vibe-geospatial`

---

### 4. community-platform

**Why trending 2026:**
Community-led growth (CLG) is 2026's top SaaS go-to-market. Discord has 500M+ users. Circle.so, Mighty Networks, Skool growing 40%+ YoY. Brands building owned communities vs. renting social media audiences. Community software market: $1.7B → $4.8B by 2030 (CAGR 23%). Every SaaS now needs community layer. No dedicated skill exists yet despite this being extremely common dev requirement.

**Technical capabilities to cover:**
1. Community infrastructure — forums (Discourse API), chat (Discord bots, Slack), spaces (Circle API), event rooms (Liveblocks)
2. Member engagement — reputation/XP systems, badges, leaderboards, challenges, streak tracking
3. Content moderation — AutoMod rules, AI toxicity detection (Perspective API), reporting workflows, appeal flows
4. Community analytics — DAU/WAU/MAU tracking, engagement scores, churn prediction, member journey mapping

**SDK:** `@agencyos/vibe-community`

---

### 5. on-device-ai

**Why trending 2026:**
Apple Intelligence (iOS 18+), Android AICore, Qualcomm NPUs, MediaTek Dimensity — every new device has dedicated AI silicon. On-device AI market: $14B → $67B by 2030 (CAGR 37%). Drivers: privacy (no cloud), latency (instant), offline capability. MLKit, Core ML, ONNX Runtime, llama.cpp, Ollama on edge. Devs need to understand how to build apps leveraging local models — completely different paradigm from cloud AI.

**Technical capabilities to cover:**
1. Local model deployment — llama.cpp, Ollama, MLX (Apple Silicon), ONNX Runtime, Core ML conversion workflows
2. Model optimization — quantization (GGUF, AWQ, GPTQ), pruning, distillation, INT4/INT8 inference, benchmarking
3. On-device AI app patterns — streaming inference UI, background model loading, memory management, fallback to cloud
4. Privacy-preserving AI — federated learning basics, differential privacy, secure enclave integration, on-device embedding generation

**SDK:** `@agencyos/vibe-on-device-ai`

---

### 6. care-economy-tech

**Why trending 2026:**
Care economy (elder care + childcare + disability care) is $648B US market, massively underdigitized. US has 54M caregivers. Elder care tech VC funding: $4.2B in 2025. Drivers: aging Baby Boomers (10K turning 65 daily in US), caregiver shortage, remote monitoring demand, AI companions for elderly. Government mandates (CMS interoperability rules) pushing digitization. Developer tooling essentially zero compared to need.

**Technical capabilities to cover:**
1. Care coordination platforms — scheduling, shift management, care plan documentation, family portal access
2. Remote patient monitoring — biometric data ingestion (wearables, sensors), anomaly detection, alert routing, HL7/FHIR integration
3. Regulatory compliance — CMS billing codes, Medicaid/Medicare rules, HIPAA for care settings, state licensing APIs
4. AI companion integration — voice interfaces for elderly (Alexa Skills, Google Actions), conversational AI patterns, accessibility standards

**SDK:** `@agencyos/vibe-care-economy`

---

### 7. loyalty-rewards-commerce

**Why trending 2026:**
Loyalty management market: $13.4B in 2026 → $28.6B by 2030 (CAGR 20.8%). Every brand building loyalty programs after realizing paid acquisition is unsustainable (CPAs up 60% since 2021). Points/cashback/rewards programs now standard for D2C, retail, fintech, airlines, QSR. Coalition loyalty programs (multiple brands sharing points) growing. Web3 loyalty tokens (onchain rewards) gaining traction. No dedicated skill exists — `billing-sdk` and `stripe-integration` don't cover loyalty flows.

**Technical capabilities to cover:**
1. Points engine — earn/burn rules, expiry logic, tier calculations, currency conversion, real-time balance updates
2. Rewards catalog — reward SKUs, redemption flows, partner integrations (gift cards, travel, crypto), fulfillment webhooks
3. Coalition & partner programs — multi-brand point pooling, white-label portal, affiliate attribution, revenue share
4. Analytics & gamification — engagement metrics, tier progression, churn risk scoring, personalized reward recommendations

**SDK:** `@agencyos/vibe-loyalty`

---

## Priority Ranking

| Rank | Domain | Market 2026 | CAGR | Skill Gap Score |
|---|---|---|---|---|
| 1 | `on-device-ai` | $14B | 37% | HIGH — paradigm shift, zero coverage |
| 2 | `geospatial-location-tech` | $105B (2030) | 14.7% | HIGH — universal need, no skill |
| 3 | `loyalty-rewards-commerce` | $13.4B | 20.8% | HIGH — every SaaS needs it |
| 4 | `gig-economy-talent-marketplace` | $7.2B FMS | 15% | MEDIUM — partial coverage |
| 5 | `community-platform` | $1.7B | 23% | HIGH — CLG is 2026 GTM standard |
| 6 | `sports-tech` | $29.6B | 22% | MEDIUM — niche but high-value |
| 7 | `care-economy-tech` | $648B TAM | 18% | HIGH — zero coverage, underserved |

---

## SDK Package Summary

```
@agencyos/vibe-sports-tech          → real-time data, betting, fan engagement
@agencyos/vibe-talent-marketplace   → matching, compliance, escrow, invoicing
@agencyos/vibe-geospatial           → maps, routing, tracking, spatial queries
@agencyos/vibe-community            → forums, engagement, moderation, analytics
@agencyos/vibe-on-device-ai         → local models, quantization, privacy AI
@agencyos/vibe-care-economy         → care coordination, RPM, CMS billing
@agencyos/vibe-loyalty              → points engine, rewards catalog, gamification
```

---

## Unresolved Questions

1. `care-economy-tech` overlaps partially with `digital-health` skill — need to define boundary (care coordination vs. clinical)
2. `on-device-ai` may overlap with `edge-ai-tinyml` skill — check if that skill covers llama.cpp/Ollama patterns or only MCU/TinyML
3. `geospatial-location-tech` may overlap with `geo-fundamentals` — check skill depth before creating duplicate
4. `community-platform` vs. `social-commerce` — define if social commerce belongs here or in separate skill
5. Is `gig-economy-talent-marketplace` sufficiently different from `b2b-procurement` + `vertical-saas` combination?
