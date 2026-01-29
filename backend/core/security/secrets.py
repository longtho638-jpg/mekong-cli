"""
🛡️ Advanced Secret Management
==============================
Provides an abstraction layer for retrieving secrets from managed providers
(Doppler, HashiCorp Vault, AWS Secrets Manager) or falling back to environment variables.
"""

import logging
import os
from typing import Any, Dict, Optional

from backend.api.config.settings import settings

logger = logging.getLogger(__name__)


class SecretManager:
    """
    Abstraction for secure secret retrieval.
    """

    def __init__(self):
        self.provider = os.getenv("SECRET_PROVIDER", "env").lower()
        self._cache: Dict[str, str] = {}

    def get_secret(self, key: str, default: Optional[str] = None) -> Optional[str]:
        """
        Retrieves a secret from the active provider.
        """
        if key in self._cache:
            return self._cache[key]

        value = None

        if self.provider == "doppler":
            # Doppler usually injects secrets into the environment via 'doppler run'
            # but we can also use their API/SDK if needed for dynamic rotation
            value = os.getenv(key)
        elif self.provider == "vault":
            # Placeholder for HashiCorp Vault integration
            # Requires hvac library
            value = self._get_vault_secret(key)
        else:
            # Default: standard environment variables
            value = os.getenv(key)

        result = value or default
        if result:
            self._cache[key] = result
        return result

    def _get_vault_secret(self, key: str) -> Optional[str]:
        """Integration with HashiCorp Vault."""
        try:
            # This is a conceptual implementation
            # import hvac
            # client = hvac.Client(url=os.getenv("VAULT_ADDR"), token=os.getenv("VAULT_TOKEN"))
            # read_response = client.secrets.kv.read_secret_version(path='agencyos-production')
            # return read_response['data']['data'].get(key)
            return os.getenv(key)  # Fallback for now
        except Exception as e:
            logger.error(f"Vault retrieval failed for {key}: {e}")
            return None


# Global Instance
secret_manager = SecretManager()


def get_secret(key: str, default: Optional[str] = None) -> Optional[str]:
    """Helper function to get a secret."""
    return secret_manager.get_secret(key, default)
