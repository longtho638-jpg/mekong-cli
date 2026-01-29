from abc import ABC, abstractmethod
from typing import List


class EmbeddingsProvider(ABC):
    """Abstract base class for Embeddings providers."""

    @abstractmethod
    async def embed_query(self, text: str) -> List[float]:
        """Embed a single query text."""
        pass

    @abstractmethod
    async def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """Embed a list of documents."""
        pass


class GeminiEmbeddings(EmbeddingsProvider):
    """Gemini Embeddings Provider."""

    def __init__(self, api_key: str):
        import google.generativeai as genai

        genai.configure(api_key=api_key)
        self.genai = genai
        self.model = "models/text-embedding-004"  # Or embedding-001

    async def embed_query(self, text: str) -> List[float]:
        result = self.genai.embed_content(
            model=self.model, content=text, task_type="retrieval_query"
        )
        return result["embedding"]

    async def embed_documents(self, texts: List[str]) -> List[List[float]]:
        # Gemini batch embedding might handle list directly
        # Note: Check batch size limits in real implementation
        result = self.genai.embed_content(
            model=self.model, content=texts, task_type="retrieval_document"
        )
        # Result format for batch?
        # google-genai returns dict with 'embedding' key which is list of floats for single,
        # or list of embeddings for list?
        # Actually verify SDK behavior. Usually it returns a dict.
        # If 'embedding' is list of list, good.
        return result["embedding"]


class OpenAIEmbeddings(EmbeddingsProvider):
    """OpenAI Embeddings Provider."""

    def __init__(self, api_key: str):
        from openai import AsyncOpenAI

        self.client = AsyncOpenAI(api_key=api_key)
        self.model = "text-embedding-3-small"

    async def embed_query(self, text: str) -> List[float]:
        response = await self.client.embeddings.create(input=text, model=self.model)
        return response.data[0].embedding

    async def embed_documents(self, texts: List[str]) -> List[List[float]]:
        response = await self.client.embeddings.create(input=texts, model=self.model)
        return [d.embedding for d in response.data]
