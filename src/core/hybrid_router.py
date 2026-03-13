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

from src.core.task_classifier import classify_task, classify_multi_agent, TaskProfile
from src.core.model_selector import select_model, select_model_with_tier, SystemState
from src.core.cost_estimator import estimate_cost, CostEstimate
from src.core.mcu_gate import MCUGate
from src.core.agent_dispatcher import build_message_chain
from src.core.fallback_chain import execute_with_fallback
from src.core.context_flow import ContextFlow
from src.core.subagent_reviewer import SubagentReviewer
from src.core.llm_client import get_client

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
    except Exception as e:
        logger.debug("Hybrid router init error: %s", e)

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

    # ── STAGE 1: CLASSIFY (Water Protocol 水 — multi-agent aware) ──
    profile = classify_task(goal, context={"tenant_id": tenant_id})
    agent_roles = classify_multi_agent(goal)
    is_multi_agent = len(agent_roles) > 1
    logger.info(
        "Stage 1 — Classified: complexity=%s, domain=%s, agent=%s, mcu=%d, multi_agent=%s",
        profile.complexity, profile.domain, profile.agent_role, profile.mcu_cost,
        agent_roles if is_multi_agent else "no",
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

    # ── STAGE 4+5+6: EXECUTE (multi-agent or single) ─────────
    if is_multi_agent:
        # Water Protocol: multiple agents collaborate with context flow
        flow = ContextFlow(task_id=mission_id)
        final_output_parts = []

        for agent_role in agent_roles:
            # Build context-enriched goal for this agent
            prior_context = flow.get_context_for(agent_role)
            enriched_goal = f"{prior_context}\n{goal}" if prior_context else goal

            messages, system_prompt = build_message_chain(
                goal=enriched_goal,
                agent_role=agent_role,
                domain=profile.domain,
                tenant_id=tenant_id,
            )
            logger.info("Stage 4+5 — Multi-agent: '%s' prompt loaded", agent_role)

            try:
                exec_result = await execute_with_fallback(
                    model_config=model_config,
                    messages=messages,
                    system_prompt=system_prompt,
                    on_token_cb=on_token,
                    data_sensitivity=profile.data_sensitivity,
                )
            except Exception as e:
                logger.error("Stage 6 — Agent '%s' failed: %s", agent_role, e)
                flow.add(agent_role, "", status="BLOCKED", concerns=str(e))
                continue

            if exec_result.success:
                flow.add(agent_role, exec_result.output, status="DONE")
                final_output_parts.append(f"[{agent_role.upper()}]\n{exec_result.output}")
            else:
                flow.add(agent_role, exec_result.error, status="BLOCKED", concerns=exec_result.error)

            # Stop if blocker detected
            if flow.has_blocker():
                logger.warning("Stage 6 — Blocker detected at agent '%s', stopping", agent_role)
                break

        # Combine outputs
        combined_output = "\n\n".join(final_output_parts)
        logger.info("Stage 6 — Multi-agent complete: %s", flow.get_summary())

        if flow.has_blocker():
            gate.refund_full(lock_id, reason="multi_agent_blocked")
            return MissionResult(
                success=False,
                mission_id=mission_id,
                error=f"multi_agent_blocked: {flow.get_summary()}",
                profile=profile,
            )

        # Create a synthetic exec_result for the review stage
        class _MultiAgentResult:
            success = True
            output = combined_output
            model_used = model_config.model_id
            error = ""
            attempts = [r for r in agent_roles]
        exec_result = _MultiAgentResult()

    else:
        # Single agent path (original logic, preserved)
        messages, system_prompt = build_message_chain(
            goal=goal,
            agent_role=profile.agent_role,
            domain=profile.domain,
            tenant_id=tenant_id,
        )
        logger.info("Stage 4+5 — Agent '%s' prompt loaded, messages built", profile.agent_role)

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

    # ── STAGE 7: VERIFY OUTPUT (with SubagentReviewer) ────────
    if not exec_result.success:
        logger.warning("Stage 7 — All models failed, refunding MCU")
        gate.refund_full(lock_id, reason=exec_result.error)
        return MissionResult(
            success=False,
            mission_id=mission_id,
            error=exec_result.error,
            profile=profile,
            attempts=getattr(exec_result, 'attempts', []),
        )

    # Post-execution review (Water Protocol)
    review_result = None
    try:
        reviewer = SubagentReviewer(get_client())
        review_result = reviewer.full_review(goal, exec_result.output)
        if not review_result.get("proceed", True):
            logger.warning(
                "Stage 7 — Review failed: %s",
                review_result.get("spec_review", {}).get("issues", []),
            )
    except Exception as e:
        logger.debug("Stage 7 — Review skipped: %s", e)

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
