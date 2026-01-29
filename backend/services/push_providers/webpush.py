import json
import logging
from typing import Any, Dict

from pywebpush import WebPushException, webpush

from backend.api.config import settings
from backend.services.push_providers.base import PushMessage, PushProvider, PushSubscriptionInfo

logger = logging.getLogger(__name__)


class WebPushProvider(PushProvider):
    def __init__(self):
        self.private_key = settings.vapid_private_key
        self.public_key = settings.vapid_public_key
        self.claims_email = settings.vapid_claims_email

    async def validate_config(self) -> bool:
        if not self.private_key or not self.public_key:
            logger.warning("WebPushProvider: VAPID keys not configured.")
            return False
        return True

    async def send_push(
        self, subscription: PushSubscriptionInfo, message: PushMessage
    ) -> Dict[str, Any]:
        """
        Send a web push notification using VAPID.
        """
        if not await self.validate_config():
            return {"status": "skipped", "reason": "configuration_missing"}

        # Prepare payload
        payload_data = message.model_dump(exclude_none=True)
        # WebPush payload standard format
        payload = json.dumps(payload_data)

        subscription_info = {"endpoint": subscription.endpoint, "keys": subscription.keys}

        try:
            # webpush is synchronous/blocking in pywebpush.
            # For high scale, run in loop.run_in_executor
            # For now, keeping it simple as per original service.
            webpush(
                subscription_info=subscription_info,
                data=payload,
                vapid_private_key=self.private_key,
                vapid_claims={"sub": self.claims_email},
                ttl=message.ttl,
            )
            return {"status": "success", "provider": "webpush"}

        except WebPushException as e:
            if e.response and e.response.status_code == 410:
                # 410 Gone - subscription expired
                return {"status": "failed", "error": "gone", "provider": "webpush"}

            logger.error(f"WebPush error: {str(e)}")
            return {"status": "failed", "error": str(e), "provider": "webpush"}

        except Exception as e:
            logger.error(f"Unexpected WebPush error: {str(e)}")
            raise
