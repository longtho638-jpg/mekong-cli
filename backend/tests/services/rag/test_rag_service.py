import sys
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Mock google.generativeai globally
sys.modules["google.generativeai"] = MagicMock()

from backend.services.rag.embeddings import GeminiEmbeddings
from backend.services.rag.service import RAGService
from backend.services.rag.vector_store import InMemoryVectorStore


@pytest.fixture
def mock_llm_service():
    with patch("backend.services.rag.service.LLMService") as MockService:
        instance = MockService.return_value
        instance.generate_text = AsyncMock(return_value="RAG Answer")
        yield instance

@pytest.fixture
def mock_embeddings():
    with patch("backend.services.rag.service.GeminiEmbeddings") as MockEmbeddings:
        instance = MockEmbeddings.return_value
        instance.embed_query = AsyncMock(return_value=[0.1, 0.2, 0.3])
        instance.embed_documents = AsyncMock(return_value=[[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]])
        yield instance

@pytest.mark.asyncio
async def test_rag_ingest_and_query(mock_llm_service, mock_embeddings):
    # Reset singleton to ensure fresh init with mocks
    RAGService._instance = None

    # We need to ensure that when RAGService inits, it uses our mocked Embeddings
    # Since RAGService instantiates GeminiEmbeddings inside __init__, we mocked the class above.

    rag = RAGService()
    # Manually inject mocks if needed, but patch should handle constructor
    # Actually, RAGService() calls _init_components which calls GeminiEmbeddings()
    # So rag.embeddings should be our mock instance

    # Verify mock injection
    assert isinstance(rag.embeddings, MagicMock) or isinstance(rag.embeddings, AsyncMock)
    # (It's actually the return_value of the class mock)

    # Ingest
    docs = ["Doc 1", "Doc 2"]
    await rag.ingest_documents(docs)

    rag.embeddings.embed_documents.assert_called_once_with(docs)
    assert len(rag.vector_store.documents) == 2

    # Query
    answer = await rag.query("Question")

    rag.embeddings.embed_query.assert_called_once_with("Question")
    mock_llm_service.generate_text.assert_called_once()
    assert answer == "RAG Answer"
