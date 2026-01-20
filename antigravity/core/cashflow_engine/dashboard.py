"""
Cashflow Dashboard Rendering
============================

Provides terminal visualization for the $1M ARR 2026 goal progress.
"""

from typing import TYPE_CHECKING

from .models import ARR_TARGET_2026, RevenueStream

if TYPE_CHECKING:
    from .engine import CashflowEngine

# ============================================
# CONSTANTS
# ============================================

STREAM_ICONS: dict[RevenueStream, str] = {
    RevenueStream.WELLNEXUS: "W",
    RevenueStream.AGENCY: "A",
    RevenueStream.SAAS: "S",
    RevenueStream.CONSULTING: "C",
    RevenueStream.AFFILIATE: "L",
}


def render_progress_bar(percent: float, width: int = 30) -> str:
    """
    Renders a text-based progress bar.

    Args:
        percent: Progress percentage (0-100+).
        width: Character width of the bar.

    Returns:
        A string like "[###########......]".
    """
    clamped = min(max(percent, 0), 100)
    filled = int(width * clamped / 100)
    empty = width - filled
    return "[" + "#" * filled + "." * empty + "]"


def print_cashflow_dashboard(engine: "CashflowEngine") -> None:
    """
    Renders the comprehensive $1M Goal Dashboard.

    Args:
        engine: The CashflowEngine instance with current revenue data.
    """
    arr = engine.get_total_arr()
    progress = engine.get_progress_percent()
    growth = engine.get_required_mrr_growth()

    print("\n" + "=" * 65)
    print("|" + " 2026 UNICORN REVENUE DASHBOARD ($1M ARR) ".center(63) + "|")
    print("=" * 65)

    # Main Progress Bar
    bar = render_progress_bar(progress)

    print(f"\n  OVERALL PROGRESS: {bar} {progress:.1f}%")
    print(f"  CURRENT ARR:      ${arr:,.0f} / ${ARR_TARGET_2026:,}")
    print(f"  REQUIRED GROWTH:  {growth:.1f}% month-over-month")

    print("\n  STREAM BREAKDOWN:")
    print("  " + "-" * 61)

    for stream, goal in engine.goals.items():
        s_bar = render_progress_bar(goal.progress_percent, width=15)
        icon = STREAM_ICONS.get(stream, "$")

        print(
            f"  {icon} {stream.value.upper():<12} | {s_bar} ${goal.current_arr:,.0f} / ${goal.target_arr:,.0f}"
        )

    print("\n" + "=" * 65)
    if progress >= 100:
        print("|  GOAL ACHIEVED! Celebrating the $1M Unicorn status.          |")
    elif progress >= 50:
        print("|  Momentum Building. Focus on scaling the winning stream.     |")
    else:
        print(f"|  Target: ${(ARR_TARGET_2026 / 12):,.0f} MRR. Keep building the moat!              |")
    print("=" * 65 + "\n")
