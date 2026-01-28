"""
Test LLM Router
"""
import pytest
from httpx import AsyncClient, ASGITransport
from backend.api.main import app
from unittest.mock import AsyncMock, patch

# Override dependency to allow access without real auth
from backend.api.auth.dependencies import get_current_active_superuser

@pytest.fixture
def override_auth():
    app.dependency_overrides[get_current_active_superuser] = lambda: {"id": 1, "email": "admin@example.com", "is_superuser": True}
    yield
    app.dependency_overrides = {}

# --- Redis/Cache Mocking to prevent connection errors ---
@pytest.fixture(autouse=True)
def mock_cache():
    with patch("backend.services.cache.cache_factory.get_response_cache", new_callable=AsyncMock) as mock:
        mock.return_value = None
        yield mock

@pytest.fixture(autouse=True)
def mock_rate_limiter_service():
    with patch("backend.services.rate_limiter_service.RateLimiterService.check_sliding_window", new_callable=AsyncMock) as mock_sliding:
        with patch("backend.services.rate_limiter_service.RateLimiterService.check_token_bucket", new_callable=AsyncMock) as mock_token:
            with patch("backend.services.rate_limiter_service.RateLimiterService.check_fixed_window", new_callable=AsyncMock) as mock_fixed:
                with patch("backend.services.rate_limiter_service.RateLimiterService.get_reset_time", new_callable=AsyncMock) as mock_reset:
                    mock_sliding.return_value = (True, 100)
                    mock_token.return_value = (True, 100)
                    mock_fixed.return_value = (True, 100)
                    mock_reset.return_value = 0
                    yield

@pytest.fixture(autouse=True)
def mock_ip_blocker():
    with patch("backend.services.ip_blocker.IpBlocker.is_blocked", new_callable=AsyncMock) as mock:
        mock.return_value = False
        yield mock
# --------------------------------------------------------

@pytest.fixture
def mock_llm_service():
    with patch("backend.api.routers.llm.LLMService") as MockService:
        instance = MockService.return_value
        instance.generate_text = AsyncMock(return_value="Mocked Text Response")
        instance.chat = AsyncMock(return_value="Mocked Chat Response")

        async def mock_stream(*args, **kwargs):
            yield "Mocked"
            yield " Stream"
        instance.generate_stream = mock_stream

        yield instance

@pytest.fixture
def mock_content_service():
    with patch("backend.api.routers.llm.ContentService") as MockService:
        instance = MockService.return_value
        instance.generate_blog_post = AsyncMock(return_value="# Blog Post\nContent")
        instance.generate_social_media_caption = AsyncMock(return_value="Social Caption")
        instance.optimize_seo = AsyncMock(return_value="Optimized Content")
        yield instance

@pytest.mark.asyncio
async def test_generate_text_endpoint(override_auth, mock_llm_service):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/llm/generate", json={"prompt": "Hello"})

    assert response.status_code == 200
    assert response.json() == {"result": "Mocked Text Response"}
    mock_llm_service.generate_text.assert_called_once()

@pytest.mark.asyncio
async def test_chat_endpoint(override_auth, mock_llm_service):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/llm/chat", json={
            "messages": [{"role": "user", "content": "Hi"}],
            "provider": "gemini"
        })

    assert response.status_code == 200
    assert response.json() == {"result": "Mocked Chat Response"}
    mock_llm_service.chat.assert_called_once()

@pytest.mark.asyncio
async def test_stream_endpoint(override_auth, mock_llm_service):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        async with ac.stream("POST", "/llm/stream", json={"prompt": "Hello"}) as response:
            assert response.status_code == 200
            content = await response.aread()
            assert content.decode() == "Mocked Stream"

@pytest.mark.asyncio
async def test_blog_endpoint(override_auth, mock_content_service):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/llm/content/blog", json={
            "topic": "AI",
            "tone": "casual"
        })

    assert response.status_code == 200
    assert response.json() == {"result": "# Blog Post\nContent"}
    mock_content_service.generate_blog_post.assert_called_once()

@pytest.mark.asyncio
async def test_social_endpoint(override_auth, mock_content_service):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/llm/content/social", json={
            "description": "My new product",
            "platform": "twitter"
        })

    assert response.status_code == 200
    assert response.json() == {"result": "Social Caption"}
    mock_content_service.generate_social_media_caption.assert_called_once()
