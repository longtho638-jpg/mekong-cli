"""
Chain Loader - YAML-based Chain Configuration
==============================================

Loads agent chains from YAML configuration files.
Replaces hardcoded Python chain definitions with data-driven config.
"""

import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional

import yaml

logger = logging.getLogger(__name__)


@dataclass
class AgentStep:
    """
    Single step in an agent chain.

    Attributes:
        agent: Agent identifier (must exist in AGENT_INVENTORY)
        action: Semantic action name (for logging/planning)
        description: Human-readable description
        optional: If True, failure doesn't halt the chain
    """

    agent: str
    action: str
    description: str
    optional: bool = False


@dataclass
class Chain:
    """
    Agent chain definition.

    Attributes:
        name: Chain identifier (e.g., "dev:cook")
        description: Human-readable description
        agents: List of AgentStep objects defining the workflow
    """

    name: str
    description: str
    agents: List[AgentStep]


class ChainLoader:
    """Load agent chains from YAML configuration."""

    def __init__(self, config_path: Path):
        """
        Initialize chain loader.

        Args:
            config_path: Path to chains.yaml file
        """
        self.config_path = Path(config_path)
        self.chains: Dict[str, Chain] = {}
        self._load_config()
        logger.info(f"ChainLoader initialized from {config_path}")

    def _load_config(self):
        """Load and parse chains.yaml."""
        if not self.config_path.exists():
            logger.error(f"Chain config not found: {self.config_path}")
            return

        try:
            with open(self.config_path) as f:
                config = yaml.safe_load(f)

            if not config or "chains" not in config:
                logger.error("Invalid chain config: missing 'chains' key")
                return

            # Parse each chain
            for chain_def in config["chains"]:
                try:
                    agents = [
                        AgentStep(
                            agent=agent_def["agent"],
                            action=agent_def["action"],
                            description=agent_def["description"],
                            optional=agent_def.get("optional", False),
                        )
                        for agent_def in chain_def.get("agents", [])
                    ]

                    chain = Chain(
                        name=chain_def["name"],
                        description=chain_def["description"],
                        agents=agents,
                    )

                    self.chains[chain.name] = chain
                    logger.debug(f"Loaded chain: {chain.name} ({len(agents)} steps)")

                except (KeyError, TypeError) as e:
                    logger.error(f"Invalid chain definition in config: {e}")
                    continue

            logger.info(f"Loaded {len(self.chains)} chains from config")

        except yaml.YAMLError as e:
            logger.error(f"YAML parsing error: {e}")
        except Exception as e:
            logger.error(f"Failed to load chain config: {e}")

    def get_chain(self, name: str) -> Optional[Chain]:
        """
        Get chain by name.

        Args:
            name: Chain identifier (e.g., "dev:cook")

        Returns:
            Chain object or None if not found
        """
        return self.chains.get(name)

    def get_chain_by_parts(self, suite: str, subcommand: str) -> Optional[Chain]:
        """
        Get chain using suite and subcommand parts.

        Args:
            suite: Command suite (e.g., "dev")
            subcommand: Specific command (e.g., "cook")

        Returns:
            Chain object or None if not found
        """
        name = f"{suite}:{subcommand}"
        return self.get_chain(name)

    def list_chains(self) -> List[str]:
        """
        List all available chain names.

        Returns:
            List of chain names
        """
        return list(self.chains.keys())

    def get_chain_summary(self, name: str) -> str:
        """
        Get formatted summary of a chain.

        Args:
            name: Chain identifier

        Returns:
            Formatted string summary
        """
        chain = self.get_chain(name)
        if not chain:
            return f"⚠️ No chain defined for {name}"

        lines = [f"🔗 Chain: {name} - {chain.description}"]
        for i, step in enumerate(chain.agents, 1):
            opt = " (optional)" if step.optional else ""
            lines.append(f"   {i}. {step.agent:<20} → {step.description}{opt}")

        return "\n".join(lines)

    def reload(self):
        """Reload configuration from file."""
        self.chains.clear()
        self._load_config()
        logger.info("Chain configuration reloaded")


__all__ = ["ChainLoader", "Chain", "AgentStep"]
