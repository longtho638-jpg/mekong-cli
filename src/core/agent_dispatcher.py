"""ALGO 8 — Agent Dispatcher.

Loads agent-specific prompts and injects domain context into message chains.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path

logger = logging.getLogger(__name__)

AGENTS_DIR = Path(__file__).parent.parent / "agents"

# Default agent system prompts (used when no .md file exists)
DEFAULT_PROMPTS: dict[str, str] = {
    "cto": "You are a senior CTO. Write clean, production-ready code with best practices.",
    "editor": "You are a technical editor. Review and improve content for clarity and accuracy.",
    "analyst": "You are a data analyst. Provide clear, actionable insights from data.",
    "cfo": "You are a CFO. Focus on financial analysis, revenue optimization, and cost control.",
    "cmo": "You are a CMO. Create compelling marketing strategies and content.",
    "devops": "You are a DevOps engineer. Focus on infrastructure, CI/CD, and reliability.",
    "pm": "You are a product manager. Prioritize features, write specs, and track delivery.",
    "support": "You are a support engineer. Resolve issues efficiently with empathy.",
}


def load_agent_prompt(agent_role: str) -> str:
    """Load agent system prompt from file or defaults.

    Looks for agents/{agent_role}.md first, falls back to DEFAULT_PROMPTS.
    """
    md_path = AGENTS_DIR / f"{agent_role}.md"
    if md_path.exists():
        try:
            return md_path.read_text(encoding="utf-8").strip()
        except OSError as e:
            logger.warning("Failed to read agent prompt %s: %s", md_path, e)

    prompt = DEFAULT_PROMPTS.get(agent_role, "")
    if not prompt:
        logger.warning("No prompt found for agent role: %s", agent_role)
        return f"You are a helpful {agent_role} agent."

    return prompt


def inject_codebase_context(messages: list[dict], goal: str) -> list[dict]:
    """Inject codebase context for code-domain tasks.

    Adds project structure hint to help the LLM understand the codebase.
    """
    cwd = os.getcwd()
    context_note = (
        f"[Context: Working in project at {cwd}. "
        f"Analyze the goal and provide actionable code.]"
    )
    enriched = list(messages)
    if enriched and enriched[-1]["role"] == "user":
        enriched[-1] = {
            "role": "user",
            "content": f"{context_note}\n\n{enriched[-1]['content']}",
        }
    return enriched


def inject_metrics_context(
    messages: list[dict], tenant_id: str
) -> list[dict]:
    """Inject metrics context for analysis-domain tasks."""
    context_note = (
        f"[Context: Analyzing data for tenant '{tenant_id}'. "
        f"Provide data-driven insights.]"
    )
    enriched = list(messages)
    if enriched and enriched[-1]["role"] == "user":
        enriched[-1] = {
            "role": "user",
            "content": f"{context_note}\n\n{enriched[-1]['content']}",
        }
    return enriched


def build_message_chain(
    goal: str,
    agent_role: str,
    domain: str,
    tenant_id: str = "",
) -> tuple[list[dict], str]:
    """Build complete message chain with agent prompt and context.

    Returns:
        Tuple of (messages, system_prompt).
    """
    system_prompt = load_agent_prompt(agent_role)
    messages = [{"role": "user", "content": goal}]

    if domain == "code":
        messages = inject_codebase_context(messages, goal)
    elif domain == "analysis":
        messages = inject_metrics_context(messages, tenant_id)

    return messages, system_prompt
