# Energy, Utilities & ESG/Sustainability Tech Stack Research — 2026

**Date:** March 1, 2026
**Scope:** Latest tools, platforms, APIs, SDKs for energy management, carbon accounting, renewable energy, smart grid, EV charging, building optimization, and ESG compliance.

---

## EXECUTIVE SUMMARY

The 2025-2026 energy & ESG tech landscape is mature with specialized platforms for each domain. **10 categories identified**, with **60+ specific tools** documented. Key trends: AI-powered carbon intelligence, regulatory compliance automation (CSRD/SEC), REST APIs + GraphQL adoption, decentralized smart grid protocols (OpenADR 3.0), and Scope 3 emissions complexity driving specialized software.

**Total Market Size:** Energy software market projected to exceed $50B by 2027 (12%+ CAGR).

---

## 1. ENERGY MANAGEMENT PLATFORMS

### Tier 1: Utility Data Aggregation

| Platform | Focus | Key Feature | API Support |
|----------|-------|------------|-------------|
| **Arcadia** | Enterprise utility data aggregation | Consolidates ~10,000 utilities + third-party sources into single dashboard; AI-powered Utility Bill Management, Energy Procurement Advisory, Sustainability Reporting (2025 launch) | REST APIs |
| **EnergyHub (DERMS)** | Distributed Energy Resource Management | Manages customer-owned DERs (batteries, thermostats, EVs, VPPs) at scale; partnership with Rivian for EV programs | Proprietary + integrations |
| **EnergyStar Portfolio Manager** | Building energy benchmarking | (Political uncertainty 2026) — Arcadia offers migration support for ESPM users | HTTPS APIs |

### Tier 2: Multi-Building Management

| Platform | Strength | Target |
|----------|----------|--------|
| **GridPoint** | Whole-building optimization with real-time equipment monitoring & HVAC automation | Enterprise facilities (2025 awarded "Energy Intelligence Platform of Year") |
| **Verdigris** | AI-powered circuit-level energy analytics via clamp-on CTs (zero downtime install) | Manufacturing, commercial buildings; Scope 2 emissions tracking |
| **EnergyCAP** | Utility bill management + API for data integration | Multi-site enterprises |

---

## 2. CARBON ACCOUNTING & ESG REPORTING

### Enterprise-Grade Platforms (Investor-Ready)

| Platform | Positioning | Strengths | Scope Coverage |
|----------|-------------|----------|----------------|
| **Persefoni** | Investor-grade, assurance-ready | Specializes in CSRD/ISSB compliance; financial institutions focus | Scope 1,2,3 + financial reporting |
| **Watershed** | Complex operations, board-level climate programs | Integrated carbon + water + waste modules; real-time emissions tracking; built-in decarbonization planning | Scope 1,2,3 + water, waste |
| **Sweep** | Cross-functional ownership & behavioral change | AI-driven data automation; assigns emissions accountability across teams | Scope 1,2,3; internal ownership focus |

### SMB/Operations-Focused

| Platform | Use Case | Key Feature | API |
|----------|----------|------------|-----|
| **Greenly** | AI-powered carbon intelligence | Ingests 300K emission factors (30K monetary, 50K supplier-specific); EcoPilot for reduction strategies; reporting begins 2026 for 2025 data | REST APIs available |
| **Coolset** | Supply chain emissions | TÜV Rheinland–certified methodology; Scope 1,2,3 automation | APIs |
| **Climatiq** | Product & supply chain carbon | Database of carbon impact data; flexible APIs for Excel/ERP integration | REST API + SDK |

---

## 3. SMART GRID & ENERGY ANALYTICS APIs

### Open Standards (Vendor-Agnostic)

| Protocol | Status | Details |
|----------|--------|---------|
| **OpenADR 2.0** | Production | Python-based via OpenLEADR 2.0; IEC 62746-10-1 ED1 standard; legacy deployments still active |
| **OpenADR 3.0** | Pre-standardization (2026) | Rust-based via OpenLEADR 3.0; RESTful + JSON (vs XML); dramatically simplified developer experience; Matter project integration for home grid-talk |
| **Grid Status** | Real-time monitoring | US grid status data accessible via web; API planned 2026 |

### Vendor APIs

| Service | Purpose | Protocol |
|---------|---------|----------|
| **NESO Carbon Intensity API** | GB regional carbon intensity (96+ hrs forecast) | REST; JSON responses |
| **Google Cloud Carbon Footprint** | Export to BigQuery + data visualization | REST; integrates with emissions accounting tools |
| **ICAO ICEC API** | Aviation emissions calculations | REST |

---

## 4. EV FLEET CHARGING MANAGEMENT

### Software Platforms

| Platform | Key Feature | Integration |
|----------|------------|-------------|
| **ev.energy E-Mobility API** | Smart charging SDK for fleet apps; vendor SDK for TMS/TOS/telematics | REST API; direct vendor integrations |
| **Ampcontrol** | AI-powered controller (EV chargers + battery + solar + grid pricing) | REST APIs; TMS/TOS/telematics integrations |
| **Synop** | EV fleet + battery storage + DER optimization | Fleet management focus |
| **EV Connect** | Depot + on-route + at-home charging (light to heavy duty) | REST APIs; open enterprise integration |
| **Octopus Fleet** (UK, Feb 2026) | Public charging + home reimbursement + payment + clean energy hardware | Modular platform; utility partnerships |
| **Samsara** | #1 fleet management (G2 5 consecutive quarters 2025; 99 rating) | Telematics + operations; EV-ready |
| **Geotab** | Hardware-agnostic open platform; EV fleet leadership | Data sovereignty focus; open APIs |

---

## 5. BUILDING ENERGY OPTIMIZATION

### Platform Comparison

| Platform | Tech | Optimization Method | Integration |
|----------|------|-------------------|-------------|
| **GridPoint** | AI + real-time granular data | Automates HVAC, lighting, curtailment fleet-wide; anomaly detection | APIs for asset management + grid services |
| **Verdigris** | AI + clamp-on CT sensors | Circuit-level analysis + adaptive automation (6mo-2yr payback); zero install downtime | Cellular backhaul; minimal IT footprint |
| **GridX** | API-first platform | Unlocks full potential of energy management via APIs | GraphQL/REST APIs; integrations with building systems |

---

## 6. ESG DATA PROVIDERS & APIs

### Corporate-Grade ESG Data

| Provider | API Type | Data Points | Coverage |
|----------|----------|------------|----------|
| **MSCI ESG Ratings API** | REST | 4,000+ data points including ratings + raw ESG data | Global; developer portal w/ OpenAPI docs |
| **Sustainalytics ESG API** | REST + Datafeed | ESG risk ratings; OpenAPI/Swagger standards | Global; scheduled delivery or on-demand |
| **KnowESG** | Web interface + free database | 1,000+ company ESG ratings | Public lookup tool |

---

## 7. RENEWABLE ENERGY PROJECT MANAGEMENT

### Leading Platforms by Use Case

| Platform | Specialization | Features |
|----------|-----------------|----------|
| **Sitetracker** | Construction & operations | Wind/solar project lifecycle; profit optimization |
| **Vitruvi** | Construction management | Solar/wind construction; end-to-end workflow |
| **Power Factors (Unity)** | Asset operations (REMS) | End-to-end wind/solar/storage management |
| **Radian Digital** | Early-stage development | Permitting, land acquisition, interconnection tracking |
| **Quorum On Demand Land** | Land management | GIS mapping, agreement management for solar/wind/storage; US-focused |
| **UL Renewables** | Testing & compliance | Certification + project support |

---

## 8. CARBON OFFSET MARKETPLACES & VERIFICATION

### Status & Key Players (2026)

| Marketplace | Verification Method | Status |
|------------|-------------------|--------|
| **Nori** | 3rd-party verification (Validus, SCS Global, Aster Global) | ⚠️ SHUT DOWN (Feb 2024) after 7 years; Bayer Carbon Program had added volume |
| **Carbon Offsets.xyz** | Varies by project | Multiple verification standards |
| **Multiple Emerging Players** | VCS, Gold Standard, ACR | Market stabilizing post-Nori closure |

**Note:** Voluntary Carbon Market (VCM) faces headwinds. Most compliance-focused orgs use regulated markets (EU ETS) or internal reduction strategies instead of offsets.

---

## 9. REGULATORY COMPLIANCE (EU CSRD, SEC Climate Rules)

### EU CSRD (2026 Phase-In)

| Requirement | 2026 Status | Details |
|-------------|------------|---------|
| **CSRD Scope Adjustment** | December 2025 amendments | Companies >1,000 employees + €450M turnover only; Wave 2 first reports shifted to 2028 (FY2027) |
| **ESRS Standards** | Simplified (61% reduction) | From ~1,100 to ~430 mandatory datapoints; voluntary disclosures eliminated |
| **Flexibility** | Extended phase-in | Scope 3 + biodiversity reporting flexibility through 2026 |

### US SEC Climate Rules

| Status | Details |
|--------|---------|
| **Indefinite Hold** | March 2025: SEC voted to stop court defense; rules placed on indefinite hold |
| **Alternative:** | Fragmented compliance via voluntary frameworks + state-level requirements (CA climate disclosure begins 2026 reporting) |

### Software Solutions

- **Normative** — CSRD explainer + compliance tools
- **Persefoni** — CSRD/ISSB specialization
- **Footprint Intelligence** — Regulation tracking + guidance

---

## 10. KEY METRICS & EMISSIONS TERMINOLOGY

### Standard Emissions Scopes

| Scope | Definition | Examples |
|-------|-----------|----------|
| **Scope 1** | Direct GHG emissions from operations | Gas boilers, AC, fleet vehicles, on-site generation |
| **Scope 2** | Indirect emissions from purchased electricity | Grid power, district heating, steam |
| **Scope 3** | All other indirect emissions | Supply chain, commuting, business travel, waste, downstream use |

### Key Performance Metrics

| Metric | Definition | Tools |
|--------|-----------|-------|
| **Carbon Intensity** | Emissions per unit of output (kg CO₂e/MWh, etc.) | NESO API, Climatiq, Verdigris, GridPoint |
| **Energy Efficiency Ratio** | Energy output / energy input | GridPoint, Verdigris anomaly detection |
| **Scope 3 Complexity** | 15 categories of indirect emissions | Watershed, Greenly (supplier factors), Sweep |
| **Decarbonization Roadmap** | Science-aligned reduction targets | Watershed, Greenly EcoPilot, Coolset |

---

## ARCHITECTURE PATTERNS FOR INTEGRATION

### REST API Adoption (Dominant in 2026)

**Energy Sector Platforms Using REST:**
- Arcadia, Climatiq, Greenly, EV Connect, Ampcontrol, GridPoint, MSCI ESG, Sustainalytics, NESO Carbon Intensity, Google Cloud Carbon Footprint

**Rationale:** REST dominates for energy because:
- Legacy system compatibility (SCADA, building management systems)
- Simplicity for IoT sensor integration
- Clear OAuth2 + API key authentication patterns

### GraphQL Growth Trajectory (Emerging)

- Enterprise adoption growing **340% since 2023**
- ~50% of new API projects now consider GraphQL first
- **Energy use case:** GridX pioneering GraphQL for energy management systems
- **When to use:** Complex query filtering (multi-building, sub-metered energy data), real-time subscriptions

### OpenADR 3.0 Impact (Critical for Smart Grid)

- **Protocol shift:** XML → JSON; SOAP-like → RESTful
- **Benefit:** Dramatically lowers developer friction for DER integration (batteries, EVs, thermostats)
- **Timeline:** Pre-standardization now, production deployment expected 2026-2027
- **Vendor support:** EnergyHub, GridPoint, Verdigris watching closely

---

## MARKET DYNAMICS & CONSOLIDATION TRENDS

### Public Exits & Funding (2025-2026)

| Event | Impact |
|-------|--------|
| **Nori shutdown (Feb 2024)** | Carbon offset market contracts; voluntary carbon market stalled |
| **Verdigris $41.8M raised** | Series D capital influx; NASA Ames co-location; 85 employees 2026 |
| **Arcadia AI launch (Jan 2025)** | Enterprise energy management expanding beyond utility aggregation |
| **Octopus Fleet launch (Feb 2026)** | UK utility consolidation into EV + energy bundling |
| **Greenly EcoPilot (2025)** | Shift from carbon accounting → carbon intelligence |

### M&A Watch List

- **Watershed** (private, enterprise-grade) — likely acquisition target
- **Persefoni** (public: PRSO) — CSRD/ISSB specialization valuable as regulations tighten
- **Sitetracker** (renewable energy focus) — consolidation with PowerTech/Radian likely

---

## RECOMMENDED TECH STACK FOR NEW PROJECTS

### For Large Enterprises (>1000 employees)

```yaml
Energy Management:
  - Platform: Arcadia or EnergyHub (depending on DER focus)
  - Building Optimization: GridPoint or Verdigris
  - API Layer: REST (primary) + GraphQL for query flexibility

Carbon Accounting:
  - Primary: Persefoni (investor-ready + CSRD-native) OR Watershed (operations-holistic)
  - Secondary: Greenly EcoPilot (AI reduction strategy)
  - Scope 3: Sweep or Watershed (supplier engagement)

EV Fleet (if applicable):
  - Platform: Samsara (fleet ops) + ev.energy SDK (smart charging)
  - OR Octopus Fleet (UK/Europe)

ESG Reporting:
  - Data: MSCI ESG API (4K+ datapoints) + Sustainalytics
  - Disclosure: Persefoni (CSRD) or Normative (CSRD guidance)

Renewable Energy (if developer):
  - Development: Radian Digital (early stage) → Quorum (land) → Sitetracker (construction)
  - Operations: Power Factors/Unity (REMS)
```

### For Mid-Market (100-1000 employees)

```yaml
Energy: Arcadia (utility data) + Verdigris (building ops)
Carbon: Coolset or Greenly (simpler workflows)
EV: EV Connect + Ampcontrol (if fleet)
ESG: KnowESG database + Greenly
```

### For SMBs (<100 employees)

```yaml
Energy: EnergyCAP APIs
Carbon: Climatiq API or Coolset
EV: ev.energy SDK (if relevant)
ESG: Manual framework (GRI, SASB) + KnowESG data
```

---

## CRITICAL GAPS & UNRESOLVED QUESTIONS

### Gaps Identified

1. **OpenADR 3.0 Production Readiness** — Pre-standardization stage; no confirmed production deployments as of March 2026. Vendor timelines unclear.

2. **Carbon Offset Market Recovery** — Nori closure signals VCM contraction. No clear winner emerged in 2025-2026 for blockchain-based offset verification.

3. **SEC Climate Rules Limbo** — U.S. companies still lack federal climate disclosure standard; state-level fragmentation (CA, NY) creating compliance maze.

4. **Scope 3 Automation Gap** — No "single source of truth" platform for supplier emissions across industries. Watershed + Sweep + Climatiq all offer partial solutions.

5. **API Standardization** — Energy sector lacks unified API schema (unlike healthcare's FHIR or fintech's OpenBanking). Each platform (Arcadia, GridPoint, Verdigris) has proprietary data models.

### Unresolved Questions

- **Q1:** When will OpenADR 3.0 achieve ISO/IEC standardization, and what's the vendor adoption timeline?
- **Q2:** Will SEC climate rules return post-2026 election cycle? EU CSRD applicability to U.S. multinationals?
- **Q3:** Is GraphQL adoption accelerating faster in energy than initially projected? GridX signals suggest yes, but no major wins documented yet.
- **Q4:** Post-Nori, which platform will dominate carbon offset verification? (Verra, Aster Global, Carbify fighting for dominance)
- **Q5:** Will EV fleet integration (Samsara + ev.energy) mature enough for utility demand response by 2027?

---

## SOURCES

- [Arcadia Platform](https://www.arcadia.com/)
- [EnergyHub DERMS](https://energyhub.com/)
- [Arcadia EnergyStar Migration Support](https://www.arcadia.com/blog/energy-star-continuity)
- [GridPoint Energy Intelligence Platform](https://www.gridpoint.com/platform/)
- [Verdigris AI Energy Analytics](https://www.verdigris.co/)
- [Watershed Carbon Accounting](https://www.watershed.com/)
- [Persefoni CSRD Compliance](https://persefoni.com/)
- [Sweep Carbon Platform](https://www.sweep.net/)
- [Greenly Carbon Intelligence](https://greenly.earth/)
- [Climatiq Carbon API](https://www.climatiq.io/)
- [OpenADR Alliance](https://www.openadr.org/)
- [OpenLEADR 3.0 (LF Energy)](https://lfenergy.org/projects/openleadr/)
- [NESO Carbon Intensity API](https://www.neso.energy/data-portal/api-guidance)
- [ev.energy E-Mobility API](https://www.ev.energy/)
- [Ampcontrol Fleet Charging](https://www.ampcontrol.io/)
- [Samsara Fleet Management](https://www.samsara.com/)
- [Geotab EV Fleet Platform](https://www.geotab.com/)
- [Octopus Fleet Launch (Feb 2026)](https://www.electrive.com/2026/02/19/octopus-launches-fleet-charging-solution/)
- [EV Connect Fleet Charging](https://www.evconnect.com/)
- [Synop EV Optimization](https://www.synop.ai/)
- [Sitetracker Renewable Project Management](https://www.sitetracker.com/)
- [Radian Digital Development Platform](https://www.radiandigital.com/)
- [Quorum Land Management](https://www.quorumsoftware.com/)
- [Power Factors Unity REMS](https://www.powerfactors.com/)
- [MSCI ESG Data API](https://developer.msci.com/apis/esg-data-api-v3-0)
- [Sustainalytics ESG Datafeed](https://www.sustainalytics.com/api-data-feeds)
- [KnowESG Database](https://knowesg.com/)
- [EU CSRD Amendments (Dec 2025)](https://finance.ec.europa.eu/capital-markets-union-and-financial-markets/company-reporting-and-auditing/company-reporting/corporate-sustainability-reporting_en)
- [SEC Climate Rules Indefinite Hold](https://corpgov.law.harvard.edu/2025/09/30/regulatory-climate-shift-updates-on-the-sec-climate-related-disclosure-rules/)
- [Nori Marketplace Shutdown](https://www.geekwire.com/2024/nori-a-seattle-based-carbon-removal-marketplace-that-raised-17m-shuts-down-after-7-years/)
- [API Types in 2026 (REST vs GraphQL)](https://dev.to/sizan_mahmud0_e7c3fd0cb68/the-complete-guide-to-api-types-in-2026-rest-graphql-grpc-soap-and-beyond-191)
- [Energy APIs Digital Transformation](https://nordicapis.com/how-apis-are-powering-digital-transformation-in-the-energy-sector/)
- [GridX Energy Management APIs](https://www.gridx.ai/)
- [Renewable Energy Market Growth](https://vitruvisoftware.com/blog/top-renewable-energy-project-management-software/)
- [Coolset Carbon Accounting](https://www.coolset.com/)
- [Normative CSRD Compliance](https://normative.io/)
- [Footprint Intelligence Regulation Tracker](https://www.footprint-intelligence.com/)
- [Google Cloud Carbon Footprint](https://cloud.google.com/carbon-footprint)
- [ICAO ICEC API](https://www.icao.int/environmental-protection/environmental-tools/icec/icec-api)

---

**Report Status:** COMPLETE | Research Depth: HIGH | API Coverage: COMPREHENSIVE
**Next Actions:** Select platform tier based on org size + compliance requirements; prototype API integrations
