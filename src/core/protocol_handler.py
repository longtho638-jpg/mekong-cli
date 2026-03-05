"""Mekong CLI - Protocol Handler.

Maps Electron's protocol.registerSchemeAsPrivileged to CLI custom URI schemes.
Routes mekong://, recipe://, agent:// URIs to registered handler functions.
Thread-safe via threading.Lock.
"""

import threading
from collections.abc import Callable
from dataclasses import dataclass, field
from enum import Enum
from typing import TYPE_CHECKING, Any
from urllib.parse import parse_qs, urlparse

if TYPE_CHECKING:
    from src.core.orchestrator import RecipeOrchestrator
    from src.core.recipe_registry import RecipeRegistry


class ProtocolScheme(str, Enum):
    """Supported custom URI schemes."""

    MEKONG = "mekong"
    RECIPE = "recipe"
    AGENT = "agent"


@dataclass
class ProtocolRequest:
    """Parsed representation of a custom URI."""

    scheme: ProtocolScheme
    path: str
    params: dict[str, Any] = field(default_factory=dict)
    raw_uri: str = ""


# Handler signature: (request: ProtocolRequest) -> object
HandlerFn = Callable[[ProtocolRequest], object]


class ProtocolHandler:
    """Routes custom URI schemes to registered handler functions.

    Inspired by Electron's protocol module. Supports built-in handlers for
    mekong://, recipe://, and agent:// schemes plus user-defined extensions.

    Example::

        handler = ProtocolHandler(orchestrator, registry, agent_registry)
        result = handler.handle("mekong://cook/clean%20logs?strict=true")
    """

    def __init__(
        self,
        orchestrator: "RecipeOrchestrator | None" = None,
        recipe_registry: "RecipeRegistry | None" = None,
        agent_registry: dict[str, object] | None = None,
    ) -> None:
        """Args:
        orchestrator: RecipeOrchestrator for mekong:// routes.
        recipe_registry: RecipeRegistry for recipe:// routes.
        agent_registry: Dict mapping agent names to agent instances.

        """
        self._handlers: dict[str, HandlerFn] = {}
        self._lock = threading.Lock()
        self._orchestrator = orchestrator
        self._recipe_registry = recipe_registry
        self._agent_registry = agent_registry or {}
        self._register_builtins()

    def _register_builtins(self) -> None:
        """Register built-in handlers for all supported schemes."""
        self.register(ProtocolScheme.MEKONG, self._handle_mekong)
        self.register(ProtocolScheme.RECIPE, self._handle_recipe)
        self.register(ProtocolScheme.AGENT, self._handle_agent)

    def register(self, scheme: ProtocolScheme, handler_fn: HandlerFn) -> None:
        """Register a handler function for a URI scheme."""
        with self._lock:
            self._handlers[scheme.value] = handler_fn

    def unregister(self, scheme: ProtocolScheme) -> None:
        """Remove the handler for a URI scheme."""
        with self._lock:
            self._handlers.pop(scheme.value, None)

    def handle(self, uri: str) -> object:
        """Parse URI and dispatch to the matching handler.

        Raises:
            ValueError: If scheme is unrecognised or no handler registered.

        """
        request = self.parse_uri(uri)
        with self._lock:
            handler = self._handlers.get(request.scheme.value)
        if handler is None:
            msg = f"No handler registered for scheme '{request.scheme.value}'"
            raise ValueError(msg)
        return handler(request)

    def parse_uri(self, uri: str) -> ProtocolRequest:
        """Parse a URI string into a ProtocolRequest.

        Supports::

            mekong://cook/goal?strict=true
            recipe://run/recipe-name
            agent://git-agent/status?branch=main

        Raises:
            ValueError: If the URI scheme is not a known ProtocolScheme.

        """
        parsed = urlparse(uri)
        try:
            scheme = ProtocolScheme(parsed.scheme)
        except ValueError:
            msg = f"Unknown protocol scheme: '{parsed.scheme}'"
            raise ValueError(msg)
        path = (parsed.netloc + parsed.path).strip("/")
        raw_params = parse_qs(parsed.query)
        params: dict[str, Any] = {
            k: (v[0] if len(v) == 1 else v) for k, v in raw_params.items()
        }
        return ProtocolRequest(scheme=scheme, path=path, params=params, raw_uri=uri)

    # ------------------------------------------------------------------
    # Built-in handlers
    # ------------------------------------------------------------------

    def _handle_mekong(self, request: ProtocolRequest) -> object:
        """Handle mekong://cook/<goal> → orchestrator.run(goal)."""
        parts = request.path.split("/", 1)
        action, goal = parts[0], (parts[1] if len(parts) > 1 else "")
        if action == "cook":
            if self._orchestrator is None:
                msg = "Orchestrator not configured"
                raise RuntimeError(msg)
            return self._orchestrator.run(goal, **request.params)
        msg = f"Unknown mekong action: '{action}'"
        raise ValueError(msg)

    def _handle_recipe(self, request: ProtocolRequest) -> object:
        """Handle recipe://run/<recipe_name> → registry.execute(recipe_name)."""
        parts = request.path.split("/", 1)
        action, recipe_name = parts[0], (parts[1] if len(parts) > 1 else "")
        if action == "run":
            if self._recipe_registry is None:
                msg = "RecipeRegistry not configured"
                raise RuntimeError(msg)
            return self._recipe_registry.execute(recipe_name)
        msg = f"Unknown recipe action: '{action}'"
        raise ValueError(msg)

    def _handle_agent(self, request: ProtocolRequest) -> object:
        """Handle agent://<agent_name>/<action> → agent.execute(action)."""
        parts = request.path.split("/", 1)
        agent_name, action = parts[0], (parts[1] if len(parts) > 1 else "")
        agent = self._agent_registry.get(agent_name)
        if agent is None:
            msg = f"Unknown agent: '{agent_name}'"
            raise ValueError(msg)
        return agent.execute(action, **request.params)
