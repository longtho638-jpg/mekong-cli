"""
Mekong CLI - Vector Memory Store (AGI v2)

Persistent vector store for semantic search with JSON file backing.
Supports cosine similarity, memory types (episodic/semantic/procedural),
and automatic persistence.
"""

import hashlib
import json
import math
import time
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


class MemoryType(str, Enum):
    """Categories of memory for the AGI system."""

    EPISODIC = "episodic"      # Task execution history & context
    SEMANTIC = "semantic"      # Knowledge/facts learned
    PROCEDURAL = "procedural"  # Skills/recipes/patterns


@dataclass
class VectorEntry:
    """Single vector record with payload metadata."""

    id: str
    vector: List[float]
    payload: Dict[str, Any]
    memory_type: MemoryType = MemoryType.EPISODIC
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
    Persistent vector store with cosine similarity search.

    Supports three memory types (episodic, semantic, procedural)
    and auto-persists to JSON.  Suitable for small-to-medium
    datasets (< 10k vectors).

    Args:
        persist_path: Optional path for JSON persistence file.
    """

    def __init__(self, persist_path: Optional[str] = None) -> None:
        """Initialize vector store with optional persistence."""
        self._collections: Dict[str, VectorCollection] = {}
        self._persist_path: Optional[Path] = None
        if persist_path:
            self._persist_path = Path(persist_path)
            self._load_snapshot()

    def create_collection(
        self, name: str, dimension: int,
    ) -> VectorCollection:
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
        self._auto_persist()
        return collection

    def get_or_create_collection(
        self, name: str, dimension: int,
    ) -> VectorCollection:
        """Get existing or create new collection."""
        if name in self._collections:
            return self._collections[name]
        return self.create_collection(name, dimension)

    def delete_collection(self, name: str) -> None:
        """Delete a collection and all its entries."""
        if name not in self._collections:
            raise KeyError(f"Collection '{name}' not found.")
        del self._collections[name]
        self._auto_persist()

    def upsert(
        self,
        collection: str,
        id: str,
        vector: List[float],
        payload: Optional[Dict[str, Any]] = None,
        memory_type: MemoryType = MemoryType.EPISODIC,
    ) -> VectorEntry:
        """
        Insert or update a vector entry in a collection.

        Args:
            collection: Target collection name.
            id: Unique point identifier.
            vector: Float vector matching collection dimension.
            payload: Optional metadata dict.
            memory_type: Type of memory (episodic/semantic/procedural).

        Returns:
            The upserted VectorEntry.
        """
        col = self._get_collection(collection)
        if len(vector) != col.dimension:
            raise ValueError(
                f"Vector dimension {len(vector)} != "
                f"collection dimension {col.dimension}."
            )
        entry = VectorEntry(
            id=id, vector=vector, payload=payload or {},
            memory_type=memory_type,
        )
        col.entries[id] = entry
        self._auto_persist()
        return entry

    def search(
        self,
        collection: str,
        query_vector: List[float],
        top_k: int = 5,
        memory_type: Optional[MemoryType] = None,
    ) -> List[Tuple[VectorEntry, float]]:
        """
        Find nearest neighbors using cosine similarity.

        Args:
            collection: Collection name to search.
            query_vector: Query vector (must match collection dimension).
            top_k: Maximum number of results.
            memory_type: Optional filter by memory type.

        Returns:
            List of (VectorEntry, score) sorted by descending similarity.
        """
        col = self._get_collection(collection)
        if len(query_vector) != col.dimension:
            raise ValueError(
                f"Query dimension {len(query_vector)} != "
                f"collection dimension {col.dimension}."
            )
        if not col.entries:
            return []

        entries = col.entries.values()
        if memory_type is not None:
            entries = [e for e in entries if e.memory_type == memory_type]

        scored: List[Tuple[VectorEntry, float]] = [
            (entry, self._cosine_similarity(query_vector, entry.vector))
            for entry in entries
        ]
        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:top_k]

    def search_by_payload(
        self,
        collection: str,
        filters: Dict[str, Any],
        limit: int = 10,
    ) -> List[VectorEntry]:
        """
        Search entries by payload field matching.

        Args:
            collection: Collection name.
            filters: Dict of payload field -> expected value.
            limit: Max results.

        Returns:
            Matching VectorEntry list.
        """
        col = self._get_collection(collection)
        results: List[VectorEntry] = []
        for entry in col.entries.values():
            match = all(
                entry.payload.get(k) == v for k, v in filters.items()
            )
            if match:
                results.append(entry)
                if len(results) >= limit:
                    break
        return results

    def delete_point(self, collection: str, id: str) -> None:
        """Remove a single entry from a collection."""
        col = self._get_collection(collection)
        if id not in col.entries:
            raise KeyError(
                f"Entry '{id}' not found in collection '{collection}'."
            )
        del col.entries[id]
        self._auto_persist()

    def count(self, collection: str) -> int:
        """Return number of entries in a collection."""
        col = self._get_collection(collection)
        return len(col.entries)

    def get_collection_info(self, name: str) -> Dict[str, Any]:
        """Return stats for a collection."""
        col = self._get_collection(name)
        type_counts: Dict[str, int] = {}
        for entry in col.entries.values():
            t = entry.memory_type.value
            type_counts[t] = type_counts.get(t, 0) + 1
        return {
            "name": col.name,
            "dimension": col.dimension,
            "count": len(col.entries),
            "memory_types": type_counts,
            "metadata": col.metadata,
        }

    def list_collections(self) -> List[str]:
        """Return names of all collections."""
        return list(self._collections.keys())

    # --- Persistence ---

    def save_snapshot(self, path: Optional[str] = None) -> str:
        """
        Save entire store to JSON file.

        Args:
            path: File path. Uses init path if not specified.

        Returns:
            Path of saved file.
        """
        save_path = Path(path) if path else self._persist_path
        if save_path is None:
            save_path = Path(".mekong/vector_store.json")

        save_path.parent.mkdir(parents=True, exist_ok=True)

        data: Dict[str, Any] = {}
        for col_name, col in self._collections.items():
            entries_data = []
            for entry in col.entries.values():
                entries_data.append({
                    "id": entry.id,
                    "vector": entry.vector,
                    "payload": entry.payload,
                    "memory_type": entry.memory_type.value,
                    "created_at": entry.created_at,
                })
            data[col_name] = {
                "dimension": col.dimension,
                "metadata": col.metadata,
                "entries": entries_data,
            }

        save_path.write_text(json.dumps(data, indent=2))
        return str(save_path)

    def _load_snapshot(self) -> None:
        """Load store from JSON file if it exists."""
        if self._persist_path is None or not self._persist_path.exists():
            return
        try:
            data = json.loads(self._persist_path.read_text())
            for col_name, col_data in data.items():
                dimension = col_data["dimension"]
                metadata = col_data.get("metadata", {})
                col = VectorCollection(
                    name=col_name, dimension=dimension, metadata=metadata,
                )
                for entry_data in col_data.get("entries", []):
                    try:
                        mem_type = MemoryType(
                            entry_data.get("memory_type", "episodic"),
                        )
                    except ValueError:
                        mem_type = MemoryType.EPISODIC
                    entry = VectorEntry(
                        id=entry_data["id"],
                        vector=entry_data["vector"],
                        payload=entry_data.get("payload", {}),
                        memory_type=mem_type,
                        created_at=entry_data.get("created_at", time.time()),
                    )
                    col.entries[entry.id] = entry
                self._collections[col_name] = col
        except (json.JSONDecodeError, KeyError):
            self._collections = {}

    def _auto_persist(self) -> None:
        """Auto-save if persistence path is configured."""
        if self._persist_path:
            self.save_snapshot(str(self._persist_path))

    # --- Embedding helpers ---

    @staticmethod
    def text_to_hash_vector(text: str, dimension: int = 64) -> List[float]:
        """
        Generate a deterministic pseudo-embedding from text using SHA-256.

        Not as good as a real embedding model, but works offline
        and is consistent across runs.

        Args:
            text: Input text.
            dimension: Output vector dimension (default: 64).

        Returns:
            Normalized float vector of given dimension.
        """
        text_lower = text.lower().strip()
        hash_bytes = hashlib.sha256(text_lower.encode()).digest()

        # Extend hash if dimension > 32 bytes
        extended = hash_bytes
        while len(extended) < dimension * 4:
            extended += hashlib.sha256(
                extended + text_lower.encode()
            ).digest()

        # Convert bytes to floats in [-1, 1]
        vector = []
        for i in range(dimension):
            byte_val = extended[i]
            vector.append((byte_val / 127.5) - 1.0)

        # Normalize
        magnitude = math.sqrt(sum(x * x for x in vector))
        if magnitude > 0:
            vector = [x / magnitude for x in vector]

        return vector

    # --- Internal helpers ---

    def _cosine_similarity(self, a: List[float], b: List[float]) -> float:
        """Compute cosine similarity between two vectors."""
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
    "MemoryType",
    "VectorEntry",
    "VectorCollection",
    "VectorMemoryStore",
]
