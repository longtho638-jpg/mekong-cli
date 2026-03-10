---
name: ai-safety-alignment-governance
description: "AI safety, alignment research, responsible AI, model governance, bias detection, EU AI Act compliance — activate when building AI systems requiring safety guardrails, regulatory compliance, or bias auditing"
source: research-driven-2026
license: MIT
version: 1.0.0
---

# AI Safety, Alignment & Governance — Skill

> EU AI Act enforcement began in 2025; organizations deploying high-risk AI systems face mandatory conformity assessments, bias audits, and transparency requirements — making governance a first-class engineering concern.

## When to Activate
- Building AI systems classified as high-risk under EU AI Act (hiring, credit, healthcare)
- Implementing content moderation and output filtering for LLM applications
- Designing Constitutional AI or RLHF-based alignment pipelines
- Auditing models for demographic bias, hallucinations, and toxicity
- Creating AI governance frameworks (model cards, datasheets, risk registers)
- Implementing red-teaming and adversarial testing workflows
- Adding guardrails to LLM outputs in production (input/output validation)

## Core Capabilities
| Area | Description | Key APIs/Tools |
|------|-------------|----------------|
| Guardrails & Filters | Input/output validation, PII detection, toxicity blocking | Guardrails AI, NeMo Guardrails, LangKit |
| Bias & Fairness | Demographic parity, equalized odds, disparate impact audits | Fairlearn, AIF360, Aequitas |
| Hallucination Detection | Faithfulness scoring, RAG answer grounding, RAGAS | RAGAS, TruLens, DeepEval |
| Regulatory Compliance | EU AI Act Article mapping, risk classification, documentation | AWS Responsible AI, Azure AI Content Safety |
| Red-Teaming | Adversarial prompt injection, jailbreak testing, model robustness | Garak, PyRIT (Microsoft), AI Verify |
| Model Cards | Standardized model documentation (intended use, limitations, metrics) | HuggingFace model cards, Google Model Card Toolkit |

## Architecture Patterns
```
[User Input]
      │ PII scrubbing + prompt injection detection
      ▼
[Input Guardrail] — topic filter, jailbreak classifier
      │
      ▼
[LLM / AI Model]
      │
      ▼
[Output Guardrail] — toxicity, hallucination, PII check
      │ fail → safe fallback response
      ▼
[Audit Log] → immutable trace for regulatory review
      │
      ▼
[User Response]
```

```python
from guardrails import Guard
from guardrails.hub import ToxicLanguage, DetectPII

guard = Guard().use_many(
    ToxicLanguage(threshold=0.5, validation_method="sentence", on_fail="fix"),
    DetectPII(pii_entities=["EMAIL_ADDRESS", "PHONE_NUMBER"], on_fail="fix"),
)
validated_output, *rest = guard(
    llm_api=openai.chat.completions.create,
    messages=[{"role": "user", "content": user_input}],
    model="gpt-4o",
)
```

## Key Providers & APIs
| Provider | Use Case | Pricing Model |
|----------|----------|---------------|
| Anthropic Constitutional AI | RLHF + Constitutional AI alignment methodology | Via Claude API |
| OpenAI Moderation API | Free content classification (hate, violence, self-harm) | Free with API usage |
| Guardrails AI | Open-source output validation framework | Free OSS; Hub validators free/paid |
| LangKit / WhyLabs | LLM observability, drift detection, bias monitoring | Free tier; enterprise pricing |
| Azure AI Content Safety | Enterprise content moderation, prompt shields | Per-1K calls pricing |

## Related Skills
- `llm-fine-tuning-mlops` — Alignment techniques (DPO, RLHF) during training
- `backend-development` — Middleware integration for guardrails in API layer
- `security-engineer` — Prompt injection, adversarial robustness testing
