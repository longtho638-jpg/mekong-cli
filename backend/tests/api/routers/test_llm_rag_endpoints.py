import sys
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

# We will patch google.generativeai inside the fixture or test execution if needed
# But better yet, since we mock RAGService entirely, we might not even need to mock google.generativeai globally
# if the imports are lazy or if we patch where it is used.
# However, if the module imports it at top level, we might crash if library not installed.
# Assuming dev environment has requirements installed or we mock it.

# To be safe and avoid ImportErrors if google-generativeai is missing in test env:
# We use patch.dict on sys.modules around the imports if necessary, but here we can just rely on mocking the service.

from backend.api.main import app
from backend.api.routers.llm import RAGIngestRequest, RAGQueryRequest


@pytest.fixture
def mock_google_genai():
    """Mock google.generativeai to prevent import errors or side effects."""
    mock = MagicMock()
    with patch.dict(sys.modules, {"google.generativeai": mock}):
        yield mock


@pytest.fixture
def client(mock_google_genai):
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
