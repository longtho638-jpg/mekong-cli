"""
Client Onboarding Facade and Dashboard.
"""
import logging

from .flow import OnboardingFlowBase
from .models import ClientOnboarding, OnboardingChecklist, OnboardingStep

logger = logging.getLogger(__name__)

class ClientOnboardingFlow(OnboardingFlowBase):
    """
    Client Onboarding Flow System.
    Manages the initial stages of the client-agency relationship.
    """
    def __init__(self, agency_name: str):
        super().__init__(agency_name)
        logger.info(f"Onboarding Flow initialized for {agency_name}")

    def format_onboarding_detail(self, onboarding_id: str) -> str:
        """Render detail view for a specific onboarding."""
        if onboarding_id not in self.onboardings:
            return "❌ Onboarding record not found."

        onb = self.onboardings[onboarding_id]
        progress = self.get_progress(onb)
        bar = "█" * int(progress / 10) + "░" * (10 - int(progress / 10))

        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  👋 CLIENT ONBOARDING DETAIL{' ' * 31}║",
            f"║  {onb.client_name[:50]:<50}         ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  📊 Progress: {bar} {progress:>3.0f}%{' ' * 21}║",
            "║                                                           ║",
            "║  ✅ CHECKLIST                                             ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]

        for item in onb.checklist:
            icon = "✅" if item.completed else "⬜"
            status = "Done" if item.completed else f"Day {item.due_days}"
            lines.append(f"║    {icon} {item.name:<25} │ {status:<15}  ║")

        lines.extend([
            "║                                                           ║",
            "║  [📧 Reminder]  [📊 Details]  [✅ Mark Done]              ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - First Impression!  ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)

    def format_overview(self) -> str:
        """Render overview of all active onboardings."""
        in_progress = sum(1 for o in self.onboardings.values() if not o.completed_at)
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  👋 ONBOARDING OVERVIEW{' ' * 36}║",
            f"║  {len(self.onboardings)} total │ {in_progress} active onboardings{' ' * 18}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  Client          │ Progress │ Status                     ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        for onb in list(self.onboardings.values())[:5]:
            progress = self.get_progress(onb)
            bar = "█" * int(progress / 20) + "░" * (5 - int(progress / 20))
            status = "✅ Done  " if onb.completed_at else "🔄 Active"
            lines.append(f"║  {onb.client_name[:15]:<15} │ {bar} {progress:>3.0f}% │ {status:<10}  ║")
        lines.append("╚═══════════════════════════════════════════════════════════╝")
        return "\n".join(lines)
