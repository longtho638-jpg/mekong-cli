"""
Strategy Module - Presentation
"""

from typing import List

from .entities import StrategicInsight
from .services import StrategyService


class StrategyPresenter:
    @staticmethod
    def format_report(service: StrategyService, insights: List[StrategicInsight]) -> str:
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🏯 BINH PHAP STRATEGY REPORT: {service.agency_name.upper()[:23]:<23} ║",
            "╠═══════════════════════════════════════════════════════════╣",
        ]

        for insight in insights:
            lines.append(
                f"║  📜 CH.{insight.chapter.value:02d}: {service.get_chapter_title(insight.chapter):<33} ║"
            )
            lines.append("║  " + "─" * 57 + "  ║")
            lines.append(f"║  💡 {insight.title:<50} ║")
            lines.append(f"║     {insight.content[:50]:<50} ║")
            if len(insight.content) > 50:
                lines.append(f"║     {insight.content[50:100]:<50}..║")

            lines.append("║                                                           ║")
            lines.append("║  ✅ ACTION ITEMS:                                         ║")
            for item in insight.action_items:
                lines.append(f"║     • {item:<48} ║")
            lines.append("║                                                           ║")

        lines.append("╚═══════════════════════════════════════════════════════════╝")
        return "\n".join(lines)
