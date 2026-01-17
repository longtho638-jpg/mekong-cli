"""
🤖 AI Wingman Repository - Data Access Layer
==============================================

Quản lý lưu trữ notifications và stats cho AI Wingman.
"""

import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from pathlib import Path

try:
    from ..services.ai_wingman_service import Notification, NotificationType
except ImportError:
    from services.ai_wingman_service import Notification, NotificationType

logger = logging.getLogger(__name__)

class AIWingmanRepository:
    """Repository pattern cho AI Wingman data access."""
    
    def __init__(self, storage_path: str = "data/ai_wingman"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self.notifications_file = self.storage_path / "notifications.json"
        self.stats_file = self.storage_path / "stats.json"
        
        logger.info(f"AI Wingman repository initialized at {storage_path}")
    
    def save_notifications(self, notifications: List[Notification]) -> bool:
        """Lưu danh sách notifications."""
        try:
            data = []
            for notif in notifications:
                data.append({
                    "id": notif.id,
                    "type": notif.type.value,
                    "title": notif.title,
                    "message": notif.message,
                    "priority": notif.priority,
                    "timestamp": notif.timestamp.isoformat(),
                    "data": notif.data,
                    "read": notif.read
                })
            
            with open(self.notifications_file, 'w') as f:
                json.dump(data, f, indent=2)
            
            logger.info(f"Saved {len(notifications)} notifications")
            return True
        except Exception as e:
            logger.error(f"Failed to save notifications: {e}")
            return False
    
    def load_notifications(self) -> List[Notification]:
        """Tải danh sách notifications."""
        try:
            if not self.notifications_file.exists():
                return []
            
            with open(self.notifications_file, 'r') as f:
                data = json.load(f)
            
            notifications = []
            for item in data:
                notif = Notification(
                    id=item["id"],
                    type=NotificationType(item["type"]),
                    title=item["title"],
                    message=item["message"],
                    priority=item["priority"],
                    timestamp=datetime.fromisoformat(item["timestamp"]),
                    data=item.get("data", {}),
                    read=item.get("read", False)
                )
                notifications.append(notif)
            
            logger.info(f"Loaded {len(notifications)} notifications")
            return notifications
        except Exception as e:
            logger.error(f"Failed to load notifications: {e}")
            return []
    
    def save_stats(self, stats: Dict[str, Any]) -> bool:
        """Lưu thống kê."""
        try:
            with open(self.stats_file, 'w') as f:
                json.dump(stats, f, indent=2)
            
            logger.info("Stats saved successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to save stats: {e}")
            return False
    
    def load_stats(self) -> Dict[str, Any]:
        """Tải thống kê."""
        try:
            if not self.stats_file.exists():
                return {
                    "inquiries_handled": 0,
                    "proposals_sent": 0,
                    "meetings_scheduled": 0,
                    "revenue_generated": 0.0,
                    "hours_saved": 0
                }
            
            with open(self.stats_file, 'r') as f:
                stats = json.load(f)
            
            logger.info("Stats loaded successfully")
            return stats
        except Exception as e:
            logger.error(f"Failed to load stats: {e}")
            return {
                "inquiries_handled": 0,
                "proposals_sent": 0,
                "meetings_scheduled": 0,
                "revenue_generated": 0.0,
                "hours_saved": 0
            }
    
    def delete_notification(self, notification_id: str) -> bool:
        """Xóa notification theo ID."""
        try:
            notifications = self.load_notifications()
            original_count = len(notifications)
            
            notifications = [n for n in notifications if n.id != notification_id]
            
            if len(notifications) == original_count:
                return False
            
            self.save_notifications(notifications)
            logger.info(f"Deleted notification {notification_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete notification: {e}")
            return False
    
    def get_notifications_by_type(self, notification_type: NotificationType) -> List[Notification]:
        """Lấy notifications theo loại."""
        notifications = self.load_notifications()
        return [n for n in notifications if n.type == notification_type]
    
    def get_notifications_by_date_range(self, start_date: datetime, end_date: datetime) -> List[Notification]:
        """Lấy notifications theo khoảng thời gian."""
        notifications = self.load_notifications()
        return [
            n for n in notifications
            if start_date <= n.timestamp <= end_date
        ]