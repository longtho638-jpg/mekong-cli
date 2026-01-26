from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class WebhookVerifier(ABC):
    @abstractmethod
    def verify(self, payload: bytes, headers: Dict[str, Any], secret: str) -> bool:
        """
        Verify the webhook signature.

        Args:
            payload: Raw request body bytes
            headers: Request headers
            secret: Webhook secret key

        Returns:
            bool: True if valid, False otherwise
        """
        pass
