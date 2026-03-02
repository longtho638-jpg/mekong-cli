# Code Standards & Contributing Guide

**Mekong CLI** maintains high quality standards to ensure reliability and maintainability. All contributions must follow these guidelines.

## 1. Python Code Standards

### Style Guide

- **Python Version**: 3.9+ (match `pyproject.toml`)
- **Formatter**: Black (line length 100)
- **Linter**: Ruff (with strict settings)
- **Type Checker**: mypy (strict mode)

### Type Hints (Mandatory)

All functions **must** have type hints:

```python
# ✅ CORRECT
def plan(self, goal: str) -> List[Task]:
    """Decompose goal into steps."""
    return [Task(...), Task(...)]

# ❌ WRONG
def plan(self, goal):  # Missing type hints
    return [Task(...), Task(...)]

# ❌ WRONG
def execute(self, task: Task) -> Any:  # Never use Any
    return result
```

**Rule:** Zero `any` types in production code. Use concrete types or generics.

### Docstrings

All classes and public functions **must** have docstrings:

```python
class Executor:
    """Multi-mode task runner supporting shell, LLM, and API execution."""

    def run(self, task: Task) -> ExecutionResult:
        """Execute a single task.

        Args:
            task: Task to execute with mode and command.

        Returns:
            ExecutionResult with exit code, output, and metadata.

        Raises:
            TimeoutError: If step exceeds timeout.
            ProviderError: If LLM provider unavailable.
        """
```

### File Size Limits

Keep files under **200 lines** (excluding comments/docstrings):

```
✅ src/core/executor.py       (180 lines) → Core logic only
✅ src/core/executor_shell.py (120 lines) → Shell runner extracted
❌ src/core/executor.py       (450 lines) → SPLIT INTO MODULES
```

### Naming Conventions

| Type | Style | Example |
|------|-------|---------|
| Module | snake_case | `recipe_parser.py`, `credit_ledger.py` |
| Function | snake_case | `execute_task()`, `verify_result()` |
| Class | PascalCase | `RecipeStep`, `ExecutionResult`, `AgentRegistry` |
| Constant | UPPER_SNAKE_CASE | `MAX_RETRIES = 3`, `DEFAULT_TIMEOUT = 30` |
| Private | `_snake_case` | `_parse_recipe()`, `_validate_input()` |

### Imports

Organize imports in groups:

```python
# Standard library
import json
from pathlib import Path
from typing import Dict, List, Optional

# Third-party
import pydantic
from pydantic import BaseModel, Field

# Local
from src.core.protocols import AgentProtocol
from src.core.executor import ExecutionResult
```

## 2. Agent Development

### AgentProtocol Contract

Every agent must implement the runtime-checkable protocol:

```python
from src.core.protocols import AgentProtocol
from src.core.agent_base import Task, Result

class MyAgent:
    name: str = "my-agent"

    def plan(self, input_data: str) -> List[Task]:
        """Parse input into executable tasks."""
        return [Task(...), Task(...)]

    def execute(self, task: Task) -> Result:
        """Execute single task (no exceptions, return Result)."""
        return Result(output="...", success=True)

    def verify(self, result: Result) -> bool:
        """Validate result meets acceptance criteria."""
        return len(result.output) > 0
```

### Plugin Registration

**PyPI Entry Point:**
```toml
# In pyproject.toml
[project.entry-points."mekong.agents"]
my_agent = "my_package.agents:MyAgent"
```

**Local Plugin:**
```python
# ~/.mekong/plugins/my_plugin.py
from src.core.agent_registry import AgentRegistry

def register(registry: AgentRegistry):
    registry.register("local-agent", MyAgent())
```

## 3. Provider Development

### LLMProvider Subclass

```python
from src.core.providers import LLMProvider, LLMResponse

class CustomProvider(LLMProvider):
    @property
    def name(self) -> str:
        return "custom"

    def chat(
        self,
        messages: List[Dict],
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        json_mode: bool = False
    ) -> LLMResponse:
        """Send chat request to your LLM backend."""
        return LLMResponse(content="...", model=model)
```

## 4. Quality Gates (Required)

### Type Safety

```bash
# Zero any types allowed
grep -r ": any" src/ --include="*.py"  # MUST return 0

# Strict mypy
python3 -m mypy src/ --strict
```

### Tests (>80% Coverage)

```bash
# Run all tests
python3 -m pytest tests/ -v

# Coverage report
python3 -m pytest --cov=src --cov-report=html
```

### Formatting & Linting

```bash
black src/ tests/
ruff check src/ tests/
mypy src/
```

## 5. Commit & PR Workflow

### Commit Messages

Use conventional format:

```
feat(agents): add custom agent registration
fix(executor): handle timeout errors
docs: update API reference
refactor(core): split executor module
test: add DAG scheduler tests
```

### PR Checklist

- [ ] Tests pass: `pytest`
- [ ] Type check: `mypy src/`
- [ ] Format: `black src/`
- [ ] Lint: `ruff check src/`
- [ ] No `any` types added
- [ ] Docstrings updated
- [ ] No secrets in code
- [ ] CHANGELOG.md updated (for features)

## 6. Security Standards

### No Hardcoded Secrets

```python
# ✅ CORRECT
api_key = os.getenv("LLM_API_KEY")

# ❌ WRONG
api_key = "sk-proj-..."
```

### Input Validation

Use Pydantic for all external inputs:

```python
from pydantic import BaseModel, Field

class MissionRequest(BaseModel):
    goal: str = Field(..., min_length=10, max_length=1000)
    priority: int = Field(default=1, ge=1, le=10)
```

## 7. Testing

### Unit Tests

```python
def test_recipe_parser_valid_markdown():
    recipe = RecipeParser.parse("# Goal\n1. Step 1\n2. Step 2")
    assert len(recipe.steps) == 2
```

### Integration Tests

```python
def test_pev_pipeline_success(tmp_path):
    orch = Orchestrator()
    result = orch.cook("Create a Python file")
    assert result.success is True
    assert result.credits_used == 1
```

### Mocking

```python
from unittest.mock import patch

@patch("src.core.providers.OpenAICompatibleProvider.chat")
def test_executor_with_mock_llm(mock_chat):
    mock_chat.return_value = LLMResponse(content="print('hi')")
    result = executor.execute(task)
    assert result.success
```

## 8. Documentation

- Add docstrings to all public functions/classes
- Update CHANGELOG.md for features
- Include examples in docstrings for non-obvious APIs
- API docs auto-generated via FastAPI + OpenAPI

## 9. Getting Help

- **Docs**: `/docs` directory
- **Issues**: GitHub issues for bugs/features
- **Discussions**: GitHub discussions for questions
- **Code Review**: All PRs require code review
