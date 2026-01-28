import pytest
from unittest.mock import AsyncMock, patch
from backend.api.routers.chatbot import router
from fastapi.testclient import TestClient
from backend.api.main import app

# We need to override dependencies
from backend.api.auth.dependencies import get_current_user
from backend.services.llm.types import LLMResponse

client = TestClient(app)

async def override_get_current_user():
    return {"id": 1, "email": "test@example.com", "is_active": True, "username": "testuser", "role": "user"}

app.dependency_overrides[get_current_user] = override_get_current_user

@pytest.fixture
def mock_llm_service():
    with patch("backend.api.routers.chatbot.LLMService") as MockService:
        instance = MockService.return_value
        instance.chat = AsyncMock(return_value="I am a bot")
        yield instance

def test_chat_endpoint(mock_llm_service):
    response = client.post(
        "/chatbot/chat",
        json={
            "messages": [{"role": "user", "content": "Hello"}],
            "provider": "gemini",
            "model": "gemini-1.5-flash"
        }
    )

    assert response.status_code == 200
    data = response.json()
    assert data["response"] == "I am a bot"
    assert data["provider"] == "gemini"
    assert data["model"] == "gemini-1.5-flash"

def test_chat_endpoint_no_messages(mock_llm_service):
    response = client.post(
        "/chatbot/chat",
        json={
            "messages": []
        }
    )
    assert response.status_code == 400
