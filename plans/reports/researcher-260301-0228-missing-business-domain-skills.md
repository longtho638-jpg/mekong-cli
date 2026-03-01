# Missing Business Domain Skills — Gap Analysis

**Date:** 2026-03-01
**Agent:** researcher
**Task:** Identify high-value business domains NOT covered by existing 347 skills

---

## Methodology

Full catalog audit of 347 existing skills vs. agency OS + SaaS business domain map.
Existing coverage is strong across: healthcare-agent, logistics-supply-chain, real-estate-agent,
fintech-banking, pharma-biotech, energy-esg, travel-tourism, food-beverage, fashion-retail,
construction-agent, insurance-agent, government-govtech, gaming-esports, automotive-mobility,
manufacturing-iiot, telecom-iot, media-entertainment, edtech, nonprofit-agent, wellness-fitness,
crypto-web3, voice-ai-development, restaurant-pos-system, property-proptech.

Gaps exist primarily in: **operational depth within verticals**, **SaaS growth patterns**,
**emerging AI-native workflows**, and **professional services tooling**.

---

## Missing Domains — 18 High-Value Gaps

### 1. `crm-operations`
**Description:** End-to-end CRM strategy, pipeline management, deal workflow automation, and customer lifecycle orchestration beyond raw sales.
**Key topics:** CRM data modeling, pipeline stages, deal scoring, customer segmentation, lifecycle automations, churn prediction, NPS workflows, CRM API integrations (HubSpot/Salesforce/Twenty), data hygiene.
**Value for agency OS:** Every client project eventually needs CRM wiring; agencies manage CRMs across multiple client stacks. Distinct from `sales-revenue` (revenue math) and `hubspot-integration` (tool-specific).

---

### 2. `subscription-saas-ops`
**Description:** SaaS subscription lifecycle management — trials, upgrades, downgrades, dunning, churn recovery, and metered billing logic.
**Key topics:** Trial conversion flows, upgrade/downgrade state machines, dunning sequences, failed payment recovery, grace periods, metered/seat-based billing, subscription analytics (MRR, ARR, churn, LTV), billing portal UX.
**Value for agency OS:** Every SaaS product the agency builds or operates needs this. Distinct from `payment-integration` (gateway wiring) and `billing-sdk` (SDK patterns).

---

### 3. `data-pipeline-etl`
**Description:** Design and build data pipelines — ETL/ELT processes, data transformation, warehouse loading, and orchestration.
**Key topics:** dbt transformations, Airflow/Prefect/Dagster DAGs, CDC (change data capture), data contracts, schema evolution, incremental loads, data quality checks, warehouse patterns (BigQuery, Snowflake, Redshift), Fivetran/Airbyte connectors.
**Value for agency OS:** Analytics clients and SaaS products need reliable data movement. No existing skill covers pipeline orchestration depth (analytics-tracking is front-end events only).

---

### 4. `product-analytics`
**Description:** Product analytics instrumentation, funnel analysis, cohort analysis, and growth metrics dashboarding.
**Key topics:** Event taxonomy design, funnel/retention/cohort SQL, Mixpanel/Amplitude/PostHog setup, feature flags analytics, activation metrics, DAU/WAU/MAU tracking, North Star metric frameworks, self-serve analytics dashboards.
**Value for agency OS:** Every SaaS product needs analytics beyond pageviews. Distinct from `analytics-tracking` (tagging/GTM) and `segment-cdp` (data routing).

---

### 5. `ai-ops-mlops`
**Description:** Operationalize AI/ML models in production — model serving, monitoring, retraining pipelines, and LLM observability.
**Key topics:** Model versioning, A/B testing models, drift detection, LLM cost monitoring, token budgeting, prompt versioning, LLM observability (Langfuse/Helicone/Braintrust), fine-tuning pipelines, vector store management, RAG evaluation.
**Value for agency OS:** Agency builds AI-native products; needs a skill for operating them post-launch. Distinct from `rag-implementation` (build) — this is run/operate.

---

### 6. `fleet-field-ops`
**Description:** Field service management, fleet tracking, technician dispatch, and job scheduling for service businesses.
**Key topics:** Route optimization, GPS/telematics integration, work order management, technician mobile apps, job costing, SLA tracking, preventive maintenance schedules, FSM APIs (ServiceTitan, Jobber, FieldEdge), geofencing.
**Value for agency OS:** Large vertical for HVAC, plumbing, cleaning, pest control SMBs — high-margin agency clients. Not covered by `logistics-supply-chain` (which is warehouse/shipping focused).

---

### 7. `marketplace-platform`
**Description:** Two-sided marketplace design patterns — buyer/seller onboarding, trust mechanics, search/discovery, and commission flows.
**Key topics:** Dual-registration flows, identity verification, seller onboarding, trust & safety (fraud, disputes), search ranking, commission/escrow logic, review systems, marketplace SEO, split payments (Stripe Connect), supply-demand balancing.
**Value for agency OS:** Marketplaces are a common SaaS pattern. No single skill covers the full two-sided platform pattern.

---

### 8. `community-platform`
**Description:** Online community building — forums, membership gating, engagement mechanics, and community-led growth.
**Key topics:** Forum/discussion architecture, member reputation systems, content moderation, gated content/tiers, gamification (badges, streaks), community analytics (DAU, post rate, retention), Discord/Circle/Slack community ops, community-led acquisition.
**Value for agency OS:** Communities are a moat for SaaS products and personal brands — growing agency deliverable.

---

### 9. `white-label-saas`
**Description:** Multi-tenant white-labeling architecture — custom domains, tenant branding, per-tenant config, and reseller management.
**Key topics:** Subdomain/custom domain routing, per-tenant theming (CSS vars, logos), tenant isolation (DB row-level, schema-per-tenant, DB-per-tenant), reseller portal patterns, white-label email/SMTP, tenant admin dashboards, usage limits per plan.
**Value for agency OS:** Agency builds white-label SaaS for clients who resell. Critical pattern not covered anywhere.

---

### 10. `api-monetization`
**Description:** Monetize APIs as products — usage-based pricing, API keys, rate limiting tiers, developer portal, and usage metering.
**Key topics:** API key issuance/rotation, usage metering (request count, token count, data volume), tier enforcement, developer portals (Readme, Mintlify, Stoplight), API product packaging, webhook delivery guarantees, API analytics, billing integration.
**Value for agency OS:** API-first products are a growing pattern; agencies need a playbook for launching paid APIs.

---

### 11. `nonprofit-fundraising`
**Description:** Digital fundraising operations — donation flows, donor management, grant tracking, and impact reporting.
**Key topics:** Donation page optimization, recurring giving flows, donor CRM (Salesforce NPSP, Bloomerang), grant pipeline management, impact dashboards, tax receipt automation, peer-to-peer fundraising, event fundraising, donor segmentation.
**Value for agency OS:** Nonprofits are a distinct client vertical with unique compliance (501c3, Gift Aid) and UX needs. Distinct from `nonprofit-agent` (generic) — this is deep fundraising ops.

---

### 12. `sports-fitness-platform`
**Description:** Digital platforms for sports clubs, gyms, fitness apps — class booking, membership, wearable data, and coaching workflows.
**Key topics:** Class/session booking engines, membership management, wearable API integrations (Apple Health, Garmin, Whoop), workout plan builders, coach-athlete communication, leaderboards, fitness challenge mechanics, video coaching delivery.
**Value for agency OS:** High-demand vertical post-COVID; distinct from `wellness-fitness` (which is wellness content/coaching) — this is platform/software for fitness businesses.

---

### 13. `media-content-ops`
**Description:** Content production pipeline management — editorial workflows, asset management, publishing schedules, rights management.
**Key topics:** Editorial calendar systems, DAM (digital asset management), content approval workflows, multi-channel publishing (CMS → social → email), content versioning, rights/licensing tracking, content performance analytics, podcast/video production workflows.
**Value for agency OS:** Content agencies and media companies need operational tooling. Distinct from `media-processing` (ffmpeg/encoding) and `media-entertainment` (industry vertical).

---

### 14. `iot-platform`
**Description:** IoT device management, telemetry ingestion, real-time dashboards, and device fleet operations.
**Key topics:** MQTT/CoAP protocols, device provisioning, OTA firmware updates, time-series data (InfluxDB, TimescaleDB), telemetry pipelines, alert/threshold rules, device twin/shadow patterns, edge computing, AWS IoT/Azure IoT/Google Cloud IoT, dashboard (Grafana).
**Value for agency OS:** Hardware+software products (smart home, industrial, agri-tech) are growing agency territory. `telecom-iot` covers telecom vertical; this covers the platform engineering pattern.

---

### 15. `ar-vr-xr`
**Description:** Augmented/virtual/mixed reality application development — spatial computing, 3D interactions, and XR deployment.
**Key topics:** WebXR API, A-Frame, React Three Fiber XR, Unity/Unreal basics, spatial UI patterns, hand tracking, spatial audio, Apple Vision Pro visionOS concepts, AR marker tracking, XR performance optimization, device compatibility (Quest, HoloLens, iOS ARKit).
**Value for agency OS:** XR is transitioning from experimental to production — agencies need a playbook. Distinct from `threejs` (3D rendering library) and `3d-web-experience` (web-specific).

---

### 16. `privacy-compliance`
**Description:** Privacy engineering and regulatory compliance implementation — GDPR, CCPA, HIPAA, cookie consent, and data governance.
**Key topics:** Consent management platforms (CMP), cookie banner implementation, right-to-erasure workflows, data subject access requests (DSAR) automation, GDPR/CCPA gap analysis, data processing agreements, privacy-by-design patterns, HIPAA safeguards checklist, PII tokenization, audit logging for compliance.
**Value for agency OS:** Every SaaS product faces privacy regulation. Distinct from `legal-compliance` (contracts/legal) — this is technical privacy implementation.

---

### 17. `b2b-saas-onboarding`
**Description:** B2B SaaS onboarding design — activation flows, product tours, empty states, success milestones, and CS handoff.
**Key topics:** Activation metric definition, onboarding checklist UX, interactive product tours (Appcues, Intercom, Pendo), empty state design, time-to-value optimization, CS handoff triggers, trial-to-paid activation, onboarding email sequences, in-app guidance patterns, onboarding analytics.
**Value for agency OS:** Onboarding is the #1 lever for SaaS conversion. The existing `onboarding-cro` skill covers signup CRO; this covers the full post-signup activation journey for B2B.

---

### 18. `talent-freelance-ops`
**Description:** Managing distributed freelance/contractor talent — sourcing, vetting, contracts, payments, and performance.
**Key topics:** Freelancer vetting workflows, portfolio/skills assessment, contract templates (NDA, SOW, IP assignment), multi-currency contractor payments (Deel, Wise, Stripe), time tracking integration, performance review for contractors, freelancer platform APIs (Upwork, Toptal), talent pool management.
**Value for agency OS:** Agencies operate with distributed talent; this is core to RaaS (Resource as a Service) operations. Distinct from `hr-people-ops` (FTE HR) and `procurement-agent` (vendor purchasing).

---

## Priority Ranking (Agency OS Value)

| Rank | Domain | Rationale |
|------|--------|-----------|
| 1 | `subscription-saas-ops` | Every SaaS product the agency builds |
| 2 | `crm-operations` | Cross-client, cross-project need |
| 3 | `privacy-compliance` | Legal requirement, not optional |
| 4 | `white-label-saas` | RaaS core delivery pattern |
| 5 | `product-analytics` | SaaS growth engine |
| 6 | `b2b-saas-onboarding` | Activation = revenue |
| 7 | `data-pipeline-etl` | Analytics clients demand |
| 8 | `marketplace-platform` | Common SaaS pattern |
| 9 | `api-monetization` | API-first product trend |
| 10 | `talent-freelance-ops` | Agency core ops |
| 11 | `community-platform` | SaaS moat strategy |
| 12 | `ai-ops-mlops` | AI product operations |
| 13 | `fleet-field-ops` | High-margin SMB vertical |
| 14 | `media-content-ops` | Content agency ops |
| 15 | `iot-platform` | Hardware+software trend |
| 16 | `nonprofit-fundraising` | Distinct vertical ops |
| 17 | `sports-fitness-platform` | Post-COVID growth vertical |
| 18 | `ar-vr-xr` | Emerging, longer horizon |

---

## Notes

- 347 existing skills already cover most industry verticals as agent stubs (healthcare-agent, real-estate-agent, etc.) — gaps are in **operational depth and SaaS patterns**, not vertical breadth.
- Highest ROI additions: `subscription-saas-ops`, `crm-operations`, `privacy-compliance`, `white-label-saas` — these apply to nearly every agency engagement.
- `ar-vr-xr` is lowest priority due to market maturity, but Apple Vision Pro may accelerate it in 2026.

## Unresolved Questions

- Is `gkg` skill documented anywhere? Not found in `.claude/skills/` directory — may be external or deprecated.
- Should `privacy-compliance` be split into GDPR-specific and HIPAA-specific sub-skills given compliance divergence?
- Does `crm-operations` overlap enough with `twenty-crm` and `salesforce-development` to warrant merging?
