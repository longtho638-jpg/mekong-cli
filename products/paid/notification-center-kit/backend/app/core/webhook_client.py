import asyncio
import httpx
import logging
from typing import Dict, Any, Optional
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class WebhookClient:
    def __init__(self, timeout: float = 10.0):
        self.timeout = timeout
        self.client = httpx.AsyncClient(timeout=timeout)

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=4),
        retry=retry_if_exception_type((httpx.RequestError, httpx.HTTPStatusError)),
        reraise=True
    )
    async def send_webhook(self, url: str, payload: Dict[str, Any], headers: Optional[Dict[str, str]] = None) -> bool:
        """
        Sends a webhook payload to the specified URL with exponential backoff retry.
        Retries 3 times: 1s, 2s, 4s wait.
        """
        try:
            logger.info(f"Sending webhook to {url} with payload: {payload}")
            response = await self.client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            logger.info(f"Webhook sent successfully to {url}. Status: {response.status_code}")
            return True
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error sending webhook to {url}: {e.response.status_code} - {e.response.text}")
            raise
        except httpx.RequestError as e:
            logger.error(f"Connection error sending webhook to {url}: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error sending webhook to {url}: {str(e)}")
            raise

    async def close(self):
        await self.client.aclose()

# Example usage
async def main():
    client = WebhookClient()
    try:
        # Example webhook endpoint
        await client.send_webhook("https://httpbin.org/post", {"event": "notification.sent", "data": {"id": 1}})
    except Exception as e:
        logger.error(f"Failed to send webhook after retries: {e}")
    finally:
        await client.close()

if __name__ == "__main__":
    asyncio.run(main())
