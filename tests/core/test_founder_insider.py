"""Tests for founder_insider module."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from src.core.founder_ipo.founder_insider import (
    build_trading_windows,
    create_10b5_1_plan,
    plan_lockup_expiry,
    build_insider_policy,
    INSIDER_POLICY_RULES,
)


_EARNINGS_DATES = ["2026-03-15", "2026-06-15", "2026-09-15", "2026-12-15"]


def test_build_trading_windows_returns_two_per_date():
    windows = build_trading_windows(_EARNINGS_DATES)
    # 2 windows (blackout + open) per earnings date
    assert len(windows) == 8


def test_build_trading_windows_open_and_closed():
    windows = build_trading_windows(["2026-03-15"])
    open_windows = [w for w in windows if w.is_open]
    closed_windows = [w for w in windows if not w.is_open]
    assert len(open_windows) == 1
    assert len(closed_windows) == 1


def test_build_trading_windows_blackout_before_earnings():
    windows = build_trading_windows(["2026-06-30"])
    blackout = next(w for w in windows if not w.is_open)
    from datetime import date
    blackout_open = date.fromisoformat(blackout.open_date)
    earnings = date(2026, 6, 30)
    assert blackout_open < earnings


def test_build_trading_windows_invalid_date_skipped():
    windows = build_trading_windows(["not-a-date", "2026-03-15"])
    # Only valid date processed → 2 windows
    assert len(windows) == 2


def test_create_10b5_1_plan_shares_per_month():
    plan = create_10b5_1_plan(
        holder_name="Jane Founder",
        total_shares=120_000,
        sell_pct=10.0,
        price_floor=15.0,
        duration_months=12,
    )
    assert plan.holder_name == "Jane Founder"
    assert plan.shares_per_month == 1_000   # 12_000 / 12
    assert plan.price_floor == 15.0
    assert plan.cooling_off_days == 90


def test_create_10b5_1_plan_min_one_share():
    plan = create_10b5_1_plan("John", 10, 1.0, 5.0, duration_months=100)
    assert plan.shares_per_month >= 1


def test_plan_lockup_expiry_returns_strategy():
    strategy = plan_lockup_expiry(
        lockup_end_date="2026-09-01",
        shares_to_sell=500_000,
        method="10b5-1",
    )
    assert strategy.lockup_end_date == "2026-09-01"
    assert strategy.shares_to_sell == 500_000
    assert strategy.method == "10b5-1"
    assert len(strategy.pre_steps) == 5


def test_build_insider_policy_structure():
    holders = [
        {"name": "Alice", "shares": 1_000_000, "sell_pct": 10.0, "price_floor": 20.0},
        {"name": "Bob", "shares": 500_000, "sell_pct": 5.0, "price_floor": 18.0},
    ]
    policy = build_insider_policy(_EARNINGS_DATES, holders)
    assert len(policy.windows) == 8
    assert len(policy.plans) == 2
    assert len(policy.policy_rules) == len(INSIDER_POLICY_RULES)


def test_insider_policy_rules_count():
    assert len(INSIDER_POLICY_RULES) == 8
