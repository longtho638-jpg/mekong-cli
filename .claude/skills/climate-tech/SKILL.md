# Climate Tech — Skill

> Carbon markets, ESG compliance automation, and green energy platform engineering.

## When to Activate
- User needs carbon credit tracking, offset verification, or emissions reporting
- Building ESG compliance dashboards or sustainability reporting pipelines
- Developing green energy marketplace or renewable energy data analytics
- Implementing carbon footprint calculators or Scope 1/2/3 emissions accounting

## Core Capabilities

| Area | Description |
|------|-------------|
| Carbon Markets | Carbon credit issuance, trading, retirement, registry integration (Verra, Gold Standard) |
| ESG Reporting | GHG Protocol compliance, TCFD/CSRD/SEC disclosure automation |
| Emissions Tracking | Scope 1/2/3 data ingestion, activity-based emission factor mapping |
| Green Energy | Renewable energy certificate (REC) management, virtual PPA modeling |
| Climate Analytics | Climate risk modeling, scenario analysis (RCP 1.5°C / 2°C pathways) |

## Architecture Patterns

- **Emissions Data Pipeline:** IoT sensor → ETL → emission factor DB → CO2e aggregation → reporting API
- **Carbon Registry Bridge:** On-chain tokenized credits (ERC-1155) ↔ off-chain Verra/Gold Standard API sync
- **ESG Disclosure Engine:** Data collection forms → validation rules → XBRL/iXBRL report generation → audit trail
- **Green Energy Matching:** 24/7 hourly energy matching — renewable generation certificates aligned to consumption intervals

## Key Technologies

- **APIs:** Climate TRACE, EPA eGRID, IEA API, Electricity Maps, Carbon Interface
- **Standards:** GHG Protocol, ISO 14064, TCFD, CSRD, SEC Climate Rule, SBTi
- **Data Formats:** XBRL, JSON-LD for ESG, GeoJSON for asset mapping
- **Stack:** Python (pandas, OpenMethane), FastAPI, PostgreSQL + TimescaleDB, Kafka for streaming sensor data
- **Blockchain:** Polygon/Ethereum for tokenized carbon credits, Chainlink oracles for price feeds

## Implementation Checklist

- [ ] Define emission boundary (Scope 1/2/3 inclusions per GHG Protocol)
- [ ] Map activity data sources to emission factors (IPCC AR6 or EPA defaults)
- [ ] Build data ingestion adapters (utility bills, fleet telematics, supplier surveys)
- [ ] Implement calculation engine with unit normalization (MWh → kgCO2e)
- [ ] Integrate carbon registry API for credit issuance/retirement verification
- [ ] Generate disclosure reports aligned to TCFD/CSRD framework
- [ ] Add audit trail with immutable event log for regulatory defensibility
- [ ] Set up automated alerts for emission target deviations

## Best Practices

- Always use activity-based emission factors over spend-based where possible — more accurate
- Apply data quality tiers (ISO 14064-1 Annex B) — label each data point with confidence level
- Store raw activity data separately from calculated CO2e — recalculate when factors update
- Version-control emission factor databases; IPCC updates factors per assessment report cycle
- Use double-entry carbon accounting: every credit issued has a corresponding liability until retired

## Anti-Patterns

- Do not aggregate Scope 3 categories without supplier-specific data — use industry averages only as fallback
- Avoid self-reported emission factors without third-party verification — greenwashing liability
- Never retire carbon credits on behalf of clients without explicit instruction + documented consent
- Do not conflate RECs with carbon offsets — electricity attribute certificates ≠ carbon neutrality claims
