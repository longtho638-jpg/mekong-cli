"""
Ingestion Engine: Parses code and documentation to populate the Knowledge Graph.
Uses AST for Python parsing.
"""
import ast
import os
from pathlib import Path
from typing import Any, Dict, List

from loguru import logger

from .client import graph_client
from .models import EdgeType, KnowledgeEdge, KnowledgeNode, NodeType


class CodeIngestor:
    def __init__(self, root_dir: str = "."):
        self.root_dir = Path(root_dir)
        self.nodes: List[KnowledgeNode] = []
        self.edges: List[KnowledgeEdge] = []

    def scan_codebase(self) -> None:
        """Scan all Python files in the repository"""
        for py_file in self.root_dir.rglob("*.py"):
            if "node_modules" in str(py_file) or ".venv" in str(py_file):
                continue
            self.parse_file(py_file)

    def parse_file(self, file_path: Path) -> None:
        """Parse a single Python file using AST"""
        try:
            content = file_path.read_text(encoding="utf-8")
            tree = ast.parse(content)

            # Create File Node
            rel_path = str(file_path.relative_to(self.root_dir))
            file_node = KnowledgeNode(
                id=rel_path,
                type=NodeType.FILE,
                name=file_path.name,
                content=content
            )
            self.nodes.append(file_node)

            # Traverse AST
            for node in ast.walk(tree):
                if isinstance(node, ast.ClassDef):
                    self._handle_class(node, rel_path)
                elif isinstance(node, ast.FunctionDef):
                    self._handle_function(node, rel_path)
                elif isinstance(node, ast.Import) or isinstance(node, ast.ImportFrom):
                    self._handle_import(node, rel_path)

        except Exception as e:
            logger.warning(f"Failed to parse {file_path}: {e}")

    def _handle_class(self, node: ast.ClassDef, file_id: str) -> None:
        """Create Class Node and Edge from File"""
        class_id = f"{file_id}::{node.name}"
        class_node = KnowledgeNode(
            id=class_id,
            type=NodeType.CLASS,
            name=node.name,
            metadata={"lineno": node.lineno}
        )
        self.nodes.append(class_node)

        # Edge: File DEFINES Class
        self.edges.append(KnowledgeEdge(
            source_id=file_id,
            target_id=class_id,
            type=EdgeType.DEFINES
        ))

    def _handle_function(self, node: ast.FunctionDef, file_id: str) -> None:
        """Create Function Node and Edge from File/Class"""
        func_id = f"{file_id}::{node.name}"
        func_node = KnowledgeNode(
            id=func_id,
            type=NodeType.FUNCTION,
            name=node.name,
            metadata={"lineno": node.lineno}
        )
        self.nodes.append(func_node)

        # Edge: File DEFINES Function
        self.edges.append(KnowledgeEdge(
            source_id=file_id,
            target_id=func_id,
            type=EdgeType.DEFINES
        ))

    def _handle_import(self, node: Any, file_id: str) -> None:
        """Create Edge for Imports"""
        # Simplification: linking to Module nodes (which might not exist yet)
        pass

    def sync_to_graph(self) -> None:
        """Push collected nodes and edges to FalkorDB using batch operations"""
        if not graph_client._graph:
            logger.warning("Graph client not connected. Skipping sync.")
            return

        logger.info(f"Syncing {len(self.nodes)} nodes and {len(self.edges)} edges to Knowledge Graph...")

        try:
            # 1. Batch Create Nodes using UNWIND
            # Convert nodes to list of dicts
            nodes_data = [node.to_dict() for node in self.nodes]

            # Use chunks to avoid memory issues with massive queries
            chunk_size = 1000
            for i in range(0, len(nodes_data), chunk_size):
                chunk = nodes_data[i:i + chunk_size]
                query = """
                UNWIND $nodes AS node
                MERGE (n:KnowledgeNode {id: node.id})
                SET n += node
                """
                graph_client.query(query, params={"nodes": chunk})

            # 2. Batch Create Edges using UNWIND
            # Group edges by type to optimize locking
            edges_by_type: Dict[str, List[Dict[str, Any]]] = {}
            for edge in self.edges:
                edge_type = edge.type.value
                if edge_type not in edges_by_type:
                    edges_by_type[edge_type] = []
                edges_by_type[edge_type].append(edge.to_dict())

            for edge_type, edges_data in edges_by_type.items():
                for i in range(0, len(edges_data), chunk_size):
                    chunk = edges_data[i:i + chunk_size]
                    # Dynamic relationship type requires f-string as parameterized types aren't supported in all Cypher versions
                    # But we trust the Enum value
                    query = f"""
                    UNWIND $edges AS edge
                    MATCH (s {{id: edge.source}}), (t {{id: edge.target}})
                    MERGE (s)-[r:{edge_type}]->(t)
                    SET r += edge
                    """
                    graph_client.query(query, params={"edges": chunk})

            logger.info("Sync complete.")

        except Exception as e:
            logger.error(f"Failed to sync graph: {e}")

if __name__ == "__main__":
    # Test execution
    ingestor = CodeIngestor()
    ingestor.scan_codebase()
    # ingestor.sync_to_graph() # Uncomment when DB is running
