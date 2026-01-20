"""
🕸️ Knowledge Graph - Codebase Intelligence
============================================

Cross-referencing all code entities for smart search and discovery.
Creates a rich semantic graph of the codebase.

This module provides a simplified orchestration layer over the modular
knowledge graph subsystems.

Binh Pháp: "Tri thiên tri địa" - Know the terrain, know the conditions

NOTE: This is a facade for backward compatibility.
The actual implementation has been moved to antigravity.core.knowledge package.
"""

from antigravity.core.knowledge import (
    CodeEntity,
    EntityExtractor,
    EntityType,
    KnowledgeGraph,
    Relationship,
    RelationType,
    SearchEngine,
    SearchResult,
    get_dependencies,
    get_knowledge_graph,
    index_codebase,
    search_code,
)

__all__ = [
    "KnowledgeGraph",
    "CodeEntity",
    "Relationship",
    "SearchResult",
    "EntityType",
    "RelationType",
    "get_knowledge_graph",
    "index_codebase",
    "search_code",
    "get_dependencies",
]
