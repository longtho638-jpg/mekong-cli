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
    def __init__(self, host: str = "localhost", port: int = 6379):
        self.driver = FalkorDB(host=host, port=port)
        self.graph = self.driver.select_graph("agencyos")

    def add_node(self, node: KnowledgeNode):
        """Add a node to the graph."""
        query = f"""
        MERGE (n:{node.label} {{name: '{node.name}'}})
        SET n += $props
        """
        self.graph.query(query, {"props": node.properties})

    def add_edge(self, edge: KnowledgeEdge):
        """Add an edge between two nodes."""
        query = f"""
        MATCH (a {{name: '{edge.source_name}'}}), (b {{name: '{edge.target_name}'}})
        MERGE (a)-[r:{edge.relation}]->(b)
        SET r += $props
        """
        self.graph.query(query, {"props": edge.properties})

    def query(self, cypher_query: str, params: Optional[Dict[str, Any]] = None):
        """Execute a raw Cypher query."""
        return self.graph.query(cypher_query, params or {})

    def get_context(self, concept_name: str) -> List[Dict[str, Any]]:
        """Retrieve related context for a concept."""
        query = f"""
        MATCH (n {{name: '{concept_name}'}})-[r]-(m)
        RETURN n, r, m
        LIMIT 20
        """
        result = self.graph.query(query)
        # Simplified result parsing would go here
        return result.result_set
