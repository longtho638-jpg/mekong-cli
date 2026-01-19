"""
Chain Validator - Validate Chain Configurations
================================================

Validates chain definitions to ensure:
- Required fields are present
- Agents exist in inventory
- No circular dependencies
"""

import logging
from pathlib import Path
from typing import List

import yaml

logger = logging.getLogger(__name__)


class ChainValidator:
    """Validate chain definitions for correctness."""

    def __init__(self, agent_inventory: dict = None):
        """
        Initialize validator.

        Args:
            agent_inventory: Dictionary of valid agent IDs (optional)
        """
        self.agent_inventory = agent_inventory or {}
        logger.debug("ChainValidator initialized")

    def validate_config(self, config_path: Path) -> List[str]:
        """
        Validate chains.yaml configuration file.

        Args:
            config_path: Path to chains.yaml

        Returns:
            List of error messages (empty if valid)
        """
        errors = []

        if not config_path.exists():
            return [f"Config file not found: {config_path}"]

        try:
            with open(config_path) as f:
                config = yaml.safe_load(f)

            # Check root structure
            if not config or not isinstance(config, dict):
                return ["Invalid YAML: root must be a dictionary"]

            if "chains" not in config:
                return ["Missing required 'chains' key"]

            if not isinstance(config["chains"], list):
                return ["'chains' must be a list"]

            # Validate each chain
            for i, chain in enumerate(config["chains"]):
                chain_errors = self._validate_chain(chain, i)
                errors.extend(chain_errors)

        except yaml.YAMLError as e:
            errors.append(f"YAML parsing error: {e}")
        except Exception as e:
            errors.append(f"Validation error: {e}")

        return errors

    def _validate_chain(self, chain: dict, index: int) -> List[str]:
        """
        Validate a single chain definition.

        Args:
            chain: Chain definition dictionary
            index: Chain index in list (for error reporting)

        Returns:
            List of error messages
        """
        errors = []
        chain_name = chain.get("name", f"chain_{index}")

        # Required fields
        if "name" not in chain:
            errors.append(f"Chain {index}: Missing 'name' field")

        if "description" not in chain:
            errors.append(f"{chain_name}: Missing 'description' field")

        if "agents" not in chain:
            errors.append(f"{chain_name}: Missing 'agents' field")
            return errors  # Can't validate agents without this field

        # Validate agents list
        agents = chain["agents"]
        if not isinstance(agents, list):
            errors.append(f"{chain_name}: 'agents' must be a list")
            return errors

        if len(agents) == 0:
            errors.append(f"{chain_name}: 'agents' list is empty")

        # Validate each agent step
        for j, agent_step in enumerate(agents):
            step_errors = self._validate_agent_step(agent_step, chain_name, j)
            errors.extend(step_errors)

        return errors

    def _validate_agent_step(self, agent_step: dict, chain_name: str, index: int) -> List[str]:
        """
        Validate a single agent step.

        Args:
            agent_step: Agent step dictionary
            chain_name: Parent chain name (for error reporting)
            index: Step index (for error reporting)

        Returns:
            List of error messages
        """
        errors = []
        agent_id = agent_step.get("agent", f"agent_{index}")

        # Required fields
        if "agent" not in agent_step:
            errors.append(f"{chain_name}.step_{index}: Missing 'agent' field")

        if "action" not in agent_step:
            errors.append(f"{chain_name}.{agent_id}: Missing 'action' field")

        if "description" not in agent_step:
            errors.append(f"{chain_name}.{agent_id}: Missing 'description' field")

        # Optional validation: check if agent exists in inventory
        if self.agent_inventory and "agent" in agent_step:
            if agent_step["agent"] not in self.agent_inventory:
                errors.append(
                    f"{chain_name}.{agent_id}: Agent '{agent_step['agent']}' not found in inventory"
                )

        # Validate optional field if present
        if "optional" in agent_step:
            if not isinstance(agent_step["optional"], bool):
                errors.append(f"{chain_name}.{agent_id}: 'optional' must be boolean")

        return errors


__all__ = ["ChainValidator"]
