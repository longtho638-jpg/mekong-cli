"""
CDN Manager
Facade for CDN operations.
"""

import logging
from typing import List, Dict, Optional

from backend.services.cdn.purge import get_purge_provider, CDNPurgeProvider
from backend.services.cdn.optimization import OptimizationService

logger = logging.getLogger(__name__)

class CDNManager:
    """
    Manager for CDN operations including Purge and Optimization.
    """

    def __init__(self):
        self.purge_provider: Optional[CDNPurgeProvider] = get_purge_provider()
        self.optimizer = OptimizationService()

    async def purge_all(self) -> bool:
        """Purge entire cache."""
        if not self.purge_provider:
            logger.warning("No CDN provider configured, skipping purge_all")
            return False
        return await self.purge_provider.purge_all()

    async def purge_urls(self, urls: List[str]) -> bool:
        """Purge specific URLs."""
        if not self.purge_provider:
            logger.warning("No CDN provider configured, skipping purge_urls")
            return False
        return await self.purge_provider.purge_urls(urls)

    async def purge_tags(self, tags: List[str]) -> bool:
        """Purge specific tags."""
        if not self.purge_provider:
            logger.warning("No CDN provider configured, skipping purge_tags")
            return False
        return await self.purge_provider.purge_tags(tags)

    def optimize_directory(self, directory: str) -> dict:
        """Run optimization on a directory."""
        return self.optimizer.optimize_assets(directory)
