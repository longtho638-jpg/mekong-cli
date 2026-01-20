"""
🧠 Agent Memory Module
======================

Provides long-term persistence and pattern recognition for AI agents.
Agents store their experiences, successes, and failures to optimize future
decision-making and improve the Agency OS 'intelligence moat'.

Features:
- Execution History: Tracking context and outcomes.
- Pattern Recognition: Success rate analysis for specific approaches.
- Persistence: JSON-based local storage with Supabase sync readiness.
"""

from .models import Memory, Pattern
from .system import AgentMemory, get_agent_memory

__all__ = ["AgentMemory", "Memory", "Pattern", "get_agent_memory"]
