# Customer Success Platform — Skill

> CS-led revenue retention, health scoring, and NRR expansion infrastructure for SaaS — market growing 22.1% CAGR to $9.17B by 2032.

## When to Activate
- Building customer health scoring engines or churn prediction pipelines
- Implementing NRR (Net Revenue Retention) dashboards and expansion revenue workflows
- Designing QBR automation, renewal forecasting, or onboarding friction detection
- Integrating CS platforms (Gainsight, Planhat, Vitally) with product analytics and CRM

## Core Capabilities

| Area | Description | Key APIs/Tools |
|------|-------------|----------------|
| Health Scoring | Composite score: product usage + support + adoption + CSM sentiment | Gainsight NXT, Planhat API, Vitally API |
| Churn Prediction | ML model on usage drops + NPS + billing behavior + support escalations | Amplitude/Mixpanel + Scikit-learn/XGBoost |
| Expansion Revenue | Identify upsell/cross-sell signals from usage patterns and seat growth | Gainsight Success Plans, Planhat Playbooks |
| NRR Tracking | MRR movement: new + expansion − contraction − churn = NRR | Stripe API + Planhat Revenue Intelligence |
| Renewal Forecasting | 90/60/30-day renewal pipeline with risk-weighted close probabilities | Gainsight Timeline, Custify API |
| QBR Automation | Auto-generate quarterly business review decks from usage data | Planhat Reports API, Google Slides API |
| Onboarding Detection | Track milestone completion, time-to-value, feature activation depth | Segment CDP + Amplitude Cohort Analysis |

## Architecture Patterns

- **Health Score Pipeline:** Product events (Amplitude) → usage aggregation (daily cron) → feature adoption score (0-100) + support ticket score + NPS score + billing score → weighted composite → stored in Gainsight/Planhat → CSM dashboard alert if score drops 15+ points in 7 days
- **Churn Prediction Model:** Feature matrix: [login_frequency_30d, feature_adoption_pct, support_tickets_30d, nps_score, days_since_last_login, seat_utilization_pct, billing_overdue_days] → XGBoost classifier → churn_probability score → trigger Gainsight Playbook if > 0.65
- **Expansion Signal Detection:** Seat utilization > 80% for 14 days OR new power-user activation in unsubscribed feature tier → CS alert → auto-create upsell opportunity in HubSpot/Salesforce → CS playbook with tailored pitch deck
- **Renewal Forecasting:** Account list + contract end dates → risk scoring → CSM capacity planning → renewal call scheduling automation (Calendly API) → outcome tracking → NRR rollup

## Key Technologies & APIs

- **Gainsight NXT API:** REST API for accounts, health scores, success plans, CTAs, timeline — `https://developer.gainsight.com`
- **Planhat API:** `https://docs.planhat.com` — accounts, users, metrics, revenue, playbooks, NPS
- **Vitally API:** `https://docs.vitally.io/api` — health scores, tasks, notes, integrations
- **Custify API:** `https://docs.custify.com` — accounts, segments, playbooks, metrics
- **Segment CDP:** Event streaming from product → CS platform ingestion via Segment Destinations
- **Amplitude API:** `https://www.docs.developers.amplitude.com` — cohort export, user activity, funnels
- **Mixpanel API:** `https://developer.mixpanel.com` — engagement metrics, retention curves
- **HubSpot CRM API:** `https://developers.hubspot.com` — contacts, deals, renewal pipeline
- **Stripe API:** MRR tracking via `subscription.updated` and `invoice.payment_failed` webhooks

## Implementation Checklist

- [ ] Define health score dimensions and weights per customer segment (Enterprise vs SMB vs PLG)
- [ ] Instrument product with Segment/Amplitude events: feature_used, milestone_completed, session_start
- [ ] Build feature adoption matrix: which features = high-value indicators vs vanity metrics
- [ ] Train churn model on 12+ months historical data — label 90-day churn events
- [ ] Set up Gainsight/Planhat data ingestion: CRM sync, product analytics sync, support ticket sync
- [ ] Create playbook library: churn-risk, expansion, low-adoption, renewal-60-day, renewal-30-day
- [ ] Implement NRR calculation job (weekly): starting MRR + expansion − contraction − churn / starting MRR
- [ ] Build CSM capacity model: accounts per CSM, ARR per CSM tier, coverage ratio alerts
- [ ] Automate QBR deck generation from account metrics template

## Best Practices

- Blend at least 4 signal types in health score — single-signal scores are gamed or misleading
- Trigger churn playbook at 0.65 probability threshold — earlier intervention has 3x higher save rate than at-risk
- Track time-to-first-value (TTFV) per cohort — TTFV > 14 days correlates strongly with 6-month churn
- Segment health score thresholds by customer tier — Enterprise tolerates more support tickets than SMB
- Log every manual health score override with CSM rationale — builds training data for future model refinement
- Measure CS team's influence on NRR separately from product-led expansion — attribution matters for headcount justification

## Anti-Patterns

- Never rely on NPS alone as churn predictor — NPS lags behavioral signals by 30-60 days
- Avoid one-size-fits-all health score across all segments — churn drivers differ by ARR tier and vertical
- Do not automate renewal outreach without CSM review for accounts > $50K ARR — relationship context matters
- Never expose raw churn probability scores to customers — it erodes trust; use internal risk tiers only
- Avoid building CS workflows in a CRM alone — CRMs lack product usage data depth; use dedicated CS platforms

## References

- Gainsight Developer Docs: `https://developer.gainsight.com/api`
- Planhat API Reference: `https://docs.planhat.com`
- Vitally API Docs: `https://docs.vitally.io/api`
- Segment CDP Destinations: `https://segment.com/docs/connections/destinations/`
- NRR Benchmark Report 2026 (KeyBanc): `https://www.keybanc.com/saas-survey`
