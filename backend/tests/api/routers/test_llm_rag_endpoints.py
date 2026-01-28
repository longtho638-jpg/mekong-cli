import sys
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

# Mock external dependencies
sys.modules["google.generativeai"] = MagicMock()

from backend.api.main import app
from backend.api.routers.llm import RAGIngestRequest, RAGQueryRequest


@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def mock_rag_service():
    with patch("backend.api.routers.llm.RAGService") as MockService:
        instance = MockService.return_value
        instance.ingest_documents = AsyncMock(return_value=None)
        instance.query = AsyncMock(return_value="RAG Answer")
        yield instance

@pytest.fixture
def override_auth():
    # Mock auth dependency to bypass security
    from backend.api.auth.dependencies import get_current_active_superuser
    app.dependency_overrides[get_current_active_superuser] = lambda: {"id": "admin", "is_superuser": True}
    yield
    app.dependency_overrides = {}

def test_rag_ingest_endpoint(client, mock_rag_service, override_auth):
    response = client.post(
        "/llm/rag/ingest",
        json={
            "documents": ["doc1", "doc2"],
            "metadatas": [{"source": "web"}, {"source": "file"}]
        }
    )

    assert response.status_code == 200
    assert response.json() == {"status": "success", "message": "Ingested 2 documents"}
    mock_rag_service.ingest_documents.assert_called_once()

    # Verify arguments passed to mock
    call_args = mock_rag_service.ingest_documents.call_args
    assert call_args.kwargs['documents'] == ["doc1", "doc2"]
    assert call_args.kwargs['metadatas'] == [{"source": "web"}, {"source": "file"}]

def test_rag_query_endpoint(client, mock_rag_service, override_auth):
    response = client.post(
        "/llm/rag/query",
        json={
            "question": "What is Agency OS?",
            "max_results": 5
        }
    )

    assert response.status_code == 200
    assert response.json() == {"answer": "RAG Answer"}
    mock_rag_service.query.assert_called_once()

    # Verify arguments
    call_args = mock_rag_service.query.call_args
    assert call_args.kwargs['question'] == "What is Agency OS?"
    assert call_args.kwargs['max_results'] == 5
