"""
ROI Dashboard — ROIaaS Phase 5

Calculates ROI metrics from usage data:
- Time saved per command vs manual coding
- Cost per agent call
- Total ROI multiplier

Export JSON for frontend dashboard.

Usage:
    from src.analytics.roi_dashboard import ROIDashboard
    dashboard = ROIDashboard("license-123")
    metrics = dashboard.calculate_metrics(days=30)
    json_str = dashboard.export_json()
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional

from src.metering.usage_tracker import UsageTracker, get_tracker


# Time estimates (minutes) for manual vs CLI
TIME_ESTIMATES: Dict[str, Dict[str, int]] = {
    # Commands
    "cook": {"manual": 120, "cli": 5},      # 2h → 5min = 24x faster
    "plan": {"manual": 60, "cli": 2},        # 1h → 2min = 30x faster
    "fix": {"manual": 90, "cli": 10},        # 1.5h → 10min = 9x faster
    "code": {"manual": 180, "cli": 15},      # 3h → 15min = 12x faster
    "test": {"manual": 60, "cli": 5},        # 1h → 5min = 12x faster
    "review": {"manual": 45, "cli": 3},      # 45min → 3min = 15x faster
    "deploy": {"manual": 30, "cli": 2},      # 30min → 2min = 15x faster
    "debug": {"manual": 120, "cli": 15},     # 2h → 15min = 8x faster
    # Agents
    "planner": {"manual": 90, "cli": 3},     # 1.5h → 3min = 30x faster
    "researcher": {"manual": 180, "cli": 5}, # 3h → 5min = 36x faster
    "fullstack-developer": {"manual": 240, "cli": 10},
    "tester": {"manual": 60, "cli": 3},
    "code-reviewer": {"manual": 90, "cli": 5},
    "debugger": {"manual": 120, "cli": 10},
    "docs-manager": {"manual": 60, "cli": 3},
    "project-manager": {"manual": 45, "cli": 2},
}

# Cost per agent call (USD) — based on LLM API costs
AGENT_COSTS: Dict[str, float] = {
    "planner": 0.05,
    "researcher": 0.08,
    "fullstack-developer": 0.15,
    "tester": 0.04,
    "code-reviewer": 0.06,
    "debugger": 0.10,
    "docs-manager": 0.04,
    "project-manager": 0.03,
    "scout": 0.02,
    "explorer": 0.03,
}

# Developer hourly rate (for time savings calculation)
DEVELOPER_HOURLY_RATE = 75  # USD/hour


@dataclass
class ROIMetrics:
    """ROI metrics dataclass."""
    total_minutes_saved: int = 0
    total_hours_saved: float = 0.0
    labor_cost_saved: float = 0.0
    investment_cost: float = 0.0
    total_cost_avoided: float = 0.0
    roi_multiplier: float = 0.0
    avg_cost_per_command: float = 0.0
    avg_cost_per_agent: float = 0.0
    total_commands: int = 0
    total_agents: int = 0
    total_pipelines: int = 0
    period_days: int = 30
    time_saved_by_command: Dict[str, int] = field(default_factory=dict)
    time_saved_by_agent: Dict[str, int] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "totalMinutesSaved": self.total_minutes_saved,
            "totalHoursSaved": round(self.total_hours_saved, 1),
            "laborCostSaved": round(self.labor_cost_saved, 2),
            "investmentCost": round(self.investment_cost, 2),
            "totalCostAvoided": round(self.total_cost_avoided, 2),
            "roiMultiplier": round(self.roi_multiplier, 1),
            "avgCostPerCommand": round(self.avg_cost_per_command, 4),
            "avgCostPerAgent": round(self.avg_cost_per_agent, 4),
            "totalCommands": self.total_commands,
            "totalAgents": self.total_agents,
            "totalPipelines": self.total_pipelines,
            "periodDays": self.period_days,
            "timeSavedByCommand": self.time_saved_by_command,
            "timeSavedByAgent": self.time_saved_by_agent,
        }


@dataclass
class DailyROI:
    """Daily ROI metrics."""
    date: str
    minutes_saved: int = 0
    cost_saved: float = 0.0
    commands: int = 0
    agents: int = 0


class ROIDashboard:
    """ROI Dashboard for calculating and displaying ROI metrics."""

    def __init__(
        self,
        license_key: str,
        tracker: Optional[UsageTracker] = None,
    ) -> None:
        """Initialize ROI dashboard.

        Args:
            license_key: License key to analyze.
            tracker: Optional UsageTracker instance (uses singleton if not provided).
        """
        self.license_key = license_key
        self.tracker = tracker or get_tracker()

    def calculate_metrics(self, days: int = 30) -> ROIMetrics:
        """Calculate ROI metrics for a period.

        Args:
            days: Number of days to analyze.

        Returns:
            ROIMetrics with calculated values.
        """
        report = self.tracker.get_usage_report(self.license_key, days)

        total_minutes_saved = 0
        time_saved_by_command: Dict[str, int] = {}
        time_saved_by_agent: Dict[str, int] = {}
        total_agent_cost = 0.0

        # Process each day
        for daily in report.daily_reports:
            # Command time savings
            for cmd, count in daily.command_breakdown.items():
                estimate = TIME_ESTIMATES.get(cmd, {"manual": 60, "cli": 5})
                saved = (estimate["manual"] - estimate["cli"]) * count
                total_minutes_saved += saved
                time_saved_by_command[cmd] = time_saved_by_command.get(cmd, 0) + saved

            # Agent time savings + costs
            for agent, count in daily.agent_breakdown.items():
                estimate = TIME_ESTIMATES.get(agent, {"manual": 60, "cli": 5})
                saved = (estimate["manual"] - estimate["cli"]) * count
                total_minutes_saved += saved
                time_saved_by_agent[agent] = time_saved_by_agent.get(agent, 0) + saved

                # Agent LLM cost
                agent_cost = AGENT_COSTS.get(agent, 0.05)
                total_agent_cost += agent_cost * count

        total_hours_saved = total_minutes_saved / 60
        labor_cost_saved = total_hours_saved * DEVELOPER_HOURLY_RATE

        total_commands = report.total_commands
        total_agents = report.total_agents

        avg_cost_per_command = total_agent_cost / total_commands if total_commands > 0 else 0
        avg_cost_per_agent = total_agent_cost / total_agents if total_agents > 0 else 0

        # ROI calculation
        investment_cost = total_agent_cost
        total_cost_avoided = labor_cost_saved
        roi_multiplier = total_cost_avoided / investment_cost if investment_cost > 0 else 0

        return ROIMetrics(
            total_minutes_saved=int(total_minutes_saved),
            total_hours_saved=round(total_hours_saved, 1),
            labor_cost_saved=round(labor_cost_saved, 2),
            investment_cost=round(investment_cost, 2),
            total_cost_avoided=round(total_cost_avoided, 2),
            roi_multiplier=round(roi_multiplier, 1),
            avg_cost_per_command=round(avg_cost_per_command, 4),
            avg_cost_per_agent=round(avg_cost_per_agent, 4),
            total_commands=total_commands,
            total_agents=total_agents,
            total_pipelines=report.total_pipelines,
            period_days=days,
            time_saved_by_command=time_saved_by_command,
            time_saved_by_agent=time_saved_by_agent,
        )

    def get_daily_roi(self, days: int = 30) -> List[DailyROI]:
        """Get daily ROI breakdown.

        Args:
            days: Number of days to analyze.

        Returns:
            List of DailyROI objects.
        """
        report = self.tracker.get_usage_report(self.license_key, days)
        daily_roi: List[DailyROI] = []

        for daily in report.daily_reports:
            minutes_saved = 0

            # Command savings
            for cmd, count in daily.command_breakdown.items():
                estimate = TIME_ESTIMATES.get(cmd, {"manual": 60, "cli": 5})
                minutes_saved += (estimate["manual"] - estimate["cli"]) * count

            # Agent savings
            for agent, count in daily.agent_breakdown.items():
                estimate = TIME_ESTIMATES.get(agent, {"manual": 60, "cli": 5})
                minutes_saved += (estimate["manual"] - estimate["cli"]) * count

            daily_roi.append(
                DailyROI(
                    date=daily.date,
                    minutes_saved=int(minutes_saved),
                    cost_saved=round((minutes_saved / 60) * DEVELOPER_HOURLY_RATE, 2),
                    commands=daily.total_commands,
                    agents=daily.total_agents,
                )
            )

        return daily_roi

    def export_json(self, days: int = 30) -> str:
        """Export ROI metrics as JSON.

        Args:
            days: Number of days to export.

        Returns:
            JSON string.
        """
        import json

        metrics = self.calculate_metrics(days)
        daily = self.get_daily_roi(days)

        today = datetime.now(timezone.utc)
        start_date = today - timedelta(days=days)

        data = {
            "licenseKeyHash": self.tracker._hash_license_key(self.license_key)[:16] + "...",
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "period": {
                "days": days,
                "startDate": start_date.strftime("%Y-%m-%d"),
                "endDate": today.strftime("%Y-%m-%d"),
            },
            "summary": metrics.to_dict(),
            "dailyBreakdown": [
                {
                    "date": d.date,
                    "minutesSaved": d.minutes_saved,
                    "costSaved": d.cost_saved,
                    "commands": d.commands,
                    "agents": d.agents,
                }
                for d in daily
            ],
        }

        return json.dumps(data, indent=2)

    def generate_ascii_report(self, days: int = 30) -> str:
        """Generate ASCII report for CLI display.

        Args:
            days: Number of days to report.

        Returns:
            ASCII formatted report string.
        """
        metrics = self.calculate_metrics(days)
        # Note: daily breakdown not used in ASCII report, only summary metrics

        lines = [
            "",
            "╔══════════════════════════════════════════════════════════╗",
            "║              ROI DASHBOARD — ROIaaS Phase 5              ║",
            "╠══════════════════════════════════════════════════════════╣",
            f"║  Period: {days} days{' ' * (46 - len(str(days)))}║",
            f"║  Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}{' ' * 37}║",
            "╠══════════════════════════════════════════════════════════╣",
            "║  📊 USAGE SUMMARY                                        ║",
            "╟──────────────────────────────────────────────────────────╢",
            f"║  Total Commands:   {metrics.total_commands:>6}{' ' * (32 - len(str(metrics.total_commands)))}║",
            f"║  Total Agents:     {metrics.total_agents:>6}{' ' * (32 - len(str(metrics.total_agents)))}║",
            f"║  Total Pipelines:  {metrics.total_pipelines:>6}{' ' * (32 - len(str(metrics.total_pipelines)))}║",
            "╠══════════════════════════════════════════════════════════╣",
            "║  ⏱️  TIME SAVINGS                                         ║",
            "╟──────────────────────────────────────────────────────────╢",
            f"║  Minutes Saved:    {metrics.total_minutes_saved:>6} min{' ' * (26 - len(str(metrics.total_minutes_saved)))}║",
            f"║  Hours Saved:      {metrics.total_hours_saved:>6} hrs{' ' * (26 - len(str(metrics.total_hours_saved)))}║",
            f"║  Labor Cost Saved: ${metrics.labor_cost_saved:>6}{' ' * (27 - len(str(metrics.labor_cost_saved)))}║",
            "╠══════════════════════════════════════════════════════════╣",
            "║  💰 ROI METRICS                                          ║",
            "╟──────────────────────────────────────────────────────────╢",
            f"║  Investment Cost:  ${metrics.investment_cost:>6}{' ' * (27 - len(str(metrics.investment_cost)))}║",
            f"║  Cost Avoided:     ${metrics.total_cost_avoided:>6}{' ' * (27 - len(str(metrics.total_cost_avoided)))}║",
            f"║  ROI Multiplier:   {metrics.roi_multiplier:>5.1f}x{' ' * (30 - len(f'{metrics.roi_multiplier:.1f}'))}║",
            "╚══════════════════════════════════════════════════════════╝",
            "",
        ]

        return "\n".join(lines)


# Convenience functions
def get_dashboard(license_key: str, tracker: Optional[UsageTracker] = None) -> ROIDashboard:
    """Get ROI dashboard for a license key."""
    return ROIDashboard(license_key, tracker)
