"""
💰 Cashflow Engine - Closed-Loop Revenue Tracking
================================================

Monitors and projects agency revenue against the $1M ARR 2026 milestone.
Provides real-time visibility into growth rates, churn impacts, and 
required performance to hit the target.

Features:
- Multi-currency support (VND, USD, THB).
- Automated ARR/MRR calculation.
- Growth trajectory projections.
- Revenue stream breakdown.

Binh Pháp: 💰 Tài (Wealth) - Managing the lifeblood of the agency.
"""

import logging
import json
import math
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any, Union
from pathlib import Path
from enum import Enum

# Configure logging
logger = logging.getLogger(__name__)

# ============================================ 
# TARGETS & CONFIGURATION
# ============================================ 

ARR_TARGET_2026 = 1_000_000  # $1M ARR goal
# 2026 standard rates
EXCHANGE_RATES = {"USD": 1.0, "VND": 25000.0, "THB": 35.0}


class RevenueStream(Enum):
    """Core revenue buckets for Agency OS."""
    WELLNEXUS = "wellnexus"      # Social Commerce Platform
    AGENCY = "agency"            # Agency Services (Retainer + Equity)
    SAAS = "saas"                # AI / SaaS Products
    CONSULTING = "consulting"    # High-ticket Strategy
    AFFILIATE = "affiliate"      # Partner Revenue
    EXIT = "exit"                # Liquidity Events


@dataclass
class Revenue:
    """A single revenue transaction or commitment."""
    id: str
    stream: RevenueStream
    amount_usd: float
    currency: str
    amount_original: float
    date: datetime
    recurring: bool
    client: Optional[str] = None
    description: str = ""


@dataclass
class RevenueGoal:
    """Target allocation per revenue stream."""
    stream: RevenueStream
    target_arr: float
    current_arr: float = 0.0
    
    @property
    def progress_percent(self) -> float:
        """Percentage of target achieved."""
        return (self.current_arr / self.target_arr * 100) if self.target_arr > 0 else 0.0
    
    @property
    def gap_usd(self) -> float:
        """Remaining USD to hit target."""
        return max(0.0, self.target_arr - self.current_arr)


class CashflowEngine:
    """
    💰 Cashflow Management System
    
    The financial cockpit for the solo unicorn journey.
    """
    
    def __init__(self, storage_path: str = ".antigravity/cashflow"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self.revenue_file = self.storage_path / "revenues.json"
        
        self.revenues: List[Revenue] = []
        self.goals: Dict[RevenueStream, RevenueGoal] = self._init_goals()
        self._load_data()
    
    def _init_goals(self) -> Dict[RevenueStream, RevenueGoal]:
        """Distributes the $1M goal across diversified streams."""
        return {
            RevenueStream.WELLNEXUS: RevenueGoal(RevenueStream.WELLNEXUS, 300_000),
            RevenueStream.AGENCY:    RevenueGoal(RevenueStream.AGENCY,    400_000),
            RevenueStream.SAAS:      RevenueGoal(RevenueStream.SAAS,      200_000),
            RevenueStream.CONSULTING: RevenueGoal(RevenueStream.CONSULTING, 80_000),
            RevenueStream.AFFILIATE:  RevenueGoal(RevenueStream.AFFILIATE,  20_000),
        }
    
    def add_revenue(
        self,
        stream: Union[RevenueStream, str],
        amount: float,
        currency: str = "USD",
        recurring: bool = False,
        client: Optional[str] = None,
        description: str = ""
    ) -> Revenue:
        """Adds a revenue entry and updates the dashboard state."""
        # Normalize stream type
        if isinstance(stream, str):
            try:
                stream = RevenueStream(stream.lower())
            except ValueError:
                stream = RevenueStream.AGENCY
                
        # Handle Currency Conversion
        rate = EXCHANGE_RATES.get(currency.upper(), 1.0)
        usd_val = amount / rate
        
        entry = Revenue(
            id=f"rev_{{datetime.now().strftime('%y%m%d%H%M%S')}}_{len(self.revenues)}",
            stream=stream,
            amount_usd=usd_val,
            amount_original=amount,
            currency=currency.upper(),
            date=datetime.now(),
            recurring=recurring,
            client=client,
            description=description
        )
        
        self.revenues.append(entry)
        self._recalculate_progress()
        self._save_data()
        
        logger.info(f"Revenue recorded: ${usd_val:,.2f} via {stream.value}")
        return entry
    
    def _recalculate_progress(self):
        """Re-evaluates current ARR across all streams."""
        now = datetime.now()
        thirty_days_ago = now - timedelta(days=30)
        
        # Reset current ARR for all goals
        for goal in self.goals.values():
            goal.current_arr = 0.0
            
        for rev in self.revenues:
            goal = self.goals.get(rev.stream)
            if not goal: continue
            
            if rev.recurring:
                # Only count recurring if it happened in last 30 days (active)
                if rev.date >= thirty_days_ago:
                    goal.current_arr += (rev.amount_usd * 12)
            else:
                # One-time revenue counts toward ARR for the current period
                goal.current_arr += rev.amount_usd
    
    def get_total_arr(self) -> float:
        """Returns the aggregate ARR across all streams."""
        return sum(g.current_arr for g in self.goals.values())
    
    def get_progress_percent(self) -> float:
        """Returns overall progress percentage toward $1M."""
        return (self.get_total_arr() / ARR_TARGET_2026) * 100
    
    def get_required_mrr_growth(self) -> float:
        """
        Calculates the required monthly growth rate to hit $1M by end of 2026.
        Assumes linear compounding growth.
        """
        current_mrr = self.get_total_arr() / 12
        target_mrr = ARR_TARGET_2026 / 12
        
        # Determine months remaining in 2026
        # If we are in 2026, calculate based on current month
        now = datetime.now()
        if now.year < 2026:
            months_left = 12
        elif now.year == 2026:
            months_left = 12 - now.month + 1
        else:
            months_left = 1 # Already past 2026?
            
        if current_mrr <= 0:
            return 100.0 # High growth needed
            
        if current_mrr >= target_mrr:
            return 0.0
            
        # target = current * (1 + rate)^months
        rate = (target_mrr / current_mrr) ** (1 / months_left) - 1
        return rate * 100
    
    def _save_data(self):
        """Persists revenue state to JSON."""
        try:
            data = {
                "metadata": {"last_updated": datetime.now().isoformat()},
                "revenues": [
                    {
                        "id": r.id,
                        "stream": r.stream.value,
                        "usd": r.amount_usd,
                        "orig": r.amount_original,
                        "cur": r.currency,
                        "date": r.date.isoformat(),
                        "rec": r.recurring,
                        "client": r.client,
                        "desc": r.description
                    }
                    for r in self.revenues
                ]
            }
            self.revenue_file.write_text(json.dumps(data, indent=2), encoding="utf-8")
        except Exception as e:
            logger.error(f"Failed to save cashflow data: {e}")
            
    def _load_data(self):
        """Loads revenue state from disk."""
        if not self.revenue_file.exists():
            return
            
        try:
            data = json.loads(self.revenue_file.read_text(encoding="utf-8"))
            for r in data.get("revenues", []):
                self.revenues.append(Revenue(
                    id=r["id"],
                    stream=RevenueStream(r["stream"]),
                    amount_usd=r["usd"],
                    amount_original=r["orig"],
                    currency=r["cur"],
                    date=datetime.fromisoformat(r["date"]),
                    recurring=r["rec"],
                    client=r.get("client"),
                    description=r.get("desc", "")
                ))
            self._recalculate_progress()
        except Exception as e:
            logger.warning(f"Cashflow data loading failed: {e}")

    def print_dashboard(self):
        """Renders the comprehensive $1M Goal Dashboard."""
        arr = self.get_total_arr()
        progress = self.get_progress_percent()
        growth = self.get_required_mrr_growth()
        
        print("\n" + "═" * 65)
        print("║" + "💰 2026 UNICORN REVENUE DASHBOARD ($1M ARR)".center(63) + "║")
        print("═" * 65)
        
        # Main Progress Bar
        bar_width = 30
        filled = int(bar_width * min(progress, 100) / 100)
        bar = "█" * filled + "░" * (bar_width - filled)
        
        print(f"\n  OVERALL PROGRESS: [{bar}] {progress:.1f}%")
        print(f"  CURRENT ARR:      ${arr:,.0f} / ${ARR_TARGET_2026:,}")
        print(f"  REQUIRED GROWTH:  {growth:.1f}% month-over-month")
        
        print("\n  📊 STREAM BREAKDOWN:")
        print("  " + "─" * 61)
        
        for stream, goal in self.goals.items():
            s_filled = int(15 * min(goal.progress_percent, 100) / 100)
            s_bar = "█" * s_filled + "░" * (15 - s_filled)
            icon = {
                RevenueStream.WELLNEXUS: "🌐",
                RevenueStream.AGENCY:    "🏢",
                RevenueStream.SAAS:      "🤖",
                RevenueStream.CONSULTING: "💼",
                RevenueStream.AFFILIATE:  "🔗",
            }.get(stream, "💰")
            
            print(f"  {icon} {stream.value.upper():<12} | [{s_bar}] ${goal.current_arr:,.0f} / ${goal.target_arr:,.0f}")
            
        print("\n" + "═" * 65)
        if progress >= 100:
            print("║  🏆 GOAL ACHIEVED! Celebrating the $1M Unicorn status.  ║")
        elif progress >= 50:
            print("║  ⚡ Momentum Building. Focus on scaling the winning stream. ║")
        else:
            print(f"║  🚀 Target: ${ (ARR_TARGET_2026/12):,.0f} MRR. Keep building the moat! ║")
        print("═" * 65 + "\n")


# Global Instance
_engine = None

def get_cashflow_engine() -> CashflowEngine:
    """Access the shared cashflow tracking engine."""
    global _engine
    if _engine is None:
        _engine = CashflowEngine()
    return _engine