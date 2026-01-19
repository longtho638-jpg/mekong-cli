"""
Knowledge Graph Types - Data Structures
========================================

Common data types for the knowledge graph system.
"""

import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, Optional


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


__all__ = ["EntityType", "RelationType", "CodeEntity", "Relationship"]
