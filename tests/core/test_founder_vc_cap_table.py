"""Tests for founder_vc_cap_table module."""

import pytest
from src.core.founder_vc.founder_vc_cap_table import (
    create_cap_table,
    model_round,
    convert_safes,
    calculate_exit_waterfall,
    model_full_journey,
    CapTable,
    SAFENote,
    ExitWaterfall,
)


def _two_founder_cap() -> CapTable:
    return create_cap_table("TestCo", [("Alice", 500_000), ("Bob", 500_000)])


def test_create_cap_table_basic():
    cap = _two_founder_cap()
    assert cap.company_name == "TestCo"
    assert len(cap.shareholders) == 3  # 2 founders + option pool
    assert cap.total_shares > 1_000_000


def test_create_cap_table_founder_shares():
    cap = create_cap_table("X", [("F1", 600_000), ("F2", 400_000)])
    f1 = cap.holder_by_name("F1")
    assert f1 is not None
    assert f1.shares == 600_000


def test_create_cap_table_option_pool_ownership():
    cap = _two_founder_cap()
    pool = cap.holder_by_name("Option Pool")
    assert pool is not None
    pool_pct = cap.ownership_pct(pool)
    assert pytest.approx(pool_pct, abs=0.2) == 10.0


def test_create_cap_table_no_pool():
    cap = create_cap_table("NP", [("Solo", 1_000_000)], option_pool_pct=0.0)
    assert cap.holder_by_name("Option Pool") is None
    assert cap.total_shares == 1_000_000


def test_model_round_adds_investor():
    cap = _two_founder_cap()
    result = model_round(cap, "Seed", 1_000_000, 5_000_000)
    assert result.round_name == "Seed"
    assert result.investment_amount == 1_000_000
    assert result.pre_money_valuation == 5_000_000
    assert result.post_money_valuation == 6_000_000
    investor = cap.holder_by_name("Seed Investor")
    assert investor is not None
    assert investor.shares > 0


def test_model_round_investor_pct_reasonable():
    cap = _two_founder_cap()
    result = model_round(cap, "Seed", 1_000_000, 5_000_000)
    # 1M / 6M = ~16.7%
    assert 10 < result.investor_pct < 25


def test_model_round_before_after_snapshots():
    cap = _two_founder_cap()
    result = model_round(cap, "Seed", 500_000, 4_000_000)
    assert len(result.cap_table_before) >= 2
    assert len(result.cap_table_after) >= 3  # includes new investor


def test_convert_safes_basic():
    cap = _two_founder_cap()
    safes = [SAFENote("Angel", 100_000, valuation_cap=3_000_000)]
    conversions = convert_safes(cap, safes, 5_000_000, 1_000_000)
    assert len(conversions) == 1
    c = conversions[0]
    assert c["investor"] == "Angel"
    assert c["shares"] > 0
    assert c["ownership_pct"] > 0


def test_convert_safes_discount():
    cap = _two_founder_cap()
    safes = [SAFENote("DiscountSafe", 50_000, discount_pct=20.0)]
    conversions = convert_safes(cap, safes, 5_000_000, 1_000_000)
    c = conversions[0]
    # Conversion price should be positive
    assert c["conversion_price"] > 0


def test_calculate_exit_waterfall_returns_entries():
    cap = _two_founder_cap()
    model_round(cap, "Seed", 1_000_000, 5_000_000)
    wf = calculate_exit_waterfall(cap, 10_000_000)
    assert isinstance(wf, ExitWaterfall)
    assert wf.exit_value == 10_000_000
    assert len(wf.entries) >= 2
    assert wf.total_distributed > 0


def test_calculate_exit_waterfall_total_bounded():
    cap = _two_founder_cap()
    model_round(cap, "Seed", 1_000_000, 5_000_000)
    wf = calculate_exit_waterfall(cap, 5_000_000)
    assert wf.total_distributed <= 5_000_000 * 1.01  # allow rounding


def test_model_full_journey():
    founders = [("CEO", 600_000), ("CTO", 400_000)]
    rounds = [
        {"name": "Seed", "investment": 500_000, "pre_money": 3_000_000},
        {"name": "Series A", "investment": 5_000_000, "pre_money": 15_000_000},
    ]
    results = model_full_journey("Journey", founders, rounds)
    assert len(results) == 2
    assert results[0].round_name == "Seed"
    assert results[1].round_name == "Series A"
