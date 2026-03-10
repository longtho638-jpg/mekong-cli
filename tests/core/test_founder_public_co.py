"""Tests for founder_public_co module."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from src.core.founder_ipo.founder_public_co import (
    build_earnings_calendar,
    calculate_guidance,
    build_quarterly_report,
    get_material_events,
)


def test_build_earnings_calendar_returns_four_quarters():
    calendar = build_earnings_calendar(fiscal_year_start_month=1)
    assert len(calendar) == 4


def test_build_earnings_calendar_quarters_labeled():
    calendar = build_earnings_calendar(fiscal_year_start_month=1)
    labels = [e.quarter for e in calendar]
    assert labels == ["Q1", "Q2", "Q3", "Q4"]


def test_build_earnings_calendar_has_dates():
    calendar = build_earnings_calendar(fiscal_year_start_month=4)
    for entry in calendar:
        assert entry.earnings_date
        assert entry.filing_deadline
        assert entry.quiet_period_start


def test_build_earnings_calendar_q4_filing_deadline_longer():
    calendar = build_earnings_calendar(fiscal_year_start_month=1)
    from datetime import date
    q4 = calendar[3]
    q3 = calendar[2]
    q4_filing = date.fromisoformat(q4.filing_deadline)
    q4_earnings = date.fromisoformat(q4.earnings_date)
    q3_filing = date.fromisoformat(q3.filing_deadline)
    q3_earnings = date.fromisoformat(q3.earnings_date)
    # Q4 (10-K): 60 days; Q3 (10-Q): 45 days after quarter-end
    assert (q4_filing - q4_earnings).days > (q3_filing - q3_earnings).days


def test_calculate_guidance_returns_model():
    guidance = calculate_guidance(
        current_revenue=10_000_000,
        growth_rate=0.25,
        churn_rate=0.05,
        signed_contracts=500_000,
    )
    assert guidance.revenue_low > 0
    assert guidance.revenue_high >= guidance.revenue_low
    assert guidance.confidence_level == 0.92


def test_calculate_guidance_safety_margin():
    guidance = calculate_guidance(
        current_revenue=10_000_000,
        growth_rate=0.20,
        churn_rate=0.05,
        signed_contracts=0,
    )
    # mid = base * 0.95, so high < base (conservative)
    assert guidance.revenue_high < guidance.revenue_low * 1.10


def test_build_quarterly_report_beat():
    report = build_quarterly_report(
        quarter="Q2", revenue=11_000_000, arr=44_000_000,
        gm_pct=75.0, nrr_pct=118.0, customers=420,
        fcf=500_000, prev_guidance_mid=10_000_000,
    )
    assert report.guidance_beat_pct == 10.0
    assert report.quarter == "Q2"
    assert report.revenue == 11_000_000.0


def test_build_quarterly_report_miss():
    report = build_quarterly_report(
        quarter="Q3", revenue=9_500_000, arr=38_000_000,
        gm_pct=72.0, nrr_pct=112.0, customers=390,
        fcf=-200_000, prev_guidance_mid=10_000_000,
    )
    assert report.guidance_beat_pct < 0


def test_build_quarterly_report_no_prev_guidance():
    report = build_quarterly_report(
        quarter="Q1", revenue=8_000_000, arr=32_000_000,
        gm_pct=70.0, nrr_pct=110.0, customers=350,
        fcf=0.0, prev_guidance_mid=0,
    )
    assert report.guidance_beat_pct == 0.0


def test_get_material_events_returns_8k_types():
    events = get_material_events()
    assert len(events) >= 6
    types = [e.event_type for e in events]
    assert any("CEO" in t or "CFO" in t for t in types)
    assert all(e.deadline_days == 4 for e in events)
