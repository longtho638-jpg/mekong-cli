"""
🤖 AI Wingman Service - Core Business Logic
============================================

Unified AI service with provider abstraction for 24/7 agency automation.
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from enum import Enum
from dataclasses import dataclass, field
from abc import ABC, abstractmethod
from core.ai.llm import LLMClient

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class WingmanMode(Enum):
    """Chế độ hoạt động của AI Wingman."""
    PASSIVE = "passive"
    SEMI_AUTO = "semi_auto"
    FULL_AUTO = "full_auto"

class NotificationType(Enum):
    """Loại thông báo."""
    LEAD = "lead"
    PAYMENT = "payment"
    INQUIRY = "inquiry"
    MILESTONE = "milestone"
    ALERT = "alert"

@dataclass
class Notification:
    """Thông báo sự kiện."""
    id: str
    type: NotificationType
    title: str
    message: str
    priority: int
    timestamp: datetime
    data: Dict[str, Any] = field(default_factory=dict)
    read: bool = False

@dataclass
class AgencyOwnerProfile:
    """Hồ sơ chủ agency để cá nhân hóa."""
    name: str
    agency_name: str
    timezone: str = "UTC"
    response_style: str = "professional"
    services: List[str] = field(default_factory=lambda: ["SEO", "Content", "PPC"])
    pricing_tier: str = "premium"
    working_hours: Dict[str, str] = field(default_factory=lambda: {"start": "09:00", "end": "18:00"})

class AIProvider(ABC):
    """Abstract base class cho AI providers."""
    
    @abstractmethod
    async def generate_response(self, prompt: str, context: Dict[str, Any]) -> str:
        """Tạo phản hồi từ prompt."""
        pass
    
    @abstractmethod
    async def analyze_inquiry(self, message: str) -> Dict[str, Any]:
        """Phân tích nội dung inquiry."""
        pass

class OpenAIProvider(AIProvider):
    """OpenAI provider implementation via Unified LLMClient."""
    
    def __init__(self, api_key: str):
        self.client = LLMClient()
    
    async def generate_response(self, prompt: str, context: Dict[str, Any]) -> str:
        return self.client.complete(prompt, system_instruction="You are AI Wingman.")
    
    async def analyze_inquiry(self, message: str) -> Dict[str, Any]:
        response = self.client.complete(f"Analyze this inquiry: {message}. Return JSON.")
        return {"raw": response, "sentiment": "neutral"} # Mock parsing

class AnthropicProvider(AIProvider):
    """Anthropic provider implementation via Unified LLMClient."""
    
    def __init__(self, api_key: str):
        self.client = LLMClient()
    
    async def generate_response(self, prompt: str, context: Dict[str, Any]) -> str:
        return self.client.complete(prompt, system_instruction="You are AI Wingman.")
    
    async def analyze_inquiry(self, message: str) -> Dict[str, Any]:
        response = self.client.complete(f"Analyze this inquiry: {message}. Return JSON.")
        return {"raw": response, "sentiment": "neutral"} # Mock parsing

class AIWingmanService:
    """Core AI Wingman service với provider abstraction."""
    
    def __init__(
        self,
        owner_profile: AgencyOwnerProfile,
        mode: WingmanMode = WingmanMode.SEMI_AUTO,
        provider: Optional[AIProvider] = None
    ):
        self.owner = owner_profile
        self.mode = mode
        self.provider = provider
        self.notifications: List[Notification] = []
        self.stats = {
            "inquiries_handled": 0,
            "proposals_sent": 0,
            "meetings_scheduled": 0,
            "revenue_generated": 0.0,
            "hours_saved": 0
        }
        logger.info(f"AI Wingman service initialized for {owner_profile.agency_name}")
    
    def set_provider(self, provider: AIProvider) -> None:
        """Đổi AI provider."""
        self.provider = provider
        logger.info(f"Switched to {provider.__class__.__name__}")
    
    def add_notification(self, notification: Notification) -> None:
        """Thêm thông báo mới."""
        self.notifications.append(notification)
        logger.info(f"Notification added: {notification.title}")
    
    def get_pending_notifications(self, unread_only: bool = True) -> List[Notification]:
        """Lấy danh sách thông báo đang chờ."""
        if unread_only:
            return [n for n in self.notifications if not n.read]
        return self.notifications
    
    def mark_notification_read(self, notification_id: str) -> bool:
        """Đánh dấu thông báo đã đọc."""
        for notif in self.notifications:
            if notif.id == notification_id:
                notif.read = True
                return True
        return False
    
    def update_stats(self, key: str, value: float) -> None:
        """Cập nhật thống kê."""
        if key in self.stats:
            if isinstance(self.stats[key], float):
                self.stats[key] += value
            else:
                self.stats[key] += int(value)
    
    def get_stats(self) -> Dict[str, Any]:
        """Lấy thống kê hiện tại."""
        return self.stats.copy()
    
    def can_auto_respond(self) -> bool:
        """Kiểm tra có thể tự động trả lời không."""
        return self.mode == WingmanMode.FULL_AUTO
    
    def needs_approval(self) -> bool:
        """Kiểm tra cần duyệt không."""
        return self.mode == WingmanMode.SEMI_AUTO
