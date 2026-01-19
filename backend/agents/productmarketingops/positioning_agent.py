"""
Positioning Agent - Product Positioning & Messaging
Manages product positioning, value props, and differentiation.
"""

import random
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List


@dataclass
class ValueProposition:
    """Value proposition"""

    headline: str
    subheadline: str
    benefits: List[str]
    proof_points: List[str]


@dataclass
class MessagingPillar:
    """Messaging pillar"""

    name: str
    key_message: str
    supporting_points: List[str]
    target_audience: str


@dataclass
class Positioning:
    """Product positioning"""

    id: str
    product: str
    category: str
    target_audience: str
    value_prop: ValueProposition
    pillars: List[MessagingPillar] = field(default_factory=list)
    differentiators: List[str] = field(default_factory=list)
    competitors: List[str] = field(default_factory=list)
    created_at: datetime = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()


class PositioningAgent:
    """
    Positioning Agent - Định vị Sản phẩm

    Responsibilities:
    - Product positioning
    - Messaging framework
    - Value proposition
    - Competitive differentiation
    """

    def __init__(self):
        self.name = "Positioning"
        self.status = "ready"
        self.positionings: Dict[str, Positioning] = {}

    def create_positioning(
        self,
        product: str,
        category: str,
        target_audience: str,
        headline: str,
        subheadline: str,
        benefits: List[str],
        proof_points: List[str],
    ) -> Positioning:
        """Create product positioning"""
        pos_id = f"pos_{random.randint(100, 999)}"

        value_prop = ValueProposition(
            headline=headline, subheadline=subheadline, benefits=benefits, proof_points=proof_points
        )

        positioning = Positioning(
            id=pos_id,
            product=product,
            category=category,
            target_audience=target_audience,
            value_prop=value_prop,
        )

        self.positionings[pos_id] = positioning
        return positioning

    def add_pillar(
        self,
        pos_id: str,
        name: str,
        key_message: str,
        supporting_points: List[str],
        target_audience: str,
    ) -> Positioning:
        """Add messaging pillar"""
        if pos_id not in self.positionings:
            raise ValueError(f"Positioning not found: {pos_id}")

        pillar = MessagingPillar(
            name=name,
            key_message=key_message,
            supporting_points=supporting_points,
            target_audience=target_audience,
        )

        self.positionings[pos_id].pillars.append(pillar)
        return self.positionings[pos_id]

    def add_differentiator(self, pos_id: str, differentiator: str) -> Positioning:
        """Add differentiator"""
        if pos_id not in self.positionings:
            raise ValueError(f"Positioning not found: {pos_id}")

        self.positionings[pos_id].differentiators.append(differentiator)
        return self.positionings[pos_id]

    def add_competitor(self, pos_id: str, competitor: str) -> Positioning:
        """Add competitor"""
        if pos_id not in self.positionings:
            raise ValueError(f"Positioning not found: {pos_id}")

        self.positionings[pos_id].competitors.append(competitor)
        return self.positionings[pos_id]

    def get_stats(self) -> Dict:
        """Get positioning statistics"""
        positionings = list(self.positionings.values())

        return {
            "total_positionings": len(positionings),
            "total_pillars": sum(len(p.pillars) for p in positionings),
            "total_differentiators": sum(len(p.differentiators) for p in positionings),
            "avg_benefits": sum(len(p.value_prop.benefits) for p in positionings)
            / len(positionings)
            if positionings
            else 0,
        }


# Demo
if __name__ == "__main__":
    agent = PositioningAgent()

    print("🎯 Positioning Agent Demo\n")

    # Create positioning
    p1 = agent.create_positioning(
        product="Product X",
        category="Marketing Automation",
        target_audience="Growth-stage startups",
        headline="Marketing automation that scales with you",
        subheadline="From startup to enterprise, one platform",
        benefits=["Save 10+ hours/week", "Increase leads by 3x", "Easy setup"],
        proof_points=["Used by 5000+ companies", "4.9 rating on G2"],
    )

    print(f"📋 Positioning: {p1.product}")
    print(f"   Category: {p1.category}")
    print(f"   Target: {p1.target_audience}")

    print("\n💬 Value Prop:")
    print(f"   {p1.value_prop.headline}")
    print(f"   {p1.value_prop.subheadline}")

    # Add pillars
    agent.add_pillar(
        p1.id,
        "Efficiency",
        "Do more with less",
        ["Automated workflows", "AI-powered suggestions"],
        "Marketing Ops",
    )

    agent.add_pillar(
        p1.id,
        "Scale",
        "Grow without limits",
        ["Unlimited contacts", "Enterprise features"],
        "Growth Leaders",
    )

    # Differentiators
    agent.add_differentiator(p1.id, "Only all-in-one solution")
    agent.add_differentiator(p1.id, "AI-native platform")

    print(f"\n🎯 Pillars: {len(p1.pillars)}")
    print(f"   Differentiators: {len(p1.differentiators)}")
