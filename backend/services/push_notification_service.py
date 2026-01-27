"""
Push Notification Service
=========================

Handles sending web push notifications using provider strategies.
Currently supports WebPush (VAPID), designed for extension to FCM/APNs.
"""

import logging
from typing import Any, Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.models.notification import PushSubscription
from backend.services.push_providers import (
    PushMessage,
    PushProvider,
    PushSubscriptionInfo,
    WebPushProvider,
)

logger = logging.getLogger(__name__)


class PushNotificationService:
    """
    High-level push notification service.
    Manages subscriptions and delegates sending to specific providers.
    """

    def __init__(self):
        # In the future, this could select provider based on config (e.g. FCM vs WebPush)
        self.provider: PushProvider = WebPushProvider()

    def _get_subscriptions(self, db: Session, user_id: str) -> List[PushSubscription]:
        """Get all push subscriptions for a user."""
        result = db.execute(
            select(PushSubscription).where(PushSubscription.user_id == user_id)
        )
        return result.scalars().all()

    def _delete_subscription(self, db: Session, endpoint: str):
        """Delete an expired or invalid subscription."""
        try:
            sub = db.execute(
                select(PushSubscription).where(PushSubscription.endpoint == endpoint)
            ).scalar_one_or_none()

            if sub:
                db.delete(sub)
                db.commit()
                logger.info(f"Deleted invalid subscription: {endpoint[:20]}...")
        except Exception as e:
            logger.error(f"Error deleting subscription: {e}")
            db.rollback()

    async def send(
        self,
        db: Session,
        user_id: str,
        title: str,
        message: str,
        data: Optional[Dict] = None,
        icon: Optional[str] = "/icons/icon-192.png",
        badge: Optional[str] = "/icons/badge-72.png"
    ) -> Dict[str, Any]:
        """
        Send push notification to all user devices.
        Returns a summary of results.
        """
        results = {
            "success": 0,
            "failure": 0,
            "removed": 0,
            "details": []
        }

        subscriptions = self._get_subscriptions(db, user_id)
        if not subscriptions:
            return {"status": "skipped", "reason": "no_subscriptions"}

        # Prepare abstract message
        push_message = PushMessage(
            title=title,
            body=message,
            icon=icon,
            badge=badge,
            data=data or {}
        )

        for sub in subscriptions:
            # Map DB model to Pydantic model
            sub_info = PushSubscriptionInfo(
                endpoint=sub.endpoint,
                keys={
                    "p256dh": sub.p256dh,
                    "auth": sub.auth
                }
            )

            try:
                response = await self.provider.send_push(sub_info, push_message)

                status = response.get("status")

                if status == "success":
                    results["success"] += 1
                    logger.debug(f"Push sent to user {user_id} device {sub.id}")

                elif status == "failed" and response.get("error") == "gone":
                    self._delete_subscription(db, sub.endpoint)
                    results["removed"] += 1
                    logger.info(f"Subscription expired for user {user_id}, removed.")

                else:
                    results["failure"] += 1
                    logger.warning(f"Push failed for user {user_id}: {response.get('error')}")

                results["details"].append(response)

            except Exception as e:
                logger.error(f"Unexpected error sending push to {user_id}: {e}")
                results["failure"] += 1
                results["details"].append({"status": "error", "error": str(e)})

        return results

# Global instance
push_notification_service = PushNotificationService()
