"""Hybrid LLM Router — Main Orchestrator.

Entry point integrating all 8 ALGOs:
1. TaskClassifier → 2. ModelSelector → 3. CostEstimator
4. MCUGate → 5. LocalAdapter → 6. APIAdapter
7. FallbackChain → 8. AgentDispatcher

9-stage pipeline: classify → MCU lock → model select → agent load →
build messages → execute with fallback → verify → MCU confirm → emit.
"""

from __future__ import annotations

import asyncio
import logging
import uuid
from dataclasses import dataclass, field

from src.core.task_classifier import classify_task, TaskProfile
from src.core.model_selector import select_model, SystemState
from src.core.cost_estimator import estimate_cost, CostEstimate
from src.core.mcu_gate import MCUGate
from src.core.agent_dispatcher import build_message_chain
from src.core.fallback_chain import execute_with_fallback

logger = logging.getLogger(__name__)


@dataclass
class MissionResult:
    """Result of a routed mission."""

    success: bool
    mission_id: str = ""
    model_used: str | None = None
    mcu_charged: int = 0
    output: str = ""
    error: str = ""
    profile: TaskProfile | None = None
    cost_estimate: CostEstimate | None = None
    attempts: list[str] = field(default_factory=list)


def _get_system_state() -> SystemState:
    """Gather current system state for model selection."""
    import os

    local_available = False
    local_models: list[str] = []

    try:
        from src.core.local_adapter import OllamaAdapter
        adapter = OllamaAdapter()
        local_available = adapter.health_check()
        if local_available:
            local_models = adapter.list_models()
    except Exception:
        pass

    api_keys = {
        "anthropic": bool(os.getenv("ANTHROPIC_API_KEY")),
        "google": bool(os.getenv("GOOGLE_API_KEY")),
        "openai": bool(os.getenv("OPENAI_API_KEY")),
    }

    return SystemState(
        local_available=local_available,
        local_models=local_models,
        api_keys=api_keys,
        tenant_tier="growth",
    )


async def route_and_execute(
    goal: str,
    tenant_id: str,
    mission_id: str | None = None,
    mcu_gate: MCUGate | None = None,
    system_state: SystemState | None = None,
    on_token: asyncio.coroutines = None,
) -> MissionResult:
    """Main routing pipeline — 9 stages.

    Args:
        goal: Natural language task description.
        tenant_id: Tenant identifier for MCU billing.
        mission_id: Optional mission ID (auto-generated if None).
        mcu_gate: Optional MCUGate instance (uses in-memory if None).
        system_state: Optional system state (auto-detected if None).
        on_token: Optional async callback for streaming tokens.

    Returns:
        MissionResult with execution details.
    """
    if not mission_id:
        mission_id = str(uuid.uuid4())

    # ── STAGE 1: CLASSIFY ─────────────────────────────────────
    profile = classify_task(goal, context={"tenant_id": tenant_id})
    logger.info(
        "Stage 1 — Classified: complexity=%s, domain=%s, agent=%s, mcu=%d",
        profile.complexity, profile.domain, profile.agent_role, profile.mcu_cost,
    )

    # ── STAGE 2: MCU CHECK + LOCK ─────────────────────────────
    gate = mcu_gate or MCUGate(":memory:")
    lock_result = gate.check_and_lock(tenant_id, mission_id, profile.mcu_cost)

    if not lock_result.success:
        logger.warning(
            "Stage 2 — MCU lock failed: %s (available=%d, required=%d)",
            lock_result.error, lock_result.available, profile.mcu_cost,
        )
        return MissionResult(
            success=False,
            mission_id=mission_id,
            error=lock_result.error,
            profile=profile,
            mcu_charged=0,
        )

    lock_id = lock_result.lock_id
    logger.info("Stage 2 — MCU locked: %d MCU (lock_id=%s)", profile.mcu_cost, lock_id)

    # ── STAGE 3: MODEL SELECT ─────────────────────────────────
    state = system_state or _get_system_state()
    model_config = select_model(profile, state)
    cost_est = estimate_cost(profile, model_config.model_id)

    logger.info(
        "Stage 3 — Model selected: %s (margin=%.1f%%)",
        model_config.model_id, cost_est.margin_pct,
    )

    # ── STAGE 4+5: LOAD AGENT PROMPT + BUILD MESSAGES ─────────
    messages, system_prompt = build_message_chain(
        goal=goal,
        agent_role=profile.agent_role,
        domain=profile.domain,
        tenant_id=tenant_id,
    )
    logger.info("Stage 4+5 — Agent '%s' prompt loaded, messages built", profile.agent_role)

    # ── STAGE 6: EXECUTE WITH FALLBACK ────────────────────────
    try:
        exec_result = await execute_with_fallback(
            model_config=model_config,
            messages=messages,
            system_prompt=system_prompt,
            on_token_cb=on_token,
            data_sensitivity=profile.data_sensitivity,
        )
    except Exception as e:
        logger.error("Stage 6 — Execution failed: %s", e)
        gate.refund_full(lock_id, reason=str(e))
        return MissionResult(
            success=False,
            mission_id=mission_id,
            error=f"execution_failed: {e}",
            profile=profile,
        )

    # ── STAGE 7: VERIFY OUTPUT ────────────────────────────────
    if not exec_result.success:
        logger.warning("Stage 7 — All models failed, refunding MCU")
        gate.refund_full(lock_id, reason=exec_result.error)
        return MissionResult(
            success=False,
            mission_id=mission_id,
            error=exec_result.error,
            profile=profile,
            attempts=exec_result.attempts,
        )

    # ── STAGE 8: MCU CONFIRM ──────────────────────────────────
    confirm_result = gate.confirm(lock_id)
    if not confirm_result.success:
        logger.error("Stage 8 — MCU confirm failed: %s", confirm_result.error)

    logger.info(
        "Stage 8 — MCU confirmed: charged=%d, refunded=%d",
        confirm_result.charged, confirm_result.refunded,
    )

    # ── STAGE 9: RETURN RESULT ────────────────────────────────
    return MissionResult(
        success=True,
        mission_id=mission_id,
        model_used=exec_result.model_used,
        mcu_charged=profile.mcu_cost,
        output=exec_result.output,
        profile=profile,
        cost_estimate=cost_est,
        attempts=exec_result.attempts,
    )


def route_sync(
    goal: str,
    tenant_id: str,
    mission_id: str | None = None,
    mcu_gate: MCUGate | None = None,
    system_state: SystemState | None = None,
) -> MissionResult:
    """Synchronous wrapper for route_and_execute."""
    return asyncio.run(
        route_and_execute(
            goal=goal,
            tenant_id=tenant_id,
            mission_id=mission_id,
            mcu_gate=mcu_gate,
            system_state=system_state,
        )
    )
