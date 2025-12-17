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

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class MarketTrend(Enum):
    """Market trend direction."""
    UP = "up"
    DOWN = "down"
    STABLE = "stable"


class AnalysisType(Enum):
    """Analysis types."""
    MARKET_OVERVIEW = "market_overview"
    PRICE_TREND = "price_trend"
    COMPETITOR = "competitor"
    INVESTMENT = "investment"
    RENTAL = "rental"


@dataclass
class MarketReport:
    """A market analysis report."""
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


@dataclass
class CompetitorAnalysis:
    """Competitor property analysis."""
    id: str
    competitor: str
    listings_count: int
    avg_price: float
    market_share: float  # percentage
    strengths: List[str] = field(default_factory=list)


class REMarketAnalyst:
    """
    Real Estate Market Analyst.
    
    Analyze market trends.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.reports: Dict[str, MarketReport] = {}
        self.competitors: Dict[str, CompetitorAnalysis] = {}
    
    def create_report(
        self,
        client_id: str,
        title: str,
        analysis_type: AnalysisType,
        location: str,
        avg_price: float,
        trend: MarketTrend,
        confidence: int = 80
    ) -> MarketReport:
        """Create a market report."""
        report = MarketReport(
            id=f"RPT-{uuid.uuid4().hex[:6].upper()}",
            client_id=client_id,
            title=title,
            analysis_type=analysis_type,
            location=location,
            avg_price_sqm=avg_price,
            trend=trend,
            confidence=confidence
        )
        self.reports[report.id] = report
        return report
    
    def add_insight(self, report: MarketReport, insight: str):
        """Add insight to report."""
        report.insights.append(insight)
    
    def analyze_competitor(
        self,
        competitor: str,
        listings: int,
        avg_price: float,
        market_share: float
    ) -> CompetitorAnalysis:
        """Create competitor analysis."""
        analysis = CompetitorAnalysis(
            id=f"CMP-{uuid.uuid4().hex[:6].upper()}",
            competitor=competitor,
            listings_count=listings,
            avg_price=avg_price,
            market_share=market_share
        )
        self.competitors[analysis.id] = analysis
        return analysis
    
    def get_stats(self) -> Dict[str, Any]:
        """Get analyst statistics."""
        by_type = {}
        for atype in AnalysisType:
            by_type[atype.value] = sum(1 for r in self.reports.values() if r.analysis_type == atype)
        
        avg_confidence = sum(r.confidence for r in self.reports.values()) / len(self.reports) if self.reports else 0
        
        return {
            "total_reports": len(self.reports),
            "competitors_tracked": len(self.competitors),
            "by_type": by_type,
            "avg_confidence": avg_confidence
        }
    
    def format_dashboard(self) -> str:
        """Format analyst dashboard."""
        stats = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📊 RE MARKET ANALYST                                     ║",
            f"║  {stats['total_reports']} reports │ {stats['competitors_tracked']} competitors │ {stats['avg_confidence']:.0f}% conf  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📋 RECENT REPORTS                                        ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        trend_icons = {"up": "📈", "down": "📉", "stable": "➡️"}
        type_icons = {"market_overview": "🌐", "price_trend": "💰", "competitor": "🏢",
                     "investment": "💎", "rental": "🔑"}
        
        for report in list(self.reports.values())[:5]:
            t_icon = trend_icons.get(report.trend.value, "➡️")
            a_icon = type_icons.get(report.analysis_type.value, "📊")
            
            lines.append(f"║  {t_icon} {a_icon} {report.title[:18]:<18} │ ${report.avg_price_sqm:>6,.0f}/m² │ {report.confidence:>2}%  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 BY ANALYSIS TYPE                                      ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for atype in list(AnalysisType)[:4]:
            count = stats['by_type'].get(atype.value, 0)
            icon = type_icons.get(atype.value, "📊")
            lines.append(f"║    {icon} {atype.value.replace('_', ' ').title():<18} │ {count:>3} reports          ║")
        
        lines.extend([
            "║                                                           ║",
            "║  🏢 COMPETITOR TRACKING                                   ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for comp in list(self.competitors.values())[:4]:
            lines.append(f"║    🏢 {comp.competitor[:15]:<15} │ {comp.listings_count:>4} │ {comp.market_share:>5.1f}% share  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [📊 New Report]  [🏢 Competitors]  [📈 Trends]           ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Data-driven decisions!           ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    analyst = REMarketAnalyst("Saigon Digital Hub")
    
    print("📊 RE Market Analyst")
    print("=" * 60)
    print()
    
    r1 = analyst.create_report("CLT-001", "D2 Villa Market Q4", AnalysisType.MARKET_OVERVIEW, "District 2", 5500, MarketTrend.UP, 85)
    r2 = analyst.create_report("CLT-001", "Rental Yield Analysis", AnalysisType.RENTAL, "District 7", 3200, MarketTrend.STABLE, 90)
    r3 = analyst.create_report("CLT-002", "Investment Hotspots", AnalysisType.INVESTMENT, "Thu Duc", 2800, MarketTrend.UP, 75)
    
    analyst.add_insight(r1, "Luxury segment growing 15% YoY")
    analyst.add_insight(r1, "Foreign buyer interest increasing")
    
    analyst.analyze_competitor("Savills", 250, 6000, 25.5)
    analyst.analyze_competitor("CBRE", 180, 5500, 18.2)
    analyst.analyze_competitor("JLL", 120, 5200, 12.0)
    
    print(analyst.format_dashboard())
