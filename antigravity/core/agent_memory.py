"""
🧠 Agent Memory - Learning from Past Executions
===============================================

Provides long-term persistence and pattern recognition for AI agents.
Agents store their experiences, successes, and failures to optimize future
decision-making and improve the Agency OS 'intelligence moat'.

Features:
- Execution History: Tracking context and outcomes.
- Pattern Recognition: Success rate analysis for specific approaches.
- Persistence: JSON-based local storage with Supabase sync readiness.

Binh Pháp: 🧠 Trí (Wisdom) - Learning from experience.

NOTE: This is a facade for backward compatibility.
The actual implementation has been moved to antigravity.core.agent_memory package.
"""

from antigravity.core.agent_memory import AgentMemory, Memory, Pattern, get_agent_memory

__all__ = ["AgentMemory", "Memory", "Pattern", "get_agent_memory"]
