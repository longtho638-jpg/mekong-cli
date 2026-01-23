# Langfuse Skill

This skill integrates [Langfuse](https://langfuse.com) for LLM engineering observability and analytics.

## Features

- **Tracing**: Debug complex agent chains.
- **Prompt Management**: Version control for prompts.
- **Evaluations**: Score model outputs.

## Usage

Set the environment variables to connect to Langfuse Cloud or a self-hosted instance.

```bash
export LANGFUSE_SECRET_KEY="sk-lf-..."
export LANGFUSE_PUBLIC_KEY="pk-lf-..."
export LANGFUSE_HOST="https://cloud.langfuse.com" # or your local host
```

### Integration

Langfuse integrates natively with LiteLLM, LlamaIndex, and other frameworks used in AgencyOS.

```python
from langfuse.decorators import observe

@observe()
def my_agent_function(input):
    # ... logic
    return output
```

## Requirements

- `langfuse` python package (or SDK for JS)
