"""
mekong-memory — Mem0 + Qdrant memory layer for Mekong CLI.

Provides a unified MemoryFacade that wraps vector search (Mem0 + Qdrant)
with automatic YAML fallback when the vector backend is unavailable.
"""

from .mem0_client import Mem0Client
from .memory_facade import MemoryFacade, get_memory_facade
from .qdrant_provider import QdrantProvider

__all__ = [
    "MemoryFacade",
    "get_memory_facade",
    "QdrantProvider",
    "Mem0Client",
]
