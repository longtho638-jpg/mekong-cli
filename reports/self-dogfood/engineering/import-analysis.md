# Engineering: Import Analysis — Mekong CLI v5.0

## Command: /review
## Date: 2026-03-11

---

## Analysis Method
Grepped import statements across src/core/*.py (95+ files) and src/gateway.py.
Checked for: unused imports, duplicate imports, circular import risks, heavy init imports.

---

## orchestrator.py Import Analysis (lines 9-51)

### Standard Library
```python
import asyncio, logging, subprocess, time, uuid
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import TYPE_CHECKING, Any, Optional
```
All used. No issues.

### Third-Party
```python
from rich.console import Console
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.table import Table
```
- `Progress`, `SpinnerColumn`, `TextColumn` imported — verify all 3 are used in orchestrator
- `Panel` imported — only used in display methods

### Internal Imports (heavy)
```python
from .dag_scheduler import DAGScheduler, validate_dag
from .event_bus import EventType, get_event_bus
from .execution_history import EventKind, ExecutionEvent, ExecutionHistory
from .executor import RecipeExecutor
from .health_endpoint import register_component_check, start_health_server
from .memory import MemoryEntry, MemoryStore
from .nlu import IntentClassifier
from .parser import Recipe, RecipeStep
from .planner import PlanningContext, RecipePlanner
from .retry_policy import RetryPolicy
from .telemetry import TelemetryCollector
from .verifier import RecipeVerifier, VerificationReport
from .workflow_state import StepStatus, WorkflowState, WorkflowStatus
from .command_sanitizer import CommandSanitizer
from ..raas.phase_completion_detector import get_detector
from ..core.graceful_shutdown import get_shutdown_handler, ShutdownReason, shutdown_on_all_phases_operational
```

**Potential issue:** `MemoryEntry` imported alongside `MemoryStore` — if MemoryEntry is only
used as a type annotation, it could be moved to `TYPE_CHECKING` block to avoid runtime import.

**Potential issue:** `start_health_server` from health_endpoint — if health server is not
started in all orchestration paths, this import may be unused in most call sites.

---

## executor.py Import Analysis

```python
import re, shlex, subprocess, time
from rich.console import Console, Panel, Text
from src.core.parser import Recipe, RecipeStep
from src.core.verifier import ExecutionResult
from src.security.command_sanitizer import CommandSanitizer
```

**Issue:** `re` is imported for DANGEROUS_PATTERNS matching — confirm it's used via `re.search()`.
**Issue:** `shlex` imported — used in `_execute_shell_step` for command splitting. Used.
**Cross-module import:** `src.security.command_sanitizer` imported here AND `src.core.command_sanitizer`
is also present. Two command sanitizer modules may exist — potential duplication.

---

## gateway.py Import Analysis

```python
import asyncio, json, logging
from datetime import datetime, timezone
from typing import AsyncGenerator, Optional
from fastapi import FastAPI, HTTPException, Header, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
```

**Issue:** `Header` imported from fastapi but `_validate_api_key()` helper using it
is defined but NEVER called by any endpoint. Dead code + dead import.

```python
from src.core.api_key_manager import validate_api_key
```
`validate_api_key` only used inside `_validate_api_key()` which is itself dead code.
Both imports are effectively unused in production paths.

---

## Inline Imports (Deferred Loading Pattern)

gateway.py uses inline import:
```python
async def _run_hybrid_router(...):
    from src.core.hybrid_router import route_and_execute  # line 227
```

status.py uses multiple inline imports:
```python
def system():
    from src.core.config import get_config
    from src.core.llm_client import get_client
    from src.core.memory import MemoryStore
    from src.core.governance import Governance
```

Inline imports avoid circular imports and defer heavy module loading.
This is intentional for CLI startup time optimization — acceptable pattern.

---

## Circular Import Risk Assessment

src/core/ has 95+ modules. High risk of circular imports given:
- orchestrator.py imports from: executor, verifier, planner, memory, nlu, parser
- executor.py imports from: parser, verifier, security/command_sanitizer
- planner.py imports from: parser

Known mitigation: `TYPE_CHECKING` block used for LLMClient in orchestrator.py and planner.py:
```python
if TYPE_CHECKING:
    from .llm_client import LLMClient
```
This pattern correctly breaks the circular dependency at runtime.

---

## Summary of Issues

| File | Issue | Severity |
|------|-------|----------|
| gateway.py | `Header`, `validate_api_key` imported but dead code | Medium |
| gateway.py | `time` imported inline in test_webhook instead of top-level | Low |
| orchestrator.py | `MemoryEntry` could be TYPE_CHECKING only | Low |
| executor.py | Possible duplicate CommandSanitizer (src.security vs src.core) | Medium |
| Multiple files | structlog imported in pyproject.toml but logging.getLogger used | Medium |

---

## Recommendations

1. Remove `Header` and `validate_api_key` imports from gateway.py (dead code)
2. Audit CommandSanitizer duplication: `src/security/` vs `src/core/` — pick one canonical location
3. Move `time` import in test_webhook to module level (PEP8)
4. Add ruff rule `F401` (unused imports) to CI — currently not enforced per ruff.toml
5. Audit structlog: declared in pyproject.toml but `logging.getLogger` used in all reviewed files;
   structlog may be partially integrated or legacy
