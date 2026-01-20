"""
Client Health Dashboard rendering.
"""
from typing import List

from .engine import HealthEngine
from .models import HealthLevel


class HealthDashboard(HealthEngine):
    def get_at_risk(self) -> List:
        return [
            c
            for c in self.clients.values()
            if c.health_level in [HealthLevel.AT_RISK, HealthLevel.CRITICAL]
        ]

    def format_dashboard(self) -> str:
        """Render Health Dashboard."""
        total = len(self.clients)
        at_risk = self.get_at_risk()
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  ❤️ CLIENT HEALTH DASHBOARD{' ' * 32}║",
            f"║  {total} clients │ {len(at_risk)} at-risk │ {self.agency_name[:25]:<25} ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 TOP HEALTH SCORES                                     ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]

        level_icons = {
            HealthLevel.EXCELLENT: "🟢", HealthLevel.GOOD: "🟡",
            HealthLevel.AT_RISK: "🟠", HealthLevel.CRITICAL: "🔴",
        }

        sorted_clients = sorted(self.clients.values(), key=lambda x: x.overall_score, reverse=True)[:5]
        for c in sorted_clients:
            icon = level_icons.get(c.health_level, "⚪")
            bar = "█" * (c.overall_score // 10) + "░" * (10 - c.overall_score // 10)
            lines.append(f"║  {icon} {c.client_name[:15]:<15} │ {bar} │ {c.overall_score:>3}  ║")

        lines.extend(["║                                                           ║", "║  🚨 URGENT: AT-RISK CLIENTS                               ║", "║  ───────────────────────────────────────────────────────  ║"])
        if not at_risk:
            lines.append("║    ✅ All clients are currently healthy!                  ║")
        else:
            for c in at_risk[:3]:
                risk_str = ", ".join(r.value.split("_")[0] for r in c.risk_factors[:2])
                lines.append(f"║    🔴 {c.client_name[:15]:<15} │ {risk_str:<25}  ║")

        lines.extend(["║                                                           ║", "║  📈 AVERAGE METRICS                                       ║", "║  ───────────────────────────────────────────────────────  ║"])
        if total:
            def avg(attr): return sum(getattr(c, attr) for c in self.clients.values()) // total
            lines.append(f"║    📊 Engagement: {avg('engagement_score'):>3}  │  💳 Payment: {avg('payment_score'):>3}      ║")
            lines.append(f"║    📈 Results:    {avg('results_score'):>3}  │  💬 Comms:   {avg('communication_score'):>3}      ║")

        lines.extend([
            "║                                                           ║",
            "║  [📊 Details]  [📧 Outreach]  [📅 Schedule Check-in]      ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  Castle {self.agency_name[:40]:<40} - Health!              ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)
