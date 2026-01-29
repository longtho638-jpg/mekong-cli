"""
Chatbot Agent core logic.
"""

import random
from typing import Dict, List, Optional

from core.growth.vibe_tuner import VibeRegion, VibeTuner

from .models import Channel, Conversation, Intent, Message


class ChatbotEngine:
    INTENT_KEYWORDS = {
        Intent.GREETING: ["hello", "hi", "xin chào", "chào", "hey"],
        Intent.PRICING: ["giá", "price", "bao nhiêu", "cost", "pricing", "license"],
        Intent.SUPPORT: ["help", "hỗ trợ", "support", "giúp", "hướng dẫn"],
        Intent.BUG_REPORT: ["lỗi", "bug", "error", "không hoạt động", "broken"],
        Intent.FEATURE_REQUEST: ["đề xuất", "feature", "thêm", "muốn có", "request"],
    }

    FAQ_RESPONSES = {
        Intent.GREETING: "Xin chào {name}! 👋 Mình là trợ lý AI của Mekong-CLI.",
        Intent.PRICING: "📋 Bảng giá Mekong-CLI:\n• Starter: Miễn phí\n• Pro: 2.000.000 VND/tháng",
        Intent.SUPPORT: "🤝 Mình sẵn sàng hỗ trợ! Bạn cần giúp gì?",
        Intent.BUG_REPORT: "🐛 Cảm ơn bạn đã báo lỗi!",
        Intent.FEATURE_REQUEST: "💡 Ý tưởng hay!",
        Intent.UNKNOWN: "Mình chưa hiểu rõ ý bạn.",
    }

    def __init__(self, vibe: str = "mien-tay"):
        self.vibe_tuner = VibeTuner(VibeRegion(vibe))
        self.conversations: Dict[str, Conversation] = {}

    def classify_intent(self, message: str) -> Intent:
        m_lower = message.lower()
        for intent, keywords in self.INTENT_KEYWORDS.items():
            if any(kw in m_lower for kw in keywords):
                return intent
        return Intent.UNKNOWN

    def generate_reply(self, intent: Intent, customer_name: str = "bạn") -> str:
        template = self.FAQ_RESPONSES.get(intent, self.FAQ_RESPONSES[Intent.UNKNOWN])
        reply = template.format(name=customer_name)
        config = self.vibe_tuner.config
        if config.local_words and random.random() > 0.5:
            reply += f" {random.choice(config.local_words)}"
        return reply
