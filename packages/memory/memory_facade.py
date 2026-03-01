"""
MemoryFacade — unified interface over Mem0/Qdrant with YAML fallback.

Priority chain:
  1. Mem0 + Qdrant (semantic vector search)
  2. YAML MemoryStore (substring search, always available)

Singleton via module-level instance.
"""

import logging
import os
from typing import Any, Dict, List, Optional

from .mem0_client import Mem0Client
from .qdrant_provider import QdrantProvider

logger = logging.getLogger(__name__)

_DEFAULT_QDRANT_URL = "http://localhost:6333"
_DEFAULT_COLLECTION = "mekong_agent_memory"
_DEFAULT_EMBEDDING_DIM = 1536


class MemoryFacade:
    """Unified memory interface with graceful degradation.

    Tries Mem0/Qdrant first; falls back to YAML MemoryStore on failure.
    Call :meth:`connect` once at startup to initialise vector backend.
    """

    def __init__(
        self,
        qdrant_url: str = _DEFAULT_QDRANT_URL,
        collection_name: str = _DEFAULT_COLLECTION,
        embedding_dim: int = _DEFAULT_EMBEDDING_DIM,
    ) -> None:
        """Initialise facade (does NOT connect automatically).

        Args:
            qdrant_url: Qdrant server URL.
            collection_name: Vector collection name.
            embedding_dim: Embedding vector dimension.
        """
        self._qdrant = QdrantProvider(qdrant_url, collection_name, embedding_dim)
        self._mem0 = Mem0Client(qdrant_url, collection_name, embedding_dim)
        self._vector_ready = False

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    def connect(self) -> bool:
        """Attempt to connect to Qdrant and initialise Mem0.

        Returns:
            True if vector backend is ready, False if falling back to YAML.
        """
        qdrant_ok = self._qdrant.connect()
        if not qdrant_ok:
            logger.info("MemoryFacade: Qdrant unavailable — using YAML fallback")
            self._vector_ready = False
            return False

        mem0_ok = self._mem0.connect()
        self._vector_ready = mem0_ok
        if mem0_ok:
            logger.info("MemoryFacade: Mem0 + Qdrant ready")
        else:
            logger.info("MemoryFacade: Qdrant up but Mem0 failed — YAML fallback active")
        return self._vector_ready

    def close(self) -> None:
        """Release vector backend resources."""
        self._qdrant.close()
        self._vector_ready = False

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def add(
        self,
        content: str,
        user_id: str = "default:session",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """Store a memory entry.

        Tries Mem0/Qdrant first; silently falls back to YAML via MemoryStore
        (caller owns the YAML persistence — this method only delegates to
        the vector layer when available).

        Args:
            content: Text to remember.
            user_id: Scoping key in ``{agent}:{session}`` format.
            metadata: Optional structured metadata.

        Returns:
            True if stored in vector backend, False if YAML fallback needed.
        """
        if self._vector_ready:
            ok = self._mem0.add(content, user_id=user_id, metadata=metadata)
            if ok:
                return True
            logger.warning("MemoryFacade.add: Mem0 failed, YAML fallback")
        return False

    def search(
        self,
        query: str,
        user_id: str = "default:session",
        limit: int = 5,
    ) -> List[Dict[str, Any]]:
        """Search for relevant memories.

        Args:
            query: Semantic or keyword search query.
            user_id: Scoping key to filter results.
            limit: Max results to return.

        Returns:
            List of memory dicts with ``memory`` and ``score`` keys.
            Empty list signals caller to use YAML substring fallback.
        """
        if self._vector_ready:
            results = self._mem0.search(query, user_id=user_id, limit=limit)
            if results:
                return results
            logger.debug("MemoryFacade.search: Mem0 empty, caller may use YAML fallback")
        return []

    def update(self, memory_id: str, content: str) -> bool:
        """Update an existing memory's content.

        Args:
            memory_id: Unique ID returned by Mem0.
            content: New text content.

        Returns:
            True on success, False if unavailable or error.
        """
        if self._vector_ready:
            return self._mem0.update(memory_id, content)
        return False

    def get_all(self, user_id: str = "default:session") -> List[Dict[str, Any]]:
        """Retrieve all memories for a user/agent scope.

        Args:
            user_id: Scoping key in ``{agent}:{session}`` format.

        Returns:
            List of all stored memories.
        """
        if self._vector_ready:
            return self._mem0.get_all(user_id=user_id)
        return []

    def history(self, memory_id: str) -> List[Dict[str, Any]]:
        """Get change history of a memory entry.

        Args:
            memory_id: Unique ID returned by Mem0.

        Returns:
            List of history entries.
        """
        if self._vector_ready:
            return self._mem0.history(memory_id)
        return []

    def forget(self, memory_id: str) -> bool:
        """Delete a memory by ID from vector store.

        Args:
            memory_id: Unique ID returned by Mem0.

        Returns:
            True on success, False if unavailable or error.
        """
        if self._vector_ready:
            return self._mem0.forget(memory_id)
        return False

    def get_provider_status(self) -> Dict[str, Any]:
        """Return health summary for all memory providers.

        Returns:
            Dict with keys: ``vector_ready``, ``qdrant_connected``,
            ``mem0_available``, ``active_provider``.
        """
        qdrant_healthy = self._qdrant.health_check() if self._qdrant.is_connected else False
        return {
            "vector_ready": self._vector_ready,
            "qdrant_connected": qdrant_healthy,
            "mem0_available": self._mem0.is_available,
            "active_provider": "mem0+qdrant" if self._vector_ready else "yaml",
        }


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------

_facade: Optional[MemoryFacade] = None


def get_memory_facade() -> MemoryFacade:
    """Return (and lazily create) the singleton MemoryFacade."""
    global _facade
    if _facade is None:
        qdrant_url = os.getenv("QDRANT_URL", _DEFAULT_QDRANT_URL)
        collection = os.getenv("QDRANT_COLLECTION", _DEFAULT_COLLECTION)
        _facade = MemoryFacade(qdrant_url=qdrant_url, collection_name=collection)
    return _facade
