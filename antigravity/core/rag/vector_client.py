import logging
import os
from typing import Any, Dict, List, Optional

import chromadb
from chromadb.config import Settings
from typing_extensions import TypedDict

logger = logging.getLogger(__name__)


class VectorQueryResponse(TypedDict):
    """Response from a vector store query"""
    ids: List[List[str]]
    distances: Optional[List[List[float]]]
    metadatas: Optional[List[List[Dict[str, Any]]]]
    documents: Optional[List[List[str]]]
    uris: Optional[List[List[str]]]
    data: Optional[List[List[Any]]]


class VectorClient:
    """
    Client for interacting with ChromaDB.
    """
    def __init__(self, host: str = "localhost", port: int = 8001):
        try:
            self.client = chromadb.HttpClient(host=host, port=port)
            self.collection = self.client.get_or_create_collection(name="agencyos_knowledge")
        except Exception as e:
            logger.warning(f"Failed to connect to ChromaDB: {e}. RAG features may be disabled.")
            self.client = None
            self.collection = None

    def add_documents(self, documents: List[str], metadatas: List[Dict[str, Any]], ids: List[str], embeddings: Optional[List[List[float]]] = None):
        """Add documents to the vector store."""
        if not self.collection:
            return

        self.collection.add(
            documents=documents,
            metadatas=metadatas,
            ids=ids,
            embeddings=embeddings
        )

    def query(self, query_texts: List[str], n_results: int = 5) -> VectorQueryResponse:
        """Query the vector store."""
        if not self.collection:
            return {"ids": [], "distances": [], "metadatas": [], "documents": []}  # type: ignore

        return self.collection.query(  # type: ignore
            query_texts=query_texts,
            n_results=n_results
        )

    def count(self) -> int:
        if not self.collection:
            return 0
        return self.collection.count()
