"""
🚦 Hybrid Router - Intelligent AI Task Routing
=============================================

Optimizes AI workload by dispatching tasks to the most cost-effective provider 
without sacrificing quality. Matches task complexity and modality to 
specific model strengths.

Core Logic:
- 🏎️ Fast/Cheap: Llama 3.1 8B for simple summaries.
- 🧠 Reasoning: Llama 3.1 70B for logic.
- 💻 Coding: Claude 3.5 Sonnet for architectural work.
- 👁️ Vision/Context: Gemini 2.0 Pro for 2M token context.

Binh Pháp: 💂 Tướng (Leadership) - Choosing the right soldier for the mission.
"""

import logging
from dataclasses import dataclass
from enum import Enum
from typing import Dict, Optional, Tuple, Any, List

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class TaskComplexity(Enum):
    """Reasoning depth required."""
    SIMPLE = "simple"
    MEDIUM = "medium"
    COMPLEX = "complex"


class TaskType(Enum):
    """Input modality or domain."""
    TEXT = "text"
    CODE = "code"
    VISION = "vision"
    AUDIO = "audio"


@dataclass
class ProviderConfig:
    """Capability and cost profile for an AI model."""
    cost_input: float
    cost_output: float
    max_tokens: int
    strengths: List[str]


@dataclass
class RoutingResult:
    """The decision output of the router."""
    provider: str
    model: str
    estimated_cost: float
    reason: str


class HybridRouter:
    """
    🚦 The Traffic Controller for AI requests.
    
    Dynamically routes to Anthropic, Google, or OpenRouter based on 
    performance needs and budget constraints.
    """

    # 2026 Updated Provider Specs
    PROVIDERS: Dict[str, ProviderConfig] = {
        "openrouter/llama-3.1-8b": ProviderConfig(0.00005, 0.00005, 8192, ["fast", "cheap"]),
        "openrouter/llama-3.1-70b": ProviderConfig(0.0003, 0.0003, 16384, ["reasoning"]),
        "google/gemini-2.0-flash": ProviderConfig(0.0001, 0.0004, 1048576, ["multimodal", "fast"]),
        "google/gemini-2.5-pro": ProviderConfig(0.001, 0.004, 2097152, ["complex", "large_context"]),
        "anthropic/claude-3.5-sonnet": ProviderConfig(0.003, 0.015, 200000, ["code", "reasoning"])
    }

    # Mapping (Type, Complexity) -> Provider Key
    ROUTING_TABLE: Dict[Tuple[TaskType, TaskComplexity], str] = {
        (TaskType.TEXT, TaskComplexity.SIMPLE): "openrouter/llama-3.1-8b",
        (TaskType.TEXT, TaskComplexity.MEDIUM): "openrouter/llama-3.1-70b",
        (TaskType.TEXT, TaskComplexity.COMPLEX): "google/gemini-2.0-flash", # Changed from Pro to Flash for speed/cost

        (TaskType.CODE, TaskComplexity.SIMPLE): "google/gemini-2.0-flash", # Changed from Llama 70B
        (TaskType.CODE, TaskComplexity.MEDIUM): "google/gemini-2.0-flash",
        (TaskType.CODE, TaskComplexity.COMPLEX): "anthropic/claude-3.5-sonnet",

        (TaskType.VISION, TaskComplexity.SIMPLE): "google/gemini-2.0-flash",
        (TaskType.VISION, TaskComplexity.MEDIUM): "google/gemini-2.0-flash",
        (TaskType.VISION, TaskComplexity.COMPLEX): "google/gemini-2.5-pro",
    }

    def __init__(self, cost_optimize: bool = True):
        self.cost_optimize = cost_optimize
        self.total_savings = 0.0
        self.calls_count = 0
        logger.info("Hybrid Router initialized and online.")

    def route(
        self,
        task_type: TaskType,
        complexity: TaskComplexity,
        context_len: int = 0,
        override_provider: Optional[str] = None
    ) -> RoutingResult:
        """Determines the best AI provider for the given parameters."""
        self.calls_count += 1

        # Priority 1: Check for manual override
        if override_provider and override_provider in self.PROVIDERS:
            provider = override_provider
            reason = "Manual override"
        # 2. Check for long context requirements
        elif context_len > 120000:
            provider = "google/gemini-2.5-pro"
            reason = f"Long context overflow ({context_len} tokens)"
        # 3. Use standard routing table
        else:
            provider = self.ROUTING_TABLE.get((task_type, complexity), "google/gemini-2.0-flash")
            reason = f"Automated optimization for {task_type.value}/{complexity.value}"

        cost = self._estimate_cost(provider, context_len)

        # Calculate savings (vs a baseline of Claude 3.5 Sonnet)
        baseline_cost = self._estimate_cost("anthropic/claude-3.5-sonnet", context_len)
        if baseline_cost > cost:
            self.total_savings += (baseline_cost - cost)

        return RoutingResult(
            provider=provider,
            model=provider.split("/")[-1],
            estimated_cost=cost,
            reason=reason
        )

    def _estimate_cost(self, provider: str, tokens: int) -> float:
        if provider not in self.PROVIDERS: return 0.0
        cfg = self.PROVIDERS[provider]
        return (tokens / 1000) * (cfg.cost_input + cfg.cost_output) / 2

    def get_stats(self) -> Dict[str, Any]:
        """Returns router usage telemetry."""
        return {
            "total_calls": self.calls_count,
            "total_savings_usd": self.total_savings,
            "efficiency_ratio": 0.7 # Simulated 70% savings
        }

    @staticmethod
    def analyze_task(prompt: str) -> Tuple[TaskType, TaskComplexity]:
        """Heuristically determines the type and complexity of a prompt."""
        p = prompt.lower()
        t = TaskType.TEXT
        c = TaskComplexity.MEDIUM

        # Modality detection
        if any(w in p for w in ["code", "script", "def ", "class ", "import ", "function"]):
            t = TaskType.CODE
        elif any(w in p for w in ["image", "picture", "draw", "look at", "see"]):
            t = TaskType.VISION

        # Complexity detection
        word_count = len(prompt.split())
        if word_count > 1000 or any(w in p for w in ["comprehensive", "detailed", "architectural", "analyze"]):
            c = TaskComplexity.COMPLEX
        elif word_count < 20:
            c = TaskComplexity.SIMPLE

        return t, c


# --- Unified Interface Helpers ---

def route_task(prompt: str, router: Optional[HybridRouter] = None) -> RoutingResult:
    """
    Standard entry point for AI task routing.
    Can accept a persistent router instance or create a transient one.
    """
    if router is None:
        router = HybridRouter()

    t, c = router.analyze_task(prompt)
    return router.route(t, c, context_len=len(prompt.split()))

# Backward compatibility
route_request = route_task
