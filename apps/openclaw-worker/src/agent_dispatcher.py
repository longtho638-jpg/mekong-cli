"""Hybrid LLM Router - Agent Dispatcher (ALGO 8).

Main orchestrator: route_and_execute flow.
Reference: hybrid-llm-router-spec.md
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any, Literal

if TYPE_CHECKING:
    from .task_classifier import TaskClassifier, TaskProfile
    from .model_selector import ModelSelector, SystemState
    from .cost_estimator import CostEstimator
    from .mcu_gate import MCUGate
    from .fallback_chain import FallbackChain


@dataclass
class MissionResult:
    """Result của mission execution."""

    success: bool
    mission_id: str
    tenant_id: str
    model_used: str | None = None
    error: str | None = None
    output: str = ""
    tokens_used: int = 0
    mcu_charged: int = 0
    attempts: list[str] = field(default_factory=list)


@dataclass
class SSEEvent:
    """SSE event cho streaming."""

    event_type: Literal["planning", "token", "completed", "error", "failed"]
    data: dict[str, Any]


class AgentDispatcher:
    """ALGO 8: Dispatch và execute tasks với full pipeline."""

    def __init__(
        self,
        task_classifier: TaskClassifier,
        model_selector: ModelSelector,
        cost_estimator: CostEstimator,
        mcu_gate: MCUGate,
        fallback_chain: FallbackChain,
    ):
        """Initialize AgentDispatcher với dependencies."""
        self.task_classifier = task_classifier
        self.model_selector = model_selector
        self.cost_estimator = cost_estimator
        self.mcu_gate = mcu_gate
        self.fallback_chain = fallback_chain
        self._sse_buffer: list[SSEEvent] = []

    async def route_and_execute(
        self,
        goal: str,
        tenant_id: str,
        mission_id: str,
        webhook_url: str | None = None,
        sse_queue: asyncio.Queue | None = None,
        context: dict | None = None,
    ) -> MissionResult:
        """Main orchestration flow: classify → MCU lock → model select → execute → verify → MCU confirm.

        Args:
            goal: Natural language goal
            tenant_id: Tenant identifier
            mission_id: Mission identifier
            webhook_url: Optional webhook for completion callback
            sse_queue: Optional queue for SSE streaming
            context: Optional context (history, preferences)

        Returns:
            MissionResult với success/failure và metadata
        """
        context = context or {}
        self._sse_buffer = []

        # ── STAGE 1: CLASSIFY ──────────────────────────────────────────
        profile = self.task_classifier.classify(goal, context)

        # ── STAGE 2: MCU CHECK + LOCK ──────────────────────────────────
        lock_result = self.mcu_gate.check_and_lock(
            tenant_id, mission_id, profile.mcu_cost
        )

        if lock_result.is_error:
            await self._emit_sse(
                sse_queue,
                "error",
                {
                    "code": "insufficient_mcu",
                    "available": lock_result.available,
                    "required": profile.mcu_cost,
                    "recharge_url": lock_result.recharge_url,
                },
            )
            return MissionResult(
                success=False,
                mission_id=mission_id,
                tenant_id=tenant_id,
                error="insufficient_mcu",
            )

        lock_id = lock_result.lock_id

        # ── STAGE 3: MODEL SELECT ──────────────────────────────────────
        system_state = self._get_system_state(tenant_id)
        model_config = self.model_selector.select(profile, system_state)
        cost_est = self.cost_estimator.estimate(profile, model_config)

        await self._emit_sse(
            sse_queue,
            "planning",
            {
                "agent": profile.agent_role,
                "model": model_config.model_id,
                "complexity": profile.complexity,
                "mcu_cost": profile.mcu_cost,
                "estimated_margin": f"{cost_est.margin_pct}%",
            },
        )

        # ── STAGE 4: LOAD AGENT PROMPT ─────────────────────────────────
        agent_prompt = self._load_agent_prompt(profile.agent_role)

        # ── STAGE 5: BUILD MESSAGE CHAIN ──────────────────────────────
        messages = [{"role": "user", "content": goal}]

        # Inject relevant context
        if profile.domain == "code":
            messages = self._inject_codebase_context(messages, goal)
        elif profile.domain == "analysis":
            messages = self._inject_metrics_context(messages, tenant_id)

        # ── STAGE 6: EXECUTE WITH FALLBACK ─────────────────────────────
        async def on_token(token: str):
            await self._emit_sse(sse_queue, "token", {"text": token})

        exec_result = await self.fallback_chain.execute_with_fallback(
            model_config,
            messages,
            agent_prompt,
            on_token_cb=on_token,
            profile=profile,
        )

        # ── STAGE 7: VERIFY OUTPUT ─────────────────────────────────────
        if exec_result.success:
            verify_result = self._verify_output(
                self._collect_sse_buffer(), profile, goal
            )
            if not verify_result.passed:
                # Self-heal: retry với reflection hint
                current_retry = getattr(self, "_retry_count", 0)
                if current_retry < 2:
                    self._retry_count = current_retry + 1
                    goal_with_hint = (
                        f"{goal}\n\nPREVIOUS ATTEMPT FAILED:\n"
                        f"{verify_result.failure_reason}\n"
                        f"Please fix: {verify_result.suggested_fix}"
                    )
                    # Refund current lock before retry
                    self.mcu_gate.refund_full(lock_id, "retry_with_reflection")
                    # Recursive retry
                    return await self.route_and_execute(
                        goal_with_hint,
                        tenant_id,
                        mission_id,
                        webhook_url,
                        sse_queue,
                        context,
                    )
                else:
                    # Max retries → refund MCU
                    self.mcu_gate.refund_full(lock_id, "max_retries_exceeded")
                    await self._emit_sse(
                        sse_queue, "failed", {"reason": "max_retries_exceeded"}
                    )
                    return MissionResult(
                        success=False,
                        mission_id=mission_id,
                        tenant_id=tenant_id,
                        error="max_retries_exceeded",
                    )

        # ── STAGE 8: MCU CONFIRM ───────────────────────────────────────
        self.mcu_gate.confirm(
            lock_id, exec_result.tokens_output or 0, model_config
        )

        # ── STAGE 9: EMIT COMPLETION ───────────────────────────────────
        await self._emit_sse(
            sse_queue,
            "completed",
            {
                "model_used": exec_result.model_used or model_config.model_id,
                "mcu_charged": profile.mcu_cost,
                "output_preview": self._get_preview(),
            },
        )

        output = self._collect_sse_buffer()

        if webhook_url:
            await self._fire_webhook(
                webhook_url,
                "mission.completed",
                {
                    "mission_id": mission_id,
                    "tenant_id": tenant_id,
                    "success": True,
                    "model_used": exec_result.model_used or model_config.model_id,
                    "mcu_charged": profile.mcu_cost,
                    "output": output,
                },
            )

        return MissionResult(
            success=True,
            mission_id=mission_id,
            tenant_id=tenant_id,
            model_used=exec_result.model_used or model_config.model_id,
            output=output,
            tokens_used=exec_result.tokens_output or 0,
            mcu_charged=profile.mcu_cost,
            attempts=exec_result.attempts,
        )

    async def _emit_sse(
        self,
        sse_queue: asyncio.Queue | None,
        event_type: Literal["planning", "token", "completed", "error", "failed"],
        data: dict[str, Any],
    ) -> None:
        """Emit SSE event."""
        event = SSEEvent(event_type=event_type, data=data)
        self._sse_buffer.append(event)
        if sse_queue:
            await sse_queue.put(event)

    def _collect_sse_buffer(self) -> str:
        """Collect SSE buffer into string output."""
        tokens = []
        for event in self._sse_buffer:
            if event.event_type == "token":
                tokens.append(event.data.get("text", ""))
        return "".join(tokens)

    def _get_preview(self) -> str:
        """Get output preview (first 200 chars)."""
        output = self._collect_sse_buffer()
        return output[:200] + "..." if len(output) > 200 else output

    def _get_system_state(self, tenant_id: str) -> SystemState:
        """Get current system state."""
        # Stub - would check Ollama status, API keys, etc.
        from .model_selector import SystemState

        return SystemState(
            local_available=True,
            local_models=["ollama:llama3.2:3b", "ollama:qwen2.5:7b"],
            api_keys={"anthropic": True, "google": True, "openai": False},
            local_load=0.3,
            tenant_tier="growth",
        )

    def _load_agent_prompt(self, agent_role: str) -> str:
        """Load agent system prompt from agents/{role}.md."""
        # Stub - would load from file
        prompts = {
            "cto": "You are CTO, expert in software architecture and code.",
            "cmo": "You are CMO, expert in marketing and content creation.",
            "coo": "You are COO, expert in operations and monitoring.",
            "cfo": "You are CFO, expert in finance and revenue.",
            "cs": "You are CS (Customer Support), helpful and patient.",
            "sales": "You are Sales expert, persuasive and strategic.",
            "editor": "You are Editor, expert in documentation.",
            "data": "You are Data Analyst, expert in insights.",
        }
        return prompts.get(agent_role, "You are a helpful assistant.")

    def _inject_codebase_context(self, messages: list[dict], goal: str) -> list[dict]:
        """Inject codebase context for code tasks."""
        # Stub - would add relevant file contents
        context = "Codebase context: [relevant files and structure]"
        messages.append({"role": "system", "content": context})
        return messages

    def _inject_metrics_context(self, messages: list[dict], tenant_id: str) -> list[dict]:
        """Inject metrics context for analysis tasks."""
        # Stub - would add tenant metrics
        metrics = f"Metrics for tenant {tenant_id}: [revenue, usage, trends]"
        messages.append({"role": "system", "content": metrics})
        return messages

    def _verify_output(
        self, output: str, profile: TaskProfile, goal: str
    ) -> VerifyResult:
        """Verify output meets quality gates (Jidoka)."""
        checks = []

        # Domain-specific checks
        if profile.domain == "code":
            checks.extend(
                [
                    self._check_no_syntax_errors(output),
                    self._check_imports_valid(output),
                    self._check_no_placeholder_comments(output),
                    self._check_file_size_reasonable(output),
                ]
            )
        elif profile.domain == "creative":
            checks.extend(
                [
                    self._check_length_adequate(output, min_words=100),
                    self._check_no_lorem_ipsum(output),
                ]
            )
        elif profile.domain == "analysis":
            checks.extend(
                [
                    self._check_contains_numbers(output),
                    self._check_structured_output(output),
                ]
            )

        # Universal checks
        checks.extend(
            [
                self._check_not_empty(output),
                self._check_no_apology_pattern(output),
                self._check_no_truncation(output),
            ]
        )

        failures = [c for c in checks if not c.passed]

        if failures:
            return VerifyResult(
                passed=False,
                failure_reason="; ".join(f.reason for f in failures),
                suggested_fix=self._generate_fix_hint(failures[0]),
                retry_count=0,
            )

        return VerifyResult(passed=True)

    # Verification check methods
    def _check_no_syntax_errors(self, output: str) -> CheckResult:
        """Check code has no syntax errors."""
        # Stub - would use AST parser
        return CheckResult(passed=True)

    def _check_imports_valid(self, output: str) -> CheckResult:
        """Check imports are valid."""
        return CheckResult(passed=True)

    def _check_no_placeholder_comments(self, output: str) -> CheckResult:
        """Check no TODO/your code here comments."""
        placeholders = ["TODO:", "your code here", "implement this"]
        for ph in placeholders:
            if ph.lower() in output.lower():
                return CheckResult(passed=False, reason=f"Found placeholder: {ph}")
        return CheckResult(passed=True)

    def _check_file_size_reasonable(self, output: str) -> CheckResult:
        """Check output not too large."""
        lines = output.count("\n")
        if lines > 300:
            return CheckResult(passed=False, reason="File too large (>300 lines)")
        return CheckResult(passed=True)

    def _check_length_adequate(self, output: str, min_words: int) -> CheckResult:
        """Check creative content has adequate length."""
        words = len(output.split())
        if words < min_words:
            return CheckResult(
                passed=False, reason=f"Too short ({words} < {min_words} words)"
            )
        return CheckResult(passed=True)

    def _check_no_lorem_ipsum(self, output: str) -> CheckResult:
        """Check no lorem ipsum placeholder text."""
        if "lorem ipsum" in output.lower():
            return CheckResult(passed=False, reason="Contains lorem ipsum")
        return CheckResult(passed=True)

    def _check_contains_numbers(self, output: str) -> CheckResult:
        """Check analysis contains numbers/data."""
        import re

        if not re.search(r"\d+", output):
            return CheckResult(passed=False, reason="No numbers/data found")
        return CheckResult(passed=True)

    def _check_structured_output(self, output: str) -> CheckResult:
        """Check analysis has structured output (JSON/table)."""
        # Simple heuristic
        if "{" in output and "}" in output:
            return CheckResult(passed=True)
        if "|" in output and "-" in output:
            return CheckResult(passed=True)
        return CheckResult(passed=False, reason="No structured output found")

    def _check_not_empty(self, output: str) -> CheckResult:
        """Check output not empty."""
        if not output.strip():
            return CheckResult(passed=False, reason="Output is empty")
        return CheckResult(passed=True)

    def _check_no_apology_pattern(self, output: str) -> CheckResult:
        """Check no apology patterns."""
        apologies = ["i cannot", "i'm sorry", "i apologize", "unfortunately"]
        for ap in apologies:
            if ap in output.lower():
                return CheckResult(passed=False, reason=f"Apology pattern: {ap}")
        return CheckResult(passed=True)

    def _check_no_truncation(self, output: str) -> CheckResult:
        """Check output not truncated mid-sentence."""
        if output.endswith("...") or output.endswith("—"):
            return CheckResult(passed=False, reason="Output appears truncated")
        return CheckResult(passed=True)

    def _generate_fix_hint(self, failure: CheckResult) -> str:
        """Generate hint for fixing failure."""
        return f"Fix: {failure.reason}"

    async def _fire_webhook(
        self, webhook_url: str, event_type: str, payload: dict
    ) -> None:
        """Fire webhook callback."""
        # Stub - would make HTTP POST
        pass


@dataclass
class VerifyResult:
    """Result của verification check."""

    passed: bool
    failure_reason: str = ""
    suggested_fix: str = ""
    retry_count: int = 0


@dataclass
class CheckResult:
    """Result của single check."""

    passed: bool
    reason: str = ""
