"""
Engagement Agent - ABM Engagement & Plays
Manages personalized outreach and engagement scoring.
"""

import random
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List


class PlayType(Enum):
    OUTREACH = "outreach"
    NURTURE = "nurture"
    EVENT = "event"
    CONTENT = "content"
    DIRECT_MAIL = "direct_mail"


class TouchpointType(Enum):
    EMAIL = "email"
    LINKEDIN = "linkedin"
    CALL = "call"
    AD = "ad"
    WEBINAR = "webinar"
    MEETING = "meeting"


@dataclass
class Touchpoint:
    """Engagement touchpoint"""

    id: str
    account_id: str
    touchpoint_type: TouchpointType
    description: str
    response: bool = False
    timestamp: datetime = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()


@dataclass
class Play:
    """ABM play"""

    id: str
    name: str
    play_type: PlayType
    target_accounts: List[str] = field(default_factory=list)
    touchpoints: int = 0
    responses: int = 0
    created_at: datetime = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()

    @property
    def response_rate(self) -> float:
        return (self.responses / self.touchpoints * 100) if self.touchpoints > 0 else 0


class EngagementAgent:
    """
    Engagement Agent - Tương tác ABM

    Responsibilities:
    - Personalized plays
    - Multi-touch campaigns
    - Engagement scoring
    - Intent signals
    """

    def __init__(self):
        self.name = "Engagement"
        self.status = "ready"
        self.plays: Dict[str, Play] = {}
        self.touchpoints: List[Touchpoint] = []
        self.engagement_scores: Dict[str, float] = {}

    def create_play(
        self, name: str, play_type: PlayType, target_accounts: List[str] = None
    ) -> Play:
        """Create ABM play"""
        play_id = f"play_{random.randint(100, 999)}"

        play = Play(
            id=play_id, name=name, play_type=play_type, target_accounts=target_accounts or []
        )

        self.plays[play_id] = play
        return play

    def add_touchpoint(
        self,
        account_id: str,
        touchpoint_type: TouchpointType,
        description: str,
        play_id: str = None,
    ) -> Touchpoint:
        """Add engagement touchpoint"""
        tp_id = f"tp_{random.randint(1000, 9999)}"

        touchpoint = Touchpoint(
            id=tp_id,
            account_id=account_id,
            touchpoint_type=touchpoint_type,
            description=description,
        )

        self.touchpoints.append(touchpoint)

        # Update play if specified
        if play_id and play_id in self.plays:
            self.plays[play_id].touchpoints += 1

        return touchpoint

    def record_response(self, touchpoint_id: str, play_id: str = None) -> Touchpoint:
        """Record touchpoint response"""
        touchpoint = next((t for t in self.touchpoints if t.id == touchpoint_id), None)

        if touchpoint:
            touchpoint.response = True

            # Update engagement score
            self.engagement_scores[touchpoint.account_id] = (
                self.engagement_scores.get(touchpoint.account_id, 0) + 10
            )

            # Update play
            if play_id and play_id in self.plays:
                self.plays[play_id].responses += 1

        return touchpoint

    def get_engagement_score(self, account_id: str) -> float:
        """Get account engagement score"""
        return self.engagement_scores.get(account_id, 0)

    def get_stats(self) -> Dict:
        """Get engagement statistics"""
        plays = list(self.plays.values())

        return {
            "total_plays": len(plays),
            "total_touchpoints": len(self.touchpoints),
            "total_responses": sum(1 for t in self.touchpoints if t.response),
            "avg_response_rate": sum(p.response_rate for p in plays) / len(plays) if plays else 0,
            "engaged_accounts": len(self.engagement_scores),
        }


# Demo
if __name__ == "__main__":
    agent = EngagementAgent()

    print("📊 Engagement Agent Demo\n")

    # Create play
    p1 = agent.create_play("Q1 Executive Outreach", PlayType.OUTREACH, ["acc_001", "acc_002"])

    print(f"📋 Play: {p1.name}")
    print(f"   Type: {p1.play_type.value}")
    print(f"   Accounts: {len(p1.target_accounts)}")

    # Add touchpoints
    t1 = agent.add_touchpoint("acc_001", TouchpointType.EMAIL, "Intro email", p1.id)
    t2 = agent.add_touchpoint("acc_001", TouchpointType.LINKEDIN, "Connection request", p1.id)
    t3 = agent.add_touchpoint("acc_002", TouchpointType.EMAIL, "Case study share", p1.id)

    # Record responses
    agent.record_response(t1.id, p1.id)
    agent.record_response(t3.id, p1.id)

    print(f"\n📨 Touchpoints: {p1.touchpoints}")
    print(f"   Responses: {p1.responses}")
    print(f"   Response Rate: {p1.response_rate:.0f}%")

    # Engagement scores
    print("\n⚡ Engagement Scores:")
    print(f"   acc_001: {agent.get_engagement_score('acc_001')}")
    print(f"   acc_002: {agent.get_engagement_score('acc_002')}")
