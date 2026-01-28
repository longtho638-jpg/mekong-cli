"""
Test LLM Service
"""
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from backend.api.config.settings import settings
from backend.services.llm.content import ContentService
from backend.services.llm.provider import GeminiProvider, OpenAIProvider
from backend.services.llm.service import LLMService


@pytest.fixture
def mock_gemini_provider():
    with patch("backend.services.llm.service.GeminiProvider") as mock:
        instance = mock.return_value
        instance.generate_text = AsyncMock(return_value={"content": "Gemini response", "usage": {"prompt_tokens": 10, "completion_tokens": 5}})
        instance.chat = AsyncMock(return_value={"content": "Gemini chat response", "usage": {"prompt_tokens": 10, "completion_tokens": 5}})

        # Mock streaming response
        async def mock_stream(*args, **kwargs):
            yield "Gemini"
            yield " Stream"
        instance.generate_stream = mock_stream

        yield instance

@pytest.fixture
def mock_openai_provider():
    with patch("backend.services.llm.service.OpenAIProvider") as mock:
        instance = mock.return_value
        instance.generate_text = AsyncMock(return_value={"content": "OpenAI response", "usage": {"prompt_tokens": 10, "completion_tokens": 5}})
        yield instance

@pytest.mark.asyncio
async def test_llm_service_gemini_text(mock_gemini_provider):
    service = LLMService()
    # Force reset instance to ensure clean state
    service._provider = None

    with patch.object(settings, "default_llm_provider", "gemini"):
        response = await service.generate_text("Hello")
        assert response == "Gemini response"

@pytest.mark.asyncio
async def test_llm_service_gemini_chat(mock_gemini_provider):
    service = LLMService()
    service._provider = None

    with patch.object(settings, "default_llm_provider", "gemini"):
        messages = [{"role": "user", "content": "Hi"}]
        response = await service.chat(messages)
        assert response == "Gemini chat response"

@pytest.mark.asyncio
async def test_llm_service_gemini_stream(mock_gemini_provider):
    service = LLMService()
    service._provider = None

    with patch.object(settings, "default_llm_provider", "gemini"):
        chunks = []
        async for chunk in service.generate_stream("Hello"):
            chunks.append(chunk)

        assert "".join(chunks) == "Gemini Stream"

@pytest.mark.asyncio
async def test_content_service_blog():
    with patch("backend.services.llm.content.LLMService") as MockLLMService, \
         patch("backend.services.llm.content.prompt_service") as mock_prompt_service:
        mock_llm = MockLLMService.return_value
        mock_llm.generate_text = AsyncMock(return_value="Generated Blog Post")

        # Simulate no prompt in DB to use default template
        mock_prompt_service.get_prompt_by_slug.return_value = None

        service = ContentService()
        mock_db = MagicMock()
        result = await service.generate_blog_post(db=mock_db, topic="AI", length="short")

        assert result == "Generated Blog Post"
        mock_llm.generate_text.assert_called_once()
        call_kwargs = mock_llm.generate_text.call_args[1]
        assert "AI" in call_kwargs["prompt"]
        assert "short" in call_kwargs["system_instruction"]

@pytest.mark.asyncio
async def test_content_service_social():
    with patch("backend.services.llm.content.LLMService") as MockLLMService, \
         patch("backend.services.llm.content.prompt_service") as mock_prompt_service:
        mock_llm = MockLLMService.return_value
        mock_llm.generate_text = AsyncMock(return_value="#AI #Tech")

        # Simulate no prompt in DB to use default template
        mock_prompt_service.get_prompt_by_slug.return_value = None

        service = ContentService()
        mock_db = MagicMock()
        result = await service.generate_social_media_caption(db=mock_db, content_description="New AI Feature", platform="twitter")

        assert result == "#AI #Tech"
        mock_llm.generate_text.assert_called_once()
        call_kwargs = mock_llm.generate_text.call_args[1]
        assert "New AI Feature" in call_kwargs["prompt"]
        assert "twitter" in call_kwargs["system_instruction"]
