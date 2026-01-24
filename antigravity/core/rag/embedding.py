import logging
from typing import List

logger = logging.getLogger(__name__)

try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    SentenceTransformer = None

class EmbeddingService:
    """
    Generates vector embeddings for text.
    """
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        if SentenceTransformer:
            self.model = SentenceTransformer(model_name)
        else:
            self.model = None
            logger.warning("⚠️ sentence-transformers not installed. Embeddings disabled.")

    def embed_text(self, text: str) -> List[float]:
        """Generate embedding for a single string."""
        if not self.model:
            return []
        return self.model.encode(text).tolist()

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for a list of strings."""
        if not self.model:
            return []
        return self.model.encode(texts).tolist()
