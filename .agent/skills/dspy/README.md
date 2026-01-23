# DSPy Skill

This skill integrates **DSPy** (Declarative Self-improving Language Programs) into the Antigravity ecosystem.

## Overview

DSPy allows us to program LLMs using declarative signatures and modules, rather than raw prompt engineering. It also supports compiling (optimizing) these modules.

## Components

- `skill.py`: Core logic with basic CoT module
- `signatures.py`: AgencyOS-specific signatures for code review, content gen, task planning

## Available Signatures

### Core Patterns

| Signature        | Description               |
| ---------------- | ------------------------- |
| `ZeroShotQA`     | Direct question answering |
| `FewShotQA`      | QA with example context   |
| `ChainOfThought` | Step-by-step reasoning    |
| `TreeOfThought`  | Multiple reasoning paths  |

### AgencyOS Specific

| Signature             | Description                         |
| --------------------- | ----------------------------------- |
| `CodeReview`          | Review code for issues/improvements |
| `ContentGeneration`   | Marketing/blog content with SEO     |
| `TaskDecomposition`   | Break down complex tasks            |
| `BugAnalysis`         | Analyze bugs and suggest fixes      |
| `RevenueOptimization` | Revenue strategy optimization       |

## Usage

### Basic Question Answering

```python
from .agent.skills.dspy.skill import run_dspy_task

answer = run_dspy_task("What is the capital of France?")
print(answer)
```

### Code Review

```python
from .agent.skills.dspy.signatures import AgencyOSCodeReviewer, setup_dspy_gemini

setup_dspy_gemini()
reviewer = AgencyOSCodeReviewer()
result = reviewer(code="def foo(): pass", language="python")
print(result.issues, result.suggestions, result.score)
```

### Content Generation

```python
from .agent.skills.dspy.signatures import AgencyOSContentWriter, setup_dspy_gemini

setup_dspy_gemini()
writer = AgencyOSContentWriter()
result = writer(topic="AI Automation", tone="professional", audience="CTOs")
print(result.content, result.seo_keywords)
```

### Task Planning

```python
from .agent.skills.dspy.signatures import AgencyOSTaskPlanner, setup_dspy_gemini

setup_dspy_gemini()
planner = AgencyOSTaskPlanner()
result = planner(task="Build MVP in 2 weeks", constraints="1 developer, $5k budget")
print(result.subtasks, result.dependencies)
```

## CLI Usage

```bash
# Basic CoT
python3 .agent/skills/dspy/skill.py "Your question here"

# Test signatures
python3 .agent/skills/dspy/signatures.py
```

## Configuration

Requires `GEMINI_API_KEY` or `OPENAI_API_KEY` to be set in the environment.

## Integration with prompt-engineer.md

This skill implements the patterns defined in `packages/agents/mekongAgent/prompt-engineer.md`:

- Zero-shot/Few-shot prompting
- Chain-of-thought reasoning
- Tree-of-thought exploration
- Template design patterns
- Token optimization strategies
