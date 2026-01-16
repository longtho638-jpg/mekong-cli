"""
Chatbot Agent - AI-Powered Customer Support
Auto-replies with Vibe Tuning and intent classification.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime
from enum import Enum
import random
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
from core.vibe_tuner import VibeTuner, VibeRegion


class Intent(Enum):
    GREETING = "greeting"
    PRICING = "pricing"
    SUPPORT = "support"
    BUG_REPORT = "bug_report"
    FEATURE_REQUEST = "feature_request"
    UNKNOWN = "unknown"


class Channel(Enum):
    ZALO = "zalo"
    MESSENGER = "messenger"
    WEBSITE = "website"
    EMAIL = "email"


@dataclass
class Message:
    """Chat message"""
    id: str
    channel: Channel
    sender_id: str
    content: str
    is_bot: bool = False
    intent: Optional[Intent] = None
    timestamp: datetime = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()


@dataclass
class Conversation:
    """Conversation thread"""
    id: str
    channel: Channel
    customer_id: str
    customer_name: str
    messages: List[Message] = field(default_factory=list)
    status: str = "open"  # open, resolved, escalated
    created_at: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()


class ChatbotAgent:
    """
    Chatbot Agent - Hỗ trợ khách hàng AI
    
    Responsibilities:
    - Auto-reply with Vibe Tuning
    - Intent classification
    - FAQ matching
    - Escalation to human
    """
    
    # Intent keywords
    INTENT_KEYWORDS = {
        Intent.GREETING: ["hello", "hi", "xin chào", "chào", "hey"],
        Intent.PRICING: ["giá", "price", "bao nhiêu", "cost", "pricing", "license"],
        Intent.SUPPORT: ["help", "hỗ trợ", "support", "giúp", "hướng dẫn"],
        Intent.BUG_REPORT: ["lỗi", "bug", "error", "không hoạt động", "broken"],
        Intent.FEATURE_REQUEST: ["đề xuất", "feature", "thêm", "muốn có", "request"],
    }
    
    # FAQ responses
    FAQ_RESPONSES = {
        Intent.GREETING: "Xin chào {name}! 👋 Mình là trợ lý AI của Mekong-CLI. Mình có thể giúp gì cho bạn?",
        Intent.PRICING: "📋 Bảng giá Mekong-CLI:\n• Starter: Miễn phí\n• Pro: 2.000.000 VND/tháng\n• Enterprise: Liên hệ\n\nBạn muốn tìm hiểu gói nào?",
        Intent.SUPPORT: "🤝 Mình sẵn sàng hỗ trợ! Bạn cần giúp về:\n1. Cài đặt\n2. Cấu hình\n3. Tích hợp\n4. Khác\n\nChọn số hoặc mô tả vấn đề nhé!",
        Intent.BUG_REPORT: "🐛 Cảm ơn bạn đã báo lỗi! Mình sẽ tạo ticket hỗ trợ. Bạn có thể mô tả chi tiết:\n• Bạn đang làm gì?\n• Lỗi xảy ra như thế nào?\n• Có thông báo lỗi không?",
        Intent.FEATURE_REQUEST: "💡 Ý tưởng hay! Mình đã ghi nhận đề xuất của bạn. Team sẽ xem xét trong sprint tiếp theo. Cảm ơn bạn!",
        Intent.UNKNOWN: "Mình chưa hiểu rõ ý bạn. Bạn có thể mô tả lại được không? Hoặc gõ 'help' để xem các tùy chọn.",
    }
    
    def __init__(self, vibe: str = "mien-tay"):
        self.name = "Chatbot"
        self.status = "ready"
        self.vibe_tuner = VibeTuner(VibeRegion(vibe))
        self.conversations: Dict[str, Conversation] = {}
        
    def classify_intent(self, message: str) -> Intent:
        """Classify message intent"""
        message_lower = message.lower()
        
        for intent, keywords in self.INTENT_KEYWORDS.items():
            if any(kw in message_lower for kw in keywords):
                return intent
        
        return Intent.UNKNOWN
    
    def generate_reply(self, intent: Intent, customer_name: str = "bạn") -> str:
        """Generate reply based on intent"""
        template = self.FAQ_RESPONSES.get(intent, self.FAQ_RESPONSES[Intent.UNKNOWN])
        reply = template.format(name=customer_name)
        
        # Add vibe flavor
        config = self.vibe_tuner.config
        if config.local_words and random.random() > 0.5:
            reply += f" {random.choice(config.local_words)}"
        
        return reply
    
    def handle_message(
        self,
        channel: Channel,
        sender_id: str,
        sender_name: str,
        content: str
    ) -> Message:
        """Handle incoming message and generate reply"""
        conv_id = f"{channel.value}_{sender_id}"
        
        # Get or create conversation
        if conv_id not in self.conversations:
            self.conversations[conv_id] = Conversation(
                id=conv_id,
                channel=channel,
                customer_id=sender_id,
                customer_name=sender_name
            )
        
        conv = self.conversations[conv_id]
        
        # Create customer message
        customer_msg = Message(
            id=f"msg_{int(datetime.now().timestamp())}",
            channel=channel,
            sender_id=sender_id,
            content=content,
            intent=self.classify_intent(content)
        )
        conv.messages.append(customer_msg)
        
        # Generate bot reply
        reply_text = self.generate_reply(customer_msg.intent, sender_name)
        bot_msg = Message(
            id=f"msg_{int(datetime.now().timestamp())}_bot",
            channel=channel,
            sender_id="bot",
            content=reply_text,
            is_bot=True
        )
        conv.messages.append(bot_msg)
        
        return bot_msg
    
    def should_escalate(self, conv_id: str) -> bool:
        """Check if should escalate to human"""
        if conv_id not in self.conversations:
            return False
            
        conv = self.conversations[conv_id]
        
        # Escalate if: 3+ unknown intents or bug report
        unknown_count = sum(1 for m in conv.messages if m.intent == Intent.UNKNOWN)
        has_bug = any(m.intent == Intent.BUG_REPORT for m in conv.messages)
        
        return unknown_count >= 3 or has_bug
    
    def get_stats(self) -> Dict:
        """Get chatbot statistics"""
        all_messages = []
        for conv in self.conversations.values():
            all_messages.extend([m for m in conv.messages if not m.is_bot])
        
        return {
            "total_conversations": len(self.conversations),
            "total_messages": len(all_messages),
            "by_intent": {
                intent.value: len([m for m in all_messages if m.intent == intent])
                for intent in Intent
            },
            "resolution_rate": "85%"  # Mock
        }


# Demo
if __name__ == "__main__":
    bot = ChatbotAgent(vibe="mien-tay")
    
    print("🤖 Chatbot Agent Demo\n")
    
    # Simulate conversation
    messages = [
        ("Chào shop", "Nguyễn Văn A"),
        ("Giá Pro bao nhiêu?", "Nguyễn Văn A"),
        ("Có lỗi khi deploy", "Trần B"),
    ]
    
    for content, name in messages:
        print(f"👤 {name}: {content}")
        reply = bot.handle_message(
            channel=Channel.ZALO,
            sender_id=name.lower().replace(" ", "_"),
            sender_name=name,
            content=content
        )
        print(f"🤖 Bot: {reply.content[:80]}...")
        print()
    
    # Stats
    print("📊 Stats:")
    stats = bot.get_stats()
    print(f"   Conversations: {stats['total_conversations']}")
    print(f"   Messages: {stats['total_messages']}")
