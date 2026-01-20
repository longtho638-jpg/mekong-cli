"""
🏯 Agent Chains Engine
=====================

Core logic for agent chain management, loading, and validation.
"""

import os
from pathlib import Path
from typing import List, Optional

from antigravity.core.chains import Chain, ChainLoader, ChainValidator
from .inventory import AGENT_INVENTORY, AGENT_BASE_DIR
from .models import AgentCategory

# Global chain loader (lazy init)
_chain_loader: Optional[ChainLoader] = None


def _get_chain_loader() -> ChainLoader:
    """Get or create global chain loader."""
    global _chain_loader
    if _chain_loader is None:
        # Look for chains.yaml in core/config
        # Note: We need to adjust path logic since we are now in core/agent_chains/engine.py
        # core/agent_chains/engine.py -> core/config/chains.yaml
        # parent = agent_chains, parent.parent = core

        # Original logic was: Path(__file__).parent / "config" / "chains.yaml" inside core/agent_chains.py
        # which meant core/config/chains.yaml

        core_dir = Path(__file__).parent.parent
        config_path = core_dir / "config" / "chains.yaml"

        if not config_path.exists():
            # Fallback to environment variable or default
            config_path = Path(os.getenv("CHAINS_CONFIG", "config/chains.yaml"))

        _chain_loader = ChainLoader(config_path)

    return _chain_loader


def get_chain(suite: str, subcommand: str) -> Optional[Chain]:
    """
    Get agent chain for a command (loaded from YAML).

    Args:
        suite: Command suite (e.g., 'dev', 'revenue')
        subcommand: Specific command (e.g., 'cook', 'quote')

    Returns:
        Chain object or None if not found
    """
    loader = _get_chain_loader()
    return loader.get_chain_by_parts(suite, subcommand)


def get_chain_summary(suite: str, subcommand: str) -> str:
    """
    Get formatted summary of the chain.

    Args:
        suite: Command suite
        subcommand: Specific command

    Returns:
        Formatted string summary
    """
    loader = _get_chain_loader()
    name = f"{suite}:{subcommand}"
    return loader.get_chain_summary(name)


def list_all_chains() -> List[str]:
    """
    List all available chains.

    Returns:
        List of chain names
    """
    loader = _get_chain_loader()
    return loader.list_chains()


def get_agents_by_category(category: AgentCategory) -> List[str]:
    """Get agents filtered by category."""
    return [name for name, config in AGENT_INVENTORY.items() if config.category == category]


def get_agent_file(agent_name: str) -> Optional[Path]:
    """Get the file path for an agent."""
    config = AGENT_INVENTORY.get(agent_name)
    return config.file if config else None


def validate_inventory() -> List[str]:
    """
    Check if all configured agent files exist on disk.

    Returns:
        List of missing agent names
    """
    missing = []
    for name, config in AGENT_INVENTORY.items():
        if not config.file.exists():
            missing.append(f"{name} ({config.file})")
    return missing


def validate_chains() -> List[str]:
    """
    Validate chain configuration.

    Returns:
        List of validation errors (empty if valid)
    """
    loader = _get_chain_loader()
    validator = ChainValidator(agent_inventory=AGENT_INVENTORY)
    return validator.validate_config(loader.config_path)
