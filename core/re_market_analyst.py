"""
📊 RE Market Analyst - Real Estate Analytics
==============================================

Analyze real estate market for clients.
Data-driven decisions!

Roles:
- Market analysis
- Price trends
- Competitor tracking
- Investment insights
"""

import uuid
import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MarketTrend(Enum):
    """Directions of market movement."""
    UP = "up"
    DOWN = "down"
    STABLE = "stable"


class AnalysisType(Enum):
    """Categories of market research."""
    MARKET_OVERVIEW = "market_overview"
    PRICE_TREND = "price_trend"
    COMPETITOR = "competitor"
    INVESTMENT = "investment"
    RENTAL = "rental"


@dataclass
class MarketReport:
    """A comprehensive market research document entity."""
    id: str
    client_id: str
    title: str
    analysis_type: AnalysisType
    location: str
    avg_price_sqm: float
    trend: MarketTrend
    confidence: int  # 1-100
    insights: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)

    def __post_init__(self):
        if not self.title or not self.location:
            raise ValueError("Title and location are required")
        if not 0 <= self.confidence <= 100:
            raise ValueError("Confidence must be 0-100")


@dataclass
class CompetitorIntel:
    """Benchmarking data for rival agencies/players."""
    id: str
    competitor: str
    listings_count: int
    avg_price: float
    market_share: float
    strengths: List[str] = field(default_factory=list)


class REMarketAnalyst:
    """
    RE Market Analyst System.
    
    Orchestrates market research, competitor benchmarking, and investment insight generation.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.reports: Dict[str, MarketReport] = {}
        self.competitors: Dict[str, CompetitorIntel] = {}
        logger.info(f"RE Market Analyst initialized for {agency_name}")
    
    def generate_report(
        self,
        client: str,
        title: str,
        a_type: AnalysisType,
        location: str,
        price: float,
        trend: MarketTrend
    ) -> MarketReport:
        """Create and register a new market report."""
        report = MarketReport(
            id=f"RPT-{uuid.uuid4().hex[:6].upper()}",
            client_id=client, title=title, analysis_type=a_type,
            location=location, avg_price_sqm=float(price),
            trend=trend, confidence=85
        )
        self.reports[report.id] = report
        logger.info(f"Market Report Generated: {title} ({location})")
        return report
    
    def get_stats(self) -> Dict[str, Any]:
        """Aggregate high-level research metrics."""
        count = len(self.reports)
        avg_conf = sum(r.confidence for r in self.reports.values()) / count if count else 0.0
        
        return {
            "total_reports": count,
            "avg_confidence": avg_conf,
            "competitor_count": len(self.competitors)
        }
    
    def format_dashboard(self) -> str:
        """Render the Market Analyst Dashboard."""
        s = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📊 RE MARKET ANALYST DASHBOARD{' ' * 30}║",
            f"║  {s['total_reports']} reports │ {s['avg_confidence']:.0f}% confidence │ {s['competitor_count']} competitors{' ' * 8}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📋 RECENT RESEARCH FINDINGS                              ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        trend_map = {MarketTrend.UP: "📈", MarketTrend.DOWN: "📉", MarketTrend.STABLE: "➡️"}
        
        for r in list(self.reports.values())[:5]:
            icon = trend_map.get(r.trend, "➡️")
            lines.append(f"║  {icon} {r.title[:20]:<20} │ ${r.avg_price_sqm:>8,.0f}/m² │ {r.location[:10]:<10} ║")
            
        lines.extend([
            "║                                                           ║",
            "║  [📊 New Report]  [🏢 Competitors]  [📈 Trends]  [⚙️]     ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Data Driven!     ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("📊 Initializing Analyst...")
    print("=" * 60)
    
    try:
        analyst = REMarketAnalyst("Saigon Digital Hub")
        # Seed
        analyst.generate_report("C1", "Q4 District 2 Overview", AnalysisType.MARKET_OVERVIEW, "D2", 5500.0, MarketTrend.UP)
        
        print("\n" + analyst.format_dashboard())
        
    except Exception as e:
        logger.error(f"Analyst Error: {e}")
