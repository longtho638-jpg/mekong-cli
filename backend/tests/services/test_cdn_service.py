"""
Tests for CDN Service
"""
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from backend.services.cdn.purge import CloudflareProvider, FastlyProvider


class MockResponse:
    def __init__(self, json_data, status_code=200):
        self._json = json_data
        self.status_code = status_code

    def json(self):
        return self._json

    def raise_for_status(self):
        pass

@pytest.mark.asyncio
async def test_cloudflare_purge_all():
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        # AsyncMock calling convention: return_value is the result of the await
        mock_post.return_value = MockResponse({"success": True})

        provider = CloudflareProvider(api_token="token", zone_id="zone")
        result = await provider.purge_all()

        assert result is True
        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        assert "purge_cache" in args[0]
        assert kwargs["json"] == {"purge_everything": True}

@pytest.mark.asyncio
async def test_cloudflare_purge_urls():
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = MockResponse({"success": True})

        provider = CloudflareProvider(api_token="token", zone_id="zone")
        result = await provider.purge_urls(["http://example.com/1"])

        assert result is True
        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        assert kwargs["json"] == {"files": ["http://example.com/1"]}

@pytest.mark.asyncio
async def test_fastly_purge_all():
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = MockResponse({"status": "ok"})

        provider = FastlyProvider(api_token="token", service_id="service")
        result = await provider.purge_all()

        assert result is True
        mock_post.assert_called_once()
        assert "purge_all" in mock_post.call_args[0][0]

