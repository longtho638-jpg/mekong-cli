"""
Competitive Agent - Competitor Tracking & SWOT Analysis
Manages competitor monitoring and market positioning.
"""

import random
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List


class ThreatLevel(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class SWOT:
    """SWOT analysis"""

    strengths: List[str] = field(default_factory=list)
    weaknesses: List[str] = field(default_factory=list)
    opportunities: List[str] = field(default_factory=list)
    threats: List[str] = field(default_factory=list)


@dataclass
class Competitor:
    """Competitor profile"""

    id: str
    name: str
    website: str
    threat_level: ThreatLevel = ThreatLevel.MEDIUM
    market_share: float = 0
    features: List[str] = field(default_factory=list)
    swot: SWOT = None
    last_updated: datetime = None

    def __post_init__(self):
        if self.swot is None:
            self.swot = SWOT()
        if self.last_updated is None:
            self.last_updated = datetime.now()


class CompetitiveAgent:
    """
    Competitive Agent - Phân tích Đối thủ

    Responsibilities:
    - Competitor tracking
    - SWOT analysis
    - Feature comparison
    - Market positioning
    """

    def __init__(self):
        self.name = "Competitive"
        self.status = "ready"
        self.competitors: Dict[str, Competitor] = {}

    def add_competitor(
        self,
        name: str,
        website: str,
        threat_level: ThreatLevel = ThreatLevel.MEDIUM,
        market_share: float = 0,
    ) -> Competitor:
        """Add competitor"""
        comp_id = f"comp_{int(datetime.now().timestamp())}_{random.randint(100, 999)}"

        competitor = Competitor(
            id=comp_id,
            name=name,
            website=website,
            threat_level=threat_level,
            market_share=market_share,
        )

        self.competitors[comp_id] = competitor
        return competitor

    def add_feature(self, comp_id: str, feature: str) -> Competitor:
        """Add competitor feature"""
        if comp_id not in self.competitors:
            raise ValueError(f"Competitor not found: {comp_id}")

        self.competitors[comp_id].features.append(feature)
        self.competitors[comp_id].last_updated = datetime.now()

        return self.competitors[comp_id]

    def update_swot(
        self,
        comp_id: str,
        strengths: List[str] = None,
        weaknesses: List[str] = None,
        opportunities: List[str] = None,
        threats: List[str] = None,
    ) -> Competitor:
        """Update SWOT analysis"""
        if comp_id not in self.competitors:
            raise ValueError(f"Competitor not found: {comp_id}")

        comp = self.competitors[comp_id]

        if strengths:
            comp.swot.strengths.extend(strengths)
        if weaknesses:
            comp.swot.weaknesses.extend(weaknesses)
        if opportunities:
            comp.swot.opportunities.extend(opportunities)
        if threats:
            comp.swot.threats.extend(threats)

        comp.last_updated = datetime.now()

        return comp

    def get_by_threat_level(self, level: ThreatLevel) -> List[Competitor]:
        """Get competitors by threat level"""
        return [c for c in self.competitors.values() if c.threat_level == level]

    def compare_features(self) -> Dict[str, List[str]]:
        """Compare features across competitors"""
        feature_matrix = {}

        for comp in self.competitors.values():
            for feature in comp.features:
                if feature not in feature_matrix:
                    feature_matrix[feature] = []
                feature_matrix[feature].append(comp.name)

        return feature_matrix

    def get_stats(self) -> Dict:
        """Get competitive statistics"""
        comps = list(self.competitors.values())

        return {
            "total_competitors": len(comps),
            "high_threat": len(self.get_by_threat_level(ThreatLevel.HIGH)),
            "critical_threat": len(self.get_by_threat_level(ThreatLevel.CRITICAL)),
            "total_market_share": sum(c.market_share for c in comps),
            "avg_features": sum(len(c.features) for c in comps) / len(comps) if comps else 0,
        }


# Demo
if __name__ == "__main__":
    agent = CompetitiveAgent()

    print("🏢 Competitive Agent Demo\n")

    # Add competitors
    c1 = agent.add_competitor("CompetitorA", "competitora.com", ThreatLevel.HIGH, 25.0)
    c2 = agent.add_competitor("CompetitorB", "competitorb.com", ThreatLevel.MEDIUM, 15.0)

    print(f"📋 Competitor: {c1.name}")
    print(f"   Threat: {c1.threat_level.value}")
    print(f"   Market Share: {c1.market_share}%")

    # Features
    agent.add_feature(c1.id, "Mobile App")
    agent.add_feature(c1.id, "API Access")
    agent.add_feature(c2.id, "Mobile App")

    # SWOT
    agent.update_swot(
        c1.id,
        strengths=["Strong brand", "Large user base"],
        weaknesses=["High pricing", "Poor support"],
        opportunities=["Emerging markets"],
        threats=["New regulations"],
    )

    print(f"\n📊 SWOT for {c1.name}:")
    print(f"   Strengths: {len(c1.swot.strengths)}")
    print(f"   Weaknesses: {len(c1.swot.weaknesses)}")

    # Compare
    print("\n🔄 Feature Comparison:")
    for feature, companies in agent.compare_features().items():
        print(f"   {feature}: {', '.join(companies)}")
