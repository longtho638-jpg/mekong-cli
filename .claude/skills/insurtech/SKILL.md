---
name: insurtech
description: "Insurance technology — claims automation, underwriting AI, parametric insurance, risk modeling. Activate when building insurance platforms, claims pipelines, or embedded insurance products."
source: research-driven-2026
license: MIT
version: 1.0.0
---

# InsurTech — Skill

> Global insurtech funding rebounded to $4.2B in 2025 as AI-driven underwriting and parametric products reshape the $7T insurance industry.

## When to Activate
- Building claims intake, triage, or settlement automation
- Implementing underwriting scoring or risk models
- Designing parametric (event-triggered) insurance products
- Integrating with policy management / core insurance systems
- Adding fraud detection or anomaly scoring to claims
- Embedding insurance into non-insurance products (embedded insurance)
- Connecting to telematics or IoT data for UBI (usage-based insurance)

## Core Capabilities
| Area | Description | Key APIs/Tools |
|------|-------------|----------------|
| Claims Automation | AI-driven FNOL intake, damage assessment, straight-through processing | Shift Technology, Google Vision AI |
| Underwriting AI | Risk scoring, appetite matching, automated decisioning | Guidewire, Duck Creek, Socotra |
| Fraud Detection | Real-time anomaly detection, network analysis, link analysis | Shift Technology, FRISS |
| Parametric Insurance | Trigger definition, oracle integration, automatic payout | Chainlink oracles, Etherisc |
| Policy Management | Policy lifecycle CRUD, endorsements, renewals | Socotra Platform API, Duck Creek |
| Actuarial Modeling | Loss ratio prediction, reserve estimation, CAT modeling | R actuarial libs, AWS SageMaker |

## Architecture Patterns
```python
# Parametric insurance trigger pattern
async def check_parametric_trigger(policy_id: str, event_data: dict) -> PayoutDecision:
    policy = await policy_store.get(policy_id)
    oracle_value = await oracle.fetch(policy.trigger_index)  # e.g., rainfall mm, wind speed
    if oracle_value >= policy.trigger_threshold:
        payout = calculate_payout(oracle_value, policy.coverage_tiers)
        await payment_gateway.initiate(policy.beneficiary, payout)
        return PayoutDecision(triggered=True, amount=payout)
    return PayoutDecision(triggered=False)
```

## Key Providers & APIs
| Provider | Use Case | Pricing Model |
|----------|----------|---------------|
| Lemonade API | Embedded renters/home/pet insurance | Revenue share |
| Guidewire Cloud | Core policy + claims + billing platform | Enterprise SaaS |
| Duck Creek | P&C insurance SaaS suite | Per-policy fee |
| Socotra | Modern policy admin platform, REST API-first | Usage-based |
| Shift Technology | AI fraud detection + claims automation | Per-claim fee |
| Etherisc | Decentralized parametric insurance protocol | Open source + GAS |

## Related Skills
- `wearable-health-iot` — UBI telematics data, health insurance triggers
- `carbon-credit-trading` — Climate/parametric product data feeds
- `regtech` — KYC/AML for policyholder onboarding, sanctions screening
