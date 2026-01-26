import pytest
from unittest.mock import MagicMock, patch
import httpx
import asyncio
from app.core.webhook_client import WebhookClient

@pytest.mark.asyncio
async def test_webhook_success():
    client = WebhookClient()
    # Mock the httpx client's post method
    with patch.object(client.client, 'post', new_callable=MagicMock) as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.raise_for_status = MagicMock()

        # Create a future for the return value
        future = asyncio.Future()
        future.set_result(mock_response)
        mock_post.return_value = future

        result = await client.send_webhook("http://example.com", {"data": 1})
        assert result is True
        mock_post.assert_called_once()
    await client.close()

@pytest.mark.asyncio
async def test_webhook_retry_logic():
    client = WebhookClient()

    # We want to simulate failures then success to test retry
    # However, testing exact retry timing/count with tenacity can be tricky without mocking time or sleep
    # Here we simulate a permanent failure to ensure it retries 3 times then raises

    with patch.object(client.client, 'post', new_callable=MagicMock) as mock_post:
        # Mock raising HTTP error
        mock_post.side_effect = httpx.RequestError("Connection failed")

        with pytest.raises(httpx.RequestError):
            await client.send_webhook("http://example.com", {"data": 1})

        # Should be called 3 times (1 initial + 2 retries)
        # We configured stop_after_attempt(3)
        assert mock_post.call_count == 3
    await client.close()
