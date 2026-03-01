"""
Mekong CLI - Vector Memory Store

In-memory vector store for semantic search, inspired by Qdrant's architecture.
Supports cosine similarity search with pure Python (no external vector DB).
"""

import math
import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple


@dataclass
class VectorEntry:
    """Single vector record with payload metadata."""

    id: str
    vector: List[float]
    payload: Dict[str, Any]
    created_at: float = field(default_factory=time.time)


@dataclass
class VectorCollection:
    """Named collection of vectors with fixed dimensionality."""

    name: str
    dimension: int
    entries: Dict[str, VectorEntry] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)


class VectorMemoryStore:
    """
    In-memory vector store with cosine similarity search.

    Inspired by Qdrant's collection/point model. Suitable for small-to-medium
    datasets (< 10k vectors). No persistence — use SnapshotManager for durability.
    """

    def __init__(self) -> None:
        """Initialize an empty vector store."""
        self._collections: Dict[str, VectorCollection] = {}

    def create_collection(self, name: str, dimension: int) -> VectorCollection:
        """
        Create a new vector collection.

        Args:
            name: Unique collection name.
            dimension: Fixed vector dimension for all entries.

        Returns:
            Newly created VectorCollection.

        Raises:
            ValueError: If collection already exists.
        """
        if name in self._collections:
            raise ValueError(f"Collection '{name}' already exists.")
        collection = VectorCollection(name=name, dimension=dimension)
        self._collections[name] = collection
        return collection

    def delete_collection(self, name: str) -> None:
        """
        Delete a collection and all its entries.

        Args:
            name: Collection name to delete.

        Raises:
            KeyError: If collection does not exist.
        """
        if name not in self._collections:
            raise KeyError(f"Collection '{name}' not found.")
        del self._collections[name]

    def upsert(
        self,
        collection: str,
        id: str,
        vector: List[float],
        payload: Optional[Dict[str, Any]] = None,
    ) -> VectorEntry:
        """
        Insert or update a vector entry in a collection.

        Args:
            collection: Target collection name.
            id: Unique point identifier.
            vector: Float vector matching collection dimension.
            payload: Optional metadata dict attached to the entry.

        Returns:
            The upserted VectorEntry.

        Raises:
            KeyError: If collection does not exist.
            ValueError: If vector dimension does not match collection.
        """
        col = self._get_collection(collection)
        if len(vector) != col.dimension:
            raise ValueError(
                f"Vector dimension {len(vector)} != collection dimension {col.dimension}."
            )
        entry = VectorEntry(id=id, vector=vector, payload=payload or {})
        col.entries[id] = entry
        return entry

    def search(
        self,
        collection: str,
        query_vector: List[float],
        top_k: int = 5,
    ) -> List[Tuple[VectorEntry, float]]:
        """
        Find nearest neighbors using cosine similarity.

        Args:
            collection: Collection name to search.
            query_vector: Query vector (must match collection dimension).
            top_k: Maximum number of results to return.

        Returns:
            List of (VectorEntry, score) sorted by descending similarity.

        Raises:
            KeyError: If collection does not exist.
            ValueError: If query vector dimension does not match.
        """
        col = self._get_collection(collection)
        if len(query_vector) != col.dimension:
            raise ValueError(
                f"Query dimension {len(query_vector)} != collection dimension {col.dimension}."
            )
        if not col.entries:
            return []

        scored: List[Tuple[VectorEntry, float]] = [
            (entry, self._cosine_similarity(query_vector, entry.vector))
            for entry in col.entries.values()
        ]
        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:top_k]

    def delete_point(self, collection: str, id: str) -> None:
        """
        Remove a single entry from a collection.

        Args:
            collection: Collection name.
            id: Entry ID to remove.

        Raises:
            KeyError: If collection or entry does not exist.
        """
        col = self._get_collection(collection)
        if id not in col.entries:
            raise KeyError(f"Entry '{id}' not found in collection '{collection}'.")
        del col.entries[id]

    def get_collection_info(self, name: str) -> Dict[str, Any]:
        """
        Return stats for a collection.

        Args:
            name: Collection name.

        Returns:
            Dict with 'name', 'dimension', 'count', and 'metadata'.

        Raises:
            KeyError: If collection does not exist.
        """
        col = self._get_collection(name)
        return {
            "name": col.name,
            "dimension": col.dimension,
            "count": len(col.entries),
            "metadata": col.metadata,
        }

    def _cosine_similarity(self, a: List[float], b: List[float]) -> float:
        """
        Compute cosine similarity between two vectors.

        Args:
            a: First vector.
            b: Second vector (same length as a).

        Returns:
            Similarity score in [-1.0, 1.0]. Returns 0.0 for zero-magnitude vectors.
        """
        dot = sum(x * y for x, y in zip(a, b))
        mag_a = math.sqrt(sum(x * x for x in a))
        mag_b = math.sqrt(sum(x * x for x in b))
        if mag_a == 0.0 or mag_b == 0.0:
            return 0.0
        return dot / (mag_a * mag_b)

    def _get_collection(self, name: str) -> VectorCollection:
        """Retrieve collection or raise KeyError."""
        if name not in self._collections:
            raise KeyError(f"Collection '{name}' not found.")
        return self._collections[name]


__all__ = [
    "VectorEntry",
    "VectorCollection",
    "VectorMemoryStore",
]
