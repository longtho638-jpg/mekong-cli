"""
Meilisearch Client Wrapper
==========================

Singleton client for Meilisearch interaction.
Handles connection, error handling, and basic health checks.
"""

import logging
from typing import Optional

import meilisearch
from meilisearch.errors import MeilisearchError

from backend.api.config.settings import settings

logger = logging.getLogger(__name__)

class MeilisearchClient:
    """
    Singleton wrapper for Meilisearch client.
    """
    _instance: Optional['MeilisearchClient'] = None
    _client: Optional[meilisearch.Client] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MeilisearchClient, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        """Initialize the Meilisearch client."""
        try:
            self._client = meilisearch.Client(
                settings.meilisearch_url,
                settings.meilisearch_master_key
            )
            logger.info(f"Initialized Meilisearch client at {settings.meilisearch_url}")
        except Exception as e:
            logger.error(f"Failed to initialize Meilisearch client: {e}")
            self._client = None

    @property
    def client(self) -> meilisearch.Client:
        """Get the raw Meilisearch client."""
        if self._client is None:
            self._initialize()
        if self._client is None:
            raise RuntimeError("Meilisearch client is not available")
        return self._client

    def is_healthy(self) -> bool:
        """Check if Meilisearch is healthy."""
        try:
            return self.client.is_healthy()
        except Exception:
            return False

    def get_version(self) -> dict:
        """Get Meilisearch version."""
        try:
            return self.client.get_version()
        except Exception as e:
            logger.error(f"Error getting Meilisearch version: {e}")
            return {}

def get_meilisearch_client() -> MeilisearchClient:
    """Dependency provider for Meilisearch client."""
    return MeilisearchClient()
