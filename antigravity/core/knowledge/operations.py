"""
Knowledge Graph Operations
==========================

Convenience functions and global instance management for the knowledge graph.
"""

from pathlib import Path
from typing import TYPE_CHECKING, List, Optional

if TYPE_CHECKING:
    from .graph import KnowledgeGraph
    from .search_engine import SearchResult

# Global instance
_graph: Optional["KnowledgeGraph"] = None


def get_knowledge_graph(root_path: str = None, max_index_size: int = 10000) -> "KnowledgeGraph":
    """
    Get global knowledge graph instance.

    Args:
        root_path: Optional root path (only used on first call)
        max_index_size: Maximum index size (only used on first call)

    Returns:
        KnowledgeGraph instance
    """
    global _graph
    if _graph is None:
        from .graph import KnowledgeGraph
        _graph = KnowledgeGraph(root_path, max_index_size)
    return _graph


def index_codebase(path: str = None) -> int:
    """Index entire codebase."""
    return get_knowledge_graph().index_directory(Path(path) if path else None)


def search_code(query: str, limit: int = 10) -> List["SearchResult"]:
    """Search the codebase."""
    return get_knowledge_graph().search(query, limit)


def get_dependencies(file_path: str) -> List[str]:
    """Get file dependencies."""
    return get_knowledge_graph().get_dependencies(file_path)


def reset_graph():
    """Reset the global graph instance."""
    global _graph
    if _graph is not None:
        _graph.clear()
    _graph = None
