"""Tests for founder_succession module."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from src.core.founder_ipo.founder_succession import (
    model_buyback,
    build_succession_scenarios,
    create_emergency_plan,
    build_post_ipo_strategy,
    LEGACY_PATHS,
)


def test_model_buyback_shares_repurchased():
    result = model_buyback(
        shares_outstanding=10_000_000,
        earnings=5_000_000,
        buyback_amount=1_000_000,
        share_price=10.0,
    )
    assert result.shares_repurchased == 100_000
    assert result.new_shares_outstanding == 9_900_000


def test_model_buyback_eps_accretion_positive():
    result = model_buyback(
        shares_outstanding=10_000_000,
        earnings=5_000_000,
        buyback_amount=2_000_000,
        share_price=10.0,
    )
    assert result.eps_after > result.eps_before
    assert result.eps_accretion_pct > 0


def test_model_buyback_eps_before_math():
    result = model_buyback(10_000_000, 5_000_000, 0, 10.0)
    assert result.eps_before == round(5_000_000 / 10_000_000, 4)


def test_model_buyback_zero_price_guard():
    result = model_buyback(1_000_000, 500_000, 100_000, share_price=0)
    # share_price defaults to 1.0 when <= 0
    assert result.shares_repurchased == 100_000


def test_build_succession_scenarios_returns_three():
    scenarios = build_succession_scenarios()
    assert len(scenarios) == 3


def test_build_succession_scenarios_names():
    scenarios = build_succession_scenarios()
    names = [s.name for s in scenarios]
    assert "Founder Stays CEO" in names
    assert "Founder to Executive Chairman" in names
    assert "Full Transition" in names


def test_build_succession_scenarios_have_actions():
    scenarios = build_succession_scenarios()
    for s in scenarios:
        assert len(s.key_actions) >= 3
        assert s.founder_role_after


def test_create_emergency_plan_structure():
    plan = create_emergency_plan("Alice Smith", "COO")
    assert plan.successor_name == "Alice Smith"
    assert plan.successor_title == "COO"
    assert plan.duration_days == 90
    assert len(plan.limitations) == 5
    assert "Full operational authority" in plan.scope


def test_build_post_ipo_strategy_complete():
    strategy = build_post_ipo_strategy(
        shares_outstanding=50_000_000,
        earnings=10_000_000,
        buyback_amount=5_000_000,
        share_price=25.0,
        successor_name="Bob Jones",
        successor_title="President",
    )
    assert strategy.buyback is not None
    assert len(strategy.succession_scenarios) == 3
    assert strategy.emergency_plan is not None
    assert strategy.emergency_plan.successor_name == "Bob Jones"


def test_legacy_paths_count():
    assert len(LEGACY_PATHS) == 4
