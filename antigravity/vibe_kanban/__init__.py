"""
Vibe Kanban Module
==================

Exports for Vibe Kanban integration.
"""

from antigravity.vibe_kanban_bridge import AgentOrchestrator, TaskModel, VibeBoardClient

__all__ = ["VibeBoardClient", "TaskModel", "AgentOrchestrator"]
