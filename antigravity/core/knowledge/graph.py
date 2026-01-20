"""
🕸️ Knowledge Graph Orchestration
================================

Orchestrates entity extraction, storage, and search.
"""

import logging
import os
from pathlib import Path
from typing import Dict, List, Optional

from .entity_extractor import EntityExtractor
from .search_engine import SearchEngine, SearchResult
from .types import CodeEntity, EntityType, Relationship, RelationType

logger = logging.getLogger(__name__)


class KnowledgeGraph:
    """
    🕸️ Codebase Knowledge Graph

    Features:
    - Entity extraction from code
    - Relationship mapping
    - Smart semantic search
    - Dependency analysis
    """

    def __init__(self, root_path: str = None, max_index_size: int = 10000):
        """
        Initialize knowledge graph.

        Args:
            root_path: Root directory to index
            max_index_size: Maximum entities to index (memory limit)
        """
        self.root_path = Path(root_path or os.getcwd())
        self.max_index_size = max_index_size

        # Initialize subsystems
        self.extractor = EntityExtractor()
        self.search_engine = SearchEngine(max_index_size)

        # Relationship storage (kept simple for now)
        self.relationships: List[Relationship] = []

        logger.info(f"🕸️ KnowledgeGraph initialized for {self.root_path}")

    def index_file(self, file_path: Path) -> List[CodeEntity]:
        """
        Index a Python file and extract entities.

        Args:
            file_path: Path to Python file

        Returns:
            List of extracted CodeEntity objects
        """
        if not str(file_path).endswith(".py"):
            return []

        try:
            # Extract entities and relationships
            result = self.extractor.extract_from_file(file_path)
            entities = result["entities"]
            relationships = result["relationships"]

            # Add to search index
            for entity in entities:
                self.search_engine.add_entity(entity)

            # Store relationships
            self.relationships.extend(relationships)

            logger.debug(f"📄 Indexed {file_path}: {len(entities)} entities")
            return entities

        except Exception as e:
            logger.error(f"Failed to index {file_path}: {e}")
            return []

    def index_directory(self, path: Path = None, recursive: bool = True) -> int:
        """
        Index all Python files in directory.

        Args:
            path: Directory path (default: root_path)
            recursive: Whether to recurse into subdirectories

        Returns:
            Total number of entities indexed
        """
        path = Path(path or self.root_path)
        count = 0

        if recursive:
            for root, dirs, files in os.walk(path):
                # Skip common non-code directories
                dirs[:] = [
                    d
                    for d in dirs
                    if d not in {"__pycache__", ".git", ".venv", "node_modules", "venv", "dist", "build"}
                ]

                for file in files:
                    if file.endswith(".py"):
                        file_path = Path(root) / file
                        entities = self.index_file(file_path)
                        count += len(entities)
        else:
            for file_path in path.glob("*.py"):
                entities = self.index_file(file_path)
                count += len(entities)

        logger.info(f"🕸️ Indexed {count} entities from {path}")
        return count

    def search(self, query: str, limit: int = 10, entity_type: str = None) -> List[SearchResult]:
        """
        Search for entities by query.

        Args:
            query: Search query
            limit: Maximum results to return
            entity_type: Optional filter by entity type

        Returns:
            List of SearchResult objects sorted by relevance
        """
        return self.search_engine.search(query, entity_type=entity_type, limit=limit)

    def get_entity(self, entity_id: str) -> Optional[CodeEntity]:
        """Get entity by ID."""
        return self.search_engine.get_entity(entity_id)

    def get_relationships(self, entity_id: str) -> List[Relationship]:
        """Get relationships for an entity."""
        return [
            r for r in self.relationships if r.source_id == entity_id or r.target_id == entity_id
        ]

    def get_dependencies(self, file_path: str) -> List[str]:
        """
        Get dependencies (imports) of a file.

        Args:
            file_path: File path to analyze

        Returns:
            List of imported module names
        """
        imports = []
        for entity_id, entity in self.search_engine.entities.items():
            if entity.file_path == file_path and entity.type == EntityType.IMPORT:
                imports.append(entity.name)
        return imports

    def get_stats(self) -> Dict:
        """
        Get knowledge graph statistics.

        Returns:
            Dictionary with stats
        """
        search_stats = self.search_engine.get_stats()
        return {
            **search_stats,
            "total_relationships": len(self.relationships),
            "root_path": str(self.root_path),
        }

    def clear(self):
        """Clear all indexed data."""
        self.search_engine.clear()
        self.relationships.clear()
        logger.info("Knowledge graph cleared")


# Global instance
_graph: Optional[KnowledgeGraph] = None


def get_knowledge_graph(root_path: str = None, max_index_size: int = 10000) -> KnowledgeGraph:
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
        _graph = KnowledgeGraph(root_path, max_index_size)
    return _graph


# Convenience functions
def index_codebase(path: str = None) -> int:
    """Index entire codebase."""
    return get_knowledge_graph().index_directory(Path(path) if path else None)


def search_code(query: str, limit: int = 10) -> List[SearchResult]:
    """Search the codebase."""
    return get_knowledge_graph().search(query, limit)


def get_dependencies(file_path: str) -> List[str]:
    """Get file dependencies."""
    return get_knowledge_graph().get_dependencies(file_path)
