"""
🏯 Agent Chains Module
====================

Provides agent configuration and chain management with YAML-driven chains.

Features:
- Agent inventory with file mappings
- Category-based organization
- YAML-based chain definitions
- Validation and registry
"""

from antigravity.core.chains import AgentStep, Chain

from .engine import (
    get_chain,
    get_chain_summary,
    list_all_chains,
    get_agents_by_category,
    get_agent_file,
    validate_inventory,
    validate_chains,
    _get_chain_loader,  # Exported for testing/verification
)
from .inventory import AGENT_INVENTORY, AGENT_BASE_DIR
from .models import AgentCategory, AgentConfig


# Backward compatibility aliases for testing
def register_chain(suite: str, subcommand: str, agents: list):
    """
    Legacy wrapper for registering a chain programmatically.
    Used mainly by verification scripts.
    """
    loader = _get_chain_loader()
    chain = Chain(
        name=f"{suite}:{subcommand}",
        description="Registered via legacy register_chain",
        agents=agents
    )
    loader.chains[f"{suite}:{subcommand}"] = chain


__all__ = [
    "AgentCategory",
    "AgentConfig",
    "AGENT_INVENTORY",
    "AGENT_BASE_DIR",
    "get_chain",
    "get_chain_summary",
    "list_all_chains",
    "get_agents_by_category",
    "get_agent_file",
    "validate_inventory",
    "validate_chains",
    "register_chain",
    "AgentStep",  # Re-exported from core.chains for convenience
]
