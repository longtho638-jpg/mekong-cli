"""Tests for founder_secondary module."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from src.core.founder_secondary import (
    get_mechanisms,
    get_platforms,
    calculate_tax_scenarios,
    analyze_liquidity,
    model_tender_offer,
)


def test_get_mechanisms_returns_list():
    mechs = get_mechanisms()
    assert isinstance(mechs, list)
    assert len(mechs) == 4


def test_get_mechanisms_have_required_fields():
    mechs = get_mechanisms()
    for m in mechs:
        assert m.name
        assert m.description
        assert isinstance(m.pros, list)
        assert isinstance(m.cons, list)


def test_get_platforms_returns_four():
    platforms = get_platforms()
    assert len(platforms) == 4
    names = [p.name for p in platforms]
    assert "Forge Global" in names


def test_calculate_tax_scenarios_us():
    scenarios = calculate_tax_scenarios(1_000_000.0, "us")
    assert len(scenarios) == 3
    rates = [s.tax_rate_pct for s in scenarios]
    assert 0.0 in rates   # QSBS
    assert 20.0 in rates  # LTCG
    assert 37.0 in rates  # Short-term


def test_calculate_tax_scenarios_singapore():
    scenarios = calculate_tax_scenarios(500_000.0, "singapore")
    assert len(scenarios) == 1
    assert scenarios[0].tax_rate_pct == 0.0
    assert scenarios[0].net_proceeds == 500_000.0


def test_calculate_tax_scenarios_vietnam():
    scenarios = calculate_tax_scenarios(200_000.0, "vietnam")
    assert len(scenarios) == 1
    assert scenarios[0].tax_rate_pct == 20.0
    assert scenarios[0].tax_amount == 40_000.0
    assert scenarios[0].net_proceeds == 160_000.0


def test_calculate_tax_net_proceeds_math():
    gross = 1_000_000.0
    scenarios = calculate_tax_scenarios(gross, "us")
    for s in scenarios:
        expected_tax = round(gross * s.tax_rate_pct / 100, 2)
        assert s.tax_amount == expected_tax
        assert s.net_proceeds == round(gross - expected_tax, 2)


def test_analyze_liquidity_returns_analysis():
    analysis = analyze_liquidity(
        current_stake_pct=20.0,
        current_valuation=100_000_000,
        secondary_amount=2_000_000,
        jurisdiction="us",
    )
    assert analysis.current_stake_pct == 20.0
    assert analysis.secondary_amount == 2_000_000
    assert analysis.shares_to_sell_pct > 0
    assert analysis.remaining_stake_pct < 20.0
    assert len(analysis.tax_scenarios) == 3


def test_analyze_liquidity_high_sale_recommendation():
    analysis = analyze_liquidity(
        current_stake_pct=20.0,
        current_valuation=10_000_000,
        secondary_amount=3_000_000,  # >30% of stake value
    )
    assert "HIGH SALE" in analysis.recommendation


def test_analyze_liquidity_conservative_recommendation():
    analysis = analyze_liquidity(
        current_stake_pct=20.0,
        current_valuation=100_000_000,
        secondary_amount=500_000,  # ~2.5% of stake value
    )
    assert "MINIMAL" in analysis.recommendation or "CONSERVATIVE" in analysis.recommendation


def test_model_tender_offer():
    offer = model_tender_offer(
        company_valuation=500_000_000,
        discount_pct=15.0,
        founder_shares=1_000_000,
        price_per_share=10.0,
        shares_to_sell=100_000,
    )
    assert offer.tender_price_discount_pct == 15.0
    assert offer.tender_valuation == 500_000_000 * 0.85
    assert offer.founder_shares_to_sell == 100_000
    # 100_000 * 10.0 * 0.85 = 850_000
    assert offer.total_proceeds == 850_000.0
    assert len(offer.checklist) > 0
