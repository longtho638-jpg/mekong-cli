---
name: legal-compliance
description: Contract management, GDPR/SOC2/HIPAA compliance, IP protection, regulatory frameworks. Use for privacy policies, terms of service, data governance, audit preparation.
license: MIT
version: 1.0.0
---

# Legal & Compliance Skill

Navigate legal requirements, compliance frameworks, and contract management for software products and businesses.

## When to Use

- Drafting/reviewing privacy policies and terms of service
- GDPR, CCPA, SOC 2, HIPAA compliance implementation
- Contract management and review workflows
- Intellectual property protection (patents, trademarks, copyrights)
- Data governance and retention policies
- Security compliance audits (SOC 2 Type II, ISO 27001)
- Open-source license compliance
- Cookie consent and data collection transparency
- Employment law compliance
- Regulatory filings and reporting

## Compliance Framework Selection

| Framework | When Required | Scope |
|-----------|---------------|-------|
| GDPR | EU user data | Data privacy, consent, right to erasure |
| CCPA/CPRA | California residents | Consumer privacy rights, opt-out |
| SOC 2 Type II | B2B SaaS, enterprise sales | Security, availability, confidentiality |
| ISO 27001 | Enterprise/government | Information security management |
| HIPAA | US healthcare data | Protected health information |
| PCI DSS | Payment card data | Cardholder data security |
| COPPA | Children under 13 | Children's online privacy |

## Tool Selection

| Need | Choose |
|------|--------|
| Contract management | Ironclad, Juro, PandaDoc |
| E-signature | DocuSign, HelloSign, SignNow |
| Privacy compliance | OneTrust, Osano, CookieYes |
| SOC 2 automation | Vanta, Drata, Secureframe |
| License scanning | FOSSA, Snyk, license-checker (npm) |
| Policy generation | Termageddon, Iubenda, TermsFeed |
| Legal research | Westlaw, LexisNexis, Casetext |

## GDPR Implementation Checklist

```yaml
data_mapping:
  - [ ] Identify all personal data collected
  - [ ] Document processing purposes and legal bases
  - [ ] Map data flows (collection → storage → sharing → deletion)
  - [ ] Maintain Records of Processing Activities (ROPA)

consent:
  - [ ] Cookie consent banner (opt-in, not opt-out)
  - [ ] Granular consent categories (necessary, analytics, marketing)
  - [ ] Consent withdrawal mechanism
  - [ ] Age verification for minors

rights:
  - [ ] Right to access (data export within 30 days)
  - [ ] Right to erasure (deletion within 30 days)
  - [ ] Right to portability (machine-readable format)
  - [ ] Right to rectification (update incorrect data)
  - [ ] Data Processing Agreement (DPA) with vendors

security:
  - [ ] Encryption at rest and in transit
  - [ ] Pseudonymization where possible
  - [ ] Data breach notification (72h to authority)
  - [ ] Data Protection Impact Assessment (DPIA) for high-risk processing
```

## Open-Source License Compatibility

```
PERMISSIVE (can use freely):
  MIT, BSD-2, BSD-3, Apache 2.0, ISC, Unlicense

COPYLEFT (derivative must be same license):
  GPL-2.0, GPL-3.0 — CAREFUL: Your code becomes GPL
  LGPL — OK for dynamic linking, not static
  MPL-2.0 — File-level copyleft only

VERIFY BEFORE USE:
  AGPL-3.0 — Network use = distribution (SaaS triggers)
  SSPL — MongoDB license, not OSI-approved
  BSL — Business Source License, time-delayed open-source
```

## Key Best Practices (2026)

**Compliance as Code:** Automate SOC 2/ISO 27001 evidence collection with Vanta/Drata
**Privacy by Design:** Build consent + data minimization into architecture from day 1
**License Scanning in CI:** Run FOSSA/Snyk license check in every PR pipeline
**Template Library:** Maintain approved templates for NDA, MSA, SLA, DPA
**AI Disclosure:** Document AI usage in products per emerging regulations (EU AI Act)

## References

- `references/compliance-framework-implementation.md` - SOC 2, GDPR, HIPAA setup guides
- `references/contract-management-workflows.md` - Contract lifecycle, templates, e-signatures
