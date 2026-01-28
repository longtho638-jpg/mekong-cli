import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from datetime import datetime

from backend.api.main import app
from backend.models.prompt import Prompt

# Mock dependencies
from backend.api.schemas.prompt import PromptCreate, PromptUpdate, PromptResponse

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def override_auth():
    # Mock auth dependency to bypass security
    from backend.api.auth.dependencies import get_current_active_superuser
    app.dependency_overrides[get_current_active_superuser] = lambda: {"id": "admin", "is_superuser": True}
    yield
    app.dependency_overrides = {}

@pytest.fixture
def mock_prompt_service():
    with patch("backend.api.routers.prompts.prompt_service") as mock:
        yield mock

def test_list_prompts(client, override_auth, mock_prompt_service):
    # Setup mock
    mock_prompt_service.list_prompts.return_value = [
        Prompt(id=1, name="Test Prompt", slug="test-prompt", content="Content", created_at=datetime.now(), version=1)
    ]

    response = client.get("/prompts/")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["slug"] == "test-prompt"
    mock_prompt_service.list_prompts.assert_called_once()

def test_get_prompt_by_slug(client, override_auth, mock_prompt_service):
    # Setup mock
    mock_prompt_service.get_prompt_by_slug.return_value = Prompt(
        id=1, name="Test Prompt", slug="test-prompt", content="Content", created_at=datetime.now(), version=1
    )

    response = client.get("/prompts/test-prompt")

    assert response.status_code == 200
    data = response.json()
    assert data["slug"] == "test-prompt"
    mock_prompt_service.get_prompt_by_slug.assert_called_once()

def test_get_prompt_not_found(client, override_auth, mock_prompt_service):
    mock_prompt_service.get_prompt_by_slug.return_value = None

    response = client.get("/prompts/non-existent")

    assert response.status_code == 404
    mock_prompt_service.get_prompt_by_slug.assert_called_once()

def test_create_prompt(client, override_auth, mock_prompt_service):
    mock_prompt_service.create_prompt.return_value = Prompt(
        id=1, name="New Prompt", slug="new-prompt", content="New Content", created_at=datetime.now(), version=1
    )

    payload = {
        "name": "New Prompt",
        "slug": "new-prompt",
        "content": "New Content",
        "input_variables": ["var1"]
    }

    response = client.post("/prompts/", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "New Prompt"
    mock_prompt_service.create_prompt.assert_called_once()

def test_update_prompt(client, override_auth, mock_prompt_service):
    mock_prompt_service.update_prompt.return_value = Prompt(
        id=1, name="Updated Prompt", slug="test-prompt", content="Updated Content", created_at=datetime.now(), version=2
    )

    payload = {"content": "Updated Content"}

    response = client.put("/prompts/1", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["content"] == "Updated Content"
    assert data["version"] == 2
    mock_prompt_service.update_prompt.assert_called_once()

def test_delete_prompt(client, override_auth, mock_prompt_service):
    mock_prompt_service.delete_prompt.return_value = True

    response = client.delete("/prompts/1")

    assert response.status_code == 200
    assert response.json() is True
    mock_prompt_service.delete_prompt.assert_called_once()
