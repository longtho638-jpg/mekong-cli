# DSPy Skill

This skill integrates **DSPy** (Declarative Self-improving Language Programs) into the Antigravity ecosystem.

## Overview
DSPy allows us to program LLMs using declarative signatures and modules, rather than raw prompt engineering. It also supports compiling (optimizing) these modules.

## Components
- `skill.py`: Contains the core logic, signatures, and modules.

## Usage

```python
from .agent.skills.dspy.skill import run_dspy_task

answer = run_dspy_task("What is the capital of France?")
print(answer)
```

## CLI Usage
You can test the skill directly:
```bash
python3 .agent/skills/dspy/skill.py "Your question here"
```

## Configuration
Requires `GEMINI_API_KEY` or `OPENAI_API_KEY` to be set in the environment.
