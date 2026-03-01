# AI Governance Compliance — 第四篇 軍形 (Security & Defense)

> EU AI Act compliance, model governance, bias detection, explainability, audit trails.

## Khi Nao Kich Hoat

Keywords: `AI governance`, `responsible AI`, `AI compliance`, `EU AI Act`, `model governance`, `bias detection`, `explainability`, `XAI`, `AI audit`, `AI risk management`

## Vai Tro

1. **AI Risk Assessment** — Classify AI systems by risk level (EU AI Act taxonomy), document intended purpose
2. **Bias Detection & Mitigation** — Fairness metrics, protected attribute analysis, debiasing pipelines
3. **Model Monitoring** — Drift detection, performance tracking, incident response workflows
4. **Explainability & Audit** — XAI integration (SHAP/LIME), decision logging, regulatory reporting

## Nghien Cuu (2026)

- EU AI Act enforcement underway 2025-2026 — most comprehensive AI law globally
- High-risk systems (biometric ID, credit scoring) require strict conformity assessments
- AI governance shifted from "nice-to-have" to business-critical necessity
- 3/4 AI platforms will include built-in responsible AI and oversight tools by 2027 (Gartner)
- Key tools: AI governance platforms, bias detection, risk management, security monitoring

## Cong Cu & Frameworks

| Tool | Use Case | Type |
|------|----------|------|
| IBM AI Fairness 360 | Bias detection & mitigation | OSS |
| SHAP | Model explainability | OSS |
| LIME | Local interpretable explanations | OSS |
| Weights & Biases | Model monitoring | SaaS |
| Fiddler AI | AI observability & governance | SaaS |
| Credo AI | AI governance platform | SaaS |

## Architecture Patterns

```
Model Development
  → Risk Classification (EU AI Act levels)
  → Bias Audit (pre-deploy fairness check)
  → Model Registry (versioned, documented)
  → Production Monitoring (drift, perf)
  → Incident Detection (anomaly alerts)
  → Explainability API (SHAP/LIME on-demand)
  → Audit Trail (immutable decision logs)
  → Regulatory Report Generation
```

## Implementation Checklist

- [ ] AI system risk classification engine
- [ ] Bias detection pipeline (demographic parity, equalized odds)
- [ ] Model registry with lineage tracking
- [ ] Production drift monitoring dashboard
- [ ] SHAP/LIME explainability API wrapper
- [ ] Immutable audit trail (append-only logs)
- [ ] EU AI Act compliance report generator
- [ ] Incident response workflow automation

## Lien Ket

- Skills: `ai-safety-red-teaming`, `llmops-ai-observability`, `data-privacy-engineering`, `compliance-automation`
- Sources: [AI Compliance 2026](https://www.wiz.io/academy/ai-security/ai-compliance), [Gartner AI Governance](https://www.gartner.com/en/articles/ai-ethics-governance-and-compliance)
