"""
Knowledge Models: Pydantic definitions for Graph Nodes and Edges.
"""
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, TypedDict

from pydantic import BaseModel, Field


class NodeDict(TypedDict, total=False):
    """Dictionary representation of a knowledge node"""
    id: str
    name: str
    type: str
    content: str
    created_at: str
    updated_at: str


class EdgeDict(TypedDict, total=False):
    """Dictionary representation of a knowledge edge"""
    source: str
    target: str
    weight: float


class NodeType(str, Enum):
    FILE = "File"
    CLASS = "Class"
    FUNCTION = "Function"
    MODULE = "Module"
    DOCUMENT = "Document"
    CONCEPT = "Concept"

class EdgeType(str, Enum):
    IMPORTS = "IMPORTS"
    DEFINES = "DEFINES"
    CALLS = "CALLS"
    INHERITS = "INHERITS"
    DOCUMENTS = "DOCUMENTS"
    RELATES_TO = "RELATES_TO"

class KnowledgeNode(BaseModel):
    """Represents a node in the Knowledge Graph"""
    id: str = Field(..., description="Unique identifier (e.g., file path or signature)")
    type: NodeType
    name: str
    content: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    embedding: Optional[List[float]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    def to_dict(self) -> NodeDict:
        """Convert to dictionary for batch ingestion"""
        result: NodeDict = {
            "id": self.id,
            "name": self.name,
            "type": self.type.value,
            "content": self.content or "",
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
        if self.metadata:
            result.update(self.metadata)  # type: ignore
        return result

class KnowledgeEdge(BaseModel):
    """Represents a relationship between nodes"""
    source_id: str
    target_id: str
    type: EdgeType
    weight: float = 1.0
    metadata: Dict[str, Any] = Field(default_factory=dict)

    def to_dict(self) -> EdgeDict:
        """Convert to dictionary for batch ingestion"""
        result: EdgeDict = {
            "source": self.source_id,
            "target": self.target_id,
            "weight": self.weight,
        }
        if self.metadata:
            result.update(self.metadata)  # type: ignore
        return result
