import os
import re
from typing import Any, Dict, List, Optional
from dataclasses import dataclass, field
import json
from falkordb import FalkorDB

@dataclass
class KnowledgeNode:
    """Represents a node in the Knowledge Graph."""
    label: str  # e.g., 'File', 'Function', 'Concept'
    name: str   # Unique identifier or name
    properties: Dict[str, Any] = field(default_factory=dict)

    def to_cypher_create(self) -> str:
        """Generate Cypher CREATE statement part."""
        props = json.dumps(self.properties).replace('"', "'") # Simple escaping for demo
        return f"(:{self.label} {{name: '{self.name}', properties: '{props}'}})"

@dataclass
class KnowledgeEdge:
    """Represents a relationship between nodes."""
    source_name: str
    target_name: str
    relation: str # e.g., 'DEPENDS_ON', 'DEFINES'
    properties: Dict[str, Any] = field(default_factory=dict)

class GraphClient:
    """
    Client for interacting with the Knowledge Graph (FalkorDB).
    """
    def __init__(self, host: Optional[str] = None, port: Optional[int] = None):
        self.host = host or os.getenv("GRAPH_HOST", "localhost")
        self.port = port if port is not None else int(os.getenv("GRAPH_PORT", "6379"))
        try:
            self.driver = FalkorDB(host=self.host, port=self.port)
            self.graph = self.driver.select_graph("agencyos")
        except Exception as e:
            print(f"⚠️ Warning: Could not connect to Knowledge Graph at {self.host}:{self.port}: {e}")
            self.driver = None
            self.graph = None

    def _sanitize_identifier(self, identifier: str) -> str:
        """Sanitize Cypher identifiers (labels, relationship types)."""
        if not re.match(r"^[a-zA-Z0-9_]+$", identifier):
            raise ValueError(f"Invalid identifier: {identifier}")
        return identifier

    def add_node(self, node: KnowledgeNode):
        """Add a node to the graph."""
        if not self.graph:
            return
        label = self._sanitize_identifier(node.label)
        query = f"""
        MERGE (n:{label} {{name: $name}})
        SET n += $props
        """
        self.graph.query(query, {"name": node.name, "props": node.properties})

    def add_edge(self, edge: KnowledgeEdge):
        """Add an edge between two nodes."""
        if not self.graph:
            return
        relation = self._sanitize_identifier(edge.relation)
        query = f"""
        MATCH (a), (b)
        WHERE a.name = $source AND b.name = $target
        MERGE (a)-[r:{relation}]->(b)
        SET r += $props
        """
        self.graph.query(query, {
            "source": edge.source_name,
            "target": edge.target_name,
            "props": edge.properties
        })

    def query(self, cypher_query: str, params: Optional[Dict[str, Any]] = None):
        """Execute a raw Cypher query."""
        if not self.graph:
            return None
        return self.graph.query(cypher_query, params or {})

    def get_context(self, concept_name: str) -> List[Dict[str, Any]]:
        """Retrieve related context for a concept."""
        if not self.graph:
            return []
        query = f"""
        MATCH (n {{name: $name}})-[r]-(m)
        RETURN n, r, m
        LIMIT 20
        """
        result = self.graph.query(query, {"name": concept_name})
        # Simplified result parsing would go here
        return result.result_set
