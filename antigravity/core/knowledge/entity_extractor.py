"""
Entity Extractor - AST-based Code Analysis
===========================================

Extracts code entities (functions, classes, imports) using AST parsing.
"""

import ast
import logging
from pathlib import Path
from typing import Dict, List

from .ast_rules import find_parent_class, get_function_signature, get_node_name, make_entity_id
from .types import CodeEntity, EntityType, Relationship, RelationType

logger = logging.getLogger(__name__)


class EntityExtractor:
    """Extract code entities using AST parsing."""

    def __init__(self):
        """Initialize entity extractor."""
        logger.debug("EntityExtractor initialized")

    def extract_from_file(self, file_path: Path) -> Dict[str, List]:
        """Extract entities from a Python file."""
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
        """Extract entities and relationships from AST."""
        entities = []
        relationships = []

        # Create module entity
        module_doc = ast.get_docstring(tree)
        module_name = Path(file_path).stem
        module_entity = CodeEntity(
            id=make_entity_id(file_path, module_name, "module"),
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
            id=make_entity_id(file_path, node.name, "class"),
            name=node.name,
            type=EntityType.CLASS,
            file_path=file_path,
            line_number=node.lineno,
            docstring=ast.get_docstring(node),
            metadata={
                "bases": [get_node_name(b) for b in node.bases],
                "decorators": [get_node_name(d) for d in node.decorator_list],
            },
        )

    def _extract_function(
        self, node: ast.FunctionDef, file_path: str, tree: ast.AST
    ) -> CodeEntity:
        """Extract function/method entity."""
        parent_class = find_parent_class(tree, node)
        entity_type = EntityType.METHOD if parent_class else EntityType.FUNCTION

        return CodeEntity(
            id=make_entity_id(file_path, node.name, entity_type.value),
            name=node.name,
            type=entity_type,
            file_path=file_path,
            line_number=node.lineno,
            docstring=ast.get_docstring(node),
            signature=get_function_signature(node),
            metadata={
                "decorators": [get_node_name(d) for d in node.decorator_list],
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
                        id=make_entity_id(file_path, alias.name, "import"),
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
                        id=make_entity_id(file_path, full_name, "import"),
                        name=full_name,
                        type=EntityType.IMPORT,
                        file_path=file_path,
                        line_number=node.lineno,
                        metadata={"from": node.module, "alias": alias.asname},
                    )
                )

        return imports


__all__ = ["EntityExtractor"]
