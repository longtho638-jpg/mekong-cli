"""
Mekong CLI - Hooks Middleware Pipeline

Portkey-inspired pre/post-request hook system for LLM calls.
Enables pluggable validation, transformation, and observability
without modifying core LLM client logic.
"""

import logging
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class HookPhase(Enum):
    """When a hook executes in the request lifecycle."""

    PRE_REQUEST = "pre_request"
    POST_REQUEST = "post_request"
    ON_ERROR = "on_error"


@dataclass
class HookContext:
    """Data passed through the hook pipeline."""

    messages: List[Dict[str, str]] = field(default_factory=list)
    model: str = ""
    provider: str = ""
    temperature: float = 0.7
    max_tokens: int = 2048
    response_content: str = ""
    response_model: str = ""
    usage: Dict[str, int] = field(default_factory=dict)
    error: Optional[Exception] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    start_time: float = 0.0


@dataclass
class HookResult:
    """Result from a hook execution."""

    passed: bool = True
    modified_context: Optional[HookContext] = None
    error_message: str = ""
    hook_name: str = ""
    duration_ms: float = 0.0


class Hook(ABC):
    """Base class for all hooks in the middleware pipeline."""

    def __init__(self, name: str, config: Optional[Dict[str, Any]] = None) -> None:
        self.name = name
        self.config = config or {}
        self.enabled = True

    @abstractmethod
    def execute(self, ctx: HookContext) -> HookResult:
        """Execute hook logic on the context.

        Args:
            ctx: Current request/response context

        Returns:
            HookResult indicating pass/fail and any modifications
        """
        ...

    @property
    def phase(self) -> HookPhase:
        """Which phase this hook runs in. Override in subclasses."""
        return HookPhase.PRE_REQUEST


class InputValidationHook(Hook):
    """Validates input messages before sending to LLM."""

    def __init__(self, config: Optional[Dict[str, Any]] = None) -> None:
        super().__init__("input_validation", config)
        self.max_message_length = self.config.get("max_message_length", 100_000)
        self.max_messages = self.config.get("max_messages", 100)

    @property
    def phase(self) -> HookPhase:
        return HookPhase.PRE_REQUEST

    def execute(self, ctx: HookContext) -> HookResult:
        if not ctx.messages:
            return HookResult(passed=False, error_message="Empty messages", hook_name=self.name)

        if len(ctx.messages) > self.max_messages:
            return HookResult(
                passed=False,
                error_message=f"Too many messages: {len(ctx.messages)} > {self.max_messages}",
                hook_name=self.name,
            )

        for i, msg in enumerate(ctx.messages):
            content = msg.get("content", "")
            if len(content) > self.max_message_length:
                return HookResult(
                    passed=False,
                    error_message=f"Message {i} too long: {len(content)} > {self.max_message_length}",
                    hook_name=self.name,
                )

        return HookResult(passed=True, hook_name=self.name)


class OutputValidationHook(Hook):
    """Validates LLM response content."""

    def __init__(self, config: Optional[Dict[str, Any]] = None) -> None:
        super().__init__("output_validation", config)
        self.min_length = self.config.get("min_length", 1)
        self.max_length = self.config.get("max_length", 500_000)

    @property
    def phase(self) -> HookPhase:
        return HookPhase.POST_REQUEST

    def execute(self, ctx: HookContext) -> HookResult:
        content = ctx.response_content
        if len(content) < self.min_length:
            return HookResult(
                passed=False,
                error_message=f"Response too short: {len(content)} < {self.min_length}",
                hook_name=self.name,
            )
        if len(content) > self.max_length:
            return HookResult(
                passed=False,
                error_message=f"Response too long: {len(content)} > {self.max_length}",
                hook_name=self.name,
            )
        return HookResult(passed=True, hook_name=self.name)


class TokenCounterHook(Hook):
    """Tracks token usage per request for cost awareness."""

    def __init__(self, config: Optional[Dict[str, Any]] = None) -> None:
        super().__init__("token_counter", config)
        self.max_input_tokens = self.config.get("max_input_tokens", 0)
        self.total_tokens_used = 0

    @property
    def phase(self) -> HookPhase:
        return HookPhase.POST_REQUEST

    def execute(self, ctx: HookContext) -> HookResult:
        total = ctx.usage.get("total_tokens", 0)
        self.total_tokens_used += total
        ctx.metadata["tokens_this_call"] = total
        ctx.metadata["tokens_cumulative"] = self.total_tokens_used
        return HookResult(passed=True, hook_name=self.name, modified_context=ctx)


class LatencyMonitorHook(Hook):
    """Records request latency for performance tracking."""

    def __init__(self, config: Optional[Dict[str, Any]] = None) -> None:
        super().__init__("latency_monitor", config)
        self.warn_threshold_ms = self.config.get("warn_threshold_ms", 10_000)

    @property
    def phase(self) -> HookPhase:
        return HookPhase.POST_REQUEST

    def execute(self, ctx: HookContext) -> HookResult:
        if ctx.start_time > 0:
            latency_ms = (time.time() - ctx.start_time) * 1000
            ctx.metadata["latency_ms"] = round(latency_ms, 2)
            if latency_ms > self.warn_threshold_ms:
                logger.warning(
                    f"[Hook] High latency: {latency_ms:.0f}ms > {self.warn_threshold_ms}ms "
                    f"(provider={ctx.provider}, model={ctx.model})"
                )
        return HookResult(passed=True, hook_name=self.name, modified_context=ctx)


class ErrorLoggerHook(Hook):
    """Logs errors with structured context for debugging."""

    def __init__(self, config: Optional[Dict[str, Any]] = None) -> None:
        super().__init__("error_logger", config)

    @property
    def phase(self) -> HookPhase:
        return HookPhase.ON_ERROR

    def execute(self, ctx: HookContext) -> HookResult:
        if ctx.error:
            logger.error(
                f"[Hook] LLM error: provider={ctx.provider} model={ctx.model} "
                f"error={ctx.error}"
            )
        return HookResult(passed=True, hook_name=self.name)


class HookPipeline:
    """Manages and executes hooks in the correct phase order.

    Hooks are organized by phase and executed sequentially within each phase.
    A failing pre-request hook aborts the pipeline.
    Post-request and error hooks always run (log-only).
    """

    def __init__(self) -> None:
        self._hooks: Dict[HookPhase, List[Hook]] = {
            HookPhase.PRE_REQUEST: [],
            HookPhase.POST_REQUEST: [],
            HookPhase.ON_ERROR: [],
        }

    def register(self, hook: Hook) -> None:
        """Register a hook in the pipeline.

        Args:
            hook: Hook instance to register
        """
        self._hooks[hook.phase].append(hook)

    def run_phase(self, phase: HookPhase, ctx: HookContext) -> List[HookResult]:
        """Execute all hooks for a given phase.

        Args:
            phase: Which phase to run
            ctx: Current context

        Returns:
            List of HookResults from each hook
        """
        results = []
        for hook in self._hooks[phase]:
            if not hook.enabled:
                continue
            start = time.time()
            try:
                result = hook.execute(ctx)
                result.duration_ms = (time.time() - start) * 1000
                if result.modified_context:
                    ctx = result.modified_context
            except Exception as e:
                result = HookResult(
                    passed=False,
                    error_message=f"Hook {hook.name} crashed: {e}",
                    hook_name=hook.name,
                    duration_ms=(time.time() - start) * 1000,
                )
            results.append(result)

            if phase == HookPhase.PRE_REQUEST and not result.passed:
                break

        return results

    def list_hooks(self) -> Dict[str, List[str]]:
        """List registered hooks by phase.

        Returns:
            Dict mapping phase name to list of hook names
        """
        return {
            phase.value: [h.name for h in hooks]
            for phase, hooks in self._hooks.items()
        }


def create_default_pipeline() -> HookPipeline:
    """Create pipeline with standard hooks pre-registered.

    Returns:
        HookPipeline with input validation, output validation,
        token counter, latency monitor, and error logger
    """
    pipeline = HookPipeline()
    pipeline.register(InputValidationHook())
    pipeline.register(OutputValidationHook())
    pipeline.register(TokenCounterHook())
    pipeline.register(LatencyMonitorHook())
    pipeline.register(ErrorLoggerHook())
    return pipeline


__all__ = [
    "Hook",
    "HookContext",
    "HookPhase",
    "HookPipeline",
    "HookResult",
    "InputValidationHook",
    "OutputValidationHook",
    "TokenCounterHook",
    "LatencyMonitorHook",
    "ErrorLoggerHook",
    "create_default_pipeline",
]
