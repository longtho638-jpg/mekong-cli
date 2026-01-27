---
name: langfuse
description: LLM observability platform - traces, prompts, evaluations, costs. Open-source alternative to LangSmith.
---

# Langfuse Integration Skill

> **Binh Pháp Chương 13: 用間 (Use of Spies/Intelligence)**
> "Biết tình hình địch là nhờ gián điệp" - Know the enemy through intelligence

## Core Usage

```python
from langfuse import Langfuse
from langfuse.decorators import observe

langfuse = Langfuse()

@observe()
def llm_call(prompt: str):
    return completion(model="gpt-4", messages=[...])
```

## Key Features

- **Traces**: Full visibility into LLM chains
- **Prompts**: Version control, A/B testing
- **Evaluations**: Quality scoring
- **Costs**: Token-level tracking

## LiteLLM Integration

```python
import litellm
litellm.callbacks = ["langfuse"]
```

## WIN-WIN-WIN

- 👑 ANH: Full cost transparency, prompt optimization
- 🏢 AGENCY: Reusable observability for all AI projects
- 🚀 CLIENT: Debug and improve LLM quality
