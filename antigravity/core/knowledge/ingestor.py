import logging
import os
import ast
from pathlib import Path
from typing import List
from .graph_client import GraphClient
from .schema import IngestionSchema

logger = logging.getLogger(__name__)

class CodeIngestor:
    """
    Parses Python code and ingests structure into the Knowledge Graph.
    """
    def __init__(self, client: GraphClient, root_dir: str):
        self.client = client
        self.root_dir = Path(root_dir)

    def ingest_directory(self):
        """Walk directory and ingest all python files."""
        logger.info(f"🧠 Ingesting code from {self.root_dir}...")
        for root, _, files in os.walk(self.root_dir):
            for file in files:
                if file.endswith(".py"):
                    file_path = Path(root) / file
                    self._ingest_file(file_path)

    def _ingest_file(self, file_path: Path):
        """Parse a single python file."""
        rel_path = file_path.relative_to(self.root_dir)
        file_node = IngestionSchema.file_node(str(rel_path), "python")
        self.client.add_node(file_node)

        try:
            content = file_path.read_text()
            tree = ast.parse(content)

            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef):
                    self._ingest_function(node, str(rel_path))
                # Can expand to classes, imports, etc.

        except Exception as e:
            logger.error(f"❌ Error parsing {rel_path}: {e}")

    def _ingest_function(self, node: ast.FunctionDef, file_path: str):
        """Ingest a function definition."""
        func_node = IngestionSchema.function_node(
            name=node.name,
            file_path=file_path,
            signature=self._get_signature(node)
        )
        self.client.add_node(func_node)

        # Link function to file
        edge = IngestionSchema.defines_edge(file_path, func_node.name)
        self.client.add_edge(edge)

    def _get_signature(self, node: ast.FunctionDef) -> str:
        args = [arg.arg for arg in node.args.args]
        return f"{node.name}({', '.join(args)})"
