# Code Standards & Guidelines (v3.0.0)

## 1. Core Principles
- **YAGNI**: No premature functionality
- **KISS**: Prefer simplicity over cleverness
- **DRY**: Single source of truth per concept
- **Type Safe**: Zero `any` types, strict mode always
- **Testable**: Every public method has tests
- **Documented**: Complex logic has docstrings/comments

## 2. Python Code Organization
- **File Naming**: `snake_case` for `.py` files (e.g., `dag_scheduler.py`, `plugin_loader.py`)
- **Test Files**: `test_*.py` (pytest auto-discovery)
- **File Size**: < 200 lines per module
  - Split large files into focused modules
  - Extract utilities to `utils/` subdirectories
- **Imports**: Organize as stdlib, third-party, local (black/isort)
- **Docstrings**: Module + class + public method docstrings (Google style)

## 3. Agent Development Guide

### AgentProtocol Contract
Every agent MUST implement the runtime-checkable protocol:

```python
from src.core.protocols import AgentProtocol
from src.core.agent_base import Task, Result

class MyAgent:
    name: str = "my-agent"

    def plan(self, input_data: str) -> list[Task]:
        """Parse user input into executable tasks."""
        # Return list of Task objects

    def execute(self, task: Task) -> Result:
        """Execute single task. No exceptions — return failed Result."""
        # Return Result(output=str, success=bool)

    def verify(self, result: Result) -> bool:
        """Validate result meets acceptance criteria."""
        # Return True/False
```

### Registration
```python
from src.core.agent_registry import AgentRegistry

registry = AgentRegistry()
registry.register("my-agent", MyAgent())  # instance or class
agent = registry.get("my-agent")  # returns instance
```

## 4. Provider Development Guide

### LLMProvider Subclass
```python
from src.core.providers import LLMProvider, LLMResponse

class MyProvider(LLMProvider):
    @property
    def name(self) -> str:
        return "my-provider"

    def chat(self, messages, model, temperature, max_tokens, json_mode) -> LLMResponse:
        """Send chat request. Raise on error (caller handles failover)."""
        # Return LLMResponse(content=str, model=str, usage=dict)

    def is_available(self) -> bool:
        """Check if provider is ready."""
        # Return True/False
```

### Error Handling
- Raise `LLMProviderError` on failures (enables circuit-breaker fallover)
- Do NOT silently return empty responses
- Include error message for debugging

## 5. Plugin Convention

### Entry Point Registration (PyPI Plugin)
In `setup.cfg` or `pyproject.toml`:
```toml
[project.entry-points."mekong.agents"]
my_agent = "my_package.agents:MyAgent"
```

### Local Plugin (~/.mekong/plugins/)
```python
# ~/.mekong/plugins/my_plugin.py
from src.core.agent_registry import AgentRegistry

def register(registry: AgentRegistry):
    """Called automatically by plugin loader."""
    registry.register("local-agent", MyAgent())
```

## 6. TypeScript / JavaScript
- **Strict Mode**: `strict: true` in `tsconfig.json`
- **Types**:
  - Zero `any` types
  - Explicit return types required
  - Use `interface` for objects, `type` for unions
- **Async/Await**: Prefer over `.then/.catch`
- **Error Handling**:
  - Use `try/catch`
  - Custom error classes
  - Never swallow errors silently

## 7. Python Testing (pytest)
- **Test Location**: `tests/test_*.py`
- **Fixtures**: Use `@pytest.fixture` for setup/teardown
- **Mocking**: Use `unittest.mock` for external dependencies
- **Assertions**: pytest assertions are clearer than unittest
- **Coverage**: `pytest --cov=src` target >80% critical paths

## 8. Code Quality (Python)
- **Linting**: `ruff check src/` (fast, comprehensive)
- **Type Checking**: `mypy src/` (strict mode)
- **Formatting**: `black src/` (line length 100)
- **No Production Logs**: Console logs only in debug mode
- **Comments**: Explain *why* not *what*, docstrings for all public APIs

## 9. Backend (Node.js/Fastify)
- **Architecture**: Controller-Service-Repository pattern
- **Validation**: Zod for schema validation
- **Database**: Prisma ORM with versioned migrations
- **Error Classes**: Custom error classes for domain errors
- **Testing**: Jest + supertest for API tests

## 10. Git Conventions
- **Commits**: Conventional Commits format
  - `feat: [module] - Add agent discovery`
  - `fix: [module] - Fix DAG cycle detection`
  - `refactor: [module] - Simplify provider failover`
  - `docs: Update plugin guide`
  - `test: Add coverage for scheduler`
- **Branches**: Feature off `main`, no force-push to `main`
- **No Secrets**: API keys, env files must NOT be committed

## 11. Documentation
- Update `docs/` when architecture/features change
- Inline comments for complex algorithms only
- `README.md` in every package explaining setup/run/test
- Examples in docstrings for non-obvious APIs
- Deprecations flagged with `# Deprecated: ...` comments
