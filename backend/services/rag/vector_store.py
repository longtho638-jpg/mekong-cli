from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional


class VectorStore(ABC):
    """Abstract base class for Vector Store."""

    @abstractmethod
    async def add_documents(
        self, documents: List[str], metadatas: List[Dict[str, Any]], embeddings: List[List[float]]
    ) -> None:
        """Add documents and their embeddings to the store."""
        pass

    @abstractmethod
    async def search(self, query_embedding: List[float], limit: int = 5) -> List[Dict[str, Any]]:
        """Search for similar documents by embedding."""
        pass


class InMemoryVectorStore(VectorStore):
    """
    Simple In-Memory Vector Store for testing/dev.
    Uses cosine similarity.
    """

    def __init__(self):
        self.documents = []
        self.metadatas = []
        self.embeddings = []

    async def add_documents(
        self, documents: List[str], metadatas: List[Dict[str, Any]], embeddings: List[List[float]]
    ) -> None:
        self.documents.extend(documents)
        self.metadatas.extend(metadatas)
        self.embeddings.extend(embeddings)

    async def search(self, query_embedding: List[float], limit: int = 5) -> List[Dict[str, Any]]:
        if not self.embeddings:
            return []

        import numpy as np

        query_vec = np.array(query_embedding)
        doc_vecs = np.array(self.embeddings)

        # Cosine similarity: (A . B) / (||A|| * ||B||)
        norm_query = np.linalg.norm(query_vec)
        norm_docs = np.linalg.norm(doc_vecs, axis=1)

        dot_products = np.dot(doc_vecs, query_vec)
        similarities = dot_products / (norm_docs * norm_query)

        # Get top k indices
        top_k_indices = np.argsort(similarities)[::-1][:limit]

        results = []
        for idx in top_k_indices:
            results.append(
                {
                    "content": self.documents[idx],
                    "metadata": self.metadatas[idx],
                    "score": float(similarities[idx]),
                }
            )

        return results
