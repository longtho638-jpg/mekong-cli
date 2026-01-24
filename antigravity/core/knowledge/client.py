"""
GraphClient: Singleton manager for FalkorDB connections.
"""
import os
from typing import Any, Dict, List, Optional

from falkordb import FalkorDB
from loguru import logger


class GraphClient:
    _instance: Optional['GraphClient'] = None
    _driver: Optional[FalkorDB] = None
    _graph: Any = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(GraphClient, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if self._driver is None:
            self._host = os.getenv("FALKORDB_HOST", "localhost")
            self._port = int(os.getenv("FALKORDB_PORT", 6379))
            self._graph_name = os.getenv("FALKORDB_GRAPH", "agency_knowledge")
            self.connect()

    def connect(self) -> None:
        """Establish connection to FalkorDB"""
        try:
            self._driver = FalkorDB(
                host=self._host,
                port=self._port
            )
            self._graph = self._driver.select_graph(self._graph_name)
            logger.info(f"Connected to Knowledge Graph: {self._graph_name} @ {self._host}:{self._port}")
        except Exception as e:
            logger.error(f"Failed to connect to Knowledge Graph: {str(e)}")
            # Don't raise in init to allow fallback/mocking in tests
            self._driver = None
            self._graph = None

    def query(self, query: str, params: Optional[Dict[str, Any]] = None) -> List[Any]:
        """Execute Cypher query"""
        if not self._graph:
            logger.warning("Graph client not connected, skipping query")
            return []

        try:
            result = self._graph.query(query, params)
            return result.result_set
        except Exception as e:
            logger.error(f"Query execution failed: {str(e)}")
            return []

    def close(self) -> None:
        """Close connection"""
        if self._driver:
            # FalkorDB driver doesn't have a direct close() in some versions,
            # but it's good practice to clear references
            self._driver = None
            self._graph = None
            logger.info("Knowledge Graph connection closed")

# Global instance
graph_client = GraphClient()
