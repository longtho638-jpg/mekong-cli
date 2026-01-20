"""
Tech Support Dashboard and Stats.
"""
from typing import Any, Dict, List

from .engine import TechSupportEngine
from .models import IssueCategory, IssueStatus, TechIssue


class TechSupportDashboard(TechSupportEngine):
    def get_stats(self) -> Dict[str, Any]:
        resolved = [i for i in self.issues.values() if i.resolved_at]
        avg = (sum((i.resolved_at - i.created_at).total_seconds() for i in resolved) / len(resolved) / 3600) if resolved else None
        return {"total": len(self.issues), "open": len(self.get_open_issues()), "resolved": len(resolved), "avg_resolution_hours": avg}

    def format_dashboard(self) -> str:
        stats = self.get_stats()
        lines = ["╔═══════════════════════════════════════════════════════════╗", "║  🔧 TECH SUPPORT SPECIALIST                               ║", f"║  {stats['total']} issues │ {stats['open']} open │ {stats['resolved']} resolved           ║", "╠═══════════════════════════════════════════════════════════╣"]
        for issue in list(self.get_open_issues())[:5]:
            lines.append(f"║  {issue.status.value[:3]} {issue.priority.value[:3]} {issue.title[:22]:<22} │ {issue.client[:12]:<12}  ║")
        lines.extend(["║                                                           ║", "╠═══════════════════════════════════════════════════════════╣", f"║  🏯 {self.agency_name} - Solutions!                    ║", "╚═══════════════════════════════════════════════════════════╝"])
        return "\n".join(lines)
