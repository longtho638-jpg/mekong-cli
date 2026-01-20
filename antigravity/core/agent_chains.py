"""
🏯 Agent Chains - Auto-Orchestration Definitions
================================================

Provides agent configuration and chain management with YAML-driven chains.

Features:
- Agent inventory with file mappings
- Category-based organization
- YAML-based chain definitions (replaces 275+ lines of hardcoded chains)
- Validation and registry

NOTE: This is a facade for backward compatibility.
The actual implementation has been moved to antigravity.core.agent_chains package.
"""

from antigravity.core.agent_chains import (
    AGENT_BASE_DIR,
    AGENT_INVENTORY,
    AgentCategory,
    AgentConfig,
    AgentStep,
    get_agent_file,
    get_agents_by_category,
    get_chain,
    get_chain_summary,
    list_all_chains,
    register_chain,
    validate_chains,
    validate_inventory,
)

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
    "AgentStep",
]
