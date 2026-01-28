from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy.orm import Session

from backend.models.prompt import Prompt
from backend.services.llm.content import ContentService
from backend.services.llm.prompts import PromptTemplates


@pytest.fixture
def mock_llm_service():
    with patch("backend.services.llm.content.LLMService") as MockService:
        instance = MockService.return_value
        instance.generate_text = AsyncMock(return_value="Generated Content")
        yield instance

@pytest.fixture
def mock_prompt_service():
    with patch("backend.services.llm.content.prompt_service") as mock:
        yield mock

@pytest.fixture
def db_session():
    return MagicMock(spec=Session)

@pytest.mark.asyncio
async def test_generate_blog_post_with_db_prompt(db_session, mock_llm_service, mock_prompt_service):
    # Setup: Prompt exists in DB
    mock_prompt = Prompt(
        id=1,
        name="Custom Blog Prompt",
        slug="blog-post-generator",
        content="Custom instruction for {tone} tone and {length} length.",
        is_active=True
    )
    mock_prompt_service.get_prompt_by_slug.return_value = mock_prompt

    service = ContentService()
    result = await service.generate_blog_post(
        db=db_session,
        topic="AI",
        tone="witty",
        length="short"
    )

    assert result == "Generated Content"

    # Verify prompt service was called
    mock_prompt_service.get_prompt_by_slug.assert_called_once_with(db_session, "blog-post-generator")

    # Verify LLM service was called with CUSTOM prompt
    mock_llm_service.generate_text.assert_called_once()
    call_args = mock_llm_service.generate_text.call_args
    assert call_args.kwargs['system_instruction'] == "Custom instruction for witty tone and short length."

@pytest.mark.asyncio
async def test_generate_blog_post_fallback(db_session, mock_llm_service, mock_prompt_service):
    # Setup: Prompt NOT in DB
    mock_prompt_service.get_prompt_by_slug.return_value = None

    service = ContentService()
    result = await service.generate_blog_post(
        db=db_session,
        topic="AI",
        tone="professional",
        length="medium"
    )

    assert result == "Generated Content"

    # Verify prompt service was called
    mock_prompt_service.get_prompt_by_slug.assert_called_once_with(db_session, "blog-post-generator")

    # Verify LLM service was called with DEFAULT prompt
    expected_instruction = PromptTemplates.BLOG_POST_SYSTEM.value.format(tone="professional", length="medium")
    mock_llm_service.generate_text.assert_called_once()
    call_args = mock_llm_service.generate_text.call_args
    assert call_args.kwargs['system_instruction'] == expected_instruction

@pytest.mark.asyncio
async def test_generate_social_caption_dynamic(db_session, mock_llm_service, mock_prompt_service):
    mock_prompt = Prompt(
        slug="social-media-caption",
        content="Custom social prompt for {platform}",
        is_active=True
    )
    mock_prompt_service.get_prompt_by_slug.return_value = mock_prompt

    service = ContentService()
    await service.generate_social_media_caption(
        db=db_session,
        content_description="New Feature",
        platform="twitter"
    )

    mock_llm_service.generate_text.assert_called_once()
    assert mock_llm_service.generate_text.call_args.kwargs['system_instruction'] == "Custom social prompt for twitter"

@pytest.mark.asyncio
async def test_optimize_seo_dynamic(db_session, mock_llm_service, mock_prompt_service):
    mock_prompt = Prompt(
        slug="seo-optimizer",
        content="Custom SEO instructions",
        is_active=True
    )
    mock_prompt_service.get_prompt_by_slug.return_value = mock_prompt

    service = ContentService()
    await service.optimize_seo(
        db=db_session,
        content="Original content"
    )

    mock_llm_service.generate_text.assert_called_once()
    assert mock_llm_service.generate_text.call_args.kwargs['system_instruction'] == "Custom SEO instructions"
