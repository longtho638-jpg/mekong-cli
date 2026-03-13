"""Water Protocol (水) — Context Flow Between Agents.

When multiple agents collaborate, context must flow like water:
- Previous agent's output becomes next agent's input
- Shared facts accumulate (don't repeat questions)
- Each agent adds to the stream, not starts fresh

Usage:
    flow = ContextFlow(task_id="abc123")
    flow.add("cfo", "Revenue: $42K MRR, +12% growth")
    flow.add("cmo", "Blog draft about Q1 growth ready")
    
    # When dispatching next agent:
    context = flow.get_context_for("editor")
    # → includes all previous agent outputs as context
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

logger = logging.getLogger(__name__)


@dataclass
class AgentContribution:
    """One agent's output in the flow."""

    agent_role: str
    output: str
    status: str  # DONE, DONE_WITH_CONCERNS, BLOCKED, NEEDS_CONTEXT
    concerns: str = ""
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())


class ContextFlow:
    """Manages context flow between agents for multi-agent tasks."""

    def __init__(self, task_id: str, mekong_dir: str = ".mekong") -> None:
        self.task_id = task_id
        self.contributions: list[AgentContribution] = []
        self._flow_dir = Path(mekong_dir) / "flows"
        self._flow_dir.mkdir(parents=True, exist_ok=True)

    def add(self, agent_role: str, output: str, status: str = "DONE", concerns: str = "") -> None:
        """Record an agent's contribution to the flow."""
        self.contributions.append(
            AgentContribution(
                agent_role=agent_role,
                output=output[:3000],  # Cap to avoid context overflow
                status=status,
                concerns=concerns,
            )
        )
        self._save()

    def get_context_for(self, next_agent: str) -> str:
        """Build context string for the next agent in the flow.

        Includes all previous contributions as structured context.
        """
        if not self.contributions:
            return ""

        parts = ["[CONTEXT FROM PREVIOUS AGENTS — Do NOT repeat their work, BUILD ON IT]\n"]
        for c in self.contributions:
            parts.append(f"### {c.agent_role.upper()} reported:")
            parts.append(c.output[:1500])
            if c.concerns:
                parts.append(f"⚠️ Concerns: {c.concerns}")
            parts.append("")

        parts.append(f"[YOUR ROLE: {next_agent.upper()} — Add your expertise to the above]\n")
        return "\n".join(parts)

    def get_summary(self) -> str:
        """Get one-line summary of all contributions."""
        agents = [c.agent_role for c in self.contributions]
        statuses = [c.status for c in self.contributions]
        blocked = [c.agent_role for c in self.contributions if c.status == "BLOCKED"]

        summary = f"Flow: {' → '.join(agents)} | "
        if blocked:
            summary += f"⛔ BLOCKED at: {', '.join(blocked)}"
        elif all(s == "DONE" for s in statuses):
            summary += "✅ All DONE"
        else:
            summary += f"Statuses: {', '.join(f'{a}={s}' for a, s in zip(agents, statuses))}"

        return summary

    def has_blocker(self) -> bool:
        """Check if any agent is blocked."""
        return any(c.status == "BLOCKED" for c in self.contributions)

    def _save(self) -> None:
        """Persist flow to disk for cross-session continuity."""
        path = self._flow_dir / f"{self.task_id}.json"
        try:
            data = [
                {
                    "agent_role": c.agent_role,
                    "output": c.output,
                    "status": c.status,
                    "concerns": c.concerns,
                    "timestamp": c.timestamp,
                }
                for c in self.contributions
            ]
            path.write_text(json.dumps(data, indent=2), encoding="utf-8")
        except OSError as e:
            logger.warning("Failed to save context flow: %s", e)

    @classmethod
    def load(cls, task_id: str, mekong_dir: str = ".mekong") -> "ContextFlow":
        """Load existing flow from disk."""
        flow = cls(task_id=task_id, mekong_dir=mekong_dir)
        path = Path(mekong_dir) / "flows" / f"{task_id}.json"
        if path.exists():
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
                flow.contributions = [AgentContribution(**item) for item in data]
            except (OSError, json.JSONDecodeError, TypeError) as e:
                logger.warning("Failed to load context flow: %s", e)
        return flow


__all__ = ["ContextFlow", "AgentContribution"]
