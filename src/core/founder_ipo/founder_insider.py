"""Founder IPO Insider — insider trading compliance engine.

Trading windows, 10b5-1 plans, lockup strategies, and insider policy.
"""

from __future__ import annotations

import json
import logging
from dataclasses import asdict, dataclass, field
from datetime import datetime, timedelta
from pathlib import Path

logger = logging.getLogger(__name__)


# ── Data Models ──────────────────────────────────────────────────────


@dataclass
class TradingWindow:
    """Open/closed trading window definition."""

    quarter: str
    open_date: str
    close_date: str
    is_open: bool


@dataclass
class Plan10b5_1:
    """SEC Rule 10b5-1 pre-planned trading plan."""

    holder_name: str
    shares_per_month: int
    price_floor: float
    duration_months: int = 12
    cooling_off_days: int = 90


@dataclass
class LockupStrategy:
    """Post-IPO lockup expiry strategy."""

    lockup_end_date: str
    shares_to_sell: int
    method: str
    pre_steps: list[str] = field(default_factory=list)


@dataclass
class InsiderPolicy:
    """Company-wide insider trading policy."""

    windows: list[TradingWindow]
    plans: list[Plan10b5_1]
    lockup: LockupStrategy | None = None
    policy_rules: list[str] = field(default_factory=list)


# ── Constants ────────────────────────────────────────────────────────


INSIDER_POLICY_RULES: list[str] = [
    "Pre-clear all trades with General Counsel at least 2 business days before execution",
    "Trade only during open trading windows; no exceptions without board approval",
    "Complete insider trading attestation form before each trade",
    "No hedging, shorting, or pledging of company shares at any time",
    "Disclose all trades via SEC Form 4 within 2 business days of execution",
    "Officers and directors must hold shares for minimum 6 months post-grant",
    "10b5-1 plans must include 90-day cooling-off period before first trade",
    "Report any MNPI received from external parties to General Counsel immediately",
]

MNPI_EXAMPLES: list[str] = [
    "Upcoming earnings results significantly above or below analyst consensus",
    "Major acquisition, merger, or strategic partnership not yet announced",
    "Pending regulatory approval or FDA decision on key product",
    "Unreported data breach or material cybersecurity incident",
    "Unannounced CEO departure or material leadership change",
    "Material government contract win or loss not yet disclosed",
]


# ── Core Functions ───────────────────────────────────────────────────


def build_trading_windows(earnings_dates: list[str]) -> list[TradingWindow]:
    """Build trading windows around earnings dates.

    Closed: 30 days before earnings + 24h after.
    Open: day 2 through day 30 after earnings.
    """
    windows: list[TradingWindow] = []
    for i, date_str in enumerate(earnings_dates):
        try:
            earnings_dt = datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            logger.warning("Invalid earnings date format: %s", date_str)
            continue

        blackout_start = earnings_dt - timedelta(days=30)
        blackout_end = earnings_dt + timedelta(days=1)
        open_start = earnings_dt + timedelta(days=2)
        open_end = earnings_dt + timedelta(days=30)

        quarter_label = f"Q{i + 1}-{earnings_dt.year}"

        windows.append(TradingWindow(
            quarter=f"{quarter_label}-blackout",
            open_date=blackout_start.strftime("%Y-%m-%d"),
            close_date=blackout_end.strftime("%Y-%m-%d"),
            is_open=False,
        ))
        windows.append(TradingWindow(
            quarter=quarter_label,
            open_date=open_start.strftime("%Y-%m-%d"),
            close_date=open_end.strftime("%Y-%m-%d"),
            is_open=True,
        ))

    return windows


def create_10b5_1_plan(
    holder_name: str,
    total_shares: int,
    sell_pct: float,
    price_floor: float,
    duration_months: int = 12,
) -> Plan10b5_1:
    """Create a 10b5-1 pre-planned trading plan.

    shares_per_month = (total_shares * sell_pct / 100) / duration_months
    """
    shares_to_sell = total_shares * sell_pct / 100
    shares_per_month = max(1, int(shares_to_sell / max(1, duration_months)))
    return Plan10b5_1(
        holder_name=holder_name,
        shares_per_month=shares_per_month,
        price_floor=price_floor,
        duration_months=duration_months,
        cooling_off_days=90,
    )


def plan_lockup_expiry(
    lockup_end_date: str,
    shares_to_sell: int,
    method: str = "10b5-1",
) -> LockupStrategy:
    """Build lockup expiry strategy with recommended pre-steps."""
    pre_steps = [
        "Establish 10b5-1 plan 90 days before lockup expiry",
        "Coordinate with underwriters to avoid oversupply pressure",
        "Pre-clear sale with General Counsel and compliance team",
        "File SEC Form 144 if selling under Rule 144 exemption",
        "Align sale timing with open trading window post-lockup",
    ]
    return LockupStrategy(
        lockup_end_date=lockup_end_date,
        shares_to_sell=shares_to_sell,
        method=method,
        pre_steps=pre_steps,
    )


def build_insider_policy(
    earnings_dates: list[str],
    holders: list[dict],
) -> InsiderPolicy:
    """Build complete insider trading policy.

    holders: list of dicts with keys: name, shares, sell_pct, price_floor
    """
    windows = build_trading_windows(earnings_dates)
    plans = []
    for h in holders:
        plan = create_10b5_1_plan(
            holder_name=h.get("name", "Unknown"),
            total_shares=h.get("shares", 0),
            sell_pct=h.get("sell_pct", 10.0),
            price_floor=h.get("price_floor", 0.0),
        )
        plans.append(plan)

    return InsiderPolicy(
        windows=windows,
        plans=plans,
        lockup=None,
        policy_rules=list(INSIDER_POLICY_RULES),
    )


# ── Save Functions ───────────────────────────────────────────────────


def save_insider_policy(output_dir: str, policy: InsiderPolicy) -> list[str]:
    """Save insider policy components to JSON files. Returns list of saved paths."""
    base = Path(output_dir) / ".mekong" / "founder" / "ipo"
    base.mkdir(parents=True, exist_ok=True)

    saved: list[str] = []

    windows_path = base / "trading-windows.json"
    windows_path.write_text(
        json.dumps([asdict(w) for w in policy.windows], indent=2)
    )
    saved.append(str(windows_path))

    plans_path = base / "10b5-1-plans.json"
    plans_path.write_text(
        json.dumps([asdict(p) for p in policy.plans], indent=2)
    )
    saved.append(str(plans_path))

    policy_data = asdict(policy)
    policy_data["mnpi_examples"] = MNPI_EXAMPLES
    policy_path = base / "insider-policy.json"
    policy_path.write_text(json.dumps(policy_data, indent=2, default=str))
    saved.append(str(policy_path))

    return saved
