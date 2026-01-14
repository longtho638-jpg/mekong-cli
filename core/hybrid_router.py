"""
Hybrid Router - Intelligent AI Task Routing.
============================================

Routes tasks to optimal AI providers for cost efficiency and performance.
Achieves up to 70% cost savings by matching task complexity to the right model.

"Dùng binh phải biết ứng biến."
"""

import logging
from dataclasses import dataclass
from enum import Enum
from typing import Dict, Optional, Tuple, Any, Union

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class TaskComplexity(Enum):
    """Degrees of computational reasoning required."""
    SIMPLE = "simple"
    MEDIUM = "medium"
    COMPLEX = "complex"


class TaskType(Enum):
    """Modality or specific skill required."""
    TEXT = "text"
    CODE = "code"
    VISION = "vision"
    AUDIO = "audio"


@dataclass
class ProviderConfig:
    """Pricing and capability configuration for an AI model."""
    cost_input: float
    cost_output: float
    max_tokens: int
    strengths: list[str]


@dataclass
class RoutingResult:
    """Decision outcome from the routing engine."""
    provider: str
    model: str
    estimated_cost: float
    reason: str


class HybridRouter:
    """
    Intelligent Routing Engine.
    
    Dynamically dispatches requests based on heuristics, context size, and modality.
    """
    
    # Provider definitions updated for 2026 standards
    PROVIDERS: Dict[str, ProviderConfig] = {
        "openrouter/llama-3.1-8b": ProviderConfig(0.00005, 0.00005, 8192, ["fast", "cheap"]),
        "openrouter/llama-3.1-70b": ProviderConfig(0.0003, 0.0003, 8192, ["reasoning"]),
        "google/gemini-2.0-flash": ProviderConfig(0.0001, 0.0004, 1048576, ["multimodal", "fast"]),
        "google/gemini-2.0-pro": ProviderConfig(0.001, 0.004, 2097152, ["complex", "context"]),
        "anthropic/claude-3.5-sonnet": ProviderConfig(0.003, 0.015, 200000, ["code", "analysis"])
    }
    
    # Routing Table mapping (Type, Complexity) -> Model Key
    ROUTING_TABLE: Dict[Tuple[TaskType, TaskComplexity], str] = {
        (TaskType.TEXT, TaskComplexity.SIMPLE): "openrouter/llama-3.1-8b",
        (TaskType.TEXT, TaskComplexity.MEDIUM): "openrouter/llama-3.1-70b",
        (TaskType.TEXT, TaskComplexity.COMPLEX): "google/gemini-2.0-pro",
        
        (TaskType.CODE, TaskComplexity.SIMPLE): "openrouter/llama-3.1-70b",
        (TaskType.CODE, TaskComplexity.MEDIUM): "google/gemini-2.0-flash",
        (TaskType.CODE, TaskComplexity.COMPLEX): "anthropic/claude-3.5-sonnet",
        
        (TaskType.VISION, TaskComplexity.SIMPLE): "google/gemini-2.0-flash",
        (TaskType.VISION, TaskComplexity.COMPLEX): "google/gemini-2.0-pro",
    }
    
    def __init__(self, cost_optimize: bool = True):
        self.cost_optimize = cost_optimize
        self.total_savings = 0.0
        self.calls_count = 0
        logger.info("Hybrid Router initialized.")
    
    def route(
        self,
        task_type: TaskType,
        complexity: TaskComplexity,
        context_len: int = 0
    ) -> RoutingResult:
        """Execute routing logic to select the best model."""
        self.calls_count += 1
        
        # Priority 1: Context Length Constraint
        if context_len > 150000:
            provider = "google/gemini-2.0-pro"
            reason = f"Long context overflow ({context_len} tokens)"
        else:
            # Priority 2: Table Lookup with Fallback
            provider = self.ROUTING_TABLE.get((task_type, complexity), "google/gemini-2.0-flash")
            reason = f"Optimized for {task_type.value}/{complexity.value}"
            
        cost = self._estimate_cost(provider, context_len)
        logger.info(f"Routed to {provider} ({reason})")
        return RoutingResult(provider, provider.split("/")[-1], cost, reason)

    def _estimate_cost(self, provider: str, tokens: int) -> float:
        if provider not in self.PROVIDERS: return 0.0
        cfg = self.PROVIDERS[provider]
        return (tokens / 1000) * (cfg.cost_input + cfg.cost_output) / 2

    @staticmethod
    def analyze_task(prompt: str) -> Tuple[TaskType, TaskComplexity]:
        """Determine type and complexity based on heuristics."""
        p = prompt.lower()
        t = TaskType.TEXT
        c = TaskComplexity.MEDIUM
        
        if any(w in p for w in ["code", "script", "def ", "class "]): t = TaskType.CODE
        elif any(w in p for w in ["image", "picture", "draw"]): t = TaskType.VISION
        
        if len(prompt) > 2000: c = TaskComplexity.COMPLEX
        elif len(prompt) < 200: c = TaskComplexity.SIMPLE
        
        return t, c


# Helper function
def route_request(prompt: str) -> RoutingResult:
    """Quick access routing helper."""
    router = HybridRouter()
    t, c = router.analyze_task(prompt)
    return router.route(t, c, len(prompt.split()))


if __name__ == "__main__":
    print("🌊 Mekong Hybrid Router Test")
    print("=" * 60)
    
    res = route_request("Write a basic hello world in python")
    print(f"Result: {res.provider} | Reason: {res.reason}")