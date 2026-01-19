"""
🕸️ Knowledge Graph Module
===========================

Modular knowledge graph system with:
- Entity extraction from code (AST parsing)
- Search engine with indexing
- Dependency analysis
"""

from .entity_extractor import EntityExtractor
from .search_engine import SearchEngine, SearchResult
from .types import CodeEntity, EntityType, Relationship, RelationType

__all__ = [
    "EntityExtractor",
    "SearchEngine",
    "SearchResult",
    "CodeEntity",
    "EntityType",
    "Relationship",
    "RelationType",
]
