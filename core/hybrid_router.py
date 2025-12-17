""
Hybrid Router - Intelligent AI Task Routing.
Mekong-CLI Core Module.

Routes tasks to optimal AI provider for up to 70% cost savings:
- Easy tasks → OpenRouter (Llama 3.1)
- Complex tasks → Google Gemini / Anthropic Claude
- Vision tasks → Google Gemini Flash/Pro
- Code tasks → Anthropic Claude
""

from dataclasses import dataclass
from enum import Enum
from typing import Dict, Optional, Tuple, Any

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
    strengths: list[str]

@dataclass
class RoutingResult:
    """Result of routing decision."""
    provider: str
    model: str
    estimated_cost: float
    reason: str

class HybridRouter:
    """
    Intelligent router for dispatching AI tasks to the most cost-effective provider.
    """
    
    PROVIDERS: Dict[str, ProviderConfig] = {
        "openrouter/llama-3.1-8b": ProviderConfig(
            cost_input=0.00005, cost_output=0.00005, max_tokens=8192,
            strengths=["fast", "cheap", "simple-text"]
        ),
        "openrouter/llama-3.1-70b": ProviderConfig(
            cost_input=0.0003, cost_output=0.0003, max_tokens=8192,
            strengths=["medium-complexity", "reasoning"]
        ),
        "google/gemini-2.5-flash": ProviderConfig(
            cost_input=0.00015, cost_output=0.0006, max_tokens=1048576,
            strengths=["long-context", "fast", "vision"]
        ),
        "google/gemini-2.5-pro": ProviderConfig(
            cost_input=0.00125, cost_output=0.005, max_tokens=1048576,
            strengths=["complex", "reasoning", "vision", "code"]
        ),
        "anthropic/claude-sonnet": ProviderConfig(
            cost_input=0.003, cost_output=0.015, max_tokens=200000,
            strengths=["code", "analysis", "complex"]
        )
    }
    
    # Routing table: (TaskType, TaskComplexity) -> Provider Key
    ROUTING_TABLE: Dict[Tuple[TaskType, TaskComplexity], str] = {
        (TaskType.TEXT, TaskComplexity.SIMPLE): "openrouter/llama-3.1-8b",
        (TaskType.TEXT, TaskComplexity.MEDIUM): "openrouter/llama-3.1-70b",
        (TaskType.TEXT, TaskComplexity.COMPLEX): "google/gemini-2.5-pro",
        
        (TaskType.CODE, TaskComplexity.SIMPLE): "openrouter/llama-3.1-70b",
        (TaskType.CODE, TaskComplexity.MEDIUM): "google/gemini-2.5-flash",
        (TaskType.CODE, TaskComplexity.COMPLEX): "anthropic/claude-sonnet",
        
        (TaskType.VISION, TaskComplexity.SIMPLE): "google/gemini-2.5-flash",
        (TaskType.VISION, TaskComplexity.MEDIUM): "google/gemini-2.5-flash",
        (TaskType.VISION, TaskComplexity.COMPLEX): "google/gemini-2.5-pro",
        
        (TaskType.AUDIO, TaskComplexity.SIMPLE): "google/gemini-2.5-flash",
        (TaskType.AUDIO, TaskComplexity.MEDIUM): "google/gemini-2.5-flash",
        (TaskType.AUDIO, TaskComplexity.COMPLEX): "google/gemini-2.5-pro",
    }
    
    def __init__(self, cost_optimize: bool = True):
        self.cost_optimize = cost_optimize
        self.total_savings = 0.0
        self.calls_count = 0
    
    def route(
        self,
        task_type: TaskType,
        complexity: TaskComplexity,
        context_length: int = 0,
        override_provider: Optional[str] = None
    ) -> RoutingResult:
        """Route a task to the optimal AI provider."""
        self.calls_count += 1
        
        # 1. Handle Overrides
        if override_provider and override_provider in self.PROVIDERS:
            return self._create_result(override_provider, context_length, "Manual override")
        
        # 2. Handle Long Context (Hard constraint)
        if context_length > 100000:
            return self._create_result("google/gemini-2.5-pro", context_length, f"Long context ({context_length} tokens)")
        
        # 3. Standard Routing
        provider = self.ROUTING_TABLE.get((task_type, complexity), "openrouter/llama-3.1-8b")
        
        # 4. Calculate Savings (vs Baseline GPT-4/Claude Sonnet)
        self._track_savings(provider, context_length)
        
        return self._create_result(provider, context_length, f"Optimal for {task_type.value}/{complexity.value}")

    def _create_result(self, provider: str, tokens: int, reason: str) -> RoutingResult:
        return RoutingResult(
            provider=provider,
            model=provider.split("/")[-1],
            estimated_cost=self._estimate_cost(provider, tokens),
            reason=reason
        )

    def _track_savings(self, chosen_provider: str, tokens: int):
        # Baseline comparison: Anthropic Claude Sonnet (proxy for GPT-4 class)
        baseline_cost = self._estimate_cost("anthropic/claude-sonnet", tokens)
        actual_cost = self._estimate_cost(chosen_provider, tokens)
        self.total_savings += max(0, baseline_cost - actual_cost)

    def _estimate_cost(self, provider: str, tokens: int) -> float:
        if provider not in self.PROVIDERS:
            return 0.0
        config = self.PROVIDERS[provider]
        # Simplified estimate: 50/50 input/output split
        return (tokens / 1000) * (config.cost_input + config.cost_output) / 2
    
    def get_stats(self) -> Dict[str, Any]:
        return {
            "total_calls": self.calls_count,
            "total_savings_usd": round(self.total_savings, 4),
            "avg_savings_per_call": round(self.total_savings / max(1, self.calls_count), 6)
        }
    
    @staticmethod
    def analyze_task(prompt: str) -> Tuple[TaskType, TaskComplexity]:
        """Heuristic analysis of a prompt to determine type and complexity."""
        prompt_lower = prompt.lower()
        length = len(prompt)
        
        # Type Detection
        if any(w in prompt_lower for w in ["code", "function", "class", "debug", "fix", "import "]):
            task_type = TaskType.CODE
        elif any(w in prompt_lower for w in ["image", "photo", "screenshot", "picture", "vision"]):
            task_type = TaskType.VISION
        elif any(w in prompt_lower for w in ["audio", "voice", "sound", "music", "transcribe"]):
            task_type = TaskType.AUDIO
        else:
            task_type = TaskType.TEXT
        
        # Complexity Detection
        if length > 2000 or any(w in prompt_lower for w in ["architecture", "comprehensive", "detailed analysis"]):
            complexity = TaskComplexity.COMPLEX
        elif length < 200 or any(w in prompt_lower for w in ["simple", "quick", "brief", "summarize"]):
            complexity = TaskComplexity.SIMPLE
        else:
            complexity = TaskComplexity.MEDIUM
            
        return task_type, complexity

def route_task(prompt: str, router: Optional[HybridRouter] = None) -> RoutingResult:
    """Convenience wrapper for routing a single prompt."""
    if router is None:
        router = HybridRouter()
    
    task_type, complexity = HybridRouter.analyze_task(prompt)
    # Estimate context length: ~1.5 tokens per word is a safer heuristic than 2, but let's stick to simple
    est_tokens = len(prompt.split()) * 1.5 
    return router.route(task_type, complexity, int(est_tokens))


if __name__ == "__main__":
    router = HybridRouter()
    
    demos = [
        "Write a simple hello world python script",
        "Analyze the geopolitical implications of quantum computing on global security protocols in the next decade",
        "Describe this image of a cat",
    ]
    
    print("🌊 Mekong-CLI Hybrid Router Demo\n")
    for d in demos:
        res = route_task(d, router)
        print(f"📝 '{d[:40]}...' → {res.provider} (${res.estimated_cost:.6f})")
    
    print(f"\n📊 {router.get_stats()}")