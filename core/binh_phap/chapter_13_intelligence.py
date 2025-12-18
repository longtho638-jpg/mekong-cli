"""
🏯 Chapter 13: Dụng Gián (用間) - Intelligence
==============================================

"5 types of spies" - Intelligence gathering.

Competitive intelligence, VC intelligence, market signals.
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum


class IntelType(Enum):
    """Types of intelligence (adapted from 5 types of spies)."""
    LOCAL = "local"              # Industry insiders
    INTERNAL = "internal"        # Former employees of competitors
    CONVERTED = "converted"      # Won over from competitor
    DOOMED = "doomed"           # Public information scraping
    LIVING = "living"            # Active relationships


class IntelSource(Enum):
    """Intelligence source."""
    PUBLIC = "public"            # Public information
    NETWORK = "network"          # Personal network
    CUSTOMER = "customer"        # Customer feedback
    EMPLOYEE = "employee"        # Employee from competitor
    INVESTOR = "investor"        # Investor network


@dataclass
class IntelligenceReport:
    """An intelligence report."""
    id: str
    subject: str
    intel_type: IntelType
    source: IntelSource
    summary: str
    confidence: float  # 0-1
    date: datetime = field(default_factory=datetime.now)
    actionable: bool = True


@dataclass
class VCIntelligence:
    """VC-specific intelligence."""
    vc_name: str
    typical_check_size: float
    focus_areas: List[str] = field(default_factory=list)
    portfolio_overlaps: List[str] = field(default_factory=list)
    known_biases: List[str] = field(default_factory=list)
    decision_makers: List[str] = field(default_factory=list)
    warm_intro_available: bool = False


class ChapterThirteenIntelligence:
    """
    Chapter 13: Dụng Gián - Intelligence.
    
    "Minh quân, hiền tướng dùng gián điệp thượng trí"
    (Wise rulers and generals use the most intelligent spies)
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.intel_reports: List[IntelligenceReport] = []
        self.vc_database: Dict[str, VCIntelligence] = {}
        self._init_demo_data()
    
    def _init_demo_data(self):
        """Initialize demo data."""
        # Sample intel reports
        self.intel_reports = [
            IntelligenceReport(
                "INT-001",
                "Competitor A Roadmap",
                IntelType.LOCAL,
                IntelSource.NETWORK,
                "Competitor planning major platform shift in Q2",
                0.75,
                datetime.now(),
                True
            ),
            IntelligenceReport(
                "INT-002",
                "Market Pricing Shift",
                IntelType.DOOMED,
                IntelSource.PUBLIC,
                "3 competitors reduced prices by 20% this month",
                0.95,
                datetime.now(),
                True
            ),
        ]
        
        # Sample VC database
        self.vc_database = {
            "Sequoia": VCIntelligence(
                "Sequoia Capital",
                5_000_000,
                ["Enterprise SaaS", "AI/ML", "Fintech"],
                ["Competitor B"],
                ["Prefers US-based founders", "Long-term focus"],
                ["Partner A", "Partner B"],
                True
            ),
            "a16z": VCIntelligence(
                "Andreessen Horowitz",
                7_000_000,
                ["Crypto", "Enterprise", "Consumer"],
                [],
                ["Strong brand preference", "Platform services push"],
                ["General Partner X"],
                False
            ),
        }
    
    def gather_competitive_intel(
        self,
        competitor: str,
        aspect: str  # "product", "pricing", "team", "strategy"
    ) -> Dict[str, Any]:
        """Framework for gathering competitive intelligence."""
        intel_sources = {
            "product": [
                "Product Hunt / G2 / Capterra reviews",
                "Free trial / demo recordings",
                "Customer interviews",
                "Technical documentation",
            ],
            "pricing": [
                "Public pricing pages",
                "Ask customers what they pay",
                "Negotiate as potential customer",
                "Monitor price changes over time",
            ],
            "team": [
                "LinkedIn company page",
                "Job postings (reveals priorities)",
                "Glassdoor reviews",
                "Conference speakers",
            ],
            "strategy": [
                "Press releases / blog posts",
                "Executive interviews",
                "Investor presentations",
                "Patent filings",
            ],
        }
        
        return {
            "competitor": competitor,
            "aspect": aspect,
            "recommended_sources": intel_sources.get(aspect, []),
            "binh_phap": "Dụng gián - Use intelligence wisely",
            "ethical_guidelines": [
                "✅ Public information is fair game",
                "✅ Customer conversations are valuable",
                "⚠️ Don't misrepresent yourself",
                "❌ Never steal proprietary data",
            ]
        }
    
    def analyze_vc(self, vc_name: str) -> Dict[str, Any]:
        """Get intelligence on a specific VC."""
        if vc_name not in self.vc_database:
            return {"error": f"VC {vc_name} not in database"}
        
        vc = self.vc_database[vc_name]
        
        return {
            "vc": vc.vc_name,
            "typical_check": vc.typical_check_size,
            "focus_areas": vc.focus_areas,
            "portfolio_conflicts": vc.portfolio_overlaps,
            "known_biases": vc.known_biases,
            "warm_intro": vc.warm_intro_available,
            "approach_strategy": self._get_vc_approach_strategy(vc),
        }
    
    def _get_vc_approach_strategy(self, vc: VCIntelligence) -> List[str]:
        """Get approach strategy for a VC."""
        strategies = []
        
        if vc.warm_intro_available:
            strategies.append("🤝 Use warm intro - highest success rate")
        else:
            strategies.append("📧 Cold outreach - personalize heavily")
        
        if vc.portfolio_overlaps:
            strategies.append(f"⚠️ Address overlap with {vc.portfolio_overlaps[0]}")
        
        if vc.focus_areas:
            strategies.append(f"🎯 Emphasize fit with {vc.focus_areas[0]}")
        
        return strategies
    
    def detect_market_signals(self) -> List[Dict[str, Any]]:
        """Detect market signals from various sources."""
        signals = [
            {
                "signal": "Competitor laying off 20% of staff",
                "interpretation": "Runway pressure, opportunity to hire talent",
                "action": "Reach out to key talent",
                "confidence": 0.90
            },
            {
                "signal": "3 new entrants in last 6 months",
                "interpretation": "Market validation, increased competition",
                "action": "Accelerate differentiation",
                "confidence": 0.85
            },
            {
                "signal": "Enterprise customer segment growing 50%",
                "interpretation": "Move upmarket opportunity",
                "action": "Build enterprise features",
                "confidence": 0.80
            },
        ]
        return signals
    
    def format_dashboard(self) -> str:
        """Format Chapter 13 dashboard."""
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            "║  🏯 CHAPTER 13: DỤNG GIÁN (用間)                           ║",
            "║  Intelligence & Market Research                           ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🕵️ 5 TYPES OF INTELLIGENCE                               ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║    1️⃣ Local       │ Industry insiders                   ║",
            "║    2️⃣ Internal    │ Former competitor employees         ║",
            "║    3️⃣ Converted   │ Won from competitor                 ║",
            "║    4️⃣ Doomed      │ Public information mining           ║",
            "║    5️⃣ Living      │ Active relationships                ║",
            "║                                                           ║",
            "║  📊 RECENT INTEL REPORTS                                  ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        conf_icons = {"high": "🟢", "medium": "🟡", "low": "🔴"}
        for report in self.intel_reports[:3]:
            conf_level = "high" if report.confidence > 0.7 else "medium" if report.confidence > 0.4 else "low"
            icon = conf_icons.get(conf_level, "⚪")
            lines.append(f"║    {icon} {report.subject[:30]:<30} {report.confidence*100:.0f}%  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  💰 VC INTELLIGENCE DATABASE                              ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for name, vc in list(self.vc_database.items())[:3]:
            intro_icon = "🤝" if vc.warm_intro_available else "📧"
            lines.append(f"║    {intro_icon} {vc.vc_name:<25} ${vc.typical_check_size/1e6:.0f}M  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📡 MARKET SIGNALS                                        ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for signal in self.detect_market_signals()[:2]:
            lines.append(f"║    📡 {signal['signal'][:40]:<40}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  💡 BINH PHÁP WISDOM                                      ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║    \"Minh quân, hiền tướng dùng gián điệp thượng trí\"     ║",
            "║    (Wise rulers use intelligent spies)                   ║",
            "║                                                           ║",
            "║  [🕵️ Intel]  [💰 VC DB]  [📡 Signals]                     ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Know your enemy!                ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    ch13 = ChapterThirteenIntelligence("Saigon Digital Hub")
    print("🏯 Chapter 13: Dụng Gián")
    print("=" * 60)
    print()
    print(ch13.format_dashboard())
