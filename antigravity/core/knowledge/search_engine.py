"""
Search Engine - Entity Indexing and Search
===========================================

Provides fast search over code entities with:
- Keyword-based indexing
- Relevance scoring
- Memory-bounded index (LRU eviction)
- Multi-field search (name, docstring)
"""

import logging
import re
from dataclasses import dataclass
from typing import Dict, List, Set

from .types import CodeEntity

logger = logging.getLogger(__name__)


@dataclass
class SearchResult:
    """Search result with relevance scoring."""

    entity: CodeEntity
    relevance: float
    matches: List[str]
    context: str


class SearchEngine:
    """Index and search code entities with memory limits."""

    def __init__(self, max_index_size: int = 10000):
        """
        Initialize search engine.

        Args:
            max_index_size: Maximum number of entities to index
        """
        self.max_index_size = max_index_size
        self.index: Dict[str, Set[str]] = {}  # keyword -> entity IDs
        self.entities: Dict[str, CodeEntity] = {}  # entity ID -> entity
        self.entity_count = 0
        logger.info(f"SearchEngine initialized (max_size={max_index_size})")

    def add_entity(self, entity: CodeEntity):
        """
        Add entity to index.

        Args:
            entity: CodeEntity to index
        """
        # Check size limit
        if self.entity_count >= self.max_index_size:
            self._evict_oldest()

        # Store entity
        self.entities[entity.id] = entity
        self.entity_count += 1

        # Index keywords
        self._index_entity(entity)

        logger.debug(f"Indexed entity: {entity.name} ({entity.type.value})")

    def search(self, query: str, entity_type: str = None, limit: int = 10) -> List[SearchResult]:
        """
        Search indexed entities.

        Args:
            query: Search query
            entity_type: Optional filter by entity type
            limit: Maximum results to return

        Returns:
            List of SearchResult objects sorted by relevance
        """
        query_words = set(query.lower().split())
        results = []

        # Find candidate entities
        candidate_ids: Set[str] = set()
        for word in query_words:
            if word in self.index:
                candidate_ids.update(self.index[word])

        # Score and filter candidates
        for entity_id in candidate_ids:
            entity = self.entities.get(entity_id)
            if not entity:
                continue

            # Filter by type if specified
            if entity_type and entity.type.value != entity_type:
                continue

            # Calculate relevance
            relevance, matches = self._calculate_relevance(entity, query_words)

            if relevance > 0:
                context = entity.docstring[:100] if entity.docstring else ""
                results.append(
                    SearchResult(entity=entity, relevance=relevance, matches=matches, context=context)
                )

        # Sort by relevance and limit
        results.sort(key=lambda r: r.relevance, reverse=True)
        return results[:limit]

    def get_entity(self, entity_id: str) -> CodeEntity:
        """Get entity by ID."""
        return self.entities.get(entity_id)

    def get_stats(self) -> Dict:
        """Get search engine statistics."""
        type_counts = {}
        for entity in self.entities.values():
            type_name = entity.type.value
            type_counts[type_name] = type_counts.get(type_name, 0) + 1

        return {
            "total_entities": self.entity_count,
            "indexed_keywords": len(self.index),
            "max_size": self.max_index_size,
            "entities_by_type": type_counts,
        }

    def clear(self):
        """Clear all indexed data."""
        self.index.clear()
        self.entities.clear()
        self.entity_count = 0
        logger.info("Search index cleared")

    def _index_entity(self, entity: CodeEntity):
        """
        Add entity to keyword index.

        Args:
            entity: Entity to index
        """
        keywords = set()

        # Extract keywords from name (camelCase/snake_case)
        name_words = re.findall(r"[A-Z][a-z]+|[a-z]+|[0-9]+", entity.name)
        keywords.update(w.lower() for w in name_words if len(w) > 1)

        # Add full name lowercased to allow exact matches
        keywords.add(entity.name.lower())

        # Extract keywords from docstring (limited)
        if entity.docstring:
            doc_words = re.findall(r"\w+", entity.docstring.lower())
            # Limit docstring keywords to prevent index bloat
            keywords.update(w for w in doc_words[:50] if len(w) > 3)

        # Add to index
        for keyword in keywords:
            if keyword not in self.index:
                self.index[keyword] = set()
            self.index[keyword].add(entity.id)

    def _calculate_relevance(self, entity: CodeEntity, query_words: Set[str]) -> tuple[float, List[str]]:
        """
        Calculate relevance score for entity.

        Args:
            entity: Entity to score
            query_words: Set of query words

        Returns:
            Tuple of (relevance_score, match_descriptions)
        """
        relevance = 0.0
        matches = []

        name_lower = entity.name.lower()

        # Exact name match (highest weight)
        if name_lower in query_words:
            relevance += 1.0
            matches.append("exact name match")

        # Name contains query words
        for word in query_words:
            if word in name_lower:
                relevance += 0.5
                matches.append(f"name contains '{word}'")

        # Docstring matches (lower weight)
        if entity.docstring:
            doc_lower = entity.docstring.lower()
            for word in query_words:
                if word in doc_lower:
                    relevance += 0.2
                    if f"docstring contains '{word}'" not in matches:
                        matches.append(f"docstring contains '{word}'")

        return relevance, matches

    def _evict_oldest(self):
        """
        Evict oldest entity when index is full.

        Uses simple FIFO eviction (could be enhanced to LRU).
        """
        if not self.entities:
            return

        # Get first entity (oldest in insertion order for dict in Python 3.7+)
        oldest_id = next(iter(self.entities))
        oldest_entity = self.entities[oldest_id]

        # Remove from entities
        del self.entities[oldest_id]
        self.entity_count -= 1

        # Remove from index
        for keyword_set in self.index.values():
            keyword_set.discard(oldest_id)

        # Clean empty keywords
        self.index = {k: v for k, v in self.index.items() if v}

        logger.debug(f"Evicted entity: {oldest_entity.name}")


__all__ = ["SearchEngine", "SearchResult"]
