"""
🚦 Hybrid Router - Intelligent AI Task Routing
=============================================

Optimizes AI workload by dispatching tasks to the most cost-effective provider.
"""

import logging
from dataclasses import dataclass
from enum import Enum
from typing import Dict, List, Optional, Tuple

from core.config import get_settings

logger = logging.getLogger(__name__)


class TaskComplexity(Enum):
    SIMPLE = "simple"
    MEDIUM = "medium"
    COMPLEX = "complex"


class TaskType(Enum):
    TEXT = "text"
    CODE = "code"
    VISION = "vision"
    AUDIO = "audio"


@dataclass
class ProviderConfig:
    cost_input: float
    cost_output: float
    max_tokens: int
    strengths: List[str]


@dataclass
class RoutingResult:
    provider: str
    model: str
    estimated_cost: float
    reason: str


class HybridRouter:
    def __init__(self):
        self.settings = get_settings()
        self.providers = self._load_providers()
        self.total_savings = 0.0
        self.calls_count = 0
        logger.info("Hybrid Router initialized.")

    def _load_providers(self) -> Dict[str, ProviderConfig]:
        """Load providers from settings."""
        providers = {}
        for key, data in self.settings.AI_MODELS.items():
            providers[key] = ProviderConfig(
                cost_input=data["cost_input"],
                cost_output=data["cost_output"],
                max_tokens=data["max_tokens"],
                strengths=data["strengths"],
            )
        return providers

    def route(
        self,
        task_type: TaskType,
        complexity: TaskComplexity,
        context_len: int = 0,
        override_provider: Optional[str] = None,
    ) -> RoutingResult:
        self.calls_count += 1

        # Logic to determine provider (Simplified for brevity but effective)
        if override_provider and override_provider in self.providers:
            provider = override_provider
            reason = "Manual override"
        elif context_len > 100000:
            provider = "google/gemini-2.5-pro"
            reason = "Large context context"
        elif task_type == TaskType.CODE and complexity == TaskComplexity.COMPLEX:
            provider = "anthropic/claude-3.5-sonnet"
            reason = "Complex coding task"
        elif complexity == TaskComplexity.SIMPLE:
            provider = "google/gemini-2.0-flash"  # Default cheap/fast
            reason = "Simple task optimization"
        else:
            provider = "google/gemini-2.0-flash"  # Fallback
            reason = "Default routing"

        cost = self._estimate_cost(provider, context_len)
        return RoutingResult(provider, provider.split("/")[-1], cost, reason)

    def _estimate_cost(self, provider: str, tokens: int) -> float:
        if provider not in self.providers:
            return 0.0
        cfg = self.providers[provider]
        return (tokens / 1000) * (cfg.cost_input)  # Approximate input cost

    @staticmethod
    def analyze_task(prompt: str) -> Tuple[TaskType, TaskComplexity]:
        """Heuristic analysis of prompt."""
        t = TaskType.TEXT
        c = TaskComplexity.MEDIUM
        if "code" in prompt.lower() or "function" in prompt.lower():
            t = TaskType.CODE
        if len(prompt) > 1000:
            c = TaskComplexity.COMPLEX
        return t, c


def route_task(prompt: str) -> RoutingResult:
    router = HybridRouter()
    t, c = router.analyze_task(prompt)
    return router.route(t, c, len(prompt))
