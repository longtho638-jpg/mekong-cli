"""
Mekong CLI - AGI Score Engine (AGI v2)

Real-time AGI capability score calculator (0-100).
Scores are computed based on actual module availability,
integration depth, and runtime metrics.

Subsystem weights:
  Module availability: 45% (5 pts each × 9 modules)
  Cross-wiring depth:  25% (pipeline integration)
  Runtime metrics:     15% (execution success rate + learning)
  Self-improvement:    15% (reflection + evolution progress)
"""

import importlib
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


@dataclass
class SubsystemScore:
    """Health score for one AGI subsystem."""

    name: str
    available: bool = False
    score: float = 0.0
    details: str = ""
    icon: str = "❓"


@dataclass
class AGIScoreReport:
    """Complete AGI score report."""

    total_score: float = 0.0
    grade: str = "F"
    subsystems: List[SubsystemScore] = field(default_factory=list)
    module_score: float = 0.0
    wiring_score: float = 0.0
    runtime_score: float = 0.0
    improvement_score: float = 0.0
    details: Dict[str, Any] = field(default_factory=dict)


# Module registry: (display_name, module_path, class_name, icon)
_AGI_MODULES = [
    ("NLU", "src.core.nlu", "IntentClassifier", "📡"),
    ("Memory", "src.core.memory", "MemoryStore", "💾"),
    ("Reflection", "src.core.reflection", "ReflectionEngine", "🪞"),
    ("WorldModel", "src.core.world_model", "WorldModel", "🌍"),
    ("ToolRegistry", "src.core.tool_registry", "ToolRegistry", "🔧"),
    ("BrowserAgent", "src.core.browser_agent", "BrowserAgent", "🌐"),
    ("Collaboration", "src.core.collaboration", "CollaborationProtocol", "🤝"),
    ("CodeEvolution", "src.core.code_evolution", "CodeEvolutionEngine", "🧬"),
    ("VectorMemory", "src.core.vector_memory_store", "VectorMemoryStore", "🧠"),
]

# Cross-wiring checks: (description, check_function_name)
_WIRING_CHECKS = [
    "orchestrator_reflection",
    "orchestrator_world_model",
    "orchestrator_tool_registry",
    "orchestrator_collaboration",
    "orchestrator_code_evolution",
    "orchestrator_vector_memory",
    "planner_step_types",
    "router_intent_tools",
    "executor_tool_step",
    "executor_browse_step",
]


class AGIScoreEngine:
    """
    Calculates real-time AGI capability score (0-100).

    Score breakdown:
      - Module availability: 45 points (5 per module × 9)
      - Cross-wiring depth:  25 points (2.5 per wiring check × 10)
      - Runtime metrics:     15 points (based on execution history)
      - Self-improvement:    15 points (reflection + evolution)
    """

    def calculate(self) -> AGIScoreReport:
        """Calculate the full AGI score report."""
        report = AGIScoreReport()

        # 1. Module availability (45 pts max)
        report.module_score = self._score_modules(report)

        # 2. Cross-wiring depth (25 pts max)
        report.wiring_score = self._score_wiring(report)

        # 3. Runtime metrics (15 pts max)
        report.runtime_score = self._score_runtime(report)

        # 4. Self-improvement (15 pts max)
        report.improvement_score = self._score_improvement(report)

        # Total
        report.total_score = round(
            report.module_score + report.wiring_score +
            report.runtime_score + report.improvement_score, 1
        )

        # Grade
        if report.total_score >= 90:
            report.grade = "S"
        elif report.total_score >= 80:
            report.grade = "A"
        elif report.total_score >= 70:
            report.grade = "B"
        elif report.total_score >= 60:
            report.grade = "C"
        elif report.total_score >= 50:
            report.grade = "D"
        else:
            report.grade = "F"

        return report

    def _score_modules(self, report: AGIScoreReport) -> float:
        """Score module availability (45 pts max, 5 per module)."""
        score = 0.0
        for name, mod_path, cls_name, icon in _AGI_MODULES:
            sub = SubsystemScore(name=name, icon=icon)
            try:
                m = importlib.import_module(mod_path)
                cls = getattr(m, cls_name)
                sub.available = True
                sub.score = 5.0
                sub.details = "online"
                score += 5.0
            except Exception as e:
                sub.details = f"offline: {e}"
            report.subsystems.append(sub)
        return score

    def _score_wiring(self, report: AGIScoreReport) -> float:
        """Score cross-wiring depth (25 pts max, 2.5 per check)."""
        score = 0.0
        wired = []

        # Check orchestrator wiring
        try:
            from src.core.orchestrator import RecipeOrchestrator
            orch = RecipeOrchestrator(llm_client=None, strict_verification=False)
            checks = [
                ("reflection", orch._reflection),
                ("world_model", orch._world_model),
                ("tool_registry", orch._tool_registry),
                ("collaboration", orch._collaboration),
                ("code_evolution", orch._code_evolution),
                ("vector_memory", orch._vector_memory),
            ]
            for name, obj in checks:
                if obj is not None:
                    score += 2.5
                    wired.append(name)
        except Exception:
            pass

        # Check planner step types
        try:
            from src.core.planner import RecipePlanner
            planner = RecipePlanner(llm_client=None)
            if hasattr(planner, "_detect_step_type"):
                score += 2.5
                wired.append("planner_step_types")
        except Exception:
            pass

        # Check router intent tools
        try:
            from src.core.smart_router import _INTENT_TOOLS
            if _INTENT_TOOLS:
                score += 2.5
                wired.append("router_intent_tools")
        except Exception:
            pass

        # Check executor step types
        try:
            from src.core.executor import RecipeExecutor
            from src.core.parser import Recipe
            exe = RecipeExecutor(Recipe(name="", description="", steps=[]))
            if hasattr(exe, "_execute_tool_step") and hasattr(exe, "_execute_browse_step"):
                score += 2.5
                wired.append("executor_step_types")
        except Exception:
            pass

        # Check EventBus wiring in orchestrator
        try:
            if orch._event_bus is not None:
                score += 2.5
                wired.append("event_bus")
        except Exception:
            pass

        report.details["wired"] = wired
        return min(score, 25.0)

    def _score_runtime(self, report: AGIScoreReport) -> float:
        """Score runtime metrics (15 pts max)."""
        score = 0.0
        try:
            from src.core.memory import MemoryStore
            store = MemoryStore()
            stats = store.stats()
            total = stats.get("total", 0)
            success_rate = stats.get("success_rate", 0.0)

            # Up to 5 pts for execution history
            if total > 0:
                score += min(5.0, total * 0.5)

            # Up to 5 pts for success rate
            score += (success_rate / 100.0) * 5.0

            # Up to 5 pts for recipe auto-save
            auto_dir = Path("recipes/auto")
            if auto_dir.exists():
                auto_count = len(list(auto_dir.glob("*.md")))
                score += min(5.0, auto_count * 1.0)

            report.details["executions"] = total
            report.details["success_rate"] = success_rate
        except Exception:
            pass
        return min(score, 15.0)

    def _score_improvement(self, report: AGIScoreReport) -> float:
        """Score self-improvement capabilities (15 pts max)."""
        score = 0.0

        # Reflection available + has data = 5 pts
        try:
            from src.core.reflection import ReflectionEngine
            ref = ReflectionEngine()
            score += 5.0  # Available
            report.details["reflection"] = "active"
        except Exception:
            pass

        # Code Evolution available = 5 pts
        try:
            from src.core.code_evolution import CodeEvolutionEngine
            evo = CodeEvolutionEngine()
            stats = evo.get_stats()
            score += 5.0
            report.details["evolution_attempts"] = stats.get("total_attempts", 0)
        except Exception:
            pass

        # Tiered telemetry available = 5 pts
        try:
            from src.core.telemetry import TieredTelemetryStore
            tiered = TieredTelemetryStore()
            score += 5.0
            report.details["telemetry"] = "tiered"
        except Exception:
            pass

        return min(score, 15.0)


__all__ = ["AGIScoreEngine", "AGIScoreReport", "SubsystemScore"]
