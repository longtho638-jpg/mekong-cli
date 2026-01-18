"""
Engagement Manager Agent - Inbox & Sentiment
Manages social interactions, comments, and sentiment analysis.
"""

import random
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional


class InteractionType(Enum):
    COMMENT = "comment"
    DM = "dm"
    MENTION = "mention"
    REPLY = "reply"


class Sentiment(Enum):
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"


@dataclass
class SocialInteraction:
    """Social media interaction"""

    id: str
    platform: str
    user_handle: str
    content: str
    type: InteractionType
    timestamp: datetime
    sentiment: Sentiment
    is_replied: bool = False
    reply_content: Optional[str] = None
    priority: str = "normal"  # low, normal, high


class EngagementManagerAgent:
    """
    Engagement Manager Agent - Quản lý Tương tác

    Responsibilities:
    - Unified inbox (Comments, DMs)
    - Sentiment analysis
    - Auto-reply suggestions
    - Engagement rate tracking
    """

    def __init__(self):
        self.name = "Engagement Manager"
        self.status = "ready"
        self.inbox: List[SocialInteraction] = []

    def ingest_interaction(
        self, platform: str, user_handle: str, content: str, interaction_type: InteractionType
    ) -> SocialInteraction:
        """Ingest new interaction"""
        interaction_id = f"int_{random.randint(1000, 9999)}"

        # Simulated Sentiment Analysis
        sentiment = Sentiment.NEUTRAL
        priority = "normal"

        content_lower = content.lower()
        if any(w in content_lower for w in ["love", "great", "awesome", "thanks"]):
            sentiment = Sentiment.POSITIVE
        elif any(w in content_lower for w in ["bad", "hate", "issue", "broken", "fail"]):
            sentiment = Sentiment.NEGATIVE
            priority = "high"

        interaction = SocialInteraction(
            id=interaction_id,
            platform=platform,
            user_handle=user_handle,
            content=content,
            type=interaction_type,
            timestamp=datetime.now(),
            sentiment=sentiment,
            priority=priority,
        )

        self.inbox.append(interaction)
        return interaction

    def generate_reply_suggestion(self, interaction: SocialInteraction) -> str:
        """Generate auto-reply suggestion"""
        if interaction.sentiment == Sentiment.POSITIVE:
            return f"Thanks for the love {interaction.user_handle}! 🚀 We appreciate your support."
        elif interaction.sentiment == Sentiment.NEGATIVE:
            return f"Hi {interaction.user_handle}, sorry to hear about this issue. Could you DM us more details so we can help?"
        else:
            return f"Thanks for reaching out {interaction.user_handle}!"

    def reply_to_interaction(self, interaction_id: str, content: str) -> SocialInteraction:
        """Send reply"""
        interaction = next((i for i in self.inbox if i.id == interaction_id), None)
        if not interaction:
            raise ValueError(f"Interaction not found: {interaction_id}")

        interaction.is_replied = True
        interaction.reply_content = content
        return interaction

    def get_inbox_stats(self) -> Dict:
        """Get inbox statistics"""
        total = len(self.inbox)
        replied = len([i for i in self.inbox if i.is_replied])
        positive = len([i for i in self.inbox if i.sentiment == Sentiment.POSITIVE])
        negative = len([i for i in self.inbox if i.sentiment == Sentiment.NEGATIVE])

        return {
            "total_pending": total - replied,
            "response_rate": (replied / total * 100) if total > 0 else 0,
            "sentiment_positive": positive,
            "sentiment_negative": negative,
        }


# Demo
if __name__ == "__main__":
    agent = EngagementManagerAgent()

    print("💬 Engagement Manager Agent Demo\n")

    # Ingest interactions
    i1 = agent.ingest_interaction(
        "twitter",
        "@dev_guru",
        "Mekong CLI is awesome! Loved the new update.",
        InteractionType.MENTION,
    )
    i2 = agent.ingest_interaction(
        "linkedin",
        "@recruiter_jane",
        "Can you DM me about enterprise pricing?",
        InteractionType.COMMENT,
    )
    i3 = agent.ingest_interaction(
        "twitter", "@angry_user", "My build is broken. This sucks.", InteractionType.MENTION
    )

    print(f"📥 Inbox: {len(agent.inbox)} items")

    # Process high priority
    print("\n🚨 High Priority Item:")
    high_pri = [i for i in agent.inbox if i.priority == "high"][0]
    print(f"   User: {high_pri.user_handle}")
    print(f"   Content: {high_pri.content}")
    print(f"   Sentiment: {high_pri.sentiment.value}")

    # Generate reply
    suggestion = agent.generate_reply_suggestion(high_pri)
    print(f"   Suggestion: {suggestion}")

    # Reply
    agent.reply_to_interaction(high_pri.id, suggestion)
    print("   Status: Replied ✅")

    # Stats
    stats = agent.get_inbox_stats()
    print("\n📊 Stats:")
    print(f"   Pending: {stats['total_pending']}")
    print(f"   Positive: {stats['sentiment_positive']}")
    print(f"   Negative: {stats['sentiment_negative']}")
