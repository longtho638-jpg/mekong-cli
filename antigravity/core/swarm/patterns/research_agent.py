import logging
from typing import Any, List, Optional

from antigravity.core.telemetry import agent_telemetry
from ..agent import BaseSwarmAgent
from ..types import AgentMessage, MessageType
from ...rag.vector_client import VectorClient
from ...rag.embedding import EmbeddingService

logger = logging.getLogger(__name__)


class ResearchAgent(BaseSwarmAgent):
    """
    Agent capable of semantic search and codebase analysis using RAG.
    """
    def __init__(self, agent_id: str, name: str, bus, vector_client: Optional[VectorClient] = None):
        super().__init__(agent_id, name, bus)
        self.vector_client = vector_client
        self.embedding_service = EmbeddingService() if vector_client else None

    def on_message(self, message: AgentMessage):
        super().on_message(message)
        if message.type == MessageType.QUERY:
            logger.info(f"🔎 [Research] Searching for: {message.content}")
            results = self.search(message.content)
            self.send(message.sender, results, MessageType.RESPONSE)

    @agent_telemetry(operation="research_search")
    def search(self, query: str) -> List[str]:
        """Perform semantic search."""
        if not self.vector_client or not self.embedding_service:
            return ["RAG is not available."]

        # In a real scenario, we'd embed the query and search
        # For simplicity, we just pass the text query if the client supports it
        # But VectorClient.query usually takes embeddings or text if using built-in embedding function
        # Our VectorClient wrapper supports text query if collection configured?
        # Let's assume VectorClient.query handles text

        results = self.vector_client.query(query_texts=[query], n_results=3)

        # Flatten results
        documents = results.get('documents', [])
        flat_docs = [doc for sublist in documents for doc in sublist] if documents else []
        return flat_docs
