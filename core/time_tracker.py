"""
⏱️ Time Tracker - Track Billable Hours
========================================

Track time spent on client projects.
Bill accurately and maximize revenue!

Features:
- Time entry logging
- Billable vs non-billable
- Timesheet generation
- Revenue calculation
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class TimeCategory(Enum):
    """Time entry categories."""
    STRATEGY = "strategy"
    DESIGN = "design"
    DEVELOPMENT = "development"
    CONTENT = "content"
    MEETING = "meeting"
    ADMIN = "admin"


@dataclass
class TimeEntry:
    """A time entry."""
    id: str
    project_name: str
    client_name: str
    category: TimeCategory
    description: str
    hours: float
    hourly_rate: float
    billable: bool
    date: datetime
    created_at: datetime = field(default_factory=datetime.now)
    
    @property
    def amount(self) -> float:
        return self.hours * self.hourly_rate if self.billable else 0


class TimeTracker:
    """
    Time Tracker.
    
    Track billable hours and generate timesheets.
    """
    
    def __init__(self, agency_name: str, default_rate: float = 75):
        self.agency_name = agency_name
        self.default_rate = default_rate
        self.entries: List[TimeEntry] = []
    
    def log_time(
        self,
        project_name: str,
        client_name: str,
        category: TimeCategory,
        description: str,
        hours: float,
        billable: bool = True,
        hourly_rate: float = None,
        date: datetime = None
    ) -> TimeEntry:
        """Log a time entry."""
        entry = TimeEntry(
            id=f"TIME-{uuid.uuid4().hex[:6].upper()}",
            project_name=project_name,
            client_name=client_name,
            category=category,
            description=description,
            hours=hours,
            hourly_rate=hourly_rate or self.default_rate,
            billable=billable,
            date=date or datetime.now()
        )
        
        self.entries.append(entry)
        return entry
    
    def get_client_summary(self, client_name: str) -> Dict[str, Any]:
        """Get time summary for a client."""
        client_entries = [e for e in self.entries if e.client_name == client_name]
        
        total_hours = sum(e.hours for e in client_entries)
        billable_hours = sum(e.hours for e in client_entries if e.billable)
        total_amount = sum(e.amount for e in client_entries)
        
        return {
            "client": client_name,
            "entries": len(client_entries),
            "total_hours": total_hours,
            "billable_hours": billable_hours,
            "billable_percent": (billable_hours / total_hours * 100) if total_hours > 0 else 0,
            "total_amount": total_amount
        }
    
    def format_timesheet(self, start_date: datetime, end_date: datetime) -> str:
        """Format timesheet for period."""
        period_entries = [e for e in self.entries 
                        if start_date <= e.date <= end_date]
        
        total_hours = sum(e.hours for e in period_entries)
        billable_hours = sum(e.hours for e in period_entries if e.billable)
        total_revenue = sum(e.amount for e in period_entries)
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  ⏱️ TIMESHEET                                              ║",
            f"║  📅 {start_date.strftime('%b %d')} - {end_date.strftime('%b %d, %Y'):<40}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  Date  │ Project     │ Category │ Hours │ Bill │ Amount  ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        for entry in period_entries[:10]:
            date = entry.date.strftime("%m/%d")
            project = entry.project_name[:11]
            category = entry.category.value[:8]
            hours = f"{entry.hours:.1f}h"
            bill = "✅" if entry.billable else "❌"
            amount = f"${entry.amount:.0f}"
            
            lines.append(
                f"║  {date}  │ {project:<11} │ {category:<8} │ {hours:>5} │  {bill}  │ {amount:>7} ║"
            )
        
        if len(period_entries) > 10:
            lines.append(f"║  ... and {len(period_entries) - 10} more entries                          ║")
        
        # Summary
        utilization = (billable_hours / total_hours * 100) if total_hours > 0 else 0
        
        lines.extend([
            "║                                                           ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 SUMMARY                                               ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    Total Hours: {total_hours:>8.1f}                               ║",
            f"║    Billable Hours: {billable_hours:>5.1f} ({utilization:.0f}% utilization)            ║",
            f"║    💰 Total Revenue: ${total_revenue:>10,.0f}                      ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name}                                    ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)
    
    def format_weekly_summary(self) -> str:
        """Format weekly summary by category."""
        # Group by category
        category_totals = {}
        for category in TimeCategory:
            cat_entries = [e for e in self.entries if e.category == category]
            if cat_entries:
                category_totals[category] = {
                    "hours": sum(e.hours for e in cat_entries),
                    "amount": sum(e.amount for e in cat_entries)
                }
        
        total_hours = sum(e.hours for e in self.entries)
        total_revenue = sum(e.amount for e in self.entries)
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  ⏱️ TIME BY CATEGORY                                      ║",
            "╠═══════════════════════════════════════════════════════════╣",
        ]
        
        cat_icons = {
            TimeCategory.STRATEGY: "🎯",
            TimeCategory.DESIGN: "🎨",
            TimeCategory.DEVELOPMENT: "💻",
            TimeCategory.CONTENT: "📝",
            TimeCategory.MEETING: "📞",
            TimeCategory.ADMIN: "📋"
        }
        
        for category, stats in category_totals.items():
            icon = cat_icons[category]
            name = category.value.capitalize()
            hours = stats["hours"]
            pct = (hours / total_hours * 100) if total_hours > 0 else 0
            bar_filled = int(20 * pct / 100)
            bar = "█" * bar_filled + "░" * (20 - bar_filled)
            
            lines.append(f"║  {icon} {name:<12} [{bar}] {hours:>5.1f}h ({pct:>4.0f}%)  ║")
        
        lines.extend([
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  ⏱️ Total: {total_hours:.1f}h | 💰 Revenue: ${total_revenue:,.0f}             ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    tracker = TimeTracker("Saigon Digital Hub", default_rate=75)
    
    print("⏱️ Time Tracker")
    print("=" * 60)
    print()
    
    # Log sample time
    today = datetime.now()
    
    tracker.log_time("Website Redesign", "Sunrise Realty", TimeCategory.STRATEGY, "Client kickoff meeting", 1.5, True, 100, today)
    tracker.log_time("Website Redesign", "Sunrise Realty", TimeCategory.DESIGN, "Homepage wireframes", 3.0, True, 75, today)
    tracker.log_time("Website Redesign", "Sunrise Realty", TimeCategory.DESIGN, "UI mockups", 4.0, True, 75, today)
    tracker.log_time("SEO Campaign", "Coffee Lab", TimeCategory.STRATEGY, "Keyword research", 2.0, True, 75, today)
    tracker.log_time("SEO Campaign", "Coffee Lab", TimeCategory.CONTENT, "Blog post writing", 3.0, True, 60, today)
    tracker.log_time("Internal", "Agency", TimeCategory.ADMIN, "Team meeting", 1.0, False, 0, today)
    tracker.log_time("Internal", "Agency", TimeCategory.MEETING, "Sales call", 0.5, False, 0, today)
    
    # Weekly summary
    print(tracker.format_weekly_summary())
    print()
    
    # Timesheet
    week_start = today - timedelta(days=7)
    print(tracker.format_timesheet(week_start, today))
