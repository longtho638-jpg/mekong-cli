"""
Mem0 client wrapper for Mekong memory layer.

Wraps mem0ai.Memory with Qdrant vector backend.
Graceful degradation: all methods return None/False when unavailable.
"""

import logging
import os
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

try:
    from mem0 import Memory as Mem0Memory
    MEM0_AVAILABLE = True
except ImportError:
    MEM0_AVAILABLE = False
    logger.warning("mem0ai not installed. Mem0 memory provider unavailable.")


def _build_mem0_config(qdrant_url: str, collection_name: str, embedding_dim: int) -> Dict[str, Any]:
    """Build Mem0 config dict with Qdrant as vector store.

    Args:
        qdrant_url: Qdrant server URL.
        collection_name: Collection to store embeddings.
        embedding_dim: Dimension of embedding model output.

    Returns:
        Config dictionary for mem0ai.Memory.
    """
    return {
        "vector_store": {
            "provider": "qdrant",
            "config": {
                "url": qdrant_url,
                "collection_name": collection_name,
                "embedding_model_dims": embedding_dim,
            },
        },
        "embedder": {
            "provider": "openai",
            "config": {
                "model": "text-embedding-ada-002",
                "api_key": os.getenv("OPENAI_API_KEY", ""),
            },
        },
    }


class Mem0Client:
    """Thin wrapper around mem0ai.Memory with Qdrant backend.

    User IDs should use the format: ``{agent_name}:{session_id}``
    to provide per-agent isolation.
    """

    def __init__(
        self,
        qdrant_url: str = "http://localhost:6333",
        collection_name: str = "mekong_agent_memory",
        embedding_dim: int = 1536,
    ) -> None:
        """Initialize Mem0Client.

        Args:
            qdrant_url: Qdrant server URL.
            collection_name: Vector collection name.
            embedding_dim: Embedding vector dimension.
        """
        self._qdrant_url = qdrant_url
        self._collection_name = collection_name
        self._embedding_dim = embedding_dim
        self._mem0: Optional["Mem0Memory"] = None
        self._available = False

    def connect(self) -> bool:
        """Initialize the Mem0 Memory instance with Qdrant config.

        Returns:
            True if initialization succeeded, False otherwise.
        """
        if not MEM0_AVAILABLE:
            return False
        try:
            config = _build_mem0_config(
                self._qdrant_url, self._collection_name, self._embedding_dim
            )
            self._mem0 = Mem0Memory.from_config(config)
            self._available = True
            logger.info("Mem0 client initialized with Qdrant backend")
            return True
        except Exception as e:
            logger.warning(f"Mem0 connect failed: {e}")
            self._available = False
            return False

    @property
    def is_available(self) -> bool:
        """Return whether Mem0 is ready to accept calls."""
        return self._available and self._mem0 is not None

    def add(
        self,
        content: str,
        user_id: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """Store a memory entry.

        Args:
            content: Text content to remember.
            user_id: Scoping key in format ``{agent}:{session}``.
            metadata: Optional extra fields attached to memory.

        Returns:
            True on success, False on any failure.
        """
        if not self.is_available:
            return False
        try:
            self._mem0.add(content, user_id=user_id, metadata=metadata or {})
            logger.debug(f"Mem0 add: user={user_id} content={content[:40]}...")
            return True
        except Exception as e:
            logger.warning(f"Mem0 add failed: {e}")
            return False

    def search(
        self,
        query: str,
        user_id: str,
        limit: int = 5,
    ) -> List[Dict[str, Any]]:
        """Search for relevant memories.

        Args:
            query: Semantic search query.
            user_id: Scoping key to filter results.
            limit: Maximum number of results to return.

        Returns:
            List of memory dicts with ``memory`` and ``score`` keys.
            Empty list on failure or unavailability.
        """
        if not self.is_available:
            return []
        try:
            results = self._mem0.search(query, user_id=user_id, limit=limit)
            # mem0ai returns list of dicts; normalise for our API
            memories: List[Dict[str, Any]] = []
            for item in results:
                if isinstance(item, dict):
                    memories.append(item)
                else:
                    memories.append({"memory": str(item), "score": 0.0})
            logger.debug(f"Mem0 search: user={user_id} query={query[:40]} hits={len(memories)}")
            return memories
        except Exception as e:
            logger.warning(f"Mem0 search failed: {e}")
            return []

    def update(
        self,
        memory_id: str,
        content: str,
    ) -> bool:
        """Update an existing memory's content.

        Args:
            memory_id: Unique identifier of the memory to update.
            content: New text content.

        Returns:
            True on success, False on any failure.
        """
        if not self.is_available:
            return False
        try:
            self._mem0.update(memory_id, content)
            logger.debug(f"Mem0 update: id={memory_id}")
            return True
        except Exception as e:
            logger.warning(f"Mem0 update failed: {e}")
            return False

    def get_all(self, user_id: str) -> List[Dict[str, Any]]:
        """Retrieve all memories for a user/agent scope.

        Args:
            user_id: Scoping key in format ``{agent}:{session}``.

        Returns:
            List of all stored memories for the user.
        """
        if not self.is_available:
            return []
        try:
            results = self._mem0.get_all(user_id=user_id)
            logger.debug(f"Mem0 get_all: user={user_id} count={len(results)}")
            return results if isinstance(results, list) else []
        except Exception as e:
            logger.warning(f"Mem0 get_all failed: {e}")
            return []

    def history(self, memory_id: str) -> List[Dict[str, Any]]:
        """Get change history of a memory entry.

        Args:
            memory_id: Unique identifier of the memory.

        Returns:
            List of history entries (version, content, timestamp).
        """
        if not self.is_available:
            return []
        try:
            hist = self._mem0.history(memory_id)
            return hist if isinstance(hist, list) else []
        except Exception as e:
            logger.warning(f"Mem0 history failed: {e}")
            return []

    def forget(self, memory_id: str) -> bool:
        """Delete a specific memory by ID.

        Args:
            memory_id: Unique identifier of the memory to remove.

        Returns:
            True on success, False on any failure.
        """
        if not self.is_available:
            return False
        try:
            self._mem0.delete(memory_id)
            logger.debug(f"Mem0 forget: id={memory_id}")
            return True
        except Exception as e:
            logger.warning(f"Mem0 forget failed: {e}")
            return False
