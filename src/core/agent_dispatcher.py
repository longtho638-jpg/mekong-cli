"""ALGO 8 — Agent Dispatcher.

Loads agent-specific prompts and injects domain context into message chains.
Water Protocol (水): Enriches agent prompts with hub expertise.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path

logger = logging.getLogger(__name__)

AGENTS_DIR = Path(__file__).parent.parent.parent / "agents"
HUBS_DIR = Path(__file__).parent.parent.parent / "packages" / "agents" / "hubs"

# Default agent system prompts (used when no .md file exists)
DEFAULT_PROMPTS: dict[str, str] = {
    "cto": "You are a senior CTO. Write clean, production-ready code with best practices.",
    "cmo": "You are a CMO. Create compelling marketing strategies and content.",
    "coo": "You are a COO. Monitor systems, execute ops tasks, manage infrastructure.",
    "cfo": "You are a CFO. Focus on financial analysis, revenue optimization, and cost control.",
    "cs": "You are a support specialist. Resolve issues efficiently with empathy.",
    "sales": "You are a sales specialist. Write persuasive copy and conversion flows.",
    "editor": "You are a technical editor. Review and improve content for clarity and accuracy.",
    "data": "You are a data analyst. Provide clear, actionable insights from data.",
    "analyst": "You are a business analyst. Analyze requirements and provide structured recommendations.",
    "devops": "You are a DevOps engineer. Manage infrastructure, CI/CD, and deployment pipelines.",
    "pm": "You are a Product Manager. Define requirements and prioritize features based on user value.",
    "support": "You are a customer support specialist. Help users resolve issues quickly and accurately.",
}

# Agent role → hub file mapping
ROLE_HUB_MAP: dict[str, str] = {
    # Core agents
    "cto": "engineering-hub",
    "cfo": "finance-hub",
    "cmo": "marketing-hub",
    "coo": "it-hub",
    "cs": "cs-hub",
    "sales": "sales-hub",
    "editor": "creative-hub",
    "data": "finance-hub",
    # Studio agents (v6.0)
    "studio": "studio-hub",
    "vc": "vc-hub",
    "legal": "legal-hub",
    "hr": "hr-hub",
    # Extended hubs (map to closest agent)
    "executive": "executive-hub",
    "entrepreneur": "entrepreneur-hub",
    "strategist": "binh-phap-hub",
    "community": "community-hub",
    "educator": "education-hub",
    "realtor": "real-estate-hub",
    "retailer": "retail-hub",
    "wellness": "wellness-hub",
}


def _load_matching_hub(agent_role: str) -> str:
    """Load hub content for an agent role.

    Hub files provide domain expertise to enrich agent behavior.
    Truncated to 2000 chars to avoid context overflow.
    """
    hub_name = ROLE_HUB_MAP.get(agent_role)
    if not hub_name:
        return ""

    hub_path = HUBS_DIR / f"{hub_name}.md"
    if not hub_path.exists():
        logger.warning("Hub file not found: %s", hub_path)
        return ""

    try:
        content = hub_path.read_text(encoding="utf-8").strip()
        # Strip YAML frontmatter
        if content.startswith("---"):
            parts = content.split("---", 2)
            if len(parts) >= 3:
                content = parts[2].strip()
        # Truncate to avoid context overflow
        return content[:2000]
    except OSError as e:
        logger.warning("Failed to read hub file %s: %s", hub_path, e)
        return ""


def load_agent_prompt(agent_role: str, include_hub: bool = True) -> str:
    """Load agent system prompt from file, enriched with hub context.

    Priority:
    1. agents/{agent_role}.md (core identity)
    2. + packages/agents/hubs/{matched-hub}.md (domain expertise)
    3. Fallback: DEFAULT_PROMPTS

    Args:
        agent_role: Role name (cto, cfo, cmo, etc.)
        include_hub: If True, enrich with hub expertise (default True)

    Returns:
        Full system prompt for the agent.
    """
    # Load core agent identity
    core_prompt = ""
    md_path = AGENTS_DIR / f"{agent_role}.md"
    if md_path.exists():
        try:
            core_prompt = md_path.read_text(encoding="utf-8").strip()
        except OSError as e:
            logger.warning("Failed to read agent prompt %s: %s", md_path, e)

    if not core_prompt:
        core_prompt = DEFAULT_PROMPTS.get(agent_role, f"You are a helpful {agent_role} agent.")

    if not include_hub:
        return core_prompt

    # Enrich with matching hub context
    hub_prompt = _load_matching_hub(agent_role)
    if hub_prompt:
        return f"{core_prompt}\n\n---\n\n## Domain Expertise (from Hub)\n\n{hub_prompt}"

    return core_prompt


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
