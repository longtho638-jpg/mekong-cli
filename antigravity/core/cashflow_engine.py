"""
💰 Cashflow Engine - Closed-Loop Revenue Tracking for $1M 2026

Maps all revenue streams to the $1M ARR target.
Tracks progress, gaps, and required growth rate.

Usage:
    from antigravity.core.cashflow_engine import CashflowEngine
    engine = CashflowEngine()
    engine.print_dashboard()
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from pathlib import Path
from enum import Enum
import json
import math


# ============================================
# CONSTANTS
# ============================================

ARR_TARGET_2026 = 1_000_000  # $1M ARR goal
MONTHS_REMAINING = 12  # Months left in 2026
EXCHANGE_RATES = {"USD": 1, "VND": 24500, "THB": 35}


class RevenueStream(Enum):
    """Revenue stream types."""
    WELLNEXUS = "wellnexus"      # Social Commerce Platform
    AGENCY = "agency"            # Agency Services (Retainer + Equity)
    SAAS = "saas"                # SaaS Products (Newsletter, etc.)
    CONSULTING = "consulting"   # Consulting & Strategy
    AFFILIATE = "affiliate"      # Affiliate Revenue
    EXIT = "exit"                # Exit/Acquisition Proceeds


@dataclass
class Revenue:
    """Single revenue entry."""
    id: str
    stream: RevenueStream
    amount: float  # In USD
    currency: str
    date: datetime
    recurring: bool
    client: Optional[str] = None
    description: str = ""


@dataclass
class RevenueGoal:
    """Revenue goal by stream."""
    stream: RevenueStream
    target_arr: float
    current_arr: float = 0
    
    @property
    def progress(self) -> float:
        return (self.current_arr / self.target_arr * 100) if self.target_arr > 0 else 0
    
    @property
    def gap(self) -> float:
        return max(0, self.target_arr - self.current_arr)


class CashflowEngine:
    """
    💰 Cashflow Engine
    
    Closed-loop revenue tracking for $1M ARR 2026 goal.
    """
    
    def __init__(self, storage_path: str = ".antigravity/cashflow"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self.revenues: List[Revenue] = []
        self.goals = self._init_goals()
        self._load_data()
    
    def _init_goals(self) -> Dict[RevenueStream, RevenueGoal]:
        """Initialize revenue goals by stream."""
        # $1M split across streams
        return {
            RevenueStream.WELLNEXUS: RevenueGoal(RevenueStream.WELLNEXUS, 300_000),    # $300K
            RevenueStream.AGENCY: RevenueGoal(RevenueStream.AGENCY, 400_000),           # $400K
            RevenueStream.SAAS: RevenueGoal(RevenueStream.SAAS, 200_000),               # $200K
            RevenueStream.CONSULTING: RevenueGoal(RevenueStream.CONSULTING, 80_000),   # $80K
            RevenueStream.AFFILIATE: RevenueGoal(RevenueStream.AFFILIATE, 20_000),     # $20K
        }
    
    def add_revenue(
        self,
        stream: RevenueStream,
        amount: float,
        currency: str = "USD",
        recurring: bool = False,
        client: str = None,
        description: str = ""
    ) -> Revenue:
        """Add a revenue entry."""
        # Convert to USD
        usd_amount = amount / EXCHANGE_RATES.get(currency, 1)
        
        revenue = Revenue(
            id=f"rev_{datetime.now().timestamp()}",
            stream=stream,
            amount=usd_amount,
            currency=currency,
            date=datetime.now(),
            recurring=recurring,
            client=client,
            description=description,
        )
        
        self.revenues.append(revenue)
        self._update_goals()
        self._save_data()
        
        return revenue
    
    def _update_goals(self):
        """Update goal progress from revenues."""
        for stream, goal in self.goals.items():
            # Calculate current ARR from revenues
            stream_revenues = [r for r in self.revenues if r.stream == stream]
            
            # MRR from recurring in last 30 days
            thirty_days_ago = datetime.now() - timedelta(days=30)
            mrr = sum(
                r.amount for r in stream_revenues 
                if r.recurring and r.date > thirty_days_ago
            )
            
            # One-time revenue annualized
            one_time = sum(r.amount for r in stream_revenues if not r.recurring)
            
            goal.current_arr = mrr * 12 + one_time
    
    def get_total_arr(self) -> float:
        """Get total current ARR."""
        return sum(g.current_arr for g in self.goals.values())
    
    def get_progress(self) -> float:
        """Get progress toward $1M goal."""
        return (self.get_total_arr() / ARR_TARGET_2026) * 100
    
    def get_gap(self) -> float:
        """Get remaining gap to $1M."""
        return max(0, ARR_TARGET_2026 - self.get_total_arr())
    
    def get_required_mrr(self) -> float:
        """Get required MRR to reach $1M."""
        return self.get_gap() / 12
    
    def get_required_growth_rate(self) -> float:
        """Get required monthly growth rate to reach $1M."""
        current = self.get_total_arr() / 12  # Current MRR
        target_mrr = ARR_TARGET_2026 / 12
        
        if current <= 0:
            return 100.0  # Need to start from scratch
        
        # Calculate required growth rate over remaining months
        # target = current * (1 + rate)^months
        # rate = (target/current)^(1/months) - 1
        rate = (target_mrr / current) ** (1 / MONTHS_REMAINING) - 1
        return rate * 100
    
    def get_monthly_targets(self) -> List[Dict]:
        """Get monthly targets to reach $1M."""
        current_mrr = self.get_total_arr() / 12
        growth_rate = self.get_required_growth_rate() / 100
        
        targets = []
        mrr = current_mrr
        
        for month in range(1, MONTHS_REMAINING + 1):
            mrr = mrr * (1 + growth_rate)
            targets.append({
                "month": month,
                "mrr": mrr,
                "arr": mrr * 12,
                "progress": (mrr * 12 / ARR_TARGET_2026) * 100
            })
        
        return targets
    
    def get_stream_breakdown(self) -> Dict[str, Dict]:
        """Get breakdown by stream."""
        breakdown = {}
        for stream, goal in self.goals.items():
            breakdown[stream.value] = {
                "target": goal.target_arr,
                "current": goal.current_arr,
                "progress": goal.progress,
                "gap": goal.gap,
            }
        return breakdown
    
    def _save_data(self):
        """Save cashflow data."""
        data = {
            "revenues": [
                {
                    "id": r.id,
                    "stream": r.stream.value,
                    "amount": r.amount,
                    "currency": r.currency,
                    "date": r.date.isoformat(),
                    "recurring": r.recurring,
                    "client": r.client,
                    "description": r.description,
                }
                for r in self.revenues
            ]
        }
        path = self.storage_path / "cashflow.json"
        path.write_text(json.dumps(data, indent=2))
    
    def _load_data(self):
        """Load cashflow data."""
        try:
            path = self.storage_path / "cashflow.json"
            if path.exists():
                data = json.loads(path.read_text())
                for r in data.get("revenues", []):
                    self.revenues.append(Revenue(
                        id=r["id"],
                        stream=RevenueStream(r["stream"]),
                        amount=r["amount"],
                        currency=r["currency"],
                        date=datetime.fromisoformat(r["date"]),
                        recurring=r["recurring"],
                        client=r.get("client"),
                        description=r.get("description", ""),
                    ))
                self._update_goals()
        except Exception:
            pass
    
    def print_dashboard(self):
        """Print cashflow dashboard."""
        total_arr = self.get_total_arr()
        progress = self.get_progress()
        gap = self.get_gap()
        growth_rate = self.get_required_growth_rate()
        
        print("\n" + "═" * 60)
        print("║" + "💰 $1M ARR 2026 - CASHFLOW DASHBOARD".center(58) + "║")
        print("═" * 60)
        
        # Progress bar
        bar_filled = int(progress / 5)
        bar = "█" * bar_filled + "░" * (20 - bar_filled)
        print(f"\n🎯 PROGRESS: [{bar}] {progress:.1f}%")
        print(f"   Current ARR: ${total_arr:,.0f}")
        print(f"   Target ARR:  ${ARR_TARGET_2026:,}")
        print(f"   Gap:         ${gap:,.0f}")
        
        # Growth required
        print(f"\n📈 REQUIRED GROWTH:")
        print(f"   Monthly Rate: {growth_rate:.1f}%")
        print(f"   Required MRR: ${self.get_required_mrr():,.0f}/month")
        
        # Stream breakdown
        print(f"\n📊 REVENUE STREAMS:")
        for stream, goal in self.goals.items():
            bar_stream = "█" * int(goal.progress / 10) + "░" * (10 - int(goal.progress / 10))
            emoji = {
                RevenueStream.WELLNEXUS: "🌐",
                RevenueStream.AGENCY: "🏢",
                RevenueStream.SAAS: "☁️",
                RevenueStream.CONSULTING: "💼",
                RevenueStream.AFFILIATE: "🔗",
            }.get(stream, "💰")
            print(f"   {emoji} {stream.value.upper()}")
            print(f"      [{bar_stream}] ${goal.current_arr:,.0f} / ${goal.target_arr:,.0f}")
        
        print("\n" + "═" * 60)
        if progress >= 100:
            print("║ 🎊 $1M GOAL ACHIEVED!".ljust(59) + "║")
        elif progress >= 50:
            print("║ ⚡ On track - Keep pushing!".ljust(59) + "║")
        else:
            print(f"║ 🚀 Need {growth_rate:.0f}% monthly growth to reach $1M".ljust(59) + "║")
        print("═" * 60)


# ============================================
# QUICK FUNCTIONS
# ============================================

_cashflow_engine: Optional[CashflowEngine] = None


def get_cashflow_engine() -> CashflowEngine:
    """Get global cashflow engine."""
    global _cashflow_engine
    if _cashflow_engine is None:
        _cashflow_engine = CashflowEngine()
    return _cashflow_engine


def track_revenue(
    stream: str,
    amount: float,
    recurring: bool = False,
    client: str = None
) -> Revenue:
    """Quick function to track revenue."""
    engine = get_cashflow_engine()
    return engine.add_revenue(
        stream=RevenueStream(stream),
        amount=amount,
        recurring=recurring,
        client=client,
    )


def show_progress():
    """Show $1M progress."""
    engine = get_cashflow_engine()
    engine.print_dashboard()
