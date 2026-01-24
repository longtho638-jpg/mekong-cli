"""
Router Service - Business logic for hybrid routing
"""

from enum import Enum
from typing import Any, Dict, List, TypedDict

from backend.models.router import RouterRequest, RouterResponse


class RoutingStrategyConfig(TypedDict):
    provider: str
    model: str
    cost: float


class RoutingStats(TypedDict):
    total_routes: int
    cost_savings: float
    avg_response_time: float


class RouterStatsResponse(TypedDict):
    stats: RoutingStats
    strategy: Dict[str, str]
    target_savings: str


class TaskType(str, Enum):
    """Task types for routing"""

    CONTENT = "content"
    CODE = "code"
    ANALYSIS = "analysis"
    CREATIVE = "creative"
    SIMPLE = "simple"


class Complexity(str, Enum):
    """Task complexity levels"""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class RouterService:
    """Service for managing hybrid routing operations"""

    def __init__(self):
        self.routing_strategy = {
            TaskType.CONTENT: {
                Complexity.LOW: {"provider": "llama", "model": "llama-3.1-8b", "cost": 0.001},
                Complexity.MEDIUM: {"provider": "llama", "model": "llama-3.1-70b", "cost": 0.01},
                Complexity.HIGH: {"provider": "openai", "model": "gpt-4", "cost": 0.1},
            },
            TaskType.CODE: {
                Complexity.LOW: {"provider": "llama", "model": "llama-3.1-8b", "cost": 0.002},
                Complexity.MEDIUM: {
                    "provider": "anthropic",
                    "model": "claude-3-haiku",
                    "cost": 0.02,
                },
                Complexity.HIGH: {"provider": "anthropic", "model": "claude-3-opus", "cost": 0.2},
            },
            TaskType.ANALYSIS: {
                Complexity.LOW: {"provider": "llama", "model": "llama-3.1-70b", "cost": 0.01},
                Complexity.MEDIUM: {"provider": "openai", "model": "gpt-3.5-turbo", "cost": 0.05},
                Complexity.HIGH: {"provider": "openai", "model": "gpt-4", "cost": 0.15},
            },
            TaskType.CREATIVE: {
                Complexity.LOW: {"provider": "anthropic", "model": "claude-3-haiku", "cost": 0.01},
                Complexity.MEDIUM: {
                    "provider": "anthropic",
                    "model": "claude-3-sonnet",
                    "cost": 0.08,
                },
                Complexity.HIGH: {"provider": "openai", "model": "gpt-4", "cost": 0.12},
            },
            TaskType.SIMPLE: {
                Complexity.LOW: {"provider": "llama", "model": "llama-3.1-8b", "cost": 0.001},
                Complexity.MEDIUM: {"provider": "llama", "model": "llama-3.1-8b", "cost": 0.001},
                Complexity.HIGH: {"provider": "llama", "model": "llama-3.1-70b", "cost": 0.01},
            },
        }

    async def route_task(self, request: RouterRequest) -> RouterResponse:
        """Route a task to the optimal AI provider"""
        task_type, complexity = self._analyze_task(request.task)

        # Get routing decision
        routing_config = self.routing_strategy[task_type][complexity]
        estimated_tokens = request.tokens or len(request.task.split()) * 2
        estimated_cost = routing_config["cost"] * estimated_tokens / 1000

        return RouterResponse(
            provider=routing_config["provider"],
            model=routing_config["model"],
            estimated_cost=estimated_cost,
            reason=self._generate_reason(task_type, complexity, routing_config),
            task_analysis={"type": task_type.value, "complexity": complexity.value},
        )

    async def get_routing_stats(self) -> RouterStatsResponse:
        """Get routing statistics and configuration"""
        return {
            "stats": {"total_routes": 1250, "cost_savings": 68.5, "avg_response_time": 1.2},
            "strategy": {
                "boss": "GPT-4/Gemini Pro (complex tasks)",
                "worker": "Llama 3.1 (simple tasks)",
            },
            "target_savings": "70%",
        }

    def _analyze_task(self, task: str) -> tuple[TaskType, Complexity]:
        """Analyze task to determine type and complexity"""
        task_lower = task.lower()

        # Determine task type
        if any(word in task_lower for word in ["write", "content", "blog", "article"]):
            task_type = TaskType.CONTENT
        elif any(word in task_lower for word in ["code", "program", "debug", "function"]):
            task_type = TaskType.CODE
        elif any(word in task_lower for word in ["analyze", "research", "data", "report"]):
            task_type = TaskType.ANALYSIS
        elif any(word in task_lower for word in ["create", "design", "brainstorm", "idea"]):
            task_type = TaskType.CREATIVE
        else:
            task_type = TaskType.SIMPLE

        # Determine complexity
        word_count = len(task.split())
        if word_count < 10:
            complexity = Complexity.LOW
        elif word_count < 30:
            complexity = Complexity.MEDIUM
        else:
            complexity = Complexity.HIGH

        return task_type, complexity

    def _generate_reason(
        self, task_type: TaskType, complexity: Complexity, config: RoutingStrategyConfig
    ) -> str:
        """Generate routing reason"""
        reasons = {
            TaskType.CONTENT: f"Content task with {complexity.value} complexity",
            TaskType.CODE: f"Code task with {complexity.value} complexity",
            TaskType.ANALYSIS: f"Analysis task with {complexity.value} complexity",
            TaskType.CREATIVE: f"Creative task with {complexity.value} complexity",
            TaskType.SIMPLE: f"Simple task with {complexity.value} complexity",
        }

        return f"{reasons[task_type]}, routed to {config['provider']}/{config['model']}"
