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
    _get_chain_loader,  # Exported for testing/verification
    get_agent_file,
    get_agents_by_category,
    get_chain,
    get_chain_obj,
    get_chain_summary,
    list_all_chains,
    validate_chains,
    validate_inventory,
)
from .inventory import AGENT_BASE_DIR, AGENT_INVENTORY
from .models import AgentCategory, AgentConfig


class _AgentChainsProxy(dict):
    """
    Lazy-loading proxy for AGENT_CHAINS.
    Provides backward compatibility by exposing chains as Dict[str, List[AgentStep]].
    """
    _initialized = False

    def _ensure_loaded(self):
        if not self._initialized:
            loader = _get_chain_loader()
            for name, chain in loader.chains.items():
                self[name] = chain.agents
            self._initialized = True

    def __getitem__(self, key):
        self._ensure_loaded()
        return super().__getitem__(key)

    def __iter__(self):
        self._ensure_loaded()
        return super().__iter__()

    def __len__(self):
        self._ensure_loaded()
        return super().__len__()

    def items(self):
        self._ensure_loaded()
        return super().items()

    def keys(self):
        self._ensure_loaded()
        return super().keys()

    def values(self):
        self._ensure_loaded()
        return super().values()


# Backward-compatible AGENT_CHAINS dict
AGENT_CHAINS = _AgentChainsProxy()


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
    "AGENT_CHAINS",  # Backward-compatible chains dict
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
