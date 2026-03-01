"""
Mekong CLI — AGI Vibe Coding Factory

Plan-Execute-Verify autonomous engine with pluggable LLM providers,
DAG-based parallel execution, and community plugin support.

Usage:
    from mekong.core import RecipeOrchestrator, LLMProvider
    from mekong.agents import registry
    from mekong.daemon import DaemonScheduler
"""

__version__ = "3.0.0"

# Re-export core components for clean public API
from src.core import (
    AgentBase,
    Task,
    Result,
    RecipeOrchestrator,
    RecipePlanner,
    RecipeExecutor,
    RecipeVerifier,
    AgentProtocol,
    StreamingMixin,
    AgentRegistry,
    DAGScheduler,
    PluginLoader,
    LLMProvider,
    LLMResponse,
    GeminiProvider,
    OpenAICompatibleProvider,
    OfflineProvider,
)

__all__ = [
    "__version__",
    "AgentBase",
    "Task",
    "Result",
    "RecipeOrchestrator",
    "RecipePlanner",
    "RecipeExecutor",
    "RecipeVerifier",
    "AgentProtocol",
    "StreamingMixin",
    "AgentRegistry",
    "DAGScheduler",
    "PluginLoader",
    "LLMProvider",
    "LLMResponse",
    "GeminiProvider",
    "OpenAICompatibleProvider",
    "OfflineProvider",
]
