"""Mekong CLI - NeuralMemory Client
Interacts with local NeuralMemory server (nmem serve) via HTTP.

Also exposes get_memory_provider() factory that selects the active memory
backend based on the MEMORY_PROVIDER environment variable:
  - "mem0"   → MemoryFacade (Mem0 + Qdrant vector search)
  - "neural" → NeuralMemoryClient (HTTP spreading-activation server)
  - "yaml"   → None (caller uses MemoryStore directly)
"""

from __future__ import annotations

import logging
import os
import time
from typing import Any

import requests  # type: ignore[import-untyped]

logger = logging.getLogger(__name__)


class NeuralMemoryClient:
    """Client for NeuralMemory (Spreading Activation Memory)."""

    def __init__(
        self, base_url: str = "http://localhost:8000", brain_id: str = "default",
        timeout: float = 5.0, health_ttl: float = 30.0,
    ) -> None:
        """Initialize NeuralMemoryClient with connection settings.

        Args:
            base_url: Base URL of the NeuralMemory server.
            brain_id: Brain identifier for multi-tenant memory isolation.
            timeout: HTTP request timeout in seconds.
            health_ttl: Seconds to cache the health check result before re-checking.

        """
        self.base_url = base_url
        self.brain_id = brain_id
        self.timeout = timeout
        self.health_ttl = health_ttl
        self._available: bool | None = None
        self._health_checked_at = 0.0

    @property
    def is_available(self) -> bool:
        """Check if NeuralMemory server is running (cached with TTL)."""
        now = time.time()
        if self._available is not None and (now - self._health_checked_at) < self.health_ttl:
            return self._available
        try:
            resp = requests.get(f"{self.base_url}/health", timeout=1.0)
            self._available = resp.status_code == 200
        except Exception:
            self._available = False
        self._health_checked_at = now
        return self._available

    def invalidate_health(self) -> None:
        """Force re-check on next is_available call."""
        self._available = None
        self._health_checked_at = 0.0

    def add_memory(self, content: str, metadata: dict[str, Any] | None = None) -> bool:
        """Encode a new memory."""
        if not self.is_available:
            return False

        try:
            url = f"{self.base_url}/api/v1/memory/encode"
            headers = {"X-Brain-ID": self.brain_id, "Content-Type": "application/json"}
            payload = {"content": content, "metadata": metadata or {}}

            resp = requests.post(url, json=payload, headers=headers, timeout=self.timeout)
            if resp.status_code == 200:
                logger.info(f"Memory encoded: {content[:30]}...")
                return True
            logger.warning(f"Failed to encode memory: {resp.text}")
            return False
        except Exception as e:
            logger.exception(f"Error encoding memory: {e}")
            return False

    def add_memory_deduped(self, content: str, metadata: dict[str, Any] | None = None) -> bool:
        """Add memory, boosting existing if similar content found."""
        if not self.is_available:
            return False
        existing = self.query_memory(content[:100], depth=1)
        if existing and len(existing) > 10:
            logger.info("Similar memory exists, skipping duplicate")
            return True  # Don't add duplicate
        return self.add_memory(content, metadata)

    def query_memory(self, query: str, depth: int = 1, decay_weight: float = 0.0) -> str | None:
        """Query memory for context (spreading activation)."""
        if not self.is_available:
            return None

        try:
            url = f"{self.base_url}/api/v1/memory/query"
            headers = {"X-Brain-ID": self.brain_id, "Content-Type": "application/json"}
            payload = {"query": query, "depth": depth, "max_tokens": 2000}
            if decay_weight > 0:
                payload["decay_weight"] = decay_weight

            resp = requests.post(url, json=payload, headers=headers, timeout=self.timeout)
            if resp.status_code == 200:
                data = resp.json()
                context = str(data.get("context", ""))
                if context and len(context.strip()) > 0:
                    logger.info(f"Memory recalled context ({len(context)} chars)")
                    return context
                return None
            logger.warning(f"Failed to query memory: {resp.text}")
            return None
        except Exception as e:
            logger.exception(f"Error querying memory: {e}")
            return None


# Singleton
_memory_client = None


def get_memory_client() -> NeuralMemoryClient:
    """Get or create the singleton NeuralMemoryClient instance."""
    global _memory_client
    if _memory_client is None:
        _memory_client = NeuralMemoryClient()
    return _memory_client


# ---------------------------------------------------------------------------
# Provider factory
# ---------------------------------------------------------------------------

def get_memory_provider() -> NeuralMemoryClient | Any | None:
    """Return the active memory provider based on MEMORY_PROVIDER env var.

    Environment variable MEMORY_PROVIDER controls selection:
      - ``"mem0"``   → MemoryFacade (Mem0 + Qdrant). Calls connect() lazily.
      - ``"neural"`` → NeuralMemoryClient singleton (HTTP nmem server).
      - ``"yaml"``   → Returns None; caller should use MemoryStore directly.

    Defaults to ``"yaml"`` when env var is absent or unrecognised.

    Returns:
        Active provider instance, or None for yaml-only mode.

    """
    provider_name = os.getenv("MEMORY_PROVIDER", "yaml").lower().strip()

    if provider_name == "mem0":
        try:
            from packages.memory.memory_facade import get_memory_facade
            facade = get_memory_facade()
            facade.connect()  # idempotent — safe to call multiple times
            return facade
        except ImportError:
            logger.warning(
                "MEMORY_PROVIDER=mem0 but packages.memory not installed. "
                "Falling back to yaml.",
            )
            return None

    if provider_name == "neural":
        return get_memory_client()

    # Default: yaml — no external provider
    return None
