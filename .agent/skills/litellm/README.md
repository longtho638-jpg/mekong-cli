# LiteLLM Skill

This skill integrates [LiteLLM](https://github.com/BerriAI/litellm) into the Antigravity Agent system. LiteLLM provides a unified interface to call 100+ LLM APIs using the OpenAI format.

## Features

- **Unified Interface**: Call Gemini, Claude, OpenAI, and more with the same code.
- **Cost Tracking**: Built-in support for tracking token usage and costs.
- **Failover**: Can be configured to failover between models (not demonstrated in basic skill).

## Usage

Run the skill using the python script directly or import `run_litellm_task`.

```bash
python .agent/skills/litellm/skill.py "Explain the A2A protocol"
```

## Requirements

- `litellm`
- `GEMINI_API_KEY` (or other provider keys)
