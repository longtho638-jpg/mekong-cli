import os
import json
import logging
from typing import Dict, Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import select

from backend.models.notification import PushSubscription

try:
    from pywebpush import webpush, WebPushException
    PYWEBPUSH_AVAILABLE = True
except ImportError:
    PYWEBPUSH_AVAILABLE = False

logger = logging.getLogger(__name__)

class PushNotificationService:
    def __init__(self):
        self.vapid_private_key = os.getenv('VAPID_PRIVATE_KEY')
        self.vapid_public_key = os.getenv('VAPID_PUBLIC_KEY')
        self.admin_email = os.getenv('VAPID_ADMIN_EMAIL', 'mailto:admin@example.com')

    def _get_subscriptions(self, db: Session, user_id: str) -> List[PushSubscription]:
        """Get all push subscriptions for a user"""
        result = db.execute(
            select(PushSubscription).where(PushSubscription.user_id == user_id)
        )
        return result.scalars().all()

    def _delete_subscription(self, db: Session, endpoint: str):
        """Delete an expired or invalid subscription"""
        db.execute(
            select(PushSubscription).where(PushSubscription.endpoint == endpoint)
        ).delete() # This might need to be db.delete(obj)
        # Correct way with SQLAlchemy select/delete
        sub = db.execute(select(PushSubscription).where(PushSubscription.endpoint == endpoint)).scalar_one_or_none()
        if sub:
            db.delete(sub)
            db.commit()

    async def send(self, db: Session, user_id: str, title: str, message: str, metadata: Optional[Dict] = None):
        """
        Send push notification to all user devices.
        """
        if not PYWEBPUSH_AVAILABLE:
            logger.warning("pywebpush not installed. Skipping push notification.")
            return

        if not self.vapid_private_key:
            logger.warning("VAPID keys not configured. Skipping push notification.")
            return

        subscriptions = self._get_subscriptions(db, user_id)
        if not subscriptions:
            logger.info(f"No push subscriptions found for user {user_id}")
            return

        payload = json.dumps({
            'title': title,
            'body': message,
            'icon': '/icons/icon-192.png',
            'badge': '/icons/badge-72.png',
            'data': metadata or {},
        })

        for sub in subscriptions:
            subscription_info = {
                "endpoint": sub.endpoint,
                "keys": {
                    "p256dh": sub.p256dh,
                    "auth": sub.auth
                }
            }

            try:
                webpush(
                    subscription_info=subscription_info,
                    data=payload,
                    vapid_private_key=self.vapid_private_key,
                    vapid_claims={'sub': self.admin_email},
                )
                logger.info(f"Push notification sent to {user_id} (device: {sub.id})")
            except WebPushException as e:
                if e.response and e.response.status_code == 410:
                    logger.info(f"Subscription expired for user {user_id}, removing.")
                    self._delete_subscription(db, sub.endpoint)
                else:
                    logger.error(f"WebPush failed for user {user_id}: {str(e)}")
            except Exception as e:
                logger.error(f"Unexpected error sending push to {user_id}: {str(e)}")
