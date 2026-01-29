"""
Notification Analytics Service
==============================

Aggregates delivery metrics for notifications.
"""

from typing import Any, Dict, List

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from backend.models.notification import Notification, NotificationDelivery


class NotificationAnalyticsService:
    def get_delivery_stats(self, db: Session, days: int = 30) -> Dict[str, Any]:
        """
        Get delivery statistics for the last N days.
        """
        # Total sent
        total_sent = db.scalar(select(func.count(NotificationDelivery.id)))

        # Breakdown by channel
        channel_stats = db.execute(
            select(
                NotificationDelivery.channel, func.count(NotificationDelivery.id).label("count")
            ).group_by(NotificationDelivery.channel)
        ).all()

        # Breakdown by status
        status_stats = db.execute(
            select(
                NotificationDelivery.status, func.count(NotificationDelivery.id).label("count")
            ).group_by(NotificationDelivery.status)
        ).all()

        # Success rate (sent vs failed)
        success_count = 0
        failed_count = 0
        for status, count in status_stats:
            if status == "sent":
                success_count += count
            elif status == "failed":
                failed_count += count

        success_rate = 0
        if (success_count + failed_count) > 0:
            success_rate = (success_count / (success_count + failed_count)) * 100

        return {
            "total_sent": total_sent,
            "channels": {channel: count for channel, count in channel_stats},
            "statuses": {status: count for status, count in status_stats},
            "success_rate": round(success_rate, 2),
        }

    def get_daily_trends(self, db: Session, days: int = 7) -> List[Dict[str, Any]]:
        """
        Get daily notification volume for the last N days.
        """
        # This requires date truncation which depends on DB (Postgres)
        # Assuming Postgres for now
        trunc_date = func.date_trunc("day", NotificationDelivery.created_at)

        trends = db.execute(
            select(trunc_date.label("date"), func.count(NotificationDelivery.id).label("count"))
            .group_by(trunc_date)
            .order_by(trunc_date.desc())
            .limit(days)
        ).all()

        return [{"date": date.isoformat(), "count": count} for date, count in trends]


# Global instance
_analytics_service = NotificationAnalyticsService()


def get_notification_analytics_service():
    return _analytics_service
