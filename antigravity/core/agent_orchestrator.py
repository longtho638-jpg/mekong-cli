"""
🏯 Agent Orchestrator - Auto-Execute Agent Chains
================================================

The central execution engine for Agency OS. It maps commands to optimal
specialized agents, manages their execution state, and
tracks performance metrics.

Key Responsibilities:
- Chain Retrieval: Identifying the right team for the task.
- Step Execution: Sequential or parallel invocation of agents.
- State Management: Capturing outputs and handling failures.
- Telemetry: Measuring execution time and success rates.

Binh Pháp: 💂 Tướng (Leadership) - Commanding the agent workforce.

NOTE: This is a facade for backward compatibility.
The actual implementation has been moved to antigravity.core.agent_orchestrator package.
"""

from antigravity.core.agent_orchestrator import (
    AgentOrchestrator,
    ChainResult,
    StepResult,
    StepStatus,
    execute_chain,
)

__all__ = [
    "StepStatus",
    "StepResult",
    "ChainResult",
    "AgentOrchestrator",
    "execute_chain",
]
