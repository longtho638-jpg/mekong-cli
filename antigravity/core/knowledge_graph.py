"""
🕸️ Knowledge Graph - Codebase Intelligence
============================================

Cross-referencing all code entities for smart search and discovery.
Creates a rich semantic graph of the codebase.

Binh Pháp: "Tri thiên tri địa" - Know the terrain, know the conditions
"""

import ast
import hashlib
import logging
import os
import re
import threading
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Set

logger = logging.getLogger(__name__)


class EntityType(Enum):
    """Types of code entities."""

    MODULE = "module"
    CLASS = "class"
    FUNCTION = "function"
    METHOD = "method"
    VARIABLE = "variable"
    CONSTANT = "constant"
    IMPORT = "import"
    DECORATOR = "decorator"


class RelationType(Enum):
    """Types of relationships between entities."""

    IMPORTS = "imports"
    DEFINES = "defines"
    CALLS = "calls"
    INHERITS = "inherits"
    IMPLEMENTS = "implements"
    USES = "uses"
    DEPENDS_ON = "depends_on"
    DECORATES = "decorates"


@dataclass
class CodeEntity:
    """A code entity in the knowledge graph."""

    id: str
    name: str
    type: EntityType
    file_path: str
    line_number: int
    docstring: Optional[str] = None
    signature: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: float = field(default_factory=time.time)


@dataclass
class Relationship:
    """Relationship between entities."""

    source_id: str
    target_id: str
    type: RelationType
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class SearchResult:
    """Search result with relevance."""

    entity: CodeEntity
    relevance: float
    matches: List[str]
    context: str


class KnowledgeGraph:
    """
    🕸️ Codebase Knowledge Graph

    Features:
    - Entity extraction from code
    - Relationship mapping
    - Smart semantic search
    - Dependency analysis
    """

    def __init__(self, root_path: str = None):
        self.root_path = root_path or os.getcwd()

        self.entities: Dict[str, CodeEntity] = {}
        self.relationships: List[Relationship] = []

        self._lock = threading.Lock()
        self._file_cache: Dict[str, float] = {}  # file -> mtime
        self._index: Dict[str, Set[str]] = {}  # keyword -> entity ids

        logger.info(f"🕸️ KnowledgeGraph initialized for {self.root_path}")

    def index_file(self, file_path: str) -> List[CodeEntity]:
        """Index a Python file and extract entities."""
        if not file_path.endswith(".py"):
            return []

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            tree = ast.parse(content, filename=file_path)
            entities = self._extract_entities(tree, file_path, content)

            with self._lock:
                for entity in entities:
                    self.entities[entity.id] = entity
                    self._index_entity(entity)

                # Track file modification time
                self._file_cache[file_path] = os.path.getmtime(file_path)

            logger.debug(f"📄 Indexed {file_path}: {len(entities)} entities")
            return entities

        except Exception as e:
            logger.error(f"Failed to index {file_path}: {e}")
            return []

    def _extract_entities(
        self, tree: ast.AST, file_path: str, content: str
    ) -> List[CodeEntity]:
        """Extract entities from AST."""
        entities = []

        # Get file-level docstring
        module_doc = ast.get_docstring(tree)

        # Create module entity
        module_name = os.path.basename(file_path).replace(".py", "")
        module_entity = CodeEntity(
            id=self._make_id(file_path, module_name, "module"),
            name=module_name,
            type=EntityType.MODULE,
            file_path=file_path,
            line_number=1,
            docstring=module_doc,
        )
        entities.append(module_entity)

        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef):
                entity = CodeEntity(
                    id=self._make_id(file_path, node.name, "class"),
                    name=node.name,
                    type=EntityType.CLASS,
                    file_path=file_path,
                    line_number=node.lineno,
                    docstring=ast.get_docstring(node),
                    metadata={
                        "bases": [self._get_name(b) for b in node.bases],
                        "decorators": [self._get_name(d) for d in node.decorator_list],
                    },
                )
                entities.append(entity)

                # Add relationship: module defines class
                self.relationships.append(
                    Relationship(
                        source_id=module_entity.id,
                        target_id=entity.id,
                        type=RelationType.DEFINES,
                    )
                )

            elif isinstance(node, ast.FunctionDef) or isinstance(
                node, ast.AsyncFunctionDef
            ):
                # Check if it's a method
                parent = self._find_parent_class(tree, node)
                entity_type = EntityType.METHOD if parent else EntityType.FUNCTION

                entity = CodeEntity(
                    id=self._make_id(file_path, node.name, entity_type.value),
                    name=node.name,
                    type=entity_type,
                    file_path=file_path,
                    line_number=node.lineno,
                    docstring=ast.get_docstring(node),
                    signature=self._get_function_signature(node),
                    metadata={
                        "decorators": [self._get_name(d) for d in node.decorator_list],
                        "is_async": isinstance(node, ast.AsyncFunctionDef),
                    },
                )
                entities.append(entity)

            elif isinstance(node, ast.Import):
                for alias in node.names:
                    entity = CodeEntity(
                        id=self._make_id(file_path, alias.name, "import"),
                        name=alias.name,
                        type=EntityType.IMPORT,
                        file_path=file_path,
                        line_number=node.lineno,
                        metadata={"alias": alias.asname},
                    )
                    entities.append(entity)

            elif isinstance(node, ast.ImportFrom):
                for alias in node.names:
                    full_name = (
                        f"{node.module}.{alias.name}" if node.module else alias.name
                    )
                    entity = CodeEntity(
                        id=self._make_id(file_path, full_name, "import"),
                        name=full_name,
                        type=EntityType.IMPORT,
                        file_path=file_path,
                        line_number=node.lineno,
                        metadata={"from": node.module, "alias": alias.asname},
                    )
                    entities.append(entity)

        return entities

    def _make_id(self, file_path: str, name: str, entity_type: str) -> str:
        """Create unique entity ID."""
        key = f"{file_path}:{name}:{entity_type}"
        return hashlib.md5(key.encode()).hexdigest()[:12]

    def _get_name(self, node: ast.AST) -> str:
        """Get name from AST node."""
        if isinstance(node, ast.Name):
            return node.id
        elif isinstance(node, ast.Attribute):
            return f"{self._get_name(node.value)}.{node.attr}"
        elif isinstance(node, ast.Call):
            return self._get_name(node.func)
        return str(node)

    def _get_function_signature(self, node: ast.FunctionDef) -> str:
        """Get function signature."""
        args = []
        for arg in node.args.args:
            args.append(arg.arg)
        return f"({', '.join(args)})"

    def _find_parent_class(
        self, tree: ast.AST, target: ast.AST
    ) -> Optional[ast.ClassDef]:
        """Find parent class of a node."""
        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef):
                for child in ast.walk(node):
                    if child is target:
                        return node
        return None

    def _index_entity(self, entity: CodeEntity):
        """Add entity to keyword index."""
        keywords = set()

        # Add name words
        words = re.findall(r"[A-Z][a-z]+|[a-z]+", entity.name)
        keywords.update(w.lower() for w in words)

        # Add docstring words
        if entity.docstring:
            words = re.findall(r"\w+", entity.docstring.lower())
            keywords.update(words[:50])  # Limit

        for keyword in keywords:
            if keyword not in self._index:
                self._index[keyword] = set()
            self._index[keyword].add(entity.id)

    def index_directory(self, path: str = None, recursive: bool = True) -> int:
        """Index all Python files in directory."""
        path = path or self.root_path
        count = 0

        if recursive:
            for root, dirs, files in os.walk(path):
                # Skip common non-code directories
                dirs[:] = [
                    d
                    for d in dirs
                    if d not in {"__pycache__", ".git", ".venv", "node_modules", "venv"}
                ]

                for file in files:
                    if file.endswith(".py"):
                        file_path = os.path.join(root, file)
                        entities = self.index_file(file_path)
                        count += len(entities)
        else:
            for file in os.listdir(path):
                if file.endswith(".py"):
                    file_path = os.path.join(path, file)
                    entities = self.index_file(file_path)
                    count += len(entities)

        logger.info(f"🕸️ Indexed {count} entities from {path}")
        return count

    def search(self, query: str, limit: int = 10) -> List[SearchResult]:
        """Search for entities by query."""
        query_words = set(query.lower().split())
        results = []

        # Find matching entities
        candidate_ids: Set[str] = set()
        for word in query_words:
            if word in self._index:
                candidate_ids.update(self._index[word])

        for entity_id in candidate_ids:
            entity = self.entities.get(entity_id)
            if not entity:
                continue

            # Calculate relevance
            matches = []
            relevance = 0.0

            # Name match (highest weight)
            name_lower = entity.name.lower()
            for word in query_words:
                if word in name_lower:
                    relevance += 0.5
                    matches.append(f"name contains '{word}'")

            # Docstring match
            if entity.docstring:
                doc_lower = entity.docstring.lower()
                for word in query_words:
                    if word in doc_lower:
                        relevance += 0.2
                        matches.append(f"docstring contains '{word}'")

            if relevance > 0:
                results.append(
                    SearchResult(
                        entity=entity,
                        relevance=relevance,
                        matches=matches,
                        context=entity.docstring[:100] if entity.docstring else "",
                    )
                )

        # Sort by relevance
        results.sort(key=lambda r: r.relevance, reverse=True)
        return results[:limit]

    def get_entity(self, entity_id: str) -> Optional[CodeEntity]:
        """Get entity by ID."""
        return self.entities.get(entity_id)

    def get_relationships(self, entity_id: str) -> List[Relationship]:
        """Get relationships for an entity."""
        return [
            r
            for r in self.relationships
            if r.source_id == entity_id or r.target_id == entity_id
        ]

    def get_dependencies(self, file_path: str) -> List[str]:
        """Get dependencies of a file."""
        imports = [
            e
            for e in self.entities.values()
            if e.file_path == file_path and e.type == EntityType.IMPORT
        ]
        return [i.name for i in imports]

    def get_stats(self) -> Dict[str, Any]:
        """Get graph statistics."""
        type_counts = {}
        for entity in self.entities.values():
            type_name = entity.type.value
            type_counts[type_name] = type_counts.get(type_name, 0) + 1

        return {
            "total_entities": len(self.entities),
            "total_relationships": len(self.relationships),
            "indexed_files": len(self._file_cache),
            "entities_by_type": type_counts,
            "index_keywords": len(self._index),
        }


# Global instance
_graph: Optional[KnowledgeGraph] = None


def get_knowledge_graph(root_path: str = None) -> KnowledgeGraph:
    """Get global knowledge graph instance."""
    global _graph
    if _graph is None:
        _graph = KnowledgeGraph(root_path)
    return _graph


# Convenience functions
def index_codebase(path: str = None) -> int:
    """Index entire codebase."""
    return get_knowledge_graph().index_directory(path)


def search_code(query: str, limit: int = 10) -> List[SearchResult]:
    """Search the codebase."""
    return get_knowledge_graph().search(query, limit)


def get_dependencies(file_path: str) -> List[str]:
    """Get file dependencies."""
    return get_knowledge_graph().get_dependencies(file_path)


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
