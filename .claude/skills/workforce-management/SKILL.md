# Workforce Management & Scheduling — Skill

> Cloud-based shift scheduling, demand-driven labor forecasting, and predictive scheduling compliance for 2026 hybrid/gig workforces.

## When to Activate
- Building employee scheduling systems, shift bidding platforms, or timesheet automation
- Implementing compliance with Fair Workweek / Predictive Scheduling laws (NYC, Chicago, SF, Oregon)
- Designing demand-based labor forecasting pipelines tied to POS, foot traffic, or order volume
- Managing gig/contract workforce pools alongside full-time staff across multiple locations

## Core Capabilities

| Area | Description | Key APIs/Tools |
|------|-------------|----------------|
| Shift Scheduling | Constraint-based schedule generation with coverage rules, skill matching, and availability | Deputy API v2, When I Work API, Shiftboard API |
| Demand Forecasting | Auto-adjust labor levels from sales/foot-traffic signals | Workforce.com Demand Engine, Prophet/NeuralProphet |
| Compliance Enforcement | Advance notice rules, right-to-rest, premium pay for late changes | Custom rule engine + UKG Dimensions API |
| Break & Meal Law | CA 30min meal break at 5h, NY spread-of-hours, FLSA overtime tracking | Deputy Compliance Module |
| Timesheet Automation | Clock-in/out via geofence, biometric, QR; auto-flag anomalies | Deputy Timesheets, When I Work GPS |
| Gig Workforce | On-demand worker pools, instant pay (DailyPay/Branch), 1099 vs W-2 routing | Shiftboard API, Stripe Connect |
| Multi-Location | Centralized policy templates, per-site overrides, shift transfer across locations | Workforce.com Multi-Site Config |

## Architecture Patterns

- **Demand-Driven Scheduling:** POS/sales data → 7-day demand forecast (Prophet) → labor model (sales-per-labor-hour target) → schedule generation (CSP solver) → manager approval → Deputy/When I Work publish
- **Fair Workweek Compliance Gate:** Schedule draft created → rule engine checks: 14-day advance notice (NYC), 10-day (SF), 72h right-to-rest, clopening detection → violations flagged before publish → premium pay auto-calculated if manager overrides
- **Gig Pool Dispatch:** Open shift created → broadcast to qualified gig pool → first-accept-wins or manager review → instant onboarding verification (I-9, background) → clock-in via QR → pay via Branch/DailyPay
- **Overtime Prevention:** Real-time hours tracker → alert at 32h (approaching 40h OT threshold) → auto-offer shift swap to part-time workers → manager override with penalty acknowledgment

## Key Technologies & APIs

- **Deputy API v2:** `https://developer.deputy.com/deputy-docs` — scheduling, timesheets, leave, webhooks
- **When I Work API:** `https://apidocs.wheniwork.com` — shifts, requests, notifications, payroll export
- **UKG Dimensions API:** REST + GraphQL for enterprise WFM, forecasting, accruals
- **Workforce.com Demand Forecasting:** ML-based labor demand from transactional data
- **Shiftboard API:** Complex workforce pools, certification tracking, compliance reporting
- **Constraint Solver:** OR-Tools (Google) `from ortools.sat.python import cp_model` for CSP scheduling
- **Cron Scheduling:** `node-cron` or Celery Beat for nightly schedule generation runs
- **Geofencing Clock-In:** Mapbox Geofences API or Deputy's GPS punch

## Implementation Checklist

- [ ] Map jurisdiction-specific Fair Workweek rules (notice period, premium pay rates, right-to-rest hours) per location
- [ ] Ingest historical sales/transaction data into forecasting pipeline — minimum 52 weeks for seasonality
- [ ] Build shift template library: role + required skills + min/max headcount per time slot
- [ ] Implement constraint satisfaction model: availability, max weekly hours, required certifications, preferences
- [ ] Add real-time hours accumulation tracker with OT threshold alerts (daily + weekly)
- [ ] Create schedule change audit log: who changed, when, original vs new, premium pay triggered
- [ ] Build employee self-service: shift swap requests, availability updates, time-off requests
- [ ] Integrate payroll export: map Deputy/WIW timesheets → ADP/Gusto/Paychex format
- [ ] Test clopening detection: flag shifts < 10h apart, auto-apply premium or block

## Best Practices

- Always generate schedules 14+ days ahead in NYC/Chicago/SF — late schedule changes trigger premium pay obligations
- Use rolling 13-week average demand baseline, override with seasonal multipliers for holidays/events
- Store employee availability as structured time windows, not free text — enables CSP solver integration
- Implement soft constraints (preferences) separately from hard constraints (legal minimums) in the solver
- Publish via push notification + email simultaneously — "sent" timestamp is legal proof of advance notice
- Log every override: manager who approved a clopening or late change must acknowledge premium pay cost

## Anti-Patterns

- Never store schedule as flat shift records without jurisdiction metadata — compliance rules vary per city
- Avoid manual Excel-based scheduling for 10+ employees — no audit trail, no compliance enforcement
- Do not treat gig workers as W-2 employees in the scheduling system — different accrual, OT, and tax rules
- Never auto-approve time-off requests without checking minimum coverage thresholds first
- Avoid forecasting labor from revenue alone — use transaction count (foot traffic proxy) for accuracy

## References

- Deputy API v2 Docs: `https://developer.deputy.com/deputy-docs/docs/getting-started`
- When I Work API: `https://apidocs.wheniwork.com`
- Fair Workweek Laws Summary (2026): `https://workforceinstitute.org/fair-workweek/`
- OR-Tools CP-SAT Scheduler: `https://developers.google.com/optimization/scheduling`
- UKG Dimensions REST API: `https://developer.ukg.com/dimensions`
