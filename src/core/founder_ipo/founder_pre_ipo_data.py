"""IPO Pre-IPO constants — exchange options and timeline phases."""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class ExchangeOption:
    name: str
    requirements: str
    listing_fee: str
    best_for: str
    region: str = "us"


@dataclass
class TimelinePhase:
    name: str
    month_range: str
    tasks: list[str] = field(default_factory=list)


EXCHANGE_OPTIONS: list[ExchangeOption] = [
    ExchangeOption(
        name="NASDAQ",
        requirements="$50M+ revenue or $75M+ assets; 400+ shareholders; bid price $4+",
        listing_fee="$55K-$155K initial; $27K-$155K annual",
        best_for="Tech, biotech, high-growth companies",
        region="us",
    ),
    ExchangeOption(
        name="NYSE",
        requirements="$200M+ market cap; $100M+ revenue; 400+ shareholders",
        listing_fee="$150K-$295K initial; $71K-$500K annual",
        best_for="Large-cap, financial, industrial companies",
        region="us",
    ),
    ExchangeOption(
        name="HoSE",
        requirements="VND 120B+ charter capital; 2yr profitability; 15%+ public float",
        listing_fee="VND 100M-500M initial",
        best_for="Vietnamese companies targeting domestic investors",
        region="vn",
    ),
    ExchangeOption(
        name="HNX",
        requirements="VND 30B+ charter capital; 1yr profitability",
        listing_fee="VND 50M-200M initial",
        best_for="SME Vietnamese companies, SME board available",
        region="vn",
    ),
    ExchangeOption(
        name="HKEX",
        requirements="HK$500M+ market cap or HK$50M profit; 3yr operating history",
        listing_fee="HK$150K-$650K initial",
        best_for="Asia-Pacific expansion, Chinese market access",
        region="hk",
    ),
]

IPO_TIMELINE: list[TimelinePhase] = [
    TimelinePhase(
        name="Foundation",
        month_range="T-18 to T-12",
        tasks=[
            "Appoint Big 4 auditor, begin PCAOB-compliant audit",
            "Hire CFO with public company experience",
            "Establish audit committee and independent board members",
            "Implement SOX-compliant internal controls",
            "Begin D&O insurance procurement",
            "Establish quarterly reporting cadence",
        ],
    ),
    TimelinePhase(
        name="Readiness",
        month_range="T-12 to T-6",
        tasks=[
            "Select underwriters (bulge bracket + co-managers)",
            "Complete 2-3 years audited financials",
            "Draft S-1 / prospectus first pass",
            "Conduct legal due diligence and IP audit",
            "Build investor relations capability",
            "Prepare management presentation",
        ],
    ),
    TimelinePhase(
        name="Selection",
        month_range="T-6 to T-3",
        tasks=[
            "File S-1 draft confidentially (DRS) with SEC",
            "Receive and respond to SEC comment letters",
            "Finalize exchange selection and listing application",
            "Complete lock-up agreements with insiders",
            "Syndicate roadshow preparation",
            "Engage transfer agent and EDGAR filing agent",
        ],
    ),
    TimelinePhase(
        name="Execution",
        month_range="T-3 to T-0",
        tasks=[
            "Price IPO with underwriters based on order book",
            "2-week roadshow: 60-80 investor meetings",
            "Final S-1 amendment and SEC effectiveness",
            "Allocate shares and confirm order book",
            "First day of trading (Listing Day)",
            "Post-IPO quiet period compliance (25 days)",
        ],
    ),
]
