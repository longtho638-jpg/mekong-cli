---
title: "Phase 2: Dependency Optimization"
description: "Move optional dependencies, reduce binary size"
priority: P2
status: pending
effort: 1 day
---

# Phase 2: Dependency Optimization

## Overview

Reduce binary size by moving heavy dependencies to optional extras and lazy loading.

## Key Insights

From `pyproject.toml` analysis:

**Heavy dependencies that can be optional:**
- `stripe` (^7.10.0) - Only for billing commands
- `prometheus-client` (^0.24.1) - Only for metrics endpoint
- `uvicorn` (standard) - Only for gateway command
- `mem0ai`, `qdrant-client` - Already optional (memory group)

**Must-have dependencies:**
- `typer`, `rich` - Core CLI
- `pydantic`, `pydantic-settings` - Config validation
- `requests`, `python-dotenv` - HTTP and env loading
- `python-jose`, `cryptography`, `passlib`, `authlib` - RaaS auth

## Requirements

### Functional
- `mekong cook`, `mekong plan`, `mekong agent` work without optional deps
- Gateway command requires uvicorn (install separately or via extras)
- Billing commands require stripe (install separately or via extras)

### Non-Functional
- Binary size reduction: 30MB → 25MB
- Startup time improvement: 0.5s → 0.3s

## Architecture

```
pyproject.toml
├── [tool.poetry.dependencies]     # Core deps (always included)
├── [tool.poetry.group.dev]        # Dev only
├── [tool.poetry.group.build]      # PyInstaller
├── [tool.poetry.extras]           # Optional extras
│   ├── gateway = [uvicorn, fastapi, prometheus-client]
│   ├── billing = [stripe]
│   └── memory  = [mem0ai, qdrant-client]
```

## Related Code Files

### Modify
- `pyproject.toml` - Reorganize dependencies
- `src/main.py` - Lazy import optional modules
- `src/cli/billing_commands.py` - Try/except stripe import
- `src/core/gateway.py` - Try/except uvicorn import

### Create
- None (no new files needed)

### Delete
- None

## Implementation Steps

### Step 1: Reorganize pyproject.toml

```toml
[tool.poetry.dependencies]
python = "^3.9"
# Core CLI
typer = ">=0.12.0"
rich = "^13.7.0"
pydantic = "^2.5.0"
pydantic-settings = "^2.1.0"
# HTTP & Config
requests = "^2.31.0"
python-dotenv = "^1.0.0"
email-validator = "^2.1.0"
python-multipart = "^0.0.6"
# Logging
structlog = "^24.1.0"
# Database (core)
sqlalchemy = {extras = ["asyncio"], version = "^2.0.25"}
psycopg2-binary = "^2.9.9"
asyncpg = "^0.29.0"
# Auth (RaaS - required)
python-jose = {extras = ["cryptography"], version = "^3.3.0"}
cryptography = "^41.0.0"
passlib = {extras = ["bcrypt"], version = "^1.7.4"}
authlib = "^1.3.0"
# CLI utils
questionary = "^2.1.1"
psutil = "^5.9.0"
jinja2 = "^3.1.3"

# Optional extras
[tool.poetry.extras]
gateway = ["uvicorn", "fastapi", "prometheus-client"]
billing = ["stripe"]
memory = ["mem0ai", "qdrant-client"]

# Dev dependencies
[tool.poetry.group.dev.dependencies]
pytest = "^7.4.0"
pytest-asyncio = "^0.21.1"
pytest-cov = "^4.1.0"
black = "^23.12.0"
ruff = "^0.1.11"
mypy = "^1.8.0"
httpx = ">=0.26.0,<0.28.0"

# Build dependencies
[tool.poetry.group.build.dependencies]
pyinstaller = "^6.0.0"
pyinstaller-hooks-contrib = "^2024.0"
```

### Step 2: Lazy Import in Commands

```python
# src/cli/billing_commands.py
try:
    import stripe
except ImportError:
    stripe = None

@app.command()
def billing_status():
    if stripe is None:
        console.print("[red]Billing extras required:[/red]")
        console.print("  [cyan]pip install mekong-cli[billing][/cyan]")
        raise SystemExit(1)
    # ... rest of command
```

```python
# src/core/gateway.py
try:
    import uvicorn
    from fastapi import FastAPI
except ImportError:
    uvicorn = None
    FastAPI = None

def start_gateway(port: int = 8000):
    if uvicorn is None:
        console.print("[red]Gateway extras required:[/red]")
        console.print("  [cyan]pip install mekong-cli[gateway][/cyan]")
        raise SystemExit(1)
    # ... rest of function
```

### Step 3: Update PyInstaller Spec

```python
# mekong.spec - exclude optional deps
excludes=[
    'stripe',
    'prometheus_client',
    'uvicorn',
    'mem0ai',
    'qdrant_client',
    # Also exclude heavy transitive deps
    'matplotlib',
    'scipy',
    'numpy',
    'pandas',
]
```

### Step 4: Update Build Script

```bash
# scripts/build-binary.sh
# Build with minimal deps
poetry install --only main,build --no-extras

# Then run PyInstaller
poetry run pyinstaller mekong.spec --clean
```

## Todo List

- [ ] Reorganize pyproject.toml dependencies
- [ ] Add lazy imports to billing_commands.py
- [ ] Add lazy imports to gateway.py
- [ ] Update PyInstaller spec excludes
- [ ] Update build script for minimal install
- [ ] Test binary without extras
- [ ] Verify size reduction

## Success Criteria

- [ ] `mekong --version` works (core binary)
- [ ] `mekong cook "test"` works
- [ ] `mekong gateway` shows helpful error (gateway extras required)
- [ ] `mekong billing` shows helpful error (billing extras required)
- [ ] Binary size reduced by 5+ MB
- [ ] Startup time < 0.4s

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Core command breaks | Low | High | Test all core commands |
| Import errors hard to debug | Medium | Medium | Clear error messages |
| Circular import issues | Low | Medium | Careful import ordering |

## Security Considerations

- Auth modules (jose, cryptography) MUST remain in core
- Stripe API keys only loaded when billing extras installed
- No secrets in error messages

## Next Steps

After Phase 2 complete:
- Move to Phase 3 (License Caching)
- Binary size should now be ~25MB

---

*Created: 2026-03-07 | Phase: 2/5 | Effort: 1 day*
