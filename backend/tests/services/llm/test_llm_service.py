import sys
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from backend.services.llm.service import LLMService
from backend.services.llm.types import LLMResponse, TokenUsage


@pytest.fixture(autouse=True)
def mock_google_genai():
    """Mock google.generativeai to prevent import errors or side effects."""
    mock = MagicMock()
    with patch.dict(sys.modules, {"google.generativeai": mock}):
        yield mock


@pytest.fixture
def mock_gemini_provider():
    # Patching where it is used or the class itself
    with patch("backend.services.llm.service.GeminiProvider") as MockProvider:
        instance = MockProvider.return_value
        instance.generate_text = AsyncMock(return_value=LLMResponse(
            content="Mocked response",
            usage={"prompt_tokens": 5, "completion_tokens": 5, "total_tokens": 10}
        ))
        instance.chat = AsyncMock(return_value=LLMResponse(
            content="Mocked chat response",
            usage={"prompt_tokens": 5, "completion_tokens": 10, "total_tokens": 15}
        ))

        async def mock_stream(*args, **kwargs):
            yield "Mocked"
            yield " stream"

        instance.generate_stream = mock_stream

        # Ensure name match for service provider check
        instance.__class__.__name__ = "GeminiProvider"

        yield instance

@pytest.mark.asyncio
async def test_generate_text(mock_gemini_provider):
    service = LLMService()
    # Force provider injection
    service._provider = mock_gemini_provider

    # We also need to ensure _get_provider returns our mock
    # The service checks: if self._provider and self._provider.__class__.__name__.lower().startswith(name):
    # So we need to make sure mock_gemini_provider class name starts with gemini

    # Alternatively, we can patch _get_provider
    with patch.object(service, '_get_provider', return_value=mock_gemini_provider):
        result = await service.generate_text("Test prompt")
        assert result == "Mocked response"
        mock_gemini_provider.generate_text.assert_called_once()

@pytest.mark.asyncio
async def test_chat(mock_gemini_provider):
    service = LLMService()
    with patch.object(service, '_get_provider', return_value=mock_gemini_provider):
        messages = [{"role": "user", "content": "Hello"}]
        result = await service.chat(messages)
        assert result == "Mocked chat response"
        mock_gemini_provider.chat.assert_called_once()

@pytest.mark.asyncio
async def test_generate_stream(mock_gemini_provider):
    service = LLMService()
    with patch.object(service, '_get_provider', return_value=mock_gemini_provider):
        chunks = []
        async for chunk in service.generate_stream("Test prompt"):
            chunks.append(chunk)

        assert "".join(chunks) == "Mocked stream"
