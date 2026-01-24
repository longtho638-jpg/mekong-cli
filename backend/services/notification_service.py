"""
Push Notification Service

Handles sending push notifications to users and managing notification state.
Features:
- Welcome notifications on signup
- Payment success notifications
- License expiry warnings (7 days before)
- New feature announcements
- In-memory notification storage with read status
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional
from enum import Enum


class NotificationType(Enum):
    """Notification type enumeration"""
    WELCOME = "welcome"
    PAYMENT_SUCCESS = "payment_success"
    LICENSE_EXPIRY_WARNING = "license_expiry_warning"
    FEATURE_ANNOUNCEMENT = "feature_announcement"


class Notification:
    """Notification data model"""

    def __init__(
        self,
        notification_id: str,
        user_id: str,
        notification_type: NotificationType,
        title: str,
        message: str,
        data: Optional[Dict] = None
    ):
        self.notification_id = notification_id
        self.user_id = user_id
        self.notification_type = notification_type
        self.title = title
        self.message = message
        self.data = data or {}
        self.created_at = datetime.utcnow()
        self.read = False
        self.read_at: Optional[datetime] = None

    def mark_as_read(self) -> None:
        """Mark notification as read"""
        self.read = True
        self.read_at = datetime.utcnow()

    def to_dict(self) -> Dict:
        """Convert notification to dictionary"""
        return {
            "notification_id": self.notification_id,
            "user_id": self.user_id,
            "type": self.notification_type.value,
            "title": self.title,
            "message": self.message,
            "data": self.data,
            "created_at": self.created_at.isoformat(),
            "read": self.read,
            "read_at": self.read_at.isoformat() if self.read_at else None
        }


class NotificationService:
    """
    Push Notification Service

    Manages push notifications with in-memory storage.
    Supports multiple notification types and read tracking.
    """

    def __init__(self):
        # In-memory storage: {user_id: [Notification, ...]}
        self._notifications: Dict[str, List[Notification]] = {}
        self._notification_counter = 0

    def _generate_notification_id(self) -> str:
        """Generate unique notification ID"""
        self._notification_counter += 1
        return f"notif_{self._notification_counter}_{datetime.utcnow().timestamp()}"

    def send_notification(
        self,
        user_id: str,
        notification_type: NotificationType,
        title: str,
        message: str,
        data: Optional[Dict] = None
    ) -> Notification:
        """
        Send a push notification to a user

        Args:
            user_id: Target user ID
            notification_type: Type of notification
            title: Notification title
            message: Notification message
            data: Additional notification data (optional)

        Returns:
            Created Notification object
        """
        notification_id = self._generate_notification_id()
        notification = Notification(
            notification_id=notification_id,
            user_id=user_id,
            notification_type=notification_type,
            title=title,
            message=message,
            data=data
        )

        # Store notification
        if user_id not in self._notifications:
            self._notifications[user_id] = []
        self._notifications[user_id].append(notification)

        # In a real implementation, this would send the push notification
        # via FCM, APNs, or another push service
        print(f"[NOTIFICATION] Sent {notification_type.value} to user {user_id}: {title}")

        return notification

    def get_user_notifications(
        self,
        user_id: str,
        unread_only: bool = False
    ) -> List[Notification]:
        """
        Get all notifications for a user

        Args:
            user_id: User ID
            unread_only: If True, return only unread notifications

        Returns:
            List of notifications
        """
        notifications = self._notifications.get(user_id, [])

        if unread_only:
            notifications = [n for n in notifications if not n.read]

        # Sort by created_at descending (newest first)
        return sorted(notifications, key=lambda n: n.created_at, reverse=True)

    def mark_as_read(self, user_id: str, notification_id: str) -> bool:
        """
        Mark a notification as read

        Args:
            user_id: User ID
            notification_id: Notification ID

        Returns:
            True if notification was marked as read, False if not found
        """
        notifications = self._notifications.get(user_id, [])

        for notification in notifications:
            if notification.notification_id == notification_id:
                notification.mark_as_read()
                return True

        return False

    def mark_all_as_read(self, user_id: str) -> int:
        """
        Mark all notifications as read for a user

        Args:
            user_id: User ID

        Returns:
            Number of notifications marked as read
        """
        notifications = self._notifications.get(user_id, [])
        count = 0

        for notification in notifications:
            if not notification.read:
                notification.mark_as_read()
                count += 1

        return count

    def get_unread_count(self, user_id: str) -> int:
        """
        Get count of unread notifications for a user

        Args:
            user_id: User ID

        Returns:
            Count of unread notifications
        """
        notifications = self._notifications.get(user_id, [])
        return sum(1 for n in notifications if not n.read)

    # Helper methods for specific notification types

    def send_welcome_notification(self, user_id: str, username: str) -> Notification:
        """
        Send welcome notification on user signup

        Args:
            user_id: New user ID
            username: User's name

        Returns:
            Created notification
        """
        return self.send_notification(
            user_id=user_id,
            notification_type=NotificationType.WELCOME,
            title="Welcome to Mekong CLI! 🎉",
            message=f"Hi {username}! Thanks for joining us. Get started by exploring our features.",
            data={"username": username}
        )

    def send_payment_success_notification(
        self,
        user_id: str,
        amount: float,
        currency: str = "USD",
        transaction_id: Optional[str] = None
    ) -> Notification:
        """
        Send payment success notification

        Args:
            user_id: User ID
            amount: Payment amount
            currency: Currency code (default: USD)
            transaction_id: Transaction ID (optional)

        Returns:
            Created notification
        """
        return self.send_notification(
            user_id=user_id,
            notification_type=NotificationType.PAYMENT_SUCCESS,
            title="Payment Successful ✅",
            message=f"Your payment of {currency} {amount:.2f} has been processed successfully.",
            data={
                "amount": amount,
                "currency": currency,
                "transaction_id": transaction_id
            }
        )

    def send_license_expiry_warning(
        self,
        user_id: str,
        days_remaining: int,
        license_type: str = "Premium"
    ) -> Notification:
        """
        Send license expiry warning (7 days before expiration)

        Args:
            user_id: User ID
            days_remaining: Days until license expires
            license_type: Type of license (default: Premium)

        Returns:
            Created notification
        """
        return self.send_notification(
            user_id=user_id,
            notification_type=NotificationType.LICENSE_EXPIRY_WARNING,
            title=f"License Expiring Soon ⚠️",
            message=f"Your {license_type} license will expire in {days_remaining} days. Renew now to avoid service interruption.",
            data={
                "days_remaining": days_remaining,
                "license_type": license_type,
                "expiry_date": (datetime.utcnow() + timedelta(days=days_remaining)).isoformat()
            }
        )

    def send_feature_announcement(
        self,
        user_id: str,
        feature_name: str,
        feature_description: str,
        learn_more_url: Optional[str] = None
    ) -> Notification:
        """
        Send new feature announcement

        Args:
            user_id: User ID
            feature_name: Name of the new feature
            feature_description: Brief description
            learn_more_url: URL for more information (optional)

        Returns:
            Created notification
        """
        return self.send_notification(
            user_id=user_id,
            notification_type=NotificationType.FEATURE_ANNOUNCEMENT,
            title=f"New Feature: {feature_name} 🚀",
            message=feature_description,
            data={
                "feature_name": feature_name,
                "learn_more_url": learn_more_url
            }
        )

    def broadcast_feature_announcement(
        self,
        user_ids: List[str],
        feature_name: str,
        feature_description: str,
        learn_more_url: Optional[str] = None
    ) -> List[Notification]:
        """
        Broadcast feature announcement to multiple users

        Args:
            user_ids: List of user IDs
            feature_name: Name of the new feature
            feature_description: Brief description
            learn_more_url: URL for more information (optional)

        Returns:
            List of created notifications
        """
        notifications = []
        for user_id in user_ids:
            notification = self.send_feature_announcement(
                user_id=user_id,
                feature_name=feature_name,
                feature_description=feature_description,
                learn_more_url=learn_more_url
            )
            notifications.append(notification)

        return notifications

    def cleanup_old_notifications(self, days: int = 30) -> int:
        """
        Remove notifications older than specified days

        Args:
            days: Age threshold in days (default: 30)

        Returns:
            Number of notifications removed
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        removed_count = 0

        for user_id in list(self._notifications.keys()):
            original_count = len(self._notifications[user_id])
            self._notifications[user_id] = [
                n for n in self._notifications[user_id]
                if n.created_at > cutoff_date
            ]
            removed_count += original_count - len(self._notifications[user_id])

            # Remove user entry if no notifications left
            if not self._notifications[user_id]:
                del self._notifications[user_id]

        return removed_count


# Global notification service instance
notification_service = NotificationService()
