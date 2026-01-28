"""
CDN Purge Service
Handles cache invalidation for Cloudflare and Fastly.
"""

import logging
from abc import ABC, abstractmethod
from typing import List, Optional, Union

import httpx
from backend.api.config.settings import settings

logger = logging.getLogger(__name__)

class CDNPurgeProvider(ABC):
    """Abstract base class for CDN purge providers."""

    @abstractmethod
    async def purge_all(self) -> bool:
        """Purge everything from the cache."""
        pass

    @abstractmethod
    async def purge_urls(self, urls: List[str]) -> bool:
        """Purge specific URLs."""
        pass

    @abstractmethod
    async def purge_tags(self, tags: List[str]) -> bool:
        """Purge by surrogate keys/tags."""
        pass


class CloudflareProvider(CDNPurgeProvider):
    """Cloudflare implementation of purge provider."""

    def __init__(self, api_token: str, zone_id: str):
        self.api_token = api_token
        self.zone_id = zone_id
        self.base_url = "https://api.cloudflare.com/client/v4"
        self.headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json",
        }

    async def purge_all(self) -> bool:
        url = f"{self.base_url}/zones/{self.zone_id}/purge_cache"
        payload = {"purge_everything": True}

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, headers=self.headers, json=payload, timeout=30.0)
                response.raise_for_status()
                result = response.json()
                if result.get("success"):
                    logger.info("Cloudflare purge_all successful")
                    return True
                else:
                    logger.error(f"Cloudflare purge_all failed: {result.get('errors')}")
                    return False
        except Exception as e:
            logger.error(f"Error purging Cloudflare cache: {str(e)}")
            return False

    async def purge_urls(self, urls: List[str]) -> bool:
        url = f"{self.base_url}/zones/{self.zone_id}/purge_cache"
        payload = {"files": urls}

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, headers=self.headers, json=payload, timeout=30.0)
                response.raise_for_status()
                result = response.json()
                if result.get("success"):
                    logger.info(f"Cloudflare purge_urls successful for {len(urls)} URLs")
                    return True
                else:
                    logger.error(f"Cloudflare purge_urls failed: {result.get('errors')}")
                    return False
        except Exception as e:
            logger.error(f"Error purging Cloudflare URLs: {str(e)}")
            return False

    async def purge_tags(self, tags: List[str]) -> bool:
        url = f"{self.base_url}/zones/{self.zone_id}/purge_cache"
        payload = {"tags": tags}

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, headers=self.headers, json=payload, timeout=30.0)
                response.raise_for_status()
                result = response.json()
                if result.get("success"):
                    logger.info(f"Cloudflare purge_tags successful for {len(tags)} tags")
                    return True
                else:
                    logger.error(f"Cloudflare purge_tags failed: {result.get('errors')}")
                    return False
        except Exception as e:
            logger.error(f"Error purging Cloudflare tags: {str(e)}")
            return False


class FastlyProvider(CDNPurgeProvider):
    """Fastly implementation of purge provider."""

    def __init__(self, api_token: str, service_id: str):
        self.api_token = api_token
        self.service_id = service_id
        self.base_url = f"https://api.fastly.com/service/{self.service_id}"
        self.headers = {
            "Fastly-Key": self.api_token,
            "Accept": "application/json",
        }

    async def purge_all(self) -> bool:
        url = f"{self.base_url}/purge_all"
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, headers=self.headers, timeout=30.0)
                response.raise_for_status()
                logger.info("Fastly purge_all successful")
                return True
        except Exception as e:
            logger.error(f"Error purging Fastly cache: {str(e)}")
            return False

    async def purge_urls(self, urls: List[str]) -> bool:
        # Fastly purge by URL requires individual calls or batch endpoint if enabled
        # Standard purge is individual DELETE requests to the URL
        success_count = 0
        async with httpx.AsyncClient() as client:
            for url in urls:
                try:
                    # Method PURGE is standard for Fastly
                    response = await client.request("PURGE", url, headers=self.headers, timeout=10.0)
                    if response.status_code == 200:
                        success_count += 1
                except Exception as e:
                    logger.error(f"Error purging Fastly URL {url}: {str(e)}")

        return success_count == len(urls)

    async def purge_tags(self, tags: List[str]) -> bool:
        url = f"{self.base_url}/purge"
        payload = {"surrogate_keys": tags}
        # Fastly supports purging by surrogate key via POST to /service/{id}/purge with keys in header or body
        # Usually it's POST /service/{service_id}/purge/{surrogate_key} for single
        # For multiple, it depends on API version. Assuming simplified single tag loop or batch if supported.

        # Using the standard "purge by key" endpoint: POST /service/service_id/purge/key
        success_count = 0
        async with httpx.AsyncClient() as client:
            for tag in tags:
                purge_url = f"{self.base_url}/purge/{tag}"
                try:
                    response = await client.post(purge_url, headers=self.headers, timeout=10.0)
                    if response.status_code == 200:
                        success_count += 1
                except Exception as e:
                    logger.error(f"Error purging Fastly tag {tag}: {str(e)}")

        return success_count == len(tags)


def get_purge_provider() -> Optional[CDNPurgeProvider]:
    """Factory to get the configured CDN provider."""
    provider_name = settings.cdn_provider.lower()

    if provider_name == "cloudflare":
        if settings.cloudflare_api_token and settings.cloudflare_zone_id:
            return CloudflareProvider(
                api_token=settings.cloudflare_api_token,
                zone_id=settings.cloudflare_zone_id
            )
        else:
            logger.warning("Cloudflare credentials not configured")
            return None

    elif provider_name == "fastly":
        if settings.fastly_api_token and settings.fastly_service_id:
            return FastlyProvider(
                api_token=settings.fastly_api_token,
                service_id=settings.fastly_service_id
            )
        else:
            logger.warning("Fastly credentials not configured")
            return None

    return None
