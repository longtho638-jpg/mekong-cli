"""Mekong CLI - Agent Registry.

Type-safe registry for AgentBase subclasses.
Replaces the plain AGENT_REGISTRY dict with validation at registration time.
"""

from collections.abc import Callable

from .agent_base import AgentBase


class AgentRegistry:
    """Type-safe registry for Mekong agents.

    Validates that only AgentBase subclasses are registered and provides
    informative KeyError messages when an unknown agent is requested.

    Example:
        registry = AgentRegistry()
        registry.register("git", GitAgent)
        agent_cls = registry.get("git")
        agent = agent_cls()

    """

    def __init__(self) -> None:
        self._agents: dict[str, type[AgentBase]] = {}

    def register(self, name: str, cls: type) -> None:
        """Register an agent class under a short name.

        Args:
            name: Short lookup key (e.g. "git", "file")
            cls:  Class to register — must subclass AgentBase

        Raises:
            TypeError: If cls is not a subclass of AgentBase

        """
        if not isinstance(cls, type) or not issubclass(cls, AgentBase):
            msg = (
                f"{cls!r} must be a subclass of AgentBase to be registered "
                f"under name '{name}'"
            )
            raise TypeError(
                msg,
            )
        self._agents[name] = cls

    def get(self, name: str) -> type[AgentBase]:
        """Retrieve a registered agent class by name.

        Args:
            name: Registered agent name

        Returns:
            Agent class (not instance)

        Raises:
            KeyError: With available agent list when name not found

        """
        if name not in self._agents:
            available = list(self._agents.keys())
            msg = (
                f"Unknown agent: '{name}'. "
                f"Available agents: {available}"
            )
            raise KeyError(
                msg,
            )
        return self._agents[name]

    def list_agents(self) -> list[str]:
        """Return sorted list of registered agent names."""
        return sorted(self._agents.keys())

    def register_decorator(self, name: str) -> Callable:
        """Decorator factory — register a class when it is defined.

        Example:
            @registry.register_decorator("git")
            class GitAgent(AgentBase):
                ...

        """
        def wrapper(cls: type) -> type:
            self.register(name, cls)
            return cls
        return wrapper

    def __contains__(self, name: object) -> bool:
        """Support `'git' in registry` syntax."""
        return name in self._agents

    def __len__(self) -> int:
        return len(self._agents)

    def __repr__(self) -> str:
        return f"<AgentRegistry agents={self.list_agents()}>"


__all__ = ["AgentRegistry"]
