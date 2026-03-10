# Compliance Automation — 第四篇 軍形 (Security & Defense)

> AML/KYC automation, regulatory compliance pipelines, perpetual monitoring.

## Khi Nao Kich Hoat

Keywords: `compliance`, `AML`, `KYC`, `regtech`, `regulatory`, `anti-money-laundering`, `sanctions`, `screening`, `onboarding verification`

## Vai Tro

1. **Compliance Pipeline Design** — AML/KYC onboarding flows, risk scoring, sanctions screening
2. **Perpetual KYC** — Continuous monitoring, trigger-based re-verification, behavioral anomaly detection
3. **Regulatory Reporting** — Automated SAR/STR filing, audit trail generation, cross-jurisdiction mapping
4. **Integration Patterns** — Identity providers, PEP/sanctions databases, transaction monitoring systems

## Nghien Cuu (2026)

- RegTech market projected $60B+ by 2030 — AI-driven AML/KYC is the largest segment
- Australia's AML/CTF overhaul effective March 2026 — biggest regulatory change in a decade
- EU AI Act classifies biometric ID and credit scoring as high-risk — strict governance mandated
- Perpetual KYC replacing periodic reviews — real-time triggers vs annual batch checks
- 3/4 AI platforms will include built-in responsible AI tools by 2027 (Gartner)

## Cong Cu & Frameworks

| Tool | Use Case | Type |
|------|----------|------|
| Onfido / Jumio | Identity verification | SaaS API |
| ComplyAdvantage | AML data, sanctions screening | SaaS API |
| Sumsub | KYC/KYB onboarding | SaaS API |
| Chainalysis | Crypto transaction monitoring | SaaS API |
| Open Sanctions | PEP & sanctions lists (OSS) | Open Data |
| Plaid (Identity) | Bank account verification | SaaS API |

## Architecture Patterns

```
User Onboarding
  → Identity Verification (Onfido/Sumsub)
  → Sanctions Screening (ComplyAdvantage)
  → Risk Score Calculation (ML model)
  → Decision Engine (approve/review/reject)
  → Continuous Monitoring (perpetual KYC)
  → SAR Auto-Filing (if threshold exceeded)
```

## Implementation Checklist

- [ ] KYC onboarding flow with multi-provider fallback
- [ ] Sanctions screening pipeline (PEP + adverse media)
- [ ] Risk scoring engine (rule-based + ML hybrid)
- [ ] Transaction monitoring with anomaly detection
- [ ] Regulatory report generation (SAR/STR)
- [ ] Audit trail with immutable logging
- [ ] Webhook-based continuous monitoring triggers

## Lien Ket

- Skills: `regtech-compliance`, `fintech-banking`, `legal-compliance`, `data-privacy-engineering`
- SDK: `@agencyos/vibe-compliance-auto`
- Sources: [RegTech AML 2026](https://www.analyticsinsight.net/fintech/how-to-strengthen-aml-compliance-frameworks-for-2026), [AI Compliance](https://research.aimultiple.com/ai-compliance/)
