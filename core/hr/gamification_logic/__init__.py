"""
Gamification Facade and Dashboard.
"""
import logging

from .engine import GamificationEngineBase
from .models import Achievement, AchievementCategory, AgencyLevel, AgencyProgress, LevelConfig

logger = logging.getLogger(__name__)

class GamificationEngine(GamificationEngineBase):
    def __init__(self):
        super().__init__()
        logger.info("Gamification Engine initialized.")

    def format_dashboard(self, agency_id: str) -> str:
        """Render the Gamification Dashboard."""
        p = self.agency_progress.get(agency_id)
        if not p:
            return "No progress data found."

        conf = self.LEVELS.get(p.current_level)
        bar_len = int((p.xp_total % 1000) / 100)  # Simple 10-step progress
        bar = "█" * bar_len + "░" * (10 - bar_len)

        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🏆 AGENCY RANKING: {p.agency_name.upper()[:30]:<30}  ║",
            f"║  Level: {p.current_level.value.upper():<10} │ Total XP: {p.xp_total:>10} {' ' * 13} ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  📈 Next Level: {bar} {p.xp_total % 1000}/1000 XP {' ' * 14} ║",
            "║                                                           ║",
            "║  🎖️ RECENT ACHIEVEMENTS                                   ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]

        if not p.achievements:
            lines.append("║    Start working to earn your first badge!                ║")
        else:
            for a in p.achievements[-3:]:
                lines.append(f"║    {a.icon} {a.name:<25} │ {a.earned_at.strftime('%Y-%m-%d')}  ║")

        lines.extend(["║                                                           ║", "║  🎁 LEVEL UNLOCKS                                         ║", "║  ───────────────────────────────────────────────────────  ║"])

        if conf:
            for u in conf.unlocks:
                lines.append(f"║    ✅ {u:<53}  ║")

        lines.extend([
            "║                                                           ║",
            "║  [🏆 Leaderboard]  [🎖️ Badges]  [🎁 Rewards]  [⚙️ Setup]  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {p.agency_name[:40]:<40} - Level Up!          ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)
