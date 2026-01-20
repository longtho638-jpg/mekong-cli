"""
Search Indexing - Entity Indexing and Eviction
===============================================

Handles keyword extraction and index management for code entities.
"""

import re
from typing import Dict, Set

from .types import CodeEntity


def extract_keywords(entity: CodeEntity) -> Set[str]:
    """
    Extract searchable keywords from a code entity.

    Args:
        entity: Entity to extract keywords from

    Returns:
        Set of lowercase keywords
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

    return keywords


def index_entity_keywords(
    entity: CodeEntity,
    index: Dict[str, Set[str]]
) -> Dict[str, Set[str]]:
    """
    Add entity keywords to the index.

    Args:
        entity: Entity to index
        index: Current keyword index

    Returns:
        Updated index
    """
    keywords = extract_keywords(entity)

    for keyword in keywords:
        if keyword not in index:
            index[keyword] = set()
        index[keyword].add(entity.id)

    return index


def evict_entity(
    entity_id: str,
    entities: Dict[str, CodeEntity],
    index: Dict[str, Set[str]]
) -> tuple[Dict[str, CodeEntity], Dict[str, Set[str]]]:
    """
    Evict an entity from the index.

    Args:
        entity_id: ID of entity to evict
        entities: Entity dictionary
        index: Keyword index

    Returns:
        Tuple of (updated entities, updated index)
    """
    if entity_id not in entities:
        return entities, index

    # Remove from entities
    del entities[entity_id]

    # Remove from index
    for keyword_set in index.values():
        keyword_set.discard(entity_id)

    # Clean empty keywords
    index = {k: v for k, v in index.items() if v}

    return entities, index
