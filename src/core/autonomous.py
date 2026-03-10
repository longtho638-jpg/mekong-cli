"""
Mekong CLI - Autonomous Engine (AGI v2)

Fully autonomous execution loop with Consciousness Score.
Coordinates NLU, Memory, Router, Orchestrator, Learner, RecipeGen,
Governance, Reflection, and WorldModel.
"""

import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

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
    reflection_health: float = 0.0  # AGI v2
    world_model_health: float = 0.0  # AGI v2


@dataclass
class DecisionTrace:
    """Explainable trace of an autonomous decision."""

    goal: str
    timestamp: float = field(default_factory=time.time)
    intent_classified: str = ""
    confidence: float = 0.0
    governance_decision: str = ""
    strategy_used: str = ""
    world_state_summary: str = ""
    reflection_summary: str = ""
    result: str = ""


@dataclass
class CycleResult:
    """Result of one autonomous cycle."""

    goal: str = ""
    governance_decision: Optional[GovernanceDecision] = None
    executed: bool = False
    result_status: str = ""
    recipe_generated: bool = False
    patterns_detected: int = 0
    reflection_summary: str = ""  # AGI v2
    world_diff_summary: str = ""  # AGI v2
    decision_trace: Optional[DecisionTrace] = None  # AGI v2


class AutonomousEngine:
    """Fully autonomous execution engine. Coordinates all subsystems."""

    MAX_HISTORY: int = 100

    def __init__(
        self,
        orchestrator: Optional[Any] = None,
        governance: Optional[Governance] = None,
    ) -> None:
        """Initialize autonomous engine."""
        self.orchestrator = orchestrator
        self.governance = governance or Governance()
        self._memory: Optional[Any] = None
        self._nlu: Optional[Any] = None
        self._router: Optional[Any] = None
        self._learner: Optional[Any] = None
        self._recipe_gen: Optional[Any] = None
        self._reflection: Optional[Any] = None  # AGI v2
        self._world_model: Optional[Any] = None  # AGI v2
        self._consciousness_history: List[ConsciousnessReport] = []
        self._decision_traces: List[DecisionTrace] = []
        self._init_subsystems()

    def _init_subsystems(self) -> None:
        """Lazy load subsystems with LLM injection."""
        from .llm_client import LLMClient

        import os
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

        # Router depends on memory
        try:
            from .smart_router import SmartRouter
            self._router = (
                SmartRouter(memory_store=self._memory) if self._memory else None
            )
        except Exception:
            pass

        # AGI v2: Reflection Engine
        if self._reflection is None:
            try:
                from .reflection import ReflectionEngine
                self._reflection = ReflectionEngine(llm_client=llm)
            except Exception:
                pass

        # AGI v2: World Model
        if self._world_model is None:
            try:
                from .world_model import WorldModel
                self._world_model = WorldModel(llm_client=llm)
            except Exception:
                pass

    def process_goal(self, goal: str) -> CycleResult:
        """Run one full autonomous cycle for a goal."""
        result = CycleResult(goal=goal)
        trace = DecisionTrace(goal=goal)
        start_time = time.time()

        # Check halt
        if self.governance.is_halted():
            result.result_status = "halted"
            trace.result = "halted"
            result.decision_trace = trace
            return result

        # AGI v2: Take world snapshot before execution
        world_before = None
        if self._world_model:
            try:
                world_before = self._world_model.snapshot()
                trace.world_state_summary = self._world_model.get_context_summary()
            except Exception:
                pass

        # NLU classification
        if self._nlu:
            try:
                intent_result = self._nlu.classify(goal)
                trace.intent_classified = intent_result.intent.value
                trace.confidence = intent_result.confidence
            except Exception:
                pass

        # Governance check
        decision = self.governance.classify(goal)
        result.governance_decision = decision
        trace.governance_decision = decision.action_class.value

        if decision.action_class == ActionClass.FORBIDDEN:
            self.governance.record_audit(
                AuditEntry(
                    goal=goal,
                    action_class="forbidden",
                    approved=False,
                    result="blocked",
                )
            )
            bus = get_event_bus()
            bus.emit(
                EventType.GOVERNANCE_BLOCKED,
                {"goal": goal, "reason": decision.reason},
            )
            result.result_status = "blocked"
            trace.result = "blocked"
            result.decision_trace = trace
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
                    )
                )
                result.result_status = "rejected"
                trace.result = "rejected"
                result.decision_trace = trace
                return result

        # AGI v2: Get strategy suggestion from reflection engine
        if self._reflection:
            try:
                strategy = self._reflection.get_strategy_suggestion(goal)
                trace.strategy_used = strategy
            except Exception:
                pass

        # Execute via orchestrator
        if self.orchestrator:
            try:
                orch_result = self.orchestrator.run_from_goal(goal)
                result.executed = True
                result.result_status = orch_result.status.value
            except Exception:
                result.executed = True
                result.result_status = "error"

        duration_ms = (time.time() - start_time) * 1000

        # Record memory
        if self._memory and result.executed:
            from .memory import MemoryEntry
            self._memory.record(
                MemoryEntry(
                    goal=goal,
                    status=result.result_status,
                    duration_ms=duration_ms,
                )
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

        # AGI v2: Post-task reflection
        if self._reflection and result.executed:
            try:
                reflection = self._reflection.reflect(
                    goal=goal,
                    status=result.result_status,
                    duration_ms=duration_ms,
                    error="" if result.result_status == "success" else result.result_status,
                )
                result.reflection_summary = reflection.lesson_learned
                trace.reflection_summary = reflection.lesson_learned
            except Exception:
                pass

        # AGI v2: Take world snapshot after and compute diff
        if self._world_model and world_before:
            try:
                world_after = self._world_model.snapshot()
                world_diff = self._world_model.diff(world_before, world_after)
                result.world_diff_summary = world_diff.summary()
            except Exception:
                pass

        # Audit
        trace.result = result.result_status
        self.governance.record_audit(
            AuditEntry(
                goal=goal,
                action_class=decision.action_class.value,
                approved=True,
                result="executed" if result.executed else "skipped",
            )
        )

        # Store decision trace
        result.decision_trace = trace
        self._decision_traces.append(trace)
        if len(self._decision_traces) > self.MAX_HISTORY:
            self._decision_traces = self._decision_traces[-self.MAX_HISTORY:]

        # Emit cycle event
        bus = get_event_bus()
        bus.emit(
            EventType.AUTONOMOUS_CYCLE,
            {
                "goal": goal,
                "status": result.result_status,
                "executed": result.executed,
                "reflection": result.reflection_summary,
                "world_diff": result.world_diff_summary,
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

        # AGI v2: Reflection health
        report.reflection_health = 1.0 if self._reflection else 0.0
        if self._reflection:
            try:
                stats = self._reflection.get_stats()
                cal_error = stats.get("calibration_error", 0.5)
                report.reflection_health = max(0.0, 1.0 - cal_error)
            except Exception:
                pass

        # AGI v2: World model health
        report.world_model_health = 1.0 if self._world_model else 0.0

        # Executor health from recent success rate
        if self._memory:
            entries = self._memory.recent(20)
            if entries:
                successes = sum(1 for e in entries if e.status == "success")
                report.executor_health = successes / len(entries)
            else:
                report.executor_health = 0.5
        else:
            report.executor_health = 0.0

        # Weighted score (AGI v2: includes reflection + world model)
        report.score = int(
            report.memory_health * 12
            + report.nlu_health * 12
            + report.router_health * 8
            + report.executor_health * 16
            + report.learner_health * 8
            + report.evolution_health * 8
            + report.governance_health * 16
            + report.reflection_health * 10  # AGI v2
            + report.world_model_health * 10  # AGI v2
        )

        # Track consciousness over time
        self._consciousness_history.append(report)
        if len(self._consciousness_history) > self.MAX_HISTORY:
            self._consciousness_history = self._consciousness_history[
                -self.MAX_HISTORY:
            ]

        return report

    def get_consciousness_trend(self, limit: int = 20) -> List[int]:
        """Return recent consciousness scores for trend analysis."""
        return [r.score for r in self._consciousness_history[-limit:]]

    def get_decision_traces(self, limit: int = 10) -> List[DecisionTrace]:
        """Return recent decision traces for explainability."""
        return self._decision_traces[-limit:]

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
    "DecisionTrace",
]
