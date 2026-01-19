"""
🏯 Agent Chains - Auto-Orchestration Definitions
================================================

Provides agent configuration and chain management with YAML-driven chains.

Features:
- Agent inventory with file mappings
- Category-based organization
- YAML-based chain definitions (replaces 275+ lines of hardcoded chains)
- Validation and registry

Usage:
    from antigravity.core.agent_chains import get_chain, validate_inventory, AGENT_INVENTORY

    # Get execution chain (now loaded from YAML)
    chain = get_chain("dev", "cook")

    # Validate agent inventory
    missing = validate_inventory()
"""

import os
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import Dict, List, NamedTuple, Optional

from .chains import Chain, ChainLoader, ChainValidator

# Base path for agents
AGENT_BASE_DIR = Path(".claude/agents")


class AgentCategory(Enum):
    """Categorization for agents to organize the workbench."""

    DEVELOPMENT = "development"
    BUSINESS = "business"
    CONTENT = "content"
    DESIGN = "design"
    EXTERNAL = "external"


class AgentConfig(NamedTuple):
    """Configuration for a single agent."""

    category: AgentCategory
    file: Path


# Agent Inventory (26 total)
# Maps agent_id -> AgentConfig
AGENT_INVENTORY: Dict[str, AgentConfig] = {
    # 🛠️ Development (8)
    "fullstack-developer": AgentConfig(AgentCategory.DEVELOPMENT, AGENT_BASE_DIR / "fullstack-developer.md"),
    "planner": AgentConfig(AgentCategory.DEVELOPMENT, AGENT_BASE_DIR / "planner.md"),
    "tester": AgentConfig(AgentCategory.DEVELOPMENT, AGENT_BASE_DIR / "tester.md"),
    "code-reviewer": AgentConfig(AgentCategory.DEVELOPMENT, AGENT_BASE_DIR / "code-reviewer.md"),
    "debugger": AgentConfig(AgentCategory.DEVELOPMENT, AGENT_BASE_DIR / "debugger.md"),
    "git-manager": AgentConfig(AgentCategory.DEVELOPMENT, AGENT_BASE_DIR / "git-manager.md"),
    "database-admin": AgentConfig(AgentCategory.DEVELOPMENT, AGENT_BASE_DIR / "database-admin.md"),
    "mcp-manager": AgentConfig(AgentCategory.DEVELOPMENT, AGENT_BASE_DIR / "mcp-manager.md"),
    # 💰 Business (8)
    "money-maker": AgentConfig(AgentCategory.BUSINESS, AGENT_BASE_DIR / "money-maker.md"),
    "deal-closer": AgentConfig(AgentCategory.BUSINESS, AGENT_BASE_DIR / "deal-closer.md"),
    "client-magnet": AgentConfig(AgentCategory.BUSINESS, AGENT_BASE_DIR / "client-magnet.md"),
    "client-value": AgentConfig(AgentCategory.BUSINESS, AGENT_BASE_DIR / "client-value.md"),
    "growth-strategist": AgentConfig(AgentCategory.BUSINESS, AGENT_BASE_DIR / "growth-strategist.md"),
    "binh-phap-strategist": AgentConfig(AgentCategory.BUSINESS, AGENT_BASE_DIR / "binh-phap-strategist.md"),
    "revenue-engine": AgentConfig(AgentCategory.BUSINESS, AGENT_BASE_DIR / "revenue-engine.md"),
    "project-manager": AgentConfig(AgentCategory.BUSINESS, AGENT_BASE_DIR / "project-manager.md"),
    # 🎨 Content (5)
    "content-factory": AgentConfig(AgentCategory.CONTENT, AGENT_BASE_DIR / "content-factory.md"),
    "copywriter": AgentConfig(AgentCategory.CONTENT, AGENT_BASE_DIR / "copywriter.md"),
    "docs-manager": AgentConfig(AgentCategory.CONTENT, AGENT_BASE_DIR / "docs-manager.md"),
    "journal-writer": AgentConfig(AgentCategory.CONTENT, AGENT_BASE_DIR / "journal-writer.md"),
    "researcher": AgentConfig(AgentCategory.CONTENT, AGENT_BASE_DIR / "researcher.md"),
    # 🖌️ Design (3)
    "ui-ux-designer": AgentConfig(AgentCategory.DESIGN, AGENT_BASE_DIR / "ui-ux-designer.md"),
    "flow-expert": AgentConfig(AgentCategory.DESIGN, AGENT_BASE_DIR / "flow-expert.md"),
    "scout": AgentConfig(AgentCategory.DESIGN, AGENT_BASE_DIR / "scout.md"),
    # 🌐 External (2)
    "scout-external": AgentConfig(AgentCategory.EXTERNAL, AGENT_BASE_DIR / "scout-external.md"),
    "brainstormer": AgentConfig(AgentCategory.EXTERNAL, AGENT_BASE_DIR / "brainstormer.md"),
}

# Global chain loader (lazy init)
_chain_loader: Optional[ChainLoader] = None


def _get_chain_loader() -> ChainLoader:
    """Get or create global chain loader."""
    global _chain_loader
    if _chain_loader is None:
        # Look for chains.yaml in core/config
        config_path = Path(__file__).parent / "config" / "chains.yaml"
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
]
