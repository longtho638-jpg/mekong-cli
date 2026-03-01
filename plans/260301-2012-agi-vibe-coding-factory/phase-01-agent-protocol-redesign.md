---
phase: 1
title: "Agent Protocol Redesign"
priority: P1
status: pending
effort: 4h
depends_on: []
---

# Phase 1: Agent Protocol Redesign

## Overview
Replace string-based agent registry with Protocol-enforced contracts, type-safe registry, and streaming support. Foundation for all subsequent phases.

## Key Insights (from research)
- Current `AgentBase` uses ABC but no runtime validation at registration (agents/__init__.py:9-16)
- `AGENT_REGISTRY` is a plain dict — typos in agent names fail silently at runtime
- No streaming support — blocks DAG parallel execution and daemon integration
- `AgentBase.run()` (agent_base.py:107-144) loops sequentially with no concurrency

## Requirements

### Functional
- F1: `AgentProtocol` runtime-checkable Protocol with plan/execute/verify signatures
- F2: `AgentRegistry` class with register/get/list, validates at registration time
- F3: `StreamingAgent` mixin with async `execute_stream()` → `AsyncIterator[str]`
- F4: Backward compatible — existing 6 agents must work without changes

### Non-Functional
- NF1: Registration errors raise `TypeError` immediately, not at call time
- NF2: Zero import-time overhead for streaming (async only when used)

## Architecture

```python
# src/core/protocols.py (NEW — ~60 lines)
from typing import Protocol, runtime_checkable, List, AsyncIterator
from .agent_base import Task, Result

@runtime_checkable
class AgentProtocol(Protocol):
    name: str
    def plan(self, input_data: str) -> List[Task]: ...
    def execute(self, task: Task) -> Result: ...
    def verify(self, result: Result) -> bool: ...

class StreamingMixin:
    async def execute_stream(self, task: Task) -> AsyncIterator[str]:
        result = self.execute(task)
        yield result.output or ""

# src/core/agent_registry.py (NEW — ~80 lines)
class AgentRegistry:
    _agents: Dict[str, Type[AgentBase]] = {}

    def register(self, name: str, cls: Type) -> None:
        if not isinstance(cls, type) or not issubclass(cls, AgentBase):
            raise TypeError(f"{cls} must subclass AgentBase")
        self._agents[name] = cls

    def get(self, name: str) -> AgentBase:
        if name not in self._agents:
            raise KeyError(f"Unknown agent: {name}. Available: {list(self._agents)}")
        return self._agents[name]

    def list_agents(self) -> List[str]:
        return list(self._agents.keys())

    def register_decorator(self, name: str):
        def wrapper(cls):
            self.register(name, cls)
            return cls
        return wrapper
```

## Related Code Files

### Modify
- `src/core/agent_base.py` — add Protocol check in `__init_subclass__`
- `src/agents/__init__.py` — replace dict with `AgentRegistry` instance
- `src/core/orchestrator.py` — use registry.get() instead of direct dict access
- `src/main.py` — update agent command to use registry

### Create
- `src/core/protocols.py` — AgentProtocol + StreamingMixin
- `src/core/agent_registry.py` — Type-safe AgentRegistry class

### Delete
- None

## Implementation Steps

1. Create `src/core/protocols.py` with `AgentProtocol` (runtime_checkable) and `StreamingMixin`
2. Create `src/core/agent_registry.py` with `AgentRegistry` class, register/get/list methods
3. Update `src/agents/__init__.py` — instantiate global `registry = AgentRegistry()`, register all 6 agents, keep `AGENT_REGISTRY` as backward-compat alias via `registry._agents`
4. Update `src/core/agent_base.py` — add `__init_subclass__` hook that warns if plan/execute not implemented
5. Update `src/main.py` agent command — use `registry.get()` with proper error messages
6. Add `src/core/protocols.py` and `agent_registry.py` to `src/core/__init__.py` exports
7. Run `python3 -m pytest tests/` — all 62 tests must pass

## Success Criteria
- [ ] `AgentProtocol` is runtime_checkable — `isinstance(GitAgent(), AgentProtocol)` returns True
- [ ] Invalid agent registration raises `TypeError` immediately
- [ ] Unknown agent lookup raises `KeyError` with available agents list
- [ ] All 62 tests pass without modification
- [ ] `mekong agent git status` still works (backward compat)

## Risk Assessment
- **Low risk**: Protocol is additive, doesn't break existing ABC inheritance
- **Medium risk**: `__init_subclass__` hook could affect agents imported from external packages — mitigate by making it a warning, not error
- **Mitigation**: Keep `AGENT_REGISTRY` dict as alias during transition period

## Todo
- [ ] Create protocols.py
- [ ] Create agent_registry.py
- [ ] Update agents/__init__.py
- [ ] Update agent_base.py with __init_subclass__
- [ ] Update main.py agent command
- [ ] Run full test suite
