---
name: regtech
description: "Regulatory technology — KYC/AML automation, compliance monitoring, sanctions screening, transaction surveillance. Activate when building fintech onboarding, compliance pipelines, or regulated financial products."
source: research-driven-2026
license: MIT
version: 1.0.0
---

# RegTech — Skill

> RegTech market hits $22B in 2026 as global AML fines exceeded $10B in 2025, forcing banks and fintechs to automate compliance at scale.

## When to Activate
- Implementing KYC (Know Your Customer) identity verification flows
- Building AML (Anti-Money Laundering) transaction monitoring
- Adding sanctions/PEP screening to onboarding or payments
- Automating regulatory reporting (MiFID II, GDPR, Basel III, FATF)
- Integrating crypto transaction tracing or blockchain analytics
- Designing adverse media monitoring or ongoing due diligence
- Building EDD (Enhanced Due Diligence) workflows for high-risk entities

## Core Capabilities
| Area | Description | Key APIs/Tools |
|------|-------------|----------------|
| Identity Verification | Document OCR, liveness detection, database checks | Onfido, Jumio, Sumsub |
| AML Screening | Real-time transaction scoring, rule engine, SAR filing | ComplyAdvantage, Actimize |
| Sanctions Screening | OFAC, UN, EU lists, PEP databases, adverse media | ComplyAdvantage, Refinitiv |
| Blockchain Analytics | On-chain tracing, wallet risk scoring, mixer detection | Chainalysis, Elliptic |
| Regulatory Reporting | Automated report generation, regulator submission | Axiom SL, Regnology |
| Case Management | Alert triage, investigator workflow, audit trail | NICE Actimize, Oracle FCCM |

## Architecture Patterns
```python
# KYC orchestration pattern with risk-based stepped verification
async def run_kyc_flow(applicant: Applicant) -> KYCDecision:
    # Step 1: Document + liveness check
    doc_result = await onfido.check(applicant.document, applicant.selfie)
    if doc_result.score < 0.8:
        return KYCDecision(status="REJECTED", reason="document_failed")

    # Step 2: Sanctions + PEP screening
    screening = await comply_advantage.screen(
        name=applicant.full_name, dob=applicant.dob, country=applicant.country
    )
    if screening.has_match(risk_levels=["sanction", "pep_tier1"]):
        return KYCDecision(status="MANUAL_REVIEW", matches=screening.matches)

    return KYCDecision(status="APPROVED", risk_band=compute_risk(doc_result, screening))
```

## Key Providers & APIs
| Provider | Use Case | Pricing Model |
|----------|----------|---------------|
| ComplyAdvantage | AML screening + transaction monitoring | Per-check / per-entity |
| Chainalysis | Crypto AML, blockchain forensics | Enterprise license |
| Onfido | Document verification + biometric liveness | Per-check |
| Jumio | KYC/KYB identity platform | Per-verification |
| Sumsub | All-in-one KYC/KYB/AML platform | Volume-based |
| Elliptic | Crypto wallet risk scoring | API per-query |

## Related Skills
- `insurtech` — KYC for policyholder onboarding, fraud detection
- `carbon-credit-trading` — Registry compliance, beneficial ownership verification
- `wearable-health-iot` — HIPAA/GDPR data compliance for health data flows
