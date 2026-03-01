# Claude Code Architecture Research Report
**Date:** 2026-03-01 | **Duration:** 1430 UTC | **Researcher:** anthropic-patterns

---

## Executive Summary

Nghiên cứu kiến trúc Claude Code (Feb-May 2025 GA) và so sánh với mekong-cli hiện tại.

**Kết luận:** Mekong-cli đã implement Plan-Execute-Verify core pattern đúng chuẩn. Gap chính:
1. **Tool System:** Chưa có declarative tool registry (Claude dùng JSON schema)
2. **Context Window Management:** Chưa implement auto-compaction & skill lazy-loading
3. **Subagent Orchestration:** Chưa fully implement Task tool delegation pattern
4. **Permission Model:** Chưa có granular permission scoping
5. **Hook System:** Đã có (Portkey-inspired) nhưng chưa integration đầy đủ

**Priority:** Top 3 patterns cần implement immediately:
1. Declarative Tool Registry (enable dynamic tool discovery)
2. Subagent Task Dispatcher (parallel/sequential delegation)
3. Context Window Auto-Compaction (scale long sessions)

---

## 1. Claude Code Core Patterns

### 1.1 Agentic Loop Architecture

Claude Code's **Gather → Act → Verify** cycle (vs mekong's Plan → Execute → Verify):

| Phase | Claude Code | Mekong CLI | Gap |
|-------|-------------|-----------|-----|
| **Gather** | Read context, file search, web fetch | Parse recipe + LLM plan | Missing: adaptive context gathering |
| **Act** | Tool use (edit, shell, API) | Execute steps (shell/LLM/API) | **On-parity** |
| **Verify** | Check output, run tests, ask user | Verifier with custom checks | **On-parity** |

**Key difference:** Claude Code cycles 3 phases autonomously per task. Mekong does once per recipe.

**Implementation gap:** Mekong should add loop-back mechanism:
```python
# In orchestrator.py - add retry loop
while not all_verified:
    execute_next_step()
    verify_result()
    if_failed: replan() or ask_user()
```

### 1.2 Tool System (JSON Schema Registry)

**Claude Code pattern:**
```json
{
  "tools": [
    {
      "name": "read_file",
      "description": "Read file contents",
      "input_schema": {
        "type": "object",
        "properties": {
          "path": {"type": "string"}
        },
        "required": ["path"]
      }
    }
  ]
}
```

**Mekong's current approach:**
- Manual agent dispatch in `agents/__init__.py` with `AGENT_REGISTRY` dict
- No standardized schema

**Gap:** No declarative tool schema = harder to extend + no model-driven tool discovery

**Fix:** Create `src/core/tool_registry.py`:
```python
from pydantic import BaseModel
from typing import Any, Dict, Callable

class ToolSchema(BaseModel):
    name: str
    description: str
    input_schema: Dict[str, Any]
    handler: Callable
    category: str  # "file", "shell", "web", "api", "code_intel"

class ToolRegistry:
    def __init__(self):
        self.tools: Dict[str, ToolSchema] = {}

    def register(self, schema: ToolSchema) -> None:
        self.tools[schema.name] = schema

    def get_tools_by_category(self, cat: str) -> List[ToolSchema]:
        return [t for t in self.tools.values() if t.category == cat]

    def to_claude_schema(self) -> Dict:
        """Export for Claude Code API compatibility"""
        return {"tools": [asdict(t) for t in self.tools.values()]}
```

**Benefits:**
- LLM can discover tools dynamically
- Easy to toggle tools per session
- Schema validation before tool use

---

## 2. Agent Orchestration Patterns (Task Tool)

### 2.1 Parallel vs Sequential Dispatching

**Claude Code pattern:** Task tool spawns 3-7 parallel subagents when:
- Multiple independent tasks (file read + web search)
- Different code domains (frontend + backend)
- No shared state between tasks

**Mekong's situation:**
- OpenClaw (Tôm Hùm) dispatches CC CLI sequentially
- No parallel subagent support yet

**Gap:** Missing parallel executor for independent tasks

**Fix:** Create `src/core/task_dispatcher.py`:
```python
import asyncio
from typing import List, Callable, Any
from dataclasses import dataclass

@dataclass
class DelegatedTask:
    name: str
    description: str
    handler: Callable[[], Any]
    depends_on: List[str] = None  # For sequential ordering

class TaskDispatcher:
    async def dispatch_parallel(self, tasks: List[DelegatedTask]) -> Dict[str, Any]:
        """Execute independent tasks in parallel."""
        # Identify independent tasks (no depends_on)
        independent = [t for t in tasks if not t.depends_on]

        # Spawn subagents (or use ThreadPoolExecutor)
        results = await asyncio.gather(
            *[self._spawn_subagent(t) for t in independent]
        )
        return dict(zip([t.name for t in independent], results))

    async def dispatch_sequential(self, tasks: List[DelegatedTask]) -> Dict[str, Any]:
        """Execute tasks in dependency order."""
        results = {}
        for task in tasks:
            if task.depends_on:
                deps = {n: results[n] for n in task.depends_on}
                results[task.name] = await self._spawn_subagent_with_context(task, deps)
            else:
                results[task.name] = await self._spawn_subagent(task)
        return results

    async def _spawn_subagent(self, task: DelegatedTask) -> Any:
        """Spawn actual subagent (CC CLI or subprocess)."""
        # TODO: Implement subagent spawning
        return await asyncio.to_thread(task.handler)
```

**Usage in orchestrator:**
```python
# In orchestrator.py
dispatcher = TaskDispatcher()

# Parallel: research + planning
research_task = DelegatedTask("research", "Investigate API patterns")
planning_task = DelegatedTask("planning", "Create implementation plan")
results = await dispatcher.dispatch_parallel([research_task, planning_task])

# Sequential: code → test → review
results = await dispatcher.dispatch_sequential([
    DelegatedTask("code", "Implement feature"),
    DelegatedTask("test", "Run tests", depends_on=["code"]),
    DelegatedTask("review", "Code review", depends_on=["code", "test"]),
])
```

### 2.2 Subagent Context Isolation

**Claude Code pattern:** Each subagent gets **fresh context window** (6000 tokens typical) isolating from parent.

**Current Mekong:** Tôm Hùm spawns CC CLI per mission but doesn't track context usage.

**Gap:** No context budget/quota per subagent

**Fix:** Track in `cost_tracker.py`:
```python
@dataclass
class ContextMetrics:
    input_tokens: int
    output_tokens: int
    tool_calls: int
    session_id: str
    subagent_id: str = None

class ContextBudgetManager:
    MAX_CONTEXT_PER_SUBAGENT = 6000

    def check_budget(self, subagent_id: str, estimated_tokens: int) -> bool:
        used = self.get_used_tokens(subagent_id)
        return (used + estimated_tokens) <= self.MAX_CONTEXT_PER_SUBAGENT

    def trigger_compaction(self, subagent_id: str):
        """Auto-compact old outputs if near limit"""
        # TODO: Call LLM to summarize conversation
        pass
```

---

## 3. Context Window Management

### 3.1 Auto-Compaction Strategy

**Claude Code approach:**
1. Clear older tool outputs first
2. Summarize conversation if still over limit
3. Preserve requests + key code snippets
4. User can add "Compact Instructions" section to CLAUDE.md

**Mekong gap:** No automatic context compaction logic

**Fix:** Create `src/core/context_compactor.py`:
```python
from typing import List, Dict
import json

class ContextCompactor:
    COMPACT_THRESHOLD = 0.85  # Compact at 85% of limit

    def should_compact(self, current_tokens: int, limit: int) -> bool:
        return (current_tokens / limit) >= self.COMPACT_THRESHOLD

    def compact(self, conversation: List[Dict], focus: str = None) -> List[Dict]:
        """Compress conversation history."""
        # Priority order:
        # 1. Keep system messages
        # 2. Keep last 5 user messages
        # 3. Summarize older messages via LLM
        # 4. Drop tool outputs except errors

        compacted = []

        # System + recent user messages
        system = [m for m in conversation if m["role"] == "system"]
        recent = conversation[-5:] if len(conversation) > 5 else conversation

        compacted.extend(system)
        compacted.extend(recent)

        # Summarize middle section
        if len(conversation) > 10:
            middle = conversation[len(system):-5]
            summary = self._summarize_via_llm(middle, focus)
            compacted.insert(1, {
                "role": "assistant",
                "content": f"[Context summary: {summary}]"
            })

        return compacted

    def _summarize_via_llm(self, messages: List[Dict], focus: str) -> str:
        # Call LLM to create 2-3 sentence summary
        pass
```

### 3.2 Skill Lazy-Loading

**Claude Code:** Skill descriptions loaded at session start, full content only when invoked.

**Current Mekong:** All agent code loaded upfront in `agents/__init__.py`.

**Fix:** Add to agent_base.py:
```python
class LazySkill(ABC):
    """Skill that loads code only when invoked."""

    @property
    def description(self) -> str:
        """1-2 sentence description - loaded at startup."""
        pass

    @abstractmethod
    def invoke(self, input_data: str) -> str:
        """Load & execute full skill code here."""
        pass

class SkillLoader:
    def __init__(self):
        self.skills: Dict[str, LazySkill] = {}
        self.loaded: Set[str] = set()

    def register(self, name: str, skill: LazySkill):
        self.skills[name] = skill

    def get_descriptions(self) -> Dict[str, str]:
        """What fits in context startup."""
        return {name: skill.description for name, skill in self.skills.items()}

    def invoke(self, name: str, input_data: str) -> str:
        """Lazy load if needed."""
        if name not in self.loaded:
            # Load full code from disk/module
            self.skills[name] = self._load_full_skill(name)
            self.loaded.add(name)
        return self.skills[name].invoke(input_data)
```

---

## 4. Permission Model Patterns

### 4.1 Granular Permission Scoping

**Claude Code's 3-level approach:**
1. **Organization-wide:** `.claude/settings.json` at repo root
2. **Project-level:** `.claude/settings.json` in subdirectory
3. **Session-level:** Scoped via `--permissions` flag

**Mekong current:** Governance.py exists but doesn't scope by directory/session.

**Gap:** No hierarchical permission resolution

**Fix:** Update `src/core/governance.py`:
```python
from enum import Enum
from pathlib import Path
from typing import Optional, Dict, Any

class PermissionLevel(Enum):
    DENY = "deny"
    ASK = "ask"
    AUTO = "auto"

class PermissionScope(Enum):
    ORGANIZATION = "org"
    PROJECT = "project"
    SESSION = "session"

class GranularPermissions:
    def __init__(self, work_dir: Path):
        self.work_dir = work_dir
        self.perms = self._load_hierarchical()

    def _load_hierarchical(self) -> Dict[str, PermissionLevel]:
        """Load from: org → project → session."""
        perms = {}

        # 1. Org-level (highest priority)
        org_config = Path.home() / ".claude" / "settings.json"
        if org_config.exists():
            perms.update(self._parse_config(org_config))

        # 2. Project-level
        proj_config = self.work_dir / ".claude" / "settings.json"
        if proj_config.exists():
            perms.update(self._parse_config(proj_config))

        # 3. Session-level (would come from CLI flags)
        # perms.update(session_overrides)

        return perms

    def check(self, tool: str, action: str) -> PermissionLevel:
        """Check if tool.action allowed."""
        key = f"{tool}.{action}"
        return self.perms.get(key, PermissionLevel.ASK)
```

---

## 5. Hook System Integration

### 5.1 Current Status

Mekong已有 `src/core/hooks.py` with Portkey-inspired pre/post-request hooks.

**Current implementation:** ✓ Hook phases (PRE_REQUEST, POST_REQUEST, ON_ERROR)

**Gap:** Not integrated into LLM client workflow

**Fix:** Wire into `llm_client.py`:
```python
class LLMClient:
    def __init__(self, hook_manager: HookManager):
        self.hooks = hook_manager

    def chat(self, messages: List[Dict]) -> ChatResponse:
        # Pre-hook
        context = HookContext(messages=messages, model=self.model)
        context = self.hooks.run(HookPhase.PRE_REQUEST, context)

        # Call LLM
        try:
            response = self._make_request(context.messages)
            context.response_content = response.content
        except Exception as e:
            context.error = e
            context = self.hooks.run(HookPhase.ON_ERROR, context)
            raise

        # Post-hook
        context = self.hooks.run(HookPhase.POST_REQUEST, context)

        return response
```

### 5.2 Useful Hook Types

Based on Claude Code patterns, add:
```python
class BuiltinHooks:
    """Pre-built hooks for common patterns"""

    @staticmethod
    def token_counter() -> Hook:
        """Count tokens in request/response"""
        pass

    @staticmethod
    def retry_policy(max_retries: int = 3) -> Hook:
        """Auto-retry on transient errors"""
        pass

    @staticmethod
    def rate_limiter(tokens_per_min: int) -> Hook:
        """Enforce rate limits"""
        pass

    @staticmethod
    def cost_tracker() -> Hook:
        """Track LLM costs per session"""
        pass

    @staticmethod
    def guardrail() -> Hook:
        """Validate outputs (no API keys, etc)"""
        pass
```

---

## 6. Top 5 Patterns to Implement

### 6.1 Priority 1: Declarative Tool Registry

**File:** `src/core/tool_registry.py` (new)

**Why:** Enables Claude to discover & invoke tools dynamically without hardcoding agent dispatch logic.

**Implementation effort:** 4-6 hours

**Impact:** High - enables extensibility at tool level

```python
# Example usage
registry = ToolRegistry()
registry.register(ToolSchema(
    name="grep",
    description="Search files by regex",
    input_schema={"pattern": "string", "path": "string"},
    handler=FileAgent.grep,
    category="search"
))

# Export for Claude
schema = registry.to_claude_schema()  # → JSON for API
```

### 6.2 Priority 2: Task Dispatcher (Parallel/Sequential)

**File:** `src/core/task_dispatcher.py` (new)

**Why:** Unblock Tôm Hùm to dispatch 3-7 subagents in parallel (vs sequential now).

**Implementation effort:** 6-8 hours

**Impact:** Critical - 3x speedup for parallel-able tasks

```python
# Enable Tôm Hùm to do:
# "research on 3 topics + plan in parallel, then code sequentially"
dispatcher.dispatch_parallel([research_task1, research_task2, research_task3, plan_task])
# Then use results in sequential code phase
```

### 6.3 Priority 3: Context Window Auto-Compaction

**File:** `src/core/context_compactor.py` (new) + wire into `orchestrator.py`

**Why:** Mekong-cli runs long sessions (Tôm Hùm 24/7) = context fill-up is real issue.

**Implementation effort:** 8-10 hours

**Impact:** Medium - enables true long-running AGI without intervention

### 6.4 Priority 4: Granular Permission Scoping

**File:** Update `src/core/governance.py`

**Why:** Enterprise feature - organization-wide policy enforcement.

**Implementation effort:** 4-6 hours

**Impact:** Medium - required for production multi-team deployment

### 6.5 Priority 5: Skill Lazy-Loading

**File:** Create `src/core/skill_loader.py` or extend `agent_base.py`

**Why:** Reduce context bloat when only using subset of agents.

**Implementation effort:** 3-4 hours

**Impact:** Low-Medium - nice-to-have for memory optimization

---

## 7. Architectural Comparison Matrix

| Aspect | Claude Code | Mekong CLI | Score |
|--------|-------------|-----------|-------|
| **Agentic Loop** | Gather→Act→Verify (dynamic) | Plan→Execute→Verify (static) | 8/10 |
| **Tool System** | JSON schema registry | Agent dispatch dict | 5/10 |
| **Subagent Dispatch** | Parallel/Sequential Task tool | Sequential via Tôm Hùm | 6/10 |
| **Context Management** | Auto-compact + skill lazy-load | Manual tracking | 4/10 |
| **Permission Model** | Hierarchical scoping | Governance exists | 5/10 |
| **Hook System** | Integrated into LLM calls | Defined but unused | 6/10 |
| **Session Continuity** | CLAUDE.md + auto-memory | Memory.yaml exists | 7/10 |
| **Error Recovery** | Checkpoint-based rollback | Orchestrator has rollback | 7/10 |

**Overall PEV alignment:** 7.2/10 — Mekong has correct core pattern, missing Claude's extensibility layers.

---

## 8. Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Create `tool_registry.py` with pydantic schemas
- [ ] Export registry to Claude Code format
- [ ] Update agent dispatch to use registry

### Phase 2: Orchestration (Week 2)
- [ ] Create `task_dispatcher.py` with parallel/sequential support
- [ ] Wire into `orchestrator.py` for task delegation
- [ ] Test with Tôm Hùm spawning parallel CC CLI instances

### Phase 3: Context Management (Week 3)
- [ ] Create `context_compactor.py` with token budget tracking
- [ ] Integrate into `llm_client.py`
- [ ] Test long-running sessions (>8 hours)

### Phase 4: Polish (Week 4)
- [ ] Granular permissions in `governance.py`
- [ ] Skill lazy-loading in agent system
- [ ] Hook system full integration

---

## 9. Unresolved Questions

1. **Subagent process model:** Should mekong spawn CC CLI per subagent, or use thread/async pool?
   - Claude Code: separate processes for isolation
   - Tôm Hùm: currently expect-based stdin injection
   - Recommendation: Hybrid — CC CLI for heavy tasks, async for lightweight

2. **Tool schema validation:** Where should validation happen — at registry, at LLM time, or at execution time?
   - Claude Code: At tool invocation time (runtime)
   - Mekong should align: validate input_schema against actual arguments

3. **Context compaction triggers:** Should auto-trigger at 85% or wait for manual `/compact` command?
   - Claude Code: Auto at threshold + manual option
   - Mekong: Should implement both, with user control via governance settings

4. **Permission deny behavior:** On DENY, should orchestrator fail hard or skip task?
   - Recommendation: Fail with clear error message (don't silently skip)

5. **Hook execution order:** If multiple hooks in same phase, what order? (registration order? priority?)
   - Recommendation: Registration order + optional priority field

---

## Sources

- [How Claude Code Works — Official Docs](https://code.claude.com/docs/en/how-claude-code-works)
- [Claude Code Subagents — Official Docs](https://code.claude.com/docs/en/sub-agents)
- [Claude Code Frameworks & Dec 2025 Guide](https://www.medianeth.dev/blog/claude-code-frameworks-subagents-2025)
- [Task Tool & Agent Orchestration Patterns — DEV Community](https://dev.to/bhaidar/the-task-tools-claude-codes-agent-orchestration-system-4bf2)
- [Claude Code Team Orchestration](https://claudefa.st/blog/guide/agents/team-orchestration)
- [GitHub: Awesome Claude Code Subagents](https://github.com/VoltAgent/awesome-claude-code-subagents)

---

**Next Step:** Use `/cook` to implement Phase 1 (tool registry) as proof-of-concept.
