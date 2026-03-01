"""
Mekong CLI - Protocol Handler

Maps Electron's protocol.registerSchemeAsPrivileged to CLI custom URI schemes.
Routes mekong://, recipe://, agent:// URIs to registered handler functions.
Thread-safe via threading.Lock.
"""

import threading
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Dict, Optional
from urllib.parse import parse_qs, urlparse


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
    params: Dict[str, Any] = field(default_factory=dict)
    raw_uri: str = ""


# Handler signature: (request: ProtocolRequest) -> Any
HandlerFn = Callable[[ProtocolRequest], Any]


class ProtocolHandler:
    """
    Routes custom URI schemes to registered handler functions.

    Inspired by Electron's protocol module. Supports built-in handlers for
    mekong://, recipe://, and agent:// schemes plus user-defined extensions.

    Example::

        handler = ProtocolHandler(orchestrator, registry, agent_registry)
        result = handler.handle("mekong://cook/clean%20logs?strict=true")
    """

    def __init__(
        self,
        orchestrator: Any = None,
        recipe_registry: Any = None,
        agent_registry: Optional[Dict[str, Any]] = None,
    ) -> None:
        """
        Args:
            orchestrator: RecipeOrchestrator for mekong:// routes.
            recipe_registry: RecipeRegistry for recipe:// routes.
            agent_registry: Dict mapping agent names to agent instances.
        """
        self._handlers: Dict[str, HandlerFn] = {}
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

    def handle(self, uri: str) -> Any:
        """
        Parse URI and dispatch to the matching handler.

        Raises:
            ValueError: If scheme is unrecognised or no handler registered.
        """
        request = self.parse_uri(uri)
        with self._lock:
            handler = self._handlers.get(request.scheme.value)
        if handler is None:
            raise ValueError(f"No handler registered for scheme '{request.scheme.value}'")
        return handler(request)

    def parse_uri(self, uri: str) -> ProtocolRequest:
        """
        Parse a URI string into a ProtocolRequest.

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
            raise ValueError(f"Unknown protocol scheme: '{parsed.scheme}'")
        path = (parsed.netloc + parsed.path).strip("/")
        raw_params = parse_qs(parsed.query)
        params: Dict[str, Any] = {
            k: (v[0] if len(v) == 1 else v) for k, v in raw_params.items()
        }
        return ProtocolRequest(scheme=scheme, path=path, params=params, raw_uri=uri)

    # ------------------------------------------------------------------
    # Built-in handlers
    # ------------------------------------------------------------------

    def _handle_mekong(self, request: ProtocolRequest) -> Any:
        """Handle mekong://cook/<goal> → orchestrator.run(goal)."""
        parts = request.path.split("/", 1)
        action, goal = parts[0], (parts[1] if len(parts) > 1 else "")
        if action == "cook":
            if self._orchestrator is None:
                raise RuntimeError("Orchestrator not configured")
            return self._orchestrator.run(goal, **request.params)
        raise ValueError(f"Unknown mekong action: '{action}'")

    def _handle_recipe(self, request: ProtocolRequest) -> Any:
        """Handle recipe://run/<recipe_name> → registry.execute(recipe_name)."""
        parts = request.path.split("/", 1)
        action, recipe_name = parts[0], (parts[1] if len(parts) > 1 else "")
        if action == "run":
            if self._recipe_registry is None:
                raise RuntimeError("RecipeRegistry not configured")
            return self._recipe_registry.execute(recipe_name)
        raise ValueError(f"Unknown recipe action: '{action}'")

    def _handle_agent(self, request: ProtocolRequest) -> Any:
        """Handle agent://<agent_name>/<action> → agent.execute(action)."""
        parts = request.path.split("/", 1)
        agent_name, action = parts[0], (parts[1] if len(parts) > 1 else "")
        agent = self._agent_registry.get(agent_name)
        if agent is None:
            raise ValueError(f"Unknown agent: '{agent_name}'")
        return agent.execute(action, **request.params)
