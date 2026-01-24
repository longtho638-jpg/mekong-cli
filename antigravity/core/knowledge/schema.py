from typing import Any, Dict, List

from .graph_client import KnowledgeEdge, KnowledgeNode


class IngestionSchema:
    """
    Defines the schema for ingesting code and documents.
    """

    @staticmethod
    def file_node(path: str, file_type: str) -> KnowledgeNode:
        return KnowledgeNode(
            label="File",
            name=path,
            properties={"type": file_type, "path": path}
        )

    @staticmethod
    def function_node(name: str, file_path: str, signature: str) -> KnowledgeNode:
        return KnowledgeNode(
            label="Function",
            name=f"{file_path}::{name}",
            properties={"signature": signature, "file": file_path}
        )

    @staticmethod
    def dependency_edge(source: str, target: str) -> KnowledgeEdge:
        return KnowledgeEdge(
            source_name=source,
            target_name=target,
            relation="DEPENDS_ON"
        )

    @staticmethod
    def defines_edge(source: str, target: str) -> KnowledgeEdge:
        return KnowledgeEdge(
            source_name=source,
            target_name=target,
            relation="DEFINES"
        )
