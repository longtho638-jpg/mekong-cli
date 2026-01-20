"""
Team Performance Facade and Dashboard.
"""
from .engine import TeamTrackerEngine
from .models import Role, TeamMember


class TeamPerformance(TeamTrackerEngine):
    """
    Team Performance Tracker.
    Track and analyze team productivity.
    """
    def format_member(self, member: TeamMember) -> str:
        role_icons = { Role.OWNER: "👑", Role.MANAGER: "📋", Role.DESIGNER: "🎨", Role.DEVELOPER: "💻", Role.MARKETER: "📢", Role.COPYWRITER: "✍️", Role.SUPPORT: "🤝" }
        score = member.productivity_score
        perf_badge = "🔥 TOP PERFORMER" if score >= 80 else ("⭐ EXCELLENT" if score >= 60 else ("✅ GOOD" if score >= 40 else "📈 GROWING"))

        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  👤 {member.name.upper():<50}  ║",
            f"║  {role_icons[member.role]} {member.role.value.capitalize():<50}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  📧 {member.email:<48}  ║",
            f"║  💵 Rate: ${member.hourly_rate:.0f}/hr                                    ║",
            "║                                                           ║",
            "║  📊 PERFORMANCE                                           ║",
            f"║    Projects Completed: {member.projects_completed:<30}  ║",
            f"║    Hours Logged: {member.hours_logged:<36.1f}  ║",
            f"║    Revenue Generated: ${member.revenue_generated:>12,.0f}               ║",
            f"║    Client Rating: {'★' * int(member.client_rating)}{'☆' * (5 - int(member.client_rating))} ({member.client_rating:.1f}/5.0)              ║",
            "║                                                           ║",
        ]
        bar_filled = int(40 * score / 100)
        bar = "█" * bar_filled + "░" * (40 - bar_filled)
        lines.append(f"║  [{bar}] {score:.0f}%  ║")
        lines.append(f"║  {perf_badge:<51}  ║")
        lines.append(f"║  🛠️ {', '.join(member.skills[:4]):<48}  ║")
        lines.append("╚═══════════════════════════════════════════════════════════╝")
        return "\n".join(lines)

    def format_leaderboard(self) -> str:
        sorted_members = sorted(self.members.values(), key=lambda m: m.productivity_score, reverse=True)
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            "║  👥 TEAM LEADERBOARD                                      ║",
            f"║  {self.agency_name:<51}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  Rank │ Name           │ Role      │ Score │ Projects   ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        medals = ["🥇", "🥈", "🥉"]
        for i, member in enumerate(sorted_members[:5]):
            rank = medals[i] if i < 3 else f" {i + 1}"
            lines.append(f"║  {rank:<4} │ {member.name[:14]:<14} │ {member.role.value[:9]:<9} │ {member.productivity_score:>5.0f}% │ {member.projects_completed:>10} ║")

        total_hours = sum(m.hours_logged for m in self.members.values())
        total_revenue = sum(m.revenue_generated for m in self.members.values())
        avg_score = sum(m.productivity_score for m in self.members.values()) / len(self.members) if self.members else 0

        lines.extend([
            "║                                                           ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  📊 Team Stats: {len(self.members)} members | {total_hours:.0f}h logged           ║",
            f"║  💰 Total Revenue: ${total_revenue:>12,.0f}                      ║",
            f"║  📈 Avg Productivity: {avg_score:.0f}%                              ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)
