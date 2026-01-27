---
name: litellm
description: Universal LLM API gateway - route to 100+ LLM providers with unified interface. Cost tracking, caching, rate limiting, and failover.
---

# LiteLLM Integration Skill

> **Binh Pháp Chương 2: 作戰 (Resource Management)**
> "Dĩ chiến dưỡng chiến" - Use battle to sustain battle

## Core Usage

```python
from litellm import completion

# Unified API for all providers
response = completion(
    model="gpt-4",  # or "claude-3", "gemini-pro", etc.
    messages=[{"role": "user", "content": "Hello!"}]
)
```

## Key Features

- **100+ Providers**: OpenAI, Anthropic, Google, Azure, Bedrock, etc.
- **Cost Tracking**: `litellm.cost_tracker`
- **Caching**: Redis, in-memory, disk
- **Rate Limiting**: Token-level, request-level
- **Failover**: Auto-retry with different providers

## AgencyOS Integration

```yaml
# litellm_config.yaml
model_list:
    - model_name: fast
      litellm_params:
          model: gemini-3-flash[1m]
    - model_name: deep
      litellm_params:
          model: claude-sonnet-4-5-thinking
```

## WIN-WIN-WIN

- 👑 ANH: 50% cost reduction via smart routing
- 🏢 AGENCY: Universal LLM gateway for all projects
- 🚀 CLIENT: Provider-agnostic AI features
