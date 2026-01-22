"""
Knowledge Models: Pydantic definitions for Graph Nodes and Edges.
"""
from typing import Dict, Any, Optional, List
from enum import Enum
from pydantic import BaseModel, Field
from datetime import datetime

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

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for batch ingestion"""
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type.value,
            "content": self.content or "",
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            **self.metadata
        }

class KnowledgeEdge(BaseModel):
    """Represents a relationship between nodes"""
    source_id: str
    target_id: str
    type: EdgeType
    weight: float = 1.0
    metadata: Dict[str, Any] = Field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for batch ingestion"""
        return {
            "source": self.source_id,
            "target": self.target_id,
            "weight": self.weight,
            **self.metadata
        }
