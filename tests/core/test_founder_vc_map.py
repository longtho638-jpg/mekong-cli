"""Tests for founder_vc_map module."""

from src.core.founder_vc.founder_vc_map import (
    get_all_funds,
    filter_funds,
    generate_outreach_intel,
    build_vc_map,
    VCFund,
    OutreachIntel,
    VCMapResult,
)


def test_get_all_funds_nonempty():
    funds = get_all_funds()
    assert len(funds) >= 10
    assert all(isinstance(f, VCFund) for f in funds)


def test_get_all_funds_has_required_fields():
    funds = get_all_funds()
    for f in funds:
        assert f.name
        assert isinstance(f.stages, list)
        assert len(f.stages) >= 1
        assert 1 <= f.ffs <= 10


def test_filter_funds_by_stage_seed():
    funds = filter_funds(stage="seed")
    assert len(funds) >= 3
    assert all("seed" in f.stages for f in funds)


def test_filter_funds_by_stage_pre_seed():
    funds = filter_funds(stage="pre-seed")
    assert all("pre-seed" in f.stages for f in funds)
    assert any(f.name == "YC" for f in funds)


def test_filter_funds_by_region_sea():
    funds = filter_funds(region="sea")
    assert len(funds) >= 3
    for f in funds:
        assert f.region in ("sea", "global")


def test_filter_funds_by_region_vietnam():
    funds = filter_funds(region="vietnam")
    assert any(f.name == "Do Ventures" for f in funds)


def test_filter_funds_by_min_ffs():
    funds = filter_funds(min_ffs=9)
    assert all(f.ffs >= 9 for f in funds)
    assert len(funds) >= 2


def test_filter_funds_sorted_by_ffs():
    funds = filter_funds(stage="seed")
    ffs_values = [f.ffs for f in funds]
    assert ffs_values == sorted(ffs_values, reverse=True)


def test_filter_funds_by_sector_ai():
    funds = filter_funds(sector="AI")
    # Some funds have "AI" in focus or no focus (included by default)
    assert len(funds) >= 1


def test_generate_outreach_intel_structure():
    funds = get_all_funds()
    yc = next(f for f in funds if f.name == "YC")
    intel = generate_outreach_intel(yc, company_sector="SaaS")
    assert isinstance(intel, OutreachIntel)
    assert intel.fund_name == "YC"
    assert intel.partner_to_target
    assert intel.warm_intro_path
    assert intel.cold_email_angle


def test_generate_outreach_intel_recent_investments():
    funds = get_all_funds()
    yc = next(f for f in funds if f.name == "YC")
    intel = generate_outreach_intel(yc)
    assert isinstance(intel.recent_investments, list)
    assert len(intel.recent_investments) <= 3


def test_generate_outreach_intel_no_portfolio():
    fund = VCFund("TestFund", ["seed"], "$1M-$5M")
    intel = generate_outreach_intel(fund)
    assert intel.recent_investments == []


def test_build_vc_map_structure():
    result = build_vc_map(stage="seed", top_n=5)
    assert isinstance(result, VCMapResult)
    assert result.stage == "seed"
    assert len(result.matched_funds) <= 5
    assert len(result.outreach_intel) == len(result.matched_funds)
    assert result.total_matched >= len(result.matched_funds)


def test_build_vc_map_top_n_respected():
    result = build_vc_map(stage="seed", top_n=3)
    assert len(result.matched_funds) <= 3


def test_build_vc_map_filters_region():
    result = build_vc_map(stage="seed", region="sea")
    for f in result.matched_funds:
        assert f.region in ("sea", "global")


def test_ffs_stars_property():
    fund = VCFund("X", ["seed"], "$1M", ffs=9)
    stars = fund.ffs_stars
    assert isinstance(stars, str)
    assert "★" in stars
