from unittest.mock import AsyncMock, patch

import pytest

from backend.services.content_generator import ContentGenerator


@pytest.fixture
def mock_content_service():
    with patch("backend.services.content_generator.ContentService") as MockService:
        instance = MockService.return_value
        instance.generate_blog_post = AsyncMock(return_value="# Blog Post")
        instance.generate_social_media_caption = AsyncMock(return_value="Amazing post! #viral")
        instance.optimize_seo = AsyncMock(return_value="Optimized content")
        yield instance

@pytest.mark.asyncio
async def test_generate_blog_post(mock_content_service):
    generator = ContentGenerator()
    generator._service = mock_content_service # Inject mock

    result = await generator.generate_blog_post(topic="AI")
    assert result == "# Blog Post"
    mock_content_service.generate_blog_post.assert_called_with("AI", None, "professional", "medium")

@pytest.mark.asyncio
async def test_generate_social(mock_content_service):
    generator = ContentGenerator()
    generator._service = mock_content_service

    result = await generator.generate_social_media_caption("My product")
    assert result == "Amazing post! #viral"

@pytest.mark.asyncio
async def test_optimize_seo(mock_content_service):
    generator = ContentGenerator()
    generator._service = mock_content_service

    result = await generator.optimize_seo("Raw content")
    assert result == "Optimized content"
