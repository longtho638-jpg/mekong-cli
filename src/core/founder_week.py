"""Founder Week — /founder week backend.

Weekly CEO operating rhythm: Monday morning brief generation, Friday review,
daily standup, and monthly investor update. Target: 30 min/week human time.
"""

from __future__ import annotations

import json
import logging
import subprocess
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal

logger = logging.getLogger(__name__)

DayMode = Literal["mon", "fri", "daily"]
PriorityStatus = Literal["DONE", "PARTIAL", "MISSED"]


# ── Data Models ──────────────────────────────────────────────────────


@dataclass
class RevenueSnapshot:
    """Revenue metrics for the brief."""

    mrr: float = 0.0
    wow_change_pct: float = 0.0
    mcu_used_week: int = 0
    llm_cost_usd: float = 0.0
    mcu_margin_pct: float = 0.0


@dataclass
class WeekPerformance:
    """Last week's performance metrics."""

    tasks_done: int = 0
    success_rate: float = 0.0
    commits: int = 0
    features_fixes: int = 0
    new_customers: int = 0
    churned_customers: int = 0


@dataclass
class Priority:
    """A weekly priority item."""

    id: str  # P1, P2, P3
    description: str
    reason: str
    status: PriorityStatus = "MISSED"


@dataclass
class DailyTask:
    """A pre-queued daily task."""

    day: str  # Mon, Tue, Wed, Thu, Fri
    task: str
    command: str  # CLI command to run


@dataclass
class HumanAction:
    """An item needing human attention."""

    description: str
    priority: int  # 1=highest


@dataclass
class MondayBrief:
    """Complete Monday morning brief."""

    week_number: int
    date_range: str
    company_name: str
    revenue: RevenueSnapshot
    performance: WeekPerformance
    human_actions: list[HumanAction]
    daily_tasks: list[DailyTask]
    priorities: list[Priority]
    timestamp: str = ""

    def __post_init__(self) -> None:
        if not self.timestamp:
            self.timestamp = datetime.now(timezone.utc).isoformat()


@dataclass
class FridayReview:
    """Friday end-of-week review."""

    week_number: int
    priorities_status: list[Priority]
    what_worked: list[str]
    what_didnt: list[str]
    learning: str
    next_week_preview: list[str]
    timestamp: str = ""

    def __post_init__(self) -> None:
        if not self.timestamp:
            self.timestamp = datetime.now(timezone.utc).isoformat()


@dataclass
class DailyStandup:
    """30-second async daily standup."""

    date: str
    yesterday: str
    today: str
    blocker: str


@dataclass
class InvestorUpdate:
    """Monthly investor update."""

    month: str
    year: int
    mrr: float
    mrr_change_pct: float
    customers: int
    new_customers: int
    key_win: str
    accomplishments: list[str]
    challenges: str
    next_month: list[str]
    ask: str


# ── Data Collection ──────────────────────────────────────────────────


def collect_git_velocity(base_dir: str, days: int = 7) -> int:
    """Count git commits in the last N days."""
    try:
        result = subprocess.run(
            ["git", "log", "--oneline", f"--since={days} days ago"],
            capture_output=True, text=True, timeout=10,
            cwd=base_dir,
        )
        if result.returncode == 0:
            return len(result.stdout.strip().splitlines())
    except (subprocess.TimeoutExpired, FileNotFoundError):
        pass
    return 0


def collect_task_stats(base_dir: str) -> dict:
    """Collect task completion stats from memory."""
    memory_file = Path(base_dir) / ".mekong" / "memory.json"
    stats = {"total": 0, "done": 0, "success_rate": 0.0}

    if memory_file.exists():
        try:
            data = json.loads(memory_file.read_text())
            tasks = data if isinstance(data, list) else data.get("tasks", [])
            stats["total"] = len(tasks)
            done = [t for t in tasks if isinstance(t, dict) and t.get("status") == "done"]
            stats["done"] = len(done)
            if tasks:
                stats["success_rate"] = round(len(done) / len(tasks) * 100, 1)
        except (json.JSONDecodeError, TypeError):
            pass

    return stats


def collect_mcu_stats(
    base_dir: str, mcu_gate=None, tenant_id: str = "default"
) -> dict:
    """Collect MCU usage stats."""
    stats = {"balance": 0, "used_week": 0, "cost": 0.0}

    if mcu_gate:
        try:
            stats["balance"] = mcu_gate.get_balance(tenant_id)
        except Exception:
            pass

    return stats


def get_week_number() -> int:
    """Get current ISO week number."""
    return datetime.now(timezone.utc).isocalendar()[1]


# ── Monday Brief Generation ─────────────────────────────────────────


def generate_monday_brief(
    base_dir: str,
    company_name: str = "Company",
    mcu_gate=None,
    tenant_id: str = "default",
) -> MondayBrief:
    """Generate Monday morning brief from all available data."""
    week_num = get_week_number()
    now = datetime.now(timezone.utc)
    date_range = f"Week {week_num}, {now.strftime('%Y')}"

    # Collect data
    commits = collect_git_velocity(base_dir)
    task_stats = collect_task_stats(base_dir)
    mcu_stats = collect_mcu_stats(base_dir, mcu_gate, tenant_id)

    revenue = RevenueSnapshot(
        mcu_used_week=mcu_stats["used_week"],
    )

    performance = WeekPerformance(
        tasks_done=task_stats["done"],
        success_rate=task_stats["success_rate"],
        commits=commits,
    )

    # Generate priorities based on current state
    priorities = _suggest_priorities(task_stats, mcu_stats, commits)

    # Generate daily task queue
    daily_tasks = _queue_daily_tasks(task_stats, mcu_stats)

    # Human attention items
    human_actions = _flag_human_actions(task_stats, mcu_stats)

    return MondayBrief(
        week_number=week_num,
        date_range=date_range,
        company_name=company_name,
        revenue=revenue,
        performance=performance,
        human_actions=human_actions,
        daily_tasks=daily_tasks,
        priorities=priorities,
    )


def _suggest_priorities(
    task_stats: dict, mcu_stats: dict, commits: int
) -> list[Priority]:
    """Suggest weekly priorities based on current state."""
    priorities: list[Priority] = []

    if task_stats["success_rate"] < 90:
        priorities.append(Priority(
            "P1", "Improve agent success rate",
            f"Current: {task_stats['success_rate']}%, target: >90%",
        ))

    if commits < 5:
        priorities.append(Priority(
            f"P{len(priorities) + 1}",
            "Increase shipping velocity",
            f"Only {commits} commits last week — ship more",
        ))

    if mcu_stats["balance"] < 50:
        priorities.append(Priority(
            f"P{len(priorities) + 1}",
            "Top up MCU balance",
            f"Balance: {mcu_stats['balance']} MCU — running low",
        ))

    # Fill to at least 3 priorities
    defaults = [
        ("Ship 1 customer-facing feature", "Weekly shipping cadence"),
        ("Engage 3 potential customers", "Pipeline building"),
        ("Publish 1 content piece", "Content marketing rhythm"),
    ]
    for desc, reason in defaults:
        if len(priorities) >= 3:
            break
        priorities.append(Priority(
            f"P{len(priorities) + 1}", desc, reason,
        ))

    return priorities[:3]


def _queue_daily_tasks(
    task_stats: dict, mcu_stats: dict
) -> list[DailyTask]:
    """Pre-queue tasks for each day of the week."""
    return [
        DailyTask("Mon", "Monday brief + approve priorities", "/founder week"),
        DailyTask("Tue", "Feature development sprint", '/cook "ship feature"'),
        DailyTask("Wed", "Content creation + outreach", "/founder grow --channel content"),
        DailyTask("Thu", "Customer engagement + support", '/cook "customer outreach"'),
        DailyTask("Fri", "Weekly review + retrospective", "/founder week --day fri"),
    ]


def _flag_human_actions(
    task_stats: dict, mcu_stats: dict
) -> list[HumanAction]:
    """Flag items needing human attention."""
    actions: list[HumanAction] = []

    if mcu_stats["balance"] < 20:
        actions.append(HumanAction(
            f"MCU balance critically low ({mcu_stats['balance']}). Top up now.",
            priority=1,
        ))

    if task_stats["success_rate"] < 80:
        actions.append(HumanAction(
            f"Agent success rate dropped to {task_stats['success_rate']}%.",
            priority=2,
        ))

    if not actions:
        actions.append(HumanAction(
            "All systems normal. Review priorities and approve.",
            priority=3,
        ))

    return actions


# ── Friday Review ────────────────────────────────────────────────────


def generate_friday_review(
    base_dir: str,
    priorities: list[Priority],
) -> FridayReview:
    """Generate Friday end-of-week review."""
    week_num = get_week_number()
    commits = collect_git_velocity(base_dir)
    task_stats = collect_task_stats(base_dir)

    what_worked = []
    what_didnt = []

    if commits >= 5:
        what_worked.append(f"Strong shipping velocity: {commits} commits")
    else:
        what_didnt.append(f"Low shipping velocity: only {commits} commits")

    if task_stats["success_rate"] >= 90:
        what_worked.append(f"Agent success rate: {task_stats['success_rate']}%")
    elif task_stats["success_rate"] > 0:
        what_didnt.append(f"Agent success rate below target: {task_stats['success_rate']}%")

    learning = (
        f"Week {week_num}: {task_stats['done']} tasks completed, "
        f"{commits} commits shipped. "
        f"{'Keep momentum.' if commits >= 5 else 'Need to ship more next week.'}"
    )

    return FridayReview(
        week_number=week_num,
        priorities_status=priorities,
        what_worked=what_worked if what_worked else ["Team showed up consistently"],
        what_didnt=what_didnt if what_didnt else ["No major issues identified"],
        learning=learning,
        next_week_preview=["Auto-queue based on this week's outcomes"],
    )


# ── Daily Standup ────────────────────────────────────────────────────


def generate_daily_standup(
    base_dir: str,
) -> DailyStandup:
    """Generate 30-second async daily standup."""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    commits = collect_git_velocity(base_dir, days=1)
    task_stats = collect_task_stats(base_dir)

    return DailyStandup(
        date=today,
        yesterday=f"Shipped {commits} commit(s), {task_stats['done']} task(s) completed",
        today="Continue priority tasks from weekly queue",
        blocker="None" if task_stats["success_rate"] >= 80 else "Agent success rate needs attention",
    )


# ── Investor Update ─────────────────────────────────────────────────


def generate_investor_update(
    company_name: str,
    mrr: float,
    mrr_change_pct: float,
    customers: int,
    new_customers: int,
    key_win: str,
    accomplishments: list[str],
    challenges: str,
    next_month: list[str],
    ask: str = "",
) -> InvestorUpdate:
    """Generate monthly investor update."""
    now = datetime.now(timezone.utc)
    return InvestorUpdate(
        month=now.strftime("%B"),
        year=now.year,
        mrr=mrr,
        mrr_change_pct=mrr_change_pct,
        customers=customers,
        new_customers=new_customers,
        key_win=key_win,
        accomplishments=accomplishments,
        challenges=challenges,
        next_month=next_month,
        ask=ask or "Introductions to potential customers in target ICP",
    )


# ── File I/O ─────────────────────────────────────────────────────────


def save_brief(base_dir: str, brief: MondayBrief) -> str:
    """Save Monday brief."""
    weeks_dir = Path(base_dir) / ".mekong" / "founder" / "weeks"
    weeks_dir.mkdir(parents=True, exist_ok=True)

    path = weeks_dir / f"week-{brief.week_number}-brief.json"
    path.write_text(json.dumps(asdict(brief), indent=2, ensure_ascii=False))
    return str(path)


def save_priorities(base_dir: str, week_num: int, priorities: list[Priority]) -> str:
    """Save approved priorities."""
    founder_dir = Path(base_dir) / ".mekong" / "founder"
    founder_dir.mkdir(parents=True, exist_ok=True)

    path = founder_dir / f"priorities-week-{week_num}.json"
    path.write_text(json.dumps(
        [asdict(p) for p in priorities],
        indent=2, ensure_ascii=False,
    ))
    return str(path)


def save_review(base_dir: str, review: FridayReview) -> str:
    """Save Friday review."""
    weeks_dir = Path(base_dir) / ".mekong" / "founder" / "weeks"
    weeks_dir.mkdir(parents=True, exist_ok=True)

    path = weeks_dir / f"week-{review.week_number}-review.json"
    path.write_text(json.dumps(asdict(review), indent=2, ensure_ascii=False))
    return str(path)


def save_standup(base_dir: str, standup: DailyStandup) -> str:
    """Save daily standup."""
    standups_dir = Path(base_dir) / ".mekong" / "founder" / "standups"
    standups_dir.mkdir(parents=True, exist_ok=True)

    path = standups_dir / f"{standup.date}.json"
    path.write_text(json.dumps(asdict(standup), indent=2, ensure_ascii=False))
    return str(path)


def save_investor_update(base_dir: str, update: InvestorUpdate) -> str:
    """Save investor update."""
    updates_dir = Path(base_dir) / ".mekong" / "raise" / "investor-updates"
    updates_dir.mkdir(parents=True, exist_ok=True)

    path = updates_dir / f"update-{update.month.lower()}-{update.year}.json"
    path.write_text(json.dumps(asdict(update), indent=2, ensure_ascii=False))
    return str(path)
