from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

from pydantic import BaseModel


class PushMessage(BaseModel):
    title: str
    body: str
    icon: Optional[str] = None
    badge: Optional[str] = None
    image: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    actions: Optional[list] = None
    tag: Optional[str] = None
    ttl: int = 60 * 60 * 24  # 24 hours default


class PushSubscriptionInfo(BaseModel):
    endpoint: str
    keys: Dict[str, str]  # p256dh, auth
    provider: str = "webpush"  # webpush, fcm_token, apns_token


class PushProvider(ABC):
    """Abstract base class for push notification providers"""

    @abstractmethod
    async def send_push(self, subscription: PushSubscriptionInfo, message: PushMessage) -> Dict[str, Any]:
        """
        Send a push notification.
        Returns provider-specific response dict.
        Should raise PushError (or subclass) on failure.
        """
        pass

    @abstractmethod
    async def validate_config(self) -> bool:
        """Validate provider configuration"""
        pass
