"""Tests for founder_ipo_day module."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from src.core.founder_ipo.founder_ipo_day import (
    model_pricing,
    calculate_founder_milestone,
    build_ipo_day_plan,
)


def test_model_pricing_returns_three_scenarios():
    scenarios = model_pricing(
        valuation=1_000_000_000,
        shares_outstanding=100_000_000,
        shares_offered_pct=10.0,
        price_range_low=18.0,
        price_range_high=22.0,
    )
    assert len(scenarios) == 3


def test_model_pricing_prices_are_low_mid_high():
    scenarios = model_pricing(
        valuation=500_000_000,
        shares_outstanding=50_000_000,
        shares_offered_pct=10.0,
        price_range_low=10.0,
        price_range_high=14.0,
    )
    prices = [s.price for s in scenarios]
    assert prices[0] == 10.0
    assert prices[1] == 12.0
    assert prices[2] == 14.0


def test_model_pricing_pop_pcts_descending():
    scenarios = model_pricing(1_000_000_000, 100_000_000, 10.0, 18.0, 22.0)
    pops = [s.first_day_pop_pct for s in scenarios]
    assert pops == [0.15, 0.10, 0.05]


def test_model_pricing_gross_proceeds_math():
    scenarios = model_pricing(
        valuation=1_000_000_000,
        shares_outstanding=100_000_000,
        shares_offered_pct=10.0,
        price_range_low=20.0,
        price_range_high=20.0,
    )
    s = scenarios[0]
    assert s.shares_offered == 10_000_000
    assert s.gross_proceeds == 200_000_000.0


def test_model_pricing_market_cap_math():
    scenarios = model_pricing(500_000_000, 50_000_000, 10.0, 10.0, 10.0)
    assert scenarios[0].market_cap == 500_000_000.0


def test_calculate_founder_milestone_returns_dict():
    m = calculate_founder_milestone(ipo_price=20.0, founder_shares=5_000_000, years_building=7)
    assert m["ipo_price"] == 20.0
    assert m["founder_shares"] == 5_000_000
    assert m["founder_value"] == 100_000_000.0
    assert m["lock_up_expiry_days"] == 180


def test_calculate_founder_milestone_per_year():
    m = calculate_founder_milestone(ipo_price=10.0, founder_shares=1_000_000, years_building=5)
    assert m["paper_gain_per_year"] == 2_000_000.0


def test_calculate_founder_milestone_zero_years_no_division_error():
    m = calculate_founder_milestone(ipo_price=15.0, founder_shares=500_000, years_building=0)
    assert m["paper_gain_per_year"] == 7_500_000.0


def test_build_ipo_day_plan_structure():
    plan = build_ipo_day_plan(
        company_name="AcmeCo",
        valuation=2_000_000_000,
        shares_outstanding=200_000_000,
        shares_offered_pct=10.0,
        price_range=(18.0, 22.0),
    )
    assert len(plan.pricing_scenarios) == 3
    assert len(plan.timeline) > 0
    assert len(plan.week_one_checklist) > 0
    assert "AcmeCo" in plan.speech_template
    assert plan.founder_milestone["ipo_price"] == 20.0
