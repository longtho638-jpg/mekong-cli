"""
Entity Extractor - AST-based Code Analysis
===========================================

Extracts code entities using AST parsing:
- Functions and methods
- Classes and inheritance
- Imports and dependencies
- Docstrings and signatures
"""

import ast
import hashlib
import logging
from pathlib import Path
from typing import Dict, List, Optional

from .types import CodeEntity, EntityType, Relationship, RelationType

logger = logging.getLogger(__name__)


class EntityExtractor:
    """Extract code entities using AST parsing."""

    def __init__(self):
        """Initialize entity extractor."""
        logger.debug("EntityExtractor initialized")

    def extract_from_file(self, file_path: Path) -> Dict[str, List]:
        """
        Extract entities from a Python file.

        Args:
            file_path: Path to Python file

        Returns:
            Dictionary with 'entities' and 'relationships' lists
        """
        if not str(file_path).endswith(".py"):
            return {"entities": [], "relationships": []}

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            tree = ast.parse(content, filename=str(file_path))
            entities, relationships = self._extract_from_ast(tree, str(file_path))

            logger.debug(f"Extracted {len(entities)} entities from {file_path}")
            return {"entities": entities, "relationships": relationships}

        except Exception as e:
            logger.error(f"Failed to extract from {file_path}: {e}")
            return {"entities": [], "relationships": []}

    def _extract_from_ast(
        self, tree: ast.AST, file_path: str
    ) -> tuple[List[CodeEntity], List[Relationship]]:
        """
        Extract entities and relationships from AST.

        Args:
            tree: AST tree
            file_path: Source file path

        Returns:
            Tuple of (entities, relationships)
        """
        entities = []
        relationships = []

        # Create module entity
        module_doc = ast.get_docstring(tree)
        module_name = Path(file_path).stem
        module_entity = CodeEntity(
            id=self._make_id(file_path, module_name, "module"),
            name=module_name,
            type=EntityType.MODULE,
            file_path=file_path,
            line_number=1,
            docstring=module_doc,
        )
        entities.append(module_entity)

        # Extract classes and functions
        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef):
                entity = self._extract_class(node, file_path)
                entities.append(entity)

                # Add relationship: module defines class
                relationships.append(
                    Relationship(
                        source_id=module_entity.id,
                        target_id=entity.id,
                        type=RelationType.DEFINES,
                    )
                )

            elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                entity = self._extract_function(node, file_path, tree)
                entities.append(entity)

            elif isinstance(node, (ast.Import, ast.ImportFrom)):
                import_entities = self._extract_imports(node, file_path)
                entities.extend(import_entities)

        return entities, relationships

    def _extract_class(self, node: ast.ClassDef, file_path: str) -> CodeEntity:
        """Extract class entity."""
        return CodeEntity(
            id=self._make_id(file_path, node.name, "class"),
            name=node.name,
            type=EntityType.CLASS,
            file_path=file_path,
            line_number=node.lineno,
            docstring=ast.get_docstring(node),
            metadata={
                "bases": [self._get_node_name(b) for b in node.bases],
                "decorators": [self._get_node_name(d) for d in node.decorator_list],
            },
        )

    def _extract_function(
        self, node: ast.FunctionDef, file_path: str, tree: ast.AST
    ) -> CodeEntity:
        """Extract function/method entity."""
        # Determine if it's a method by checking parent
        parent_class = self._find_parent_class(tree, node)
        entity_type = EntityType.METHOD if parent_class else EntityType.FUNCTION

        return CodeEntity(
            id=self._make_id(file_path, node.name, entity_type.value),
            name=node.name,
            type=entity_type,
            file_path=file_path,
            line_number=node.lineno,
            docstring=ast.get_docstring(node),
            signature=self._get_function_signature(node),
            metadata={
                "decorators": [self._get_node_name(d) for d in node.decorator_list],
                "is_async": isinstance(node, ast.AsyncFunctionDef),
            },
        )

    def _extract_imports(self, node: ast.AST, file_path: str) -> List[CodeEntity]:
        """Extract import entities."""
        imports = []

        if isinstance(node, ast.Import):
            for alias in node.names:
                imports.append(
                    CodeEntity(
                        id=self._make_id(file_path, alias.name, "import"),
                        name=alias.name,
                        type=EntityType.IMPORT,
                        file_path=file_path,
                        line_number=node.lineno,
                        metadata={"alias": alias.asname},
                    )
                )

        elif isinstance(node, ast.ImportFrom):
            for alias in node.names:
                full_name = f"{node.module}.{alias.name}" if node.module else alias.name
                imports.append(
                    CodeEntity(
                        id=self._make_id(file_path, full_name, "import"),
                        name=full_name,
                        type=EntityType.IMPORT,
                        file_path=file_path,
                        line_number=node.lineno,
                        metadata={"from": node.module, "alias": alias.asname},
                    )
                )

        return imports

    def _make_id(self, file_path: str, name: str, entity_type: str) -> str:
        """Create unique entity ID using hash."""
        key = f"{file_path}:{name}:{entity_type}"
        return hashlib.md5(key.encode()).hexdigest()[:12]

    def _get_node_name(self, node: ast.AST) -> str:
        """Get name from AST node."""
        if isinstance(node, ast.Name):
            return node.id
        elif isinstance(node, ast.Attribute):
            return f"{self._get_node_name(node.value)}.{node.attr}"
        elif isinstance(node, ast.Call):
            return self._get_node_name(node.func)
        return str(node)

    def _get_function_signature(self, node: ast.FunctionDef) -> str:
        """Get function signature as string."""
        args = [arg.arg for arg in node.args.args]
        return f"({', '.join(args)})"

    def _find_parent_class(self, tree: ast.AST, target: ast.AST) -> Optional[ast.ClassDef]:
        """Find parent class of a node."""
        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef):
                for child in ast.walk(node):
                    if child is target:
                        return node
        return None


__all__ = ["EntityExtractor"]
