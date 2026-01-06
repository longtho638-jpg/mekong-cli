"""
🏯 Chapter 6: Hư Thực (虛實) - Weakness & Strength
==================================================

"Đánh vào chỗ trống, tránh chỗ đầy"

Attack weakness, avoid strength. Blue ocean strategy.
ANTI-DILUTION SHIELD: Investor Red Flag Detection.
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum


class RedFlagSeverity(Enum):
    """Red flag severity level."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class RedFlag:
    """An investor/term sheet red flag."""
    category: str
    description: str
    severity: RedFlagSeverity
    recommendation: str
    binh_phap: str = ""


@dataclass
class WeaknessAnalysis:
    """Competitor weakness analysis."""
    competitor: str
    weaknesses: List[str] = field(default_factory=list)
    attack_vectors: List[str] = field(default_factory=list)
    blue_ocean: str = ""


class ChapterSixWeakness:
    """
    Chapter 6: Hư Thực - Weakness & Strength.
    
    🛡️ ANTI-DILUTION SHIELD
    
    "Công kỳ vô bị, xuất kỳ bất ý"
    (Attack where they're unprepared, appear where unexpected)
    """
    
    # Term Sheet Scoring Constants
    BASE_SCORE = 100
    DEDUCTION_CRITICAL = 25
    DEDUCTION_HIGH = 15
    DEDUCTION_MEDIUM = 10
    DEDUCTION_LOW = 5
    
    # Status Thresholds
    SCORE_FRIENDLY_THRESHOLD = 70
    SCORE_NEGOTIATE_THRESHOLD = 50

    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.red_flags: List[RedFlag] = []
        self.competitor_weaknesses: Dict[str, WeaknessAnalysis] = {}
        self._init_red_flags()
        self._init_demo_data()
    
    def _init_red_flags(self) -> None:
        """Initialize common investor red flags database."""
        self.red_flag_database = [
            RedFlag(
                "Liquidation Preference",
                "2x or higher participating preferred",
                RedFlagSeverity.CRITICAL,
                "Negotiate to 1x non-participating",
                "Họ đang 'đầy' ở chỗ này - tránh!"
            ),
            RedFlag(
                "Anti-Dilution",
                "Full ratchet anti-dilution",
                RedFlagSeverity.CRITICAL,
                "Insist on broad-based weighted average",
                "Điều khoản này là 'thực' - rất nguy hiểm"
            ),
            RedFlag(
                "Board Control",
                "Investor majority on board before profitability",
                RedFlagSeverity.HIGH,
                "Maintain founder majority or parity",
                "Mất board = mất công ty"
            ),
            RedFlag(
                "Vesting Restart",
                "Founder vesting resets on funding",
                RedFlagSeverity.HIGH,
                "Negotiate credit for time served",
                "Bạn đã chiến đấu - được công nhận"
            ),
            RedFlag(
                "Pay-to-Play",
                "Aggressive pay-to-play terms",
                RedFlagSeverity.MEDIUM,
                "Negotiate carve-outs for small investors",
                "Có thể chấp nhận nếu có bảo vệ"
            ),
            RedFlag(
                "Drag-Along",
                "Low threshold drag-along (50%)",
                RedFlagSeverity.HIGH,
                "Negotiate to 70-80% threshold",
                "Cần đa số thật sự để kéo theo"
            ),
            RedFlag(
                "No-Shop",
                "Extended no-shop period (60+ days)",
                RedFlagSeverity.MEDIUM,
                "Limit to 30-45 days",
                "Thời gian là tiền - giữ linh hoạt"
            ),
            RedFlag(
                "Redemption Rights",
                "Mandatory redemption after 5 years",
                RedFlagSeverity.HIGH,
                "Remove or extend to 7+ years",
                "Họ đang tạo áp lực thời gian"
            ),
        ]
    
    def _init_demo_data(self) -> None:
        """Initialize demo competitor analysis."""
        self.competitor_weaknesses["BigCorp Enterprise"] = WeaknessAnalysis(
            competitor="BigCorp Enterprise",
            weaknesses=[
                "Slow product updates (quarterly)",
                "Enterprise-only pricing",
                "Poor mobile experience",
                "Complex onboarding (weeks)",
            ],
            attack_vectors=[
                "Target SMB market they ignore",
                "Offer self-serve + rapid deployment",
                "Mobile-first approach",
                "Freemium to capture early adopters",
            ],
            blue_ocean="SMB segment with mobile-first, self-serve product"
        )
    
    def detect_red_flags(self, term_sheet: Dict[str, Any]) -> List[RedFlag]:
        """Detect red flags in a term sheet."""
        detected = []
        
        # Check liquidation preference
        liq_pref = term_sheet.get("liquidation_preference", "")
        if "participating" in liq_pref.lower() and "non-participating" not in liq_pref.lower():
            detected.append(self.red_flag_database[0])
        elif "2x" in liq_pref or "3x" in liq_pref:
            detected.append(self.red_flag_database[0])
        
        # Check anti-dilution
        anti_dilution = term_sheet.get("anti_dilution", "")
        if "full ratchet" in anti_dilution.lower():
            detected.append(self.red_flag_database[1])
        
        # Check board
        board = term_sheet.get("board_composition", "")
        if "investor majority" in board.lower():
            detected.append(self.red_flag_database[2])
        
        # Check drag-along
        drag = term_sheet.get("drag_along", "")
        if "50%" in drag or "majority" in drag.lower():
            detected.append(self.red_flag_database[5])
        
        return detected
    
    def score_term_sheet(self, term_sheet: Dict[str, Any]) -> Dict[str, Any]:
        """Score a term sheet for founder-friendliness."""
        red_flags = self.detect_red_flags(term_sheet)
        
        # Use constants for initial score
        score = self.BASE_SCORE
        
        # Deduct for red flags using constants
        for flag in red_flags:
            if flag.severity == RedFlagSeverity.CRITICAL:
                score -= self.DEDUCTION_CRITICAL
            elif flag.severity == RedFlagSeverity.HIGH:
                score -= self.DEDUCTION_HIGH
            elif flag.severity == RedFlagSeverity.MEDIUM:
                score -= self.DEDUCTION_MEDIUM
            else:
                score -= self.DEDUCTION_LOW
        
        # Determine status and recommendation based on thresholds
        final_score = max(0, score)
        if final_score >= self.SCORE_FRIENDLY_THRESHOLD:
            recommendation = "PROCEED"
            shield_status = "🛡️ PROTECTED"
        elif final_score >= self.SCORE_NEGOTIATE_THRESHOLD:
            recommendation = "NEGOTIATE"
            shield_status = "⚠️ AT RISK"
        else:
            recommendation = "WALK AWAY"
            shield_status = "🚨 DANGER"

        return {
            "founder_friendly_score": final_score,
            "red_flags_count": len(red_flags),
            "red_flags": red_flags,
            "recommendation": recommendation,
            "shield_status": shield_status
        }
    
    def find_blue_ocean(self, market: str, competitors: List[str]) -> Dict[str, Any]:
        """Find blue ocean opportunities."""
        return {
            "market": market,
            "strategy": "Target underserved segment",
            "tactics": [
                "Identify customers ignored by incumbents",
                "Simplify over-engineered solutions",
                "New pricing model (usage-based, freemium)",
                "Vertical focus vs horizontal sprawl",
            ],
            "binh_phap": "Công kỳ vô bị - attack where unprepared",
            "example_opportunities": [
                f"SMB version of {competitors[0] if competitors else 'incumbent'} solution",
                "Mobile-first approach in desktop-dominated market",
                "AI-powered automation of manual processes",
            ]
        }
    
    def format_dashboard(self) -> str:
        """Format Chapter 6 dashboard."""
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            "║  🏯 CHAPTER 6: HƯ THỰC (虛實)                              ║",
            "║  Attack Weakness + ANTI-DILUTION SHIELD 🛡️                ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🛡️ ANTI-DILUTION SHIELD                                  ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        # Show red flag database
        severity_icons = {"low": "🟡", "medium": "🟠", "high": "🔴", "critical": "🚨"}
        for flag in self.red_flag_database[:5]:
            icon = severity_icons.get(flag.severity.value, "⚪")
            lines.append(f"║    {icon} {flag.category:<20} │ {flag.severity.value.upper():<8}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  🎯 COMPETITOR WEAKNESS ANALYSIS                          ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for competitor, analysis in list(self.competitor_weaknesses.items())[:1]:
            lines.append(f"║    📊 {competitor}                                ║")
            for weakness in analysis.weaknesses[:3]:
                lines.append(f"║       ❌ {weakness[:40]:<40}  ║")
            lines.append(f"║    🌊 Blue Ocean: {analysis.blue_ocean[:35]:<35}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  💡 BINH PHÁP WISDOM                                      ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║    \"Công kỳ vô bị, xuất kỳ bất ý\"                        ║",
            "║    (Attack unprepared, appear unexpected)                ║",
            "║                                                           ║",
            "║  [🛡️ Shield]  [🎯 Weakness]  [🌊 Blue Ocean]              ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Know your battlefield!          ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    ch6 = ChapterSixWeakness("Saigon Digital Hub")
    print("🏯 Chapter 6: Hư Thực")
    print("=" * 60)
    print()
    print(ch6.format_dashboard())
    
    # Test red flag detection
    print("\n🛡️ Testing Anti-Dilution Shield:")
    sample_term_sheet = {
        "liquidation_preference": "2x participating preferred",
        "anti_dilution": "full ratchet",
        "board_composition": "2 investor, 1 founder",
    }
    result = ch6.score_term_sheet(sample_term_sheet)
    print(f"   Score: {result['founder_friendly_score']}%")
    print(f"   Status: {result['shield_status']}")
    print(f"   Recommendation: {result['recommendation']}")
