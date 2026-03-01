"""
Mekong CLI - Agent Preferences Registry

Electron's webPreferences pattern mapped to per-agent configuration.
Stores, retrieves, and persists preferences for each agent type.
"""

import json
from dataclasses import dataclass, field, asdict
from typing import Any, Dict, Optional


@dataclass
class AgentPreferences:
    """Per-agent configuration modelled after Electron's webPreferences."""

    sandbox_policy: Optional[str] = None  # Policy name or None for unrestricted
    max_retries: int = 3
    timeout_seconds: int = 300
    verbose: bool = False
    enable_telemetry: bool = True
    enable_memory: bool = True
    model_override: Optional[str] = None
    custom_env: Dict[str, str] = field(default_factory=dict)


# ---------------------------------------------------------------------------
# Default preferences keyed by agent type
# ---------------------------------------------------------------------------

_DEFAULTS: Dict[str, AgentPreferences] = {
    "git": AgentPreferences(
        sandbox_policy="GIT_OPS",
        max_retries=2,
        timeout_seconds=60,
        enable_telemetry=True,
    ),
    "file": AgentPreferences(
        sandbox_policy="FILE_READ_WRITE",
        max_retries=3,
        timeout_seconds=120,
        enable_telemetry=True,
    ),
    "shell": AgentPreferences(
        sandbox_policy="SHELL_EXEC",
        max_retries=1,
        timeout_seconds=300,
        enable_telemetry=True,
    ),
}

_DEFAULT_PREFS = AgentPreferences()


class PreferencesRegistry:
    """
    Central registry for per-agent preferences.

    Inspired by Electron's webPreferences: each agent type gets isolated
    configuration controlling sandbox policy, retries, timeouts, and more.
    """

    def __init__(self) -> None:
        """Initialize registry with built-in agent defaults."""
        self._registry: Dict[str, AgentPreferences] = dict(_DEFAULTS)

    def register(self, agent_type: str, prefs: AgentPreferences) -> None:
        """Register preferences for an agent type.

        Overwrites any existing entry for that type.

        Args:
            agent_type: Unique agent identifier (e.g. 'git', 'file').
            prefs: AgentPreferences instance to associate with this type.
        """
        self._registry[agent_type] = prefs

    def get(self, agent_type: str) -> AgentPreferences:
        """Retrieve preferences for an agent type.

        Returns default AgentPreferences if the type has not been registered.

        Args:
            agent_type: Agent identifier to look up.

        Returns:
            AgentPreferences for the given type, or defaults.
        """
        return self._registry.get(agent_type, _DEFAULT_PREFS)

    def update(self, agent_type: str, **kwargs: Any) -> None:
        """Partially update preferences for an agent type.

        Creates a default entry first if the type is not yet registered.

        Args:
            agent_type: Agent identifier to update.
            **kwargs: Fields to update on the AgentPreferences dataclass.
        """
        current = self._registry.get(agent_type, AgentPreferences())
        for key, value in kwargs.items():
            if hasattr(current, key):
                object.__setattr__(current, key, value)
        self._registry[agent_type] = current

    def load_from_file(self, filepath: str) -> None:
        """Load and merge preferences from a JSON config file.

        JSON format: { "agent_type": { ...AgentPreferences fields... }, ... }

        Args:
            filepath: Absolute or relative path to the JSON config file.

        Raises:
            FileNotFoundError: If the config file does not exist.
            json.JSONDecodeError: If the file contains invalid JSON.
        """
        with open(filepath, "r", encoding="utf-8") as fh:
            data: Dict[str, Dict[str, Any]] = json.load(fh)

        for agent_type, raw in data.items():
            # Only accept known fields to avoid surprises
            known = {f for f in AgentPreferences.__dataclass_fields__}
            filtered = {k: v for k, v in raw.items() if k in known}
            self._registry[agent_type] = AgentPreferences(**filtered)

    def save_to_file(self, filepath: str) -> None:
        """Persist current registry preferences to a JSON config file.

        Args:
            filepath: Absolute or relative path to write the JSON config.
        """
        data = {
            agent_type: asdict(prefs)
            for agent_type, prefs in self._registry.items()
        }
        with open(filepath, "w", encoding="utf-8") as fh:
            json.dump(data, fh, indent=2)


__all__ = [
    "AgentPreferences",
    "PreferencesRegistry",
]
