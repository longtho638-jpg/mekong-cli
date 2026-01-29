"""
Notification Orchestrator
=========================

Coordinates the delivery of notifications across multiple channels (Push, Email, SMS)
based on user preferences and priority.

Ch.9 行軍 (Marching/Logistics) - "Reliable delivery infrastructure"
"""

import logging
from enum import Enum
from typing import Any, Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.models.notification import (
    Notification,
    NotificationDelivery,
    UserNotificationPreferences,
)
from backend.services.email_service import get_email_service
from backend.services.notification_rate_limiter import get_notification_rate_limiter
from backend.services.push_notification_service import PushNotificationService
from backend.services.template_service import get_template_service

logger = logging.getLogger(__name__)


class NotificationPriority(Enum):
    LOW = "low"  # Marketing
    NORMAL = "normal"  # Transactional
    HIGH = "high"  # Security alerts, OTPs
    CRITICAL = "critical"  # System outage, urgent action


class NotificationChannel(Enum):
    PUSH = "push"
    EMAIL = "email"
    SMS = "sms"
    IN_APP = "in_app"


class NotificationOrchestrator:
    def __init__(self):
        self.email_service = get_email_service()
        self.push_service = PushNotificationService()
        self.template_service = get_template_service()
        self.rate_limiter = get_notification_rate_limiter()

    async def send_notification(
        self,
        db: Session,
        user_id: str,
        type: str,
        title: str,
        message: str,
        data: Optional[Dict[str, Any]] = None,
        priority: NotificationPriority = NotificationPriority.NORMAL,
        channels: Optional[List[NotificationChannel]] = None,
        template_name: Optional[str] = None,
        template_context: Optional[Dict[str, Any]] = None,
    ):
        """
        Orchestrate notification delivery.

        1. Check user preferences.
        2. Resolve channels (if not specified).
        3. Dispatch to providers.
        4. Log delivery.
        """
        # 1. Get User Preferences
        preferences = self._get_user_preferences(db, user_id)

        # 2. Check Quiet Hours (unless Critical)
        if priority != NotificationPriority.CRITICAL and self._is_quiet_hours(preferences):
            logger.info(f"Notification suppressed due to quiet hours for user {user_id}")
            # Log as skipped? Or just return?
            # Creating DB notification but marking delivery as skipped
            notification_id = self._create_db_notification(db, user_id, type, title, message, data)
            self._log_delivery(db, notification_id, "all", "skipped_quiet_hours")
            return {"status": "skipped", "reason": "quiet_hours"}

        # 3. Resolve Channels
        target_channels = channels or self._resolve_channels(preferences, type, priority)

        # 4. Create In-App Notification (Always, unless explicitly excluded)
        # In-App is usually persistent, so we create the record.
        notification_id = self._create_db_notification(db, user_id, type, title, message, data)

        results = {}

        # 5. Dispatch
        for channel in target_channels:
            channel_name = channel.value

            # Check Rate Limit
            if not await self.rate_limiter.check_limit(user_id, channel_name):
                results[channel_name] = "rate_limited"
                self._log_delivery(db, notification_id, channel_name, "failed_rate_limit")
                continue

            try:
                if channel == NotificationChannel.PUSH:
                    if preferences.push_enabled:
                        await self.push_service.send(db, user_id, title, message, data)
                        self._log_delivery(db, notification_id, "push", "sent")
                        results["push"] = "sent"
                    else:
                        results["push"] = "skipped_pref"

                elif channel == NotificationChannel.EMAIL:
                    if preferences.email_enabled:
                        # Use template if provided
                        email_html = message
                        if template_name:
                            email_html = await self.template_service.render_template(
                                template_name, template_context or {}
                            )

                        # Get user email
                        # First check data
                        user_email = data.get("email") if data else None

                        if not user_email:
                            # TODO: Fetch user email from DB using user_id
                            # Currently User model is Pydantic, need SQLAlchemy model for DB lookup
                            # For now, we rely on email being passed in data
                            logger.warning(
                                f"No email found in data for user {user_id} and DB lookup not implemented"
                            )

                        if user_email:
                            await self.email_service.send_email(
                                to_email=user_email, subject=title, html_content=email_html
                            )
                            self._log_delivery(db, notification_id, "email", "sent")
                            results["email"] = "sent"
                        else:
                            logger.warning(f"No email found for user {user_id}")
                            self._log_delivery(
                                db, notification_id, "email", "failed", error="no_email_found"
                            )
                            results["email"] = "failed_no_email"
                    else:
                        results["email"] = "skipped_pref"

                elif channel == NotificationChannel.IN_APP:
                    # Already created DB record, so just mark as sent/available
                    results["in_app"] = "saved"

            except Exception as e:
                logger.error(f"Failed to send {channel_name} to {user_id}: {e}")
                self._log_delivery(db, notification_id, channel_name, "failed", error=str(e))
                results[channel_name] = f"failed: {e}"

        return results

    def _is_quiet_hours(self, prefs: UserNotificationPreferences) -> bool:
        """Check if current time is within user's quiet hours."""
        if not prefs.quiet_hours_enabled:
            return False

        try:
            from datetime import datetime

            import pytz

            # Assuming server time for now, ideally user timezone
            # TODO: Add timezone support to UserNotificationPreferences
            now = datetime.now(pytz.UTC)
            current_time = now.strftime("%H:%M")

            start = prefs.quiet_hours_start
            end = prefs.quiet_hours_end

            if start <= end:
                return start <= current_time <= end
            else:
                # Crosses midnight (e.g. 22:00 to 08:00)
                return current_time >= start or current_time <= end
        except Exception as e:
            logger.error(f"Error checking quiet hours: {e}")
            return False

    def _get_user_preferences(self, db: Session, user_id: str) -> UserNotificationPreferences:
        """Fetch user preferences or return defaults."""
        prefs = db.execute(
            select(UserNotificationPreferences).where(
                UserNotificationPreferences.user_id == user_id
            )
        ).scalar_one_or_none()

        if not prefs:
            # Return default preferences object (not saved to DB yet)
            return UserNotificationPreferences(
                user_id=user_id, email_enabled=True, push_enabled=True, sms_enabled=False
            )
        return prefs

    def _resolve_channels(
        self, prefs: UserNotificationPreferences, type: str, priority: NotificationPriority
    ) -> List[NotificationChannel]:
        """Determine which channels to use based on type and priority."""

        # Critical alerts always go everywhere possible
        if priority == NotificationPriority.CRITICAL:
            return [NotificationChannel.PUSH, NotificationChannel.EMAIL, NotificationChannel.SMS]

        # Check specific channel preferences in JSONB
        # This logic can be expanded based on the 'channels' column structure
        # e.g., prefs.channels.get(type, ["email"])

        defaults = [NotificationChannel.IN_APP]

        if prefs.email_enabled:
            defaults.append(NotificationChannel.EMAIL)

        if prefs.push_enabled:
            defaults.append(NotificationChannel.PUSH)

        return defaults

    def _create_db_notification(
        self, db: Session, user_id: str, type: str, title: str, message: str, data: Dict
    ) -> str:
        """Persist notification to database."""
        notification = Notification(
            user_id=user_id, notification_type=type, title=title, message=message, metadata_=data
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        return str(notification.id)

    def _log_delivery(
        self,
        db: Session,
        notification_id: str,
        channel: str,
        status: str,
        provider: str = None,
        error: str = None,
    ):
        """Log delivery attempt."""
        delivery = NotificationDelivery(
            notification_id=notification_id,
            channel=channel,
            status=status,
            provider=provider,
            error_message=error,
        )
        db.add(delivery)
        db.commit()


# Global instance
_orchestrator: Optional[NotificationOrchestrator] = None


def get_notification_orchestrator() -> NotificationOrchestrator:
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = NotificationOrchestrator()
    return _orchestrator
