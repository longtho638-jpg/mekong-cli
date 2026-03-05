"""Mekong CLI - Autonomous Engine.

Fully autonomous execution loop with Consciousness Score.
Coordinates NLU, Memory, Router, Orchestrator, Learner, RecipeGen, Governance.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    pass

from .event_bus import EventType, get_event_bus
from .governance import ActionClass, AuditEntry, Governance, GovernanceDecision


@dataclass
class ConsciousnessReport:
    """Consciousness Score and subsystem health."""

    score: int = 0  # 0-100
    memory_health: float = 0.0
    nlu_health: float = 0.0
    router_health: float = 0.0
    executor_health: float = 0.0
    learner_health: float = 0.0
    evolution_health: float = 0.0
    governance_health: float = 0.0


@dataclass
class CycleResult:
    """Result of one autonomous cycle."""

    goal: str = ""
    governance_decision: GovernanceDecision | None = None
    executed: bool = False
    result_status: str = ""
    recipe_generated: bool = False
    patterns_detected: int = 0


class AutonomousEngine:
    """Fully autonomous execution engine. Coordinates all subsystems."""

    def __init__(
        self,
        orchestrator: Any | None = None,
        governance: Governance | None = None,
    ) -> None:
        """Initialize autonomous engine."""
        self.orchestrator = orchestrator
        self.governance = governance or Governance()
        self._memory: Any | None = None
        self._nlu: Any | None = None
        self._router: Any | None = None
        self._learner: Any | None = None
        self._recipe_gen: Any | None = None
        self._init_subsystems()

    def _init_subsystems(self) -> None:
        """Lazy load subsystems with LLM injection."""
        # Inject the key from environment variable
        import os

        from .llm_client import LLMClient
        gemini_key = os.getenv("GEMINI_API_KEY", "")
        llm = LLMClient(gemini_key=gemini_key)

        if self._memory is None:
            try:
                from .memory import MemoryStore

                self._memory = MemoryStore()
            except Exception:
                pass

        if self._nlu is None:
            try:
                from .nlu import IntentClassifier

                self._nlu = IntentClassifier(llm_client=llm)
            except Exception:
                pass

        if self._recipe_gen is None:
            try:
                from .recipe_gen import RecipeGenerator

                self._recipe_gen = RecipeGenerator(llm_client=llm)
            except Exception:
                pass

        # Router still depends on memory, not LLM directly
        try:
            from .smart_router import SmartRouter

            self._router = (
                SmartRouter(memory_store=self._memory) if self._memory else None
            )
        except Exception:
            pass

    def process_goal(self, goal: str) -> CycleResult:
        """Run one full autonomous cycle for a goal."""
        result = CycleResult(goal=goal)

        # Check halt
        if self.governance.is_halted():
            result.result_status = "halted"
            return result

        # Governance check
        decision = self.governance.classify(goal)
        result.governance_decision = decision

        if decision.action_class == ActionClass.FORBIDDEN:
            self.governance.record_audit(
                AuditEntry(
                    goal=goal,
                    action_class="forbidden",
                    approved=False,
                    result="blocked",
                ),
            )
            bus = get_event_bus()
            bus.emit(
                EventType.GOVERNANCE_BLOCKED,
                {
                    "goal": goal,
                    "reason": decision.reason,
                },
            )
            result.result_status = "blocked"
            return result

        if decision.action_class == ActionClass.REVIEW_REQUIRED:
            approved = self.governance.request_approval(goal, decision)
            if not approved:
                self.governance.record_audit(
                    AuditEntry(
                        goal=goal,
                        action_class="review_required",
                        approved=False,
                        result="rejected",
                    ),
                )
                result.result_status = "rejected"
                return result

        # Execute via orchestrator
        if self.orchestrator:
            try:
                orch_result = self.orchestrator.run_from_goal(goal)
                result.executed = True
                result.result_status = orch_result.status.value
            except Exception:
                result.executed = True
                result.result_status = "error"

        # Record memory
        if self._memory and result.executed:
            from .memory import MemoryEntry

            self._memory.record(
                MemoryEntry(
                    goal=goal,
                    status=result.result_status,
                ),
            )

        # Learn from result
        if self._learner and result.result_status == "failed":
            try:
                patterns = self._learner.analyze_failures()
                result.patterns_detected = len(patterns)
            except Exception:
                pass

        # Generate recipe on success
        if self._recipe_gen and self._memory and result.result_status == "success":
            try:
                from .memory import MemoryEntry

                entry = MemoryEntry(goal=goal, status="success")
                recipe = self._recipe_gen.from_successful_run(entry)
                if recipe.valid:
                    self._recipe_gen.save_recipe(recipe)
                    result.recipe_generated = True
            except Exception:
                pass

        # Audit
        self.governance.record_audit(
            AuditEntry(
                goal=goal,
                action_class=decision.action_class.value,
                approved=True,
                result="executed" if result.executed else "skipped",
            ),
        )

        # Emit cycle event
        bus = get_event_bus()
        bus.emit(
            EventType.AUTONOMOUS_CYCLE,
            {
                "goal": goal,
                "status": result.result_status,
                "executed": result.executed,
            },
        )

        return result

    def get_consciousness(self) -> ConsciousnessReport:
        """Calculate Consciousness Score from subsystem health."""
        report = ConsciousnessReport()

        report.memory_health = 1.0 if self._memory else 0.0
        report.nlu_health = 1.0 if self._nlu else 0.0
        report.router_health = 1.0 if self._router else 0.0
        report.learner_health = 1.0 if self._learner else 0.0
        report.evolution_health = 1.0 if self._recipe_gen else 0.0
        report.governance_health = (
            1.0 if self.governance and not self.governance.is_halted() else 0.0
        )

        # Executor health from recent success rate
        if self._memory:
            entries = self._memory.recent(20)
            if entries:
                successes = sum(1 for e in entries if e.status == "success")
                report.executor_health = successes / len(entries)
            else:
                report.executor_health = 0.5  # No data = neutral
        else:
            report.executor_health = 0.0

        # Weighted score
        report.score = int(
            report.memory_health * 15
            + report.nlu_health * 15
            + report.router_health * 10
            + report.executor_health * 20
            + report.learner_health * 10
            + report.evolution_health * 10
            + report.governance_health * 20,
        )

        return report

    def is_halted(self) -> bool:
        """Check if engine is halted."""
        return self.governance.is_halted()

    def halt(self) -> None:
        """Halt all autonomous operations."""
        self.governance.halt()

    def resume(self) -> None:
        """Resume autonomous operations."""
        self.governance.resume()


__all__ = [
    "AutonomousEngine",
    "ConsciousnessReport",
    "CycleResult",
]
