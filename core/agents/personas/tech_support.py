"""
🔧 Technical Support Specialist - Tech Support
=================================================

Resolve technical issues for clients.
Expert troubleshooting!

Roles:
- Technical troubleshooting
- Bug tracking
- System diagnostics
- Documentation
"""

import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional


class IssuePriority(Enum):
    """Issue priority levels."""

    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class IssueCategory(Enum):
    """Issue categories."""

    BUG = "bug"
    CONFIGURATION = "configuration"
    INTEGRATION = "integration"
    PERFORMANCE = "performance"
    ACCESS = "access"
    OTHER = "other"


class IssueStatus(Enum):
    """Issue status."""

    NEW = "new"
    INVESTIGATING = "investigating"
    IN_PROGRESS = "in_progress"
    AWAITING_INFO = "awaiting_info"
    RESOLVED = "resolved"
    CLOSED = "closed"


@dataclass
class TechIssue:
    """A technical support issue."""

    id: str
    client: str
    title: str
    category: IssueCategory
    priority: IssuePriority
    status: IssueStatus = IssueStatus.NEW
    specialist: str = ""
    resolution: str = ""
    created_at: datetime = field(default_factory=datetime.now)
    resolved_at: Optional[datetime] = None


class TechSupportSpecialist:
    """
    Technical Support Specialist.

    Expert troubleshooting.
    """

    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.issues: Dict[str, TechIssue] = {}

    def create_issue(
        self,
        client: str,
        title: str,
        category: IssueCategory,
        priority: IssuePriority,
        specialist: str = "",
    ) -> TechIssue:
        """Create a tech support issue."""
        issue = TechIssue(
            id=f"TSS-{uuid.uuid4().hex[:6].upper()}",
            client=client,
            title=title,
            category=category,
            priority=priority,
            specialist=specialist,
        )
        self.issues[issue.id] = issue
        return issue

    def update_status(self, issue: TechIssue, status: IssueStatus, resolution: str = ""):
        """Update issue status."""
        issue.status = status
        if status == IssueStatus.RESOLVED:
            issue.resolved_at = datetime.now()
            issue.resolution = resolution

    def get_open_issues(self) -> List[TechIssue]:
        """Get open issues."""
        return [
            i
            for i in self.issues.values()
            if i.status not in [IssueStatus.RESOLVED, IssueStatus.CLOSED]
        ]

    def get_stats(self) -> Dict[str, Any]:
        """Get support stats."""
        resolved = [i for i in self.issues.values() if i.resolved_at]
        avg_resolution = None
        if resolved:
            total_time = sum((i.resolved_at - i.created_at).total_seconds() for i in resolved)
            avg_resolution = total_time / len(resolved) / 3600  # hours

        return {
            "total": len(self.issues),
            "open": len(self.get_open_issues()),
            "resolved": len(resolved),
            "avg_resolution_hours": avg_resolution,
        }

    def format_dashboard(self) -> str:
        """Format tech support dashboard."""
        stats = self.get_stats()

        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            "║  🔧 TECH SUPPORT SPECIALIST                               ║",
            f"║  {stats['total']} issues │ {stats['open']} open │ {stats['resolved']} resolved           ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📋 OPEN ISSUES                                           ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]

        priority_icons = {"critical": "🔴", "high": "🟠", "medium": "🟡", "low": "🟢"}
        status_icons = {
            "new": "🆕",
            "investigating": "🔍",
            "in_progress": "🔄",
            "awaiting_info": "⏳",
            "resolved": "✅",
            "closed": "📁",
        }

        for issue in list(self.get_open_issues())[:5]:
            p_icon = priority_icons.get(issue.priority.value, "⚪")
            s_icon = status_icons.get(issue.status.value, "⚪")

            lines.append(
                f"║  {p_icon} {s_icon} {issue.title[:22]:<22} │ {issue.client[:12]:<12}  ║"
            )

        lines.extend(
            [
                "║                                                           ║",
                "║  📊 BY CATEGORY                                           ║",
                "║  ─────────────────────────────────────────────────────── ║",
            ]
        )

        cat_icons = {
            "bug": "🐛",
            "configuration": "⚙️",
            "integration": "🔗",
            "performance": "⚡",
            "access": "🔑",
            "other": "📋",
        }
        for cat in list(IssueCategory)[:4]:
            count = sum(1 for i in self.issues.values() if i.category == cat)
            icon = cat_icons.get(cat.value, "📋")
            lines.append(
                f"║    {icon} {cat.value.capitalize():<15} │ {count:>2} issues                 ║"
            )

        lines.extend(
            [
                "║                                                           ║",
                "║  [🆕 New Issue]  [🔍 Diagnose]  [✅ Resolve]              ║",
                "╠═══════════════════════════════════════════════════════════╣",
                f"║  🏯 {self.agency_name} - Expert troubleshooting!          ║",
                "╚═══════════════════════════════════════════════════════════╝",
            ]
        )

        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    tss = TechSupportSpecialist("Saigon Digital Hub")

    print("🔧 Tech Support Specialist")
    print("=" * 60)
    print()

    i1 = tss.create_issue(
        "Sunrise Realty",
        "Website loading slow",
        IssueCategory.PERFORMANCE,
        IssuePriority.HIGH,
        "Alex",
    )
    i2 = tss.create_issue(
        "Coffee Lab",
        "Analytics not tracking",
        IssueCategory.INTEGRATION,
        IssuePriority.MEDIUM,
        "Sam",
    )
    i3 = tss.create_issue(
        "Tech Startup", "Login not working", IssueCategory.BUG, IssuePriority.CRITICAL, "Alex"
    )
    i4 = tss.create_issue(
        "Fashion Brand", "Can't access portal", IssueCategory.ACCESS, IssuePriority.HIGH, "Sam"
    )

    # Update statuses
    tss.update_status(i1, IssueStatus.INVESTIGATING)
    tss.update_status(i2, IssueStatus.IN_PROGRESS)
    tss.update_status(i3, IssueStatus.RESOLVED, "Fixed auth token issue")

    print(tss.format_dashboard())
