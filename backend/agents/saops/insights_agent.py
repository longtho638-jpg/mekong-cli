"""
Insights Agent - Trend Detection & Recommendations
Analyzes data for trends and generates insights.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime
from enum import Enum
import random


class InsightType(Enum):
    TREND = "trend"
    ANOMALY = "anomaly"
    OPPORTUNITY = "opportunity"
    WARNING = "warning"


class InsightPriority(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class Insight:
    """Data insight"""
    id: str
    title: str
    description: str
    insight_type: InsightType
    priority: InsightPriority
    metric: str
    recommendation: str = ""
    created_at: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()


class InsightsAgent:
    """
    Insights Agent - Phát hiện Xu hướng
    
    Responsibilities:
    - Detect trends
    - Identify anomalies
    - Generate recommendations
    - Alert on issues
    """
    
    # Thresholds for anomaly detection
    ANOMALY_THRESHOLD = 0.20  # 20% deviation
    
    def __init__(self):
        self.name = "Insights"
        self.status = "ready"
        self.insights: List[Insight] = []
        
    def analyze_trend(
        self,
        metric_name: str,
        values: List[float]
    ) -> Insight:
        """Analyze trend in data"""
        if len(values) < 2:
            return None
            
        # Simple trend detection
        avg_first_half = sum(values[:len(values)//2]) / (len(values)//2)
        avg_second_half = sum(values[len(values)//2:]) / (len(values) - len(values)//2)
        
        change = ((avg_second_half - avg_first_half) / avg_first_half * 100) if avg_first_half > 0 else 0
        
        if change > 10:
            direction = "upward"
            priority = InsightPriority.HIGH if change > 20 else InsightPriority.MEDIUM
        elif change < -10:
            direction = "downward"
            priority = InsightPriority.HIGH if change < -20 else InsightPriority.MEDIUM
        else:
            direction = "stable"
            priority = InsightPriority.LOW
            
        insight = Insight(
            id=f"insight_{int(datetime.now().timestamp())}_{random.randint(100,999)}",
            title=f"{metric_name} shows {direction} trend",
            description=f"{metric_name} has changed by {change:.1f}% over the analyzed period.",
            insight_type=InsightType.TREND,
            priority=priority,
            metric=metric_name,
            recommendation=f"{'Maintain momentum' if change > 0 else 'Investigate root cause'} for {metric_name}."
        )
        
        self.insights.append(insight)
        return insight
    
    def detect_anomaly(
        self,
        metric_name: str,
        current_value: float,
        baseline: float
    ) -> Optional[Insight]:
        """Detect anomaly in metric"""
        if baseline == 0:
            return None
            
        deviation = abs((current_value - baseline) / baseline)
        
        if deviation < self.ANOMALY_THRESHOLD:
            return None
            
        direction = "above" if current_value > baseline else "below"
        priority = InsightPriority.CRITICAL if deviation > 0.5 else InsightPriority.HIGH
        
        insight = Insight(
            id=f"insight_{int(datetime.now().timestamp())}_{random.randint(100,999)}",
            title=f"Anomaly detected in {metric_name}",
            description=f"{metric_name} is {deviation*100:.0f}% {direction} baseline ({current_value} vs {baseline}).",
            insight_type=InsightType.ANOMALY,
            priority=priority,
            metric=metric_name,
            recommendation=f"Immediate attention needed for {metric_name}."
        )
        
        self.insights.append(insight)
        return insight
    
    def generate_opportunity(
        self,
        title: str,
        description: str,
        metric: str,
        recommendation: str
    ) -> Insight:
        """Generate opportunity insight"""
        insight = Insight(
            id=f"insight_{int(datetime.now().timestamp())}_{random.randint(100,999)}",
            title=title,
            description=description,
            insight_type=InsightType.OPPORTUNITY,
            priority=InsightPriority.MEDIUM,
            metric=metric,
            recommendation=recommendation
        )
        
        self.insights.append(insight)
        return insight
    
    def get_by_priority(self, priority: InsightPriority) -> List[Insight]:
        """Get insights by priority"""
        return [i for i in self.insights if i.priority == priority]
    
    def get_recent(self, count: int = 5) -> List[Insight]:
        """Get most recent insights"""
        return sorted(self.insights, key=lambda i: i.created_at, reverse=True)[:count]
    
    def get_summary(self) -> Dict:
        """Get insights summary"""
        return {
            "total_insights": len(self.insights),
            "critical": len(self.get_by_priority(InsightPriority.CRITICAL)),
            "high": len(self.get_by_priority(InsightPriority.HIGH)),
            "medium": len(self.get_by_priority(InsightPriority.MEDIUM)),
            "by_type": {
                t.value: len([i for i in self.insights if i.insight_type == t])
                for t in InsightType
            }
        }


# Demo
if __name__ == "__main__":
    agent = InsightsAgent()
    
    print("💡 Insights Agent Demo\n")
    
    # Analyze trend
    trend = agent.analyze_trend("Monthly Revenue", [100, 110, 105, 120, 135, 140])
    print(f"📈 Trend: {trend.title}")
    print(f"   {trend.description}")
    print(f"   Recommendation: {trend.recommendation}")
    
    # Detect anomaly
    anomaly = agent.detect_anomaly("Daily Leads", 45, 100)
    if anomaly:
        print(f"\n⚠️ Anomaly: {anomaly.title}")
        print(f"   {anomaly.description}")
    
    # Generate opportunity
    agent.generate_opportunity(
        "High-value segment underserved",
        "Enterprise segment shows 40% less coverage than potential.",
        "Enterprise Coverage",
        "Increase SDR focus on enterprise accounts."
    )
    
    # Summary
    print("\n📊 Summary:")
    summary = agent.get_summary()
    print(f"   Total Insights: {summary['total_insights']}")
    print(f"   Critical: {summary['critical']}")
    print(f"   High: {summary['high']}")
