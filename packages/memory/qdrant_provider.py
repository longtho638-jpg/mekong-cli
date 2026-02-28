"""
Qdrant vector database provider for Mekong memory layer.

Handles connection, health checking, and collection management.
Graceful degradation: returns False on any failure.
"""

import logging
from typing import Optional

logger = logging.getLogger(__name__)

try:
    from qdrant_client import QdrantClient
    from qdrant_client.models import Distance, VectorParams
    QDRANT_AVAILABLE = True
except ImportError:
    QDRANT_AVAILABLE = False
    logger.warning("qdrant-client not installed. Vector storage unavailable.")

_DEFAULT_URL = "http://localhost:6333"
_COLLECTION_NAME = "mekong_agent_memory"
_EMBEDDING_DIM = 1536


class QdrantProvider:
    """Manages connection to Qdrant vector database.

    Provides connect/health/close lifecycle with graceful fallback
    when Qdrant is unavailable.
    """

    def __init__(
        self,
        url: str = _DEFAULT_URL,
        collection_name: str = _COLLECTION_NAME,
        embedding_dim: int = _EMBEDDING_DIM,
    ) -> None:
        """Initialize QdrantProvider.

        Args:
            url: Qdrant server URL (default: http://localhost:6333).
            collection_name: Vector collection to use.
            embedding_dim: Dimension of embedding vectors.
        """
        self.url = url
        self.collection_name = collection_name
        self.embedding_dim = embedding_dim
        self._client: Optional["QdrantClient"] = None
        self._connected = False

    def connect(self) -> bool:
        """Connect to Qdrant and ensure collection exists.

        Returns:
            True if connection succeeded, False otherwise.
        """
        if not QDRANT_AVAILABLE:
            return False
        try:
            self._client = QdrantClient(url=self.url, timeout=5.0)
            self._ensure_collection()
            self._connected = True
            logger.info(f"Qdrant connected: {self.url} / {self.collection_name}")
            return True
        except Exception as e:
            logger.warning(f"Qdrant connect failed: {e}")
            self._connected = False
            return False

    def health_check(self) -> bool:
        """Verify Qdrant is reachable.

        Returns:
            True if server responds, False otherwise.
        """
        if not QDRANT_AVAILABLE or self._client is None:
            return False
        try:
            self._client.get_collections()
            return True
        except Exception as e:
            logger.warning(f"Qdrant health check failed: {e}")
            self._connected = False
            return False

    def close(self) -> None:
        """Close the Qdrant client connection."""
        if self._client is not None:
            try:
                self._client.close()
            except Exception:
                pass
            self._client = None
        self._connected = False

    @property
    def is_connected(self) -> bool:
        """Return current connection state."""
        return self._connected

    @property
    def client(self) -> Optional["QdrantClient"]:
        """Return the underlying QdrantClient (None if not connected)."""
        return self._client

    def _ensure_collection(self) -> None:
        """Create collection if it does not exist."""
        if self._client is None:
            return
        existing = {c.name for c in self._client.get_collections().collections}
        if self.collection_name not in existing:
            self._client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(
                    size=self.embedding_dim,
                    distance=Distance.COSINE,
                ),
            )
            logger.info(f"Qdrant collection created: {self.collection_name}")
