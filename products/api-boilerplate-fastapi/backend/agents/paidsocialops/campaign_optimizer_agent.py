"""
Campaign Optimizer Agent - A/B Testing & ROAS
Manages campaign optimization and performance analysis.
"""

from dataclasses import dataclass, field
from typing import List, Dict
from enum import Enum
import random


class TestStatus(Enum):
    RUNNING = "running"
    COMPLETED = "completed"
    STOPPED = "stopped"


@dataclass
class Variant:
    """A/B test variant"""
    id: str
    name: str
    impressions: int = 0
    clicks: int = 0
    conversions: int = 0
    spend: float = 0
    
    @property
    def ctr(self) -> float:
        return (self.clicks / self.impressions * 100) if self.impressions > 0 else 0
    
    @property
    def conversion_rate(self) -> float:
        return (self.conversions / self.clicks * 100) if self.clicks > 0 else 0


@dataclass
class ABTest:
    """A/B test"""
    id: str
    name: str
    campaign_id: str
    variants: List[Variant] = field(default_factory=list)
    status: TestStatus = TestStatus.RUNNING
    winner: str = None
    confidence: float = 0
    
    @property
    def total_impressions(self) -> int:
        return sum(v.impressions for v in self.variants)


@dataclass
class OptimizationInsight:
    """Optimization insight"""
    insight_type: str
    message: str
    impact: str
    priority: str


class CampaignOptimizerAgent:
    """
    Campaign Optimizer Agent - Tối ưu Quảng cáo
    
    Responsibilities:
    - A/B testing
    - ROAS optimization
    - Bid management
    - Performance analysis
    """
    
    def __init__(self):
        self.name = "Campaign Optimizer"
        self.status = "ready"
        self.tests: Dict[str, ABTest] = {}
        self.insights: List[OptimizationInsight] = []
        
    def create_ab_test(
        self,
        name: str,
        campaign_id: str,
        variant_names: List[str]
    ) -> ABTest:
        """Create A/B test"""
        test_id = f"test_{random.randint(100,999)}"
        
        variants = [
            Variant(id=f"var_{i}", name=name)
            for i, name in enumerate(variant_names)
        ]
        
        test = ABTest(
            id=test_id,
            name=name,
            campaign_id=campaign_id,
            variants=variants
        )
        
        self.tests[test_id] = test
        return test
    
    def run_test(self, test_id: str) -> ABTest:
        """Simulate test run"""
        if test_id not in self.tests:
            raise ValueError(f"Test not found: {test_id}")
            
        test = self.tests[test_id]
        
        for variant in test.variants:
            variant.impressions = random.randint(5000, 10000)
            variant.clicks = int(variant.impressions * random.uniform(0.01, 0.05))
            variant.conversions = int(variant.clicks * random.uniform(0.05, 0.20))
            variant.spend = variant.impressions * random.uniform(0.005, 0.015)
        
        return test
    
    def declare_winner(self, test_id: str) -> ABTest:
        """Declare test winner"""
        if test_id not in self.tests:
            raise ValueError(f"Test not found: {test_id}")
            
        test = self.tests[test_id]
        
        # Find best performing variant
        best = max(test.variants, key=lambda v: v.conversion_rate)
        test.winner = best.name
        test.confidence = random.uniform(0.90, 0.99)
        test.status = TestStatus.COMPLETED
        
        return test
    
    def generate_insights(self, campaign_id: str) -> List[OptimizationInsight]:
        """Generate optimization insights"""
        insights = [
            OptimizationInsight(
                "budget", "Increase budget on top ad set by 20%",
                "+15% conversions", "high"
            ),
            OptimizationInsight(
                "audience", "Exclude low-performing age group",
                "-10% wasted spend", "medium"
            ),
            OptimizationInsight(
                "creative", "Video ads outperform images by 2x",
                "+50% engagement", "high"
            )
        ]
        
        self.insights.extend(insights)
        return insights
    
    def get_stats(self) -> Dict:
        """Get optimization statistics"""
        tests = list(self.tests.values())
        completed = [t for t in tests if t.status == TestStatus.COMPLETED]
        
        return {
            "total_tests": len(tests),
            "completed": len(completed),
            "running": len([t for t in tests if t.status == TestStatus.RUNNING]),
            "total_insights": len(self.insights),
            "avg_confidence": sum(t.confidence for t in completed) / len(completed) if completed else 0
        }


# Demo
if __name__ == "__main__":
    agent = CampaignOptimizerAgent()
    
    print("🔬 Campaign Optimizer Agent Demo\n")
    
    # Create A/B test
    t1 = agent.create_ab_test(
        "Headline Test",
        "camp_001",
        ["Original Headline", "New Headline A", "New Headline B"]
    )
    
    print(f"📋 A/B Test: {t1.name}")
    print(f"   Variants: {len(t1.variants)}")
    
    # Run test
    agent.run_test(t1.id)
    
    print("\n📊 Results:")
    for v in t1.variants:
        print(f"   {v.name}: CTR {v.ctr:.1f}%, Conv {v.conversion_rate:.1f}%")
    
    # Declare winner
    agent.declare_winner(t1.id)
    
    print(f"\n🏆 Winner: {t1.winner}")
    print(f"   Confidence: {t1.confidence*100:.0f}%")
    
    # Generate insights
    insights = agent.generate_insights("camp_001")
    
    print(f"\n💡 Insights: {len(insights)}")
    for i in insights:
        print(f"   [{i.priority}] {i.message}")
