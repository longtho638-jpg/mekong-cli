"""
🕸️ Knowledge Graph Module
===========================

Modular knowledge graph system with:
- Entity extraction from code (AST parsing)
- Search engine with indexing
- Dependency analysis
"""

from .entity_extractor import EntityExtractor
from .graph import (
    KnowledgeGraph,
    get_dependencies,
    get_knowledge_graph,
    index_codebase,
    search_code,
)
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
    "KnowledgeGraph",
    "get_knowledge_graph",
    "index_codebase",
    "search_code",
    "get_dependencies",
]
