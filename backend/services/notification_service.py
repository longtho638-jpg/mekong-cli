"""
Notification Service
====================

High-level service for managing notifications.
- Persists notifications to Database via SQLAlchemy.
- Delegates delivery to NotificationOrchestrator (Email, Push, In-App).
- Provides helper methods for common business events (Welcome, Payment, etc.).

Refactored for IPO-051 (Database-backed).
"""

import logging
from typing import Dict, List, Optional, Any
from datetime import datetime

from sqlalchemy import select, func, update, and_
from sqlalchemy.orm import Session

from backend.models.notification import Notification
from backend.services.notification_orchestrator import get_notification_orchestrator, NotificationPriority

logger = logging.getLogger(__name__)

# Re-export or redefine Enum if needed.
# The previous service had its own Enum. We should align with the codebase.
# For now, we'll keep the Enum here for compatibility or move it to a shared location.
from enum import Enum

class NotificationType(Enum):
    WELCOME = "welcome"
    PAYMENT_SUCCESS = "payment_success"
    PAYMENT_FAILED = "payment_failed"
    LICENSE_EXPIRY_WARNING = "license_expiry_warning"
    FEATURE_ANNOUNCEMENT = "feature_announcement"
    SYSTEM_ALERT = "system_alert"

class NotificationService:
    """
    Database-backed Notification Service.
    """

    def __init__(self):
        self.orchestrator = get_notification_orchestrator()

    async def send_notification(
        self,
        db: Session,
        user_id: str,
        notification_type: NotificationType,
        title: str,
        message: str,
        data: Optional[Dict[str, Any]] = None,
        priority: NotificationPriority = NotificationPriority.NORMAL
    ) -> Notification:
        """
        Send a notification via Orchestrator (handles multi-channel delivery & persistence).
        """
        # Orchestrator handles creation of DB record and dispatching
        # We pass the 'type' as string value of the Enum
        result = await self.orchestrator.send_notification(
            db=db,
            user_id=user_id,
            type=notification_type.value,
            title=title,
            message=message,
            data=data or {},
            priority=priority
        )

        # orchestrator.send_notification returns a dict with status or id?
        # Looking at orchestrator code: it creates DB record.
        # But send_notification returns a dict of results currently.
        # We might want to fetch the created notification to return it,
        # but the orchestrator doesn't currently return the ID clearly in the return value (it creates it internally).

        # Let's assume for now we just want to ensure it was created.
        # Ideally Orchestrator should return the Notification object or ID.
        # For this refactor, we can fetch the latest notification for the user to return it,
        # or update Orchestrator to return ID.

        # For efficiency, let's just return a placeholder or fetch latest.
        # Fetching latest:
        stmt = select(Notification).where(
            Notification.user_id == user_id
        ).order_by(Notification.created_at.desc()).limit(1)
        notification = db.execute(stmt).scalar_one_or_none()

        return notification

    def get_user_notifications(
        self,
        db: Session,
        user_id: str,
        unread_only: bool = False,
        limit: int = 50,
        offset: int = 0
    ) -> List[Notification]:
        """
        Get notifications for a user from DB.
        """
        stmt = select(Notification).where(Notification.user_id == user_id)

        if unread_only:
            stmt = stmt.where(Notification.read.is_(False))

        stmt = stmt.order_by(Notification.created_at.desc()).limit(limit).offset(offset)
        result = db.execute(stmt)
        return result.scalars().all()

    def mark_as_read(self, db: Session, user_id: str, notification_id: str) -> bool:
        """
        Mark a specific notification as read.
        """
        stmt = update(Notification).where(
            and_(
                Notification.id == notification_id,
                Notification.user_id == user_id
            )
        ).values(read=True)

        result = db.execute(stmt)
        db.commit()

        return result.rowcount > 0

    def mark_all_as_read(self, db: Session, user_id: str) -> int:
        """
        Mark all notifications as read for a user.
        """
        stmt = update(Notification).where(
            and_(
                Notification.user_id == user_id,
                Notification.read.is_(False)
            )
        ).values(read=True)

        result = db.execute(stmt)
        db.commit()

        return result.rowcount

    def get_unread_count(self, db: Session, user_id: str) -> int:
        """
        Get count of unread notifications.
        """
        stmt = select(func.count()).select_from(Notification).where(
            and_(
                Notification.user_id == user_id,
                Notification.read.is_(False)
            )
        )
        return db.execute(stmt).scalar() or 0

    # --- High-Level Business Events ---

    async def send_welcome_notification(self, db: Session, user_id: str, username: str) -> Notification:
        return await self.send_notification(
            db=db,
            user_id=user_id,
            notification_type=NotificationType.WELCOME,
            title="Welcome to Mekong CLI! 🎉",
            message=f"Hi {username}! Thanks for joining us. Get started by exploring our features.",
            data={"username": username},
            priority=NotificationPriority.HIGH # Welcome is important
        )

    async def send_payment_success_notification(
        self,
        db: Session,
        user_id: str,
        amount: float,
        currency: str = "USD",
        transaction_id: Optional[str] = None
    ) -> Notification:
        return await self.send_notification(
            db=db,
            user_id=user_id,
            notification_type=NotificationType.PAYMENT_SUCCESS,
            title="Payment Successful ✅",
            message=f"Your payment of {currency} {amount:.2f} has been processed successfully.",
            data={
                "amount": amount,
                "currency": currency,
                "transaction_id": transaction_id
            },
            priority=NotificationPriority.HIGH
        )

    async def send_payment_failure_notification(
        self,
        db: Session,
        user_id: str,
        amount: float,
        currency: str = "USD",
        reason: str = "Unknown error",
        invoice_url: Optional[str] = None
    ) -> Notification:
        return await self.send_notification(
            db=db,
            user_id=user_id,
            notification_type=NotificationType.PAYMENT_FAILED,
            title="Payment Failed ❌",
            message=f"We could not process your payment of {currency} {amount:.2f}. Please update your payment method.",
            data={
                "amount": amount,
                "currency": currency,
                "reason": reason,
                "invoice_url": invoice_url
            },
            priority=NotificationPriority.CRITICAL
        )

    async def send_license_expiry_warning(
        self,
        db: Session,
        user_id: str,
        days_remaining: int,
        license_type: str = "Premium"
    ) -> Notification:
        priority = NotificationPriority.CRITICAL if days_remaining <= 3 else NotificationPriority.HIGH
        return await self.send_notification(
            db=db,
            user_id=user_id,
            notification_type=NotificationType.LICENSE_EXPIRY_WARNING,
            title="License Expiring Soon ⚠️",
            message=f"Your {license_type} license will expire in {days_remaining} days. Renew now.",
            data={
                "days_remaining": days_remaining,
                "license_type": license_type
            },
            priority=priority
        )

    async def send_feature_announcement(
        self,
        db: Session,
        user_id: str,
        feature_name: str,
        feature_description: str,
        learn_more_url: Optional[str] = None
    ) -> Notification:
        return await self.send_notification(
            db=db,
            user_id=user_id,
            notification_type=NotificationType.FEATURE_ANNOUNCEMENT,
            title=f"New Feature: {feature_name} 🚀",
            message=feature_description,
            data={
                "feature_name": feature_name,
                "learn_more_url": learn_more_url
            },
            priority=NotificationPriority.NORMAL # Marketing
        )

# Global notification service instance
notification_service = NotificationService()
