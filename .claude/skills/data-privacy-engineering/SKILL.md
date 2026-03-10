# Data Privacy Engineering — Skill

> Privacy-by-design architecture, consent management infrastructure, and DSR/DSAR automation — CMP market growing to $3.6B by 2033, regulators demanding "technical truth" in 2026.

## When to Activate
- Implementing GDPR Article 25 privacy-by-design or CCPA/CPRA compliance in a product
- Building consent management platforms (CMP) with IAB TCF 2.2 or Global Privacy Control support
- Automating DSR/DSAR (Data Subject Request / Data Subject Access Request) workflows
- Designing data retention automation, right-to-erasure, or cross-border transfer compliance

## Core Capabilities

| Area | Description | Key APIs/Tools |
|------|-------------|----------------|
| Consent Management | Granular per-purpose consent, one-click reject, consent versioning | OneTrust API, Secureprivacy SDK, IAB TCF 2.2 |
| DSR/DSAR Automation | Intake, identity verification, data discovery, fulfillment, audit log | Transcend API, OneTrust DSAR Workflow |
| Data Mapping | Auto-discover data flows, classify personal data, document processing purposes | BigID, Securiti.ai, OneTrust Data Inventory |
| Privacy Impact Assessment | PIA/DPIA templates, risk scoring, record of processing activities (RoPA) | OneTrust PIA module, custom DPIA workflow |
| Data Retention | Policy-based auto-deletion or anonymization per retention schedule | Custom scheduler + database TTL + S3 Lifecycle |
| Right-to-Erasure | Cascade delete across primary + replica + backups with verification receipt | Transcend Erasure API, custom graph traversal |
| Cookie Governance | Cookie scan, classification, consent-gated loading, re-consent on policy change | Cookiebot API, OneTrust Cookie Consent |
| Cross-Border Transfer | SCCs, BCRs, adequacy decisions, transfer impact assessments | OneTrust Transfer Risk module |

## Architecture Patterns

- **Privacy-by-Design (GDPR Art. 25):** Data minimization at collection layer → purpose limitation enforced in API layer → consent checked before data processing → encryption at rest (AES-256) + in transit (TLS 1.3) → audit log on every personal data access
- **Consent Infrastructure:** User visits site → CMP SDK loads → check stored consent (localStorage + server-side) → Global Privacy Control header detected → auto-honor GPC as opt-out → render consent banner (ONLY if no valid consent) → user choice → store consent record with timestamp, version, jurisdiction → downstream tag/pixel firing gated on consent purposes
- **DSR Automation Pipeline:** Request intake (web form / email) → identity verification (ID document match or account login MFA) → data discovery scan across all systems → compile portable data package (JSON/PDF) → deliver within SLA (GDPR: 30 days, CCPA: 45 days) → audit record → auto-close ticket
- **Right-to-Erasure:** Erasure request received → legal hold check → cascade delete: primary DB (SQL DELETE with personal data columns) → replicas sync → anonymize in analytics (replace PII with UUID) → purge from search index → request backup purge (scheduled) → generate erasure certificate

## Key Technologies & APIs

- **OneTrust API:** `https://developer.onetrust.com` — consent records, DSAR workflow, data mapping, cookie scan
- **Transcend API:** `https://docs.transcend.io` — privacy request automation, data silo connectors, erasure workflows
- **Secureprivacy API:** `https://secureprivacy.ai/developers` — CMP SDK, consent storage, compliance monitoring
- **IAB TCF 2.2:** `https://iabeurope.eu/tcf-2-2/` — Transparency & Consent Framework for adtech consent signals
- **Global Privacy Control:** HTTP header `Sec-GPC: 1` — must be honored as opt-out in CA, CO, CT, VA, OR
- **Cookiebot API:** `https://www.cookiebot.com/en/developer/` — cookie scanning, consent widget, consent log export
- **BigID:** Data discovery and classification for DSAR fulfillment across databases, S3, SaaS
- **AWS S3 Lifecycle Policies:** Auto-expire objects containing personal data per retention schedule
- **PostgreSQL Row-Level Security:** Enforce data access by purpose/role at database layer

## Implementation Checklist

- [ ] Document RoPA (Record of Processing Activities): data category, purpose, legal basis, retention period, recipients, transfers
- [ ] Implement consent collection with purpose granularity: analytics, marketing, functional, personalization — separate checkboxes
- [ ] Add Global Privacy Control header detection: `request.headers['sec-gpc'] === '1'` → set opt-out for CA/CO/CT visitors
- [ ] Build consent versioning: store consent_version alongside consent_timestamp — re-consent required on policy change
- [ ] Create DSAR intake form with identity verification step before any data disclosure
- [ ] Implement data discovery connectors: map personal data across DB tables, S3 buckets, SaaS tools
- [ ] Set up retention policy engine: cron job checks `created_at + retention_days` → anonymize or delete
- [ ] Build erasure cascade: identify all tables with user_id FK → delete or anonymize in transaction → verify no orphaned records
- [ ] Configure cookie scanner to run weekly — detect new cookies before they fire without consent
- [ ] Implement audit log: every read/write on personal data fields logged with actor, purpose, timestamp

## Best Practices

- Treat consent as a first-class identity attribute — store alongside user record, not in a separate silo
- Honor Global Privacy Control as opt-out by default in regulated US states — regulators are actively enforcing in 2026
- Separate consent storage from analytics processing — if consent is revoked, downstream processing must stop within 24h
- Use purpose-based data access control in the API layer: `if (!consent.includes('analytics')) return null` before returning personal data
- Design erasure as graph traversal — map all FK relationships first, then delete leaf nodes before parent records
- Generate machine-readable consent receipts (ISO 27560 format) — required for audits and user portability
- Run PIAs before launching new data processing activities, not after — Art. 35 GDPR requires pre-launch assessment for high-risk processing

## Anti-Patterns

- Never use pre-ticked consent checkboxes — invalid under GDPR, ePrivacy, and CCPA; regulators actively issue fines
- Avoid bundling consent for multiple purposes in a single "I agree" — each purpose needs separate, granular consent
- Do not store consent as a boolean flag only — you need purpose, version, timestamp, jurisdiction, and withdrawal date
- Never soft-delete personal data records and call it erasure — anonymization (irreversible) or hard delete required
- Avoid cookie consent that only blocks banner but still fires pixels — technical implementation must match consent state
- Do not treat DSAR as a manual process for > 100 requests/month — automation required to meet 30/45-day SLAs at scale

## References

- GDPR Article 25 (Privacy by Design): `https://gdpr-info.eu/art-25-gdpr/`
- IAB TCF 2.2 Specification: `https://iabeurope.eu/tcf-2-2/`
- Global Privacy Control Spec: `https://globalprivacycontrol.org/`
- OneTrust Developer Portal: `https://developer.onetrust.com`
- Transcend Privacy Engineering Docs: `https://docs.transcend.io`
- ISO 27560 Consent Record Standard: `https://www.iso.org/standard/80392.html`
