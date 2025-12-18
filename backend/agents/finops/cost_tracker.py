"""
Cost Tracker Agent - AI Spending Monitoring
Tracks token usage, costs, and savings by provider.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from enum import Enum
import random


class Provider(Enum):
    OPENROUTER = "openrouter"  # Llama 3.1
    GEMINI_FLASH = "gemini_flash"
    GEMINI_PRO = "gemini_pro"
    CLAUDE_SONNET = "claude_sonnet"


@dataclass
class UsageRecord:
    """Single API usage record"""
    id: str
    provider: Provider
    tokens_in: int
    tokens_out: int
    cost: float
    task_type: str
    timestamp: datetime = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()
    
    @property
    def total_tokens(self) -> int:
        return self.tokens_in + self.tokens_out


class CostTrackerAgent:
    """
    Cost Tracker Agent - Theo dõi Chi phí AI
    
    Responsibilities:
    - Track token usage per request
    - Calculate costs by provider
    - Compute savings vs baseline
    - Real-time spending alerts
    """
    
    # Cost per 1M tokens (USD)
    PRICING = {
        Provider.OPENROUTER: 0.06,      # Llama 3.1 8B
        Provider.GEMINI_FLASH: 0.075,   # Gemini Flash
        Provider.GEMINI_PRO: 1.25,      # Gemini Pro
        Provider.CLAUDE_SONNET: 3.00,   # Claude Sonnet
    }
    
    # Baseline cost (if everything went to Claude)
    BASELINE_COST = 3.00
    
    def __init__(self):
        self.name = "Cost Tracker"
        self.status = "ready"
        self.records: List[UsageRecord] = []
        
    def track(
        self,
        provider: Provider,
        tokens_in: int,
        tokens_out: int,
        task_type: str = "general"
    ) -> UsageRecord:
        """Track a single API usage"""
        total_tokens = tokens_in + tokens_out
        cost = (total_tokens / 1_000_000) * self.PRICING[provider]
        
        record = UsageRecord(
            id=f"usage_{int(datetime.now().timestamp())}_{random.randint(100,999)}",
            provider=provider,
            tokens_in=tokens_in,
            tokens_out=tokens_out,
            cost=cost,
            task_type=task_type
        )
        
        self.records.append(record)
        return record
    
    def get_total_cost(self, days: int = 30) -> float:
        """Get total cost for period"""
        cutoff = datetime.now() - timedelta(days=days)
        return sum(r.cost for r in self.records if r.timestamp >= cutoff)
    
    def get_total_tokens(self, days: int = 30) -> int:
        """Get total tokens for period"""
        cutoff = datetime.now() - timedelta(days=days)
        return sum(r.total_tokens for r in self.records if r.timestamp >= cutoff)
    
    def get_savings(self, days: int = 30) -> Dict:
        """Calculate savings vs baseline (all Claude)"""
        cutoff = datetime.now() - timedelta(days=days)
        period_records = [r for r in self.records if r.timestamp >= cutoff]
        
        actual_cost = sum(r.cost for r in period_records)
        total_tokens = sum(r.total_tokens for r in period_records)
        baseline_cost = (total_tokens / 1_000_000) * self.BASELINE_COST
        
        savings = baseline_cost - actual_cost
        savings_pct = (savings / baseline_cost * 100) if baseline_cost > 0 else 0
        
        return {
            "actual_cost": round(actual_cost, 4),
            "baseline_cost": round(baseline_cost, 4),
            "savings": round(savings, 4),
            "savings_percent": round(savings_pct, 1),
            "total_tokens": total_tokens
        }
    
    def get_by_provider(self, days: int = 30) -> Dict[str, Dict]:
        """Get breakdown by provider"""
        cutoff = datetime.now() - timedelta(days=days)
        period_records = [r for r in self.records if r.timestamp >= cutoff]
        
        breakdown = {}
        for provider in Provider:
            provider_records = [r for r in period_records if r.provider == provider]
            breakdown[provider.value] = {
                "requests": len(provider_records),
                "tokens": sum(r.total_tokens for r in provider_records),
                "cost": round(sum(r.cost for r in provider_records), 4),
                "percent": round(len(provider_records) / len(period_records) * 100, 1) if period_records else 0
            }
        
        return breakdown
    
    def get_daily_trend(self, days: int = 7) -> List[Dict]:
        """Get daily cost trend"""
        trend = []
        for i in range(days):
            date = datetime.now().date() - timedelta(days=i)
            day_records = [
                r for r in self.records 
                if r.timestamp.date() == date
            ]
            trend.append({
                "date": str(date),
                "cost": round(sum(r.cost for r in day_records), 4),
                "tokens": sum(r.total_tokens for r in day_records),
                "requests": len(day_records)
            })
        return list(reversed(trend))


# Demo
if __name__ == "__main__":
    tracker = CostTrackerAgent()
    
    print("📊 Cost Tracker Agent Demo\n")
    
    # Simulate usage
    tracker.track(Provider.OPENROUTER, 500, 1000, "content_generation")
    tracker.track(Provider.OPENROUTER, 300, 800, "chat")
    tracker.track(Provider.GEMINI_FLASH, 1000, 2000, "summarization")
    tracker.track(Provider.GEMINI_PRO, 2000, 3000, "code_review")
    tracker.track(Provider.CLAUDE_SONNET, 500, 1500, "complex_reasoning")
    
    # Stats
    print(f"💰 Total Cost: ${tracker.get_total_cost():.4f}")
    print(f"🔢 Total Tokens: {tracker.get_total_tokens():,}")
    
    # Savings
    savings = tracker.get_savings()
    print(f"\n💚 Savings Analysis:")
    print(f"   Actual: ${savings['actual_cost']}")
    print(f"   Baseline: ${savings['baseline_cost']}")
    print(f"   Saved: ${savings['savings']} ({savings['savings_percent']}%)")
    
    # By provider
    print(f"\n📈 By Provider:")
    breakdown = tracker.get_by_provider()
    for provider, data in breakdown.items():
        if data['requests'] > 0:
            print(f"   {provider}: {data['requests']} requests, ${data['cost']}")
