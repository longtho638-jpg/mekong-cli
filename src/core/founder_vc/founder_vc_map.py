"""Founder VC Map — /founder vc-map backend.

VC database with founder-friendliness scoring, stage/sector filtering,
warm intro path finder, outreach intel generation.
"""

from __future__ import annotations

import json
import logging
from dataclasses import asdict, dataclass, field
from pathlib import Path

logger = logging.getLogger(__name__)


# ── Data Models ──────────────────────────────────────────────────────


@dataclass
class VCFund:
    """A venture capital fund entry."""

    name: str
    stages: list[str]  # "pre-seed" | "seed" | "a" | "b" | "c" | "d" | "pre-ipo"
    check_range: str
    equity_pct: str = ""
    ffs: int = 5  # Founder-Friendliness Score 1-10
    focus: str = ""
    region: str = "global"
    pros: str = ""
    cons: str = ""
    url: str = ""
    notable_portfolio: str = ""

    @property
    def ffs_stars(self) -> str:
        full = self.ffs // 2
        half = self.ffs % 2
        return "★" * full + ("½" if half else "") + "☆" * (5 - full - (1 if half else 0))


@dataclass
class OutreachIntel:
    """Personalized outreach info for a specific VC."""

    fund_name: str
    partner_to_target: str
    warm_intro_path: str
    cold_email_angle: str
    recent_investments: list[str] = field(default_factory=list)


@dataclass
class VCMapResult:
    """Result of VC map filtering and ranking."""

    stage: str
    sector: str
    region: str
    matched_funds: list[VCFund] = field(default_factory=list)
    outreach_intel: list[OutreachIntel] = field(default_factory=list)
    total_matched: int = 0


# ── VC Database ──────────────────────────────────────────────────────

VC_DATABASE: list[dict] = [
    # Global Tier 1 — Seed
    {"name": "YC", "stages": ["pre-seed", "seed"], "check_range": "$125K-$500K",
     "equity_pct": "7%", "ffs": 9, "focus": "All sectors",
     "pros": "Best network, brand lifts valuation", "cons": "Competitive",
     "url": "ycombinator.com/apply", "notable_portfolio": "Airbnb, Stripe, Coinbase"},
    {"name": "Pioneer", "stages": ["pre-seed"], "check_range": "$8K-$50K",
     "equity_pct": "1-2%", "ffs": 8, "focus": "Solo founders",
     "pros": "Small equity, global", "cons": "Small check", "url": "pioneer.app"},
    {"name": "Sequoia", "stages": ["seed", "a", "b", "c"], "check_range": "$1M-$100M+",
     "equity_pct": "15-25%", "ffs": 7, "focus": "All sectors",
     "pros": "Best brand, deep operator network", "cons": "High expectations",
     "url": "sequoiacap.com"},
    {"name": "a16z", "stages": ["seed", "a", "b", "c"], "check_range": "$500K-$100M+",
     "equity_pct": "15-20%", "ffs": 7, "focus": "AI, crypto, bio, consumer",
     "pros": "Deep media + network", "cons": "Big fund needs big outcomes",
     "url": "a16z.com"},

    # SEA / Vietnam
    {"name": "Do Ventures", "stages": ["seed", "a"], "check_range": "$500K-$5M",
     "equity_pct": "10-20%", "ffs": 8, "focus": "Vietnam, SEA tech",
     "region": "vietnam", "pros": "Vietnam deep network",
     "notable_portfolio": "Timo, Dat Bike", "url": "doventures.vc"},
    {"name": "Wavemaker Partners", "stages": ["seed", "a"], "check_range": "$500K-$5M",
     "equity_pct": "10-20%", "ffs": 7, "region": "sea", "url": "wavemaker.vc"},
    {"name": "Golden Gate Ventures", "stages": ["seed", "a", "b"],
     "check_range": "$1M-$15M", "ffs": 7, "region": "sea", "url": "goldengate.vc"},
    {"name": "500 SEA", "stages": ["pre-seed", "seed"], "check_range": "$150K-$500K",
     "ffs": 8, "region": "sea", "pros": "Network access",
     "url": "500.co/startups/sea"},
    {"name": "Monk's Hill Ventures", "stages": ["seed", "a"],
     "check_range": "$1M-$10M", "ffs": 8, "region": "sea", "url": "monkshill.com"},

    # AI / Dev Tool Focused
    {"name": "Gradient Ventures (Google)", "stages": ["seed", "a"],
     "check_range": "$1M-$10M", "ffs": 7, "focus": "AI, developer tools",
     "pros": "Google integration + credits", "url": "gradient.google"},
    {"name": "Boldstart Ventures", "stages": ["seed"], "check_range": "$1M-$5M",
     "ffs": 9, "focus": "Developer tools, infra",
     "pros": "Deep enterprise + PLG expertise", "notable_portfolio": "Snyk, BigID"},
    {"name": "Heavybit", "stages": ["seed", "a"], "check_range": "$500K-$5M",
     "ffs": 9, "focus": "Developer tools exclusively",
     "pros": "Community, program, networks", "url": "heavybit.com/apply"},

    # Bootstrapped / Indie Friendly
    {"name": "Tiny.vc", "stages": ["seed"], "check_range": "$250K-$2M",
     "equity_pct": "5-10%", "ffs": 10, "focus": "Calm, profitable businesses",
     "pros": "No board, no pressure", "url": "tiny.vc"},
    {"name": "Calm Fund", "stages": ["seed"], "check_range": "$20K-$200K",
     "equity_pct": "revenue share", "ffs": 10,
     "focus": "Sustainable, founder-owned", "url": "calmfund.com"},
    {"name": "Indie.vc", "stages": ["seed"], "check_range": "$100K-$1M",
     "equity_pct": "revenue-based", "ffs": 10, "focus": "Revenue from day 1"},

    # Series A/B
    {"name": "Accel", "stages": ["a", "b"], "check_range": "$5M-$50M",
     "ffs": 7, "notable_portfolio": "Atlassian, Slack, Dropbox"},
    {"name": "Bessemer", "stages": ["a", "b", "c"], "check_range": "$5M-$100M",
     "ffs": 7, "notable_portfolio": "LinkedIn, Shopify"},
    {"name": "Index Ventures", "stages": ["a", "b", "c"],
     "check_range": "$5M-$100M", "ffs": 8,
     "notable_portfolio": "Adyen, Figma, Notion"},

    # Late Stage / Pre-IPO
    {"name": "Tiger Global", "stages": ["c", "d", "pre-ipo"],
     "check_range": "$50M-$500M", "ffs": 5,
     "pros": "Fast, no board involvement", "cons": "Pure financial, no value-add"},
    {"name": "SoftBank Vision Fund", "stages": ["c", "d", "pre-ipo"],
     "check_range": "$100M-$5B", "ffs": 3,
     "cons": "Read WeWork case study before taking"},
    {"name": "Coatue", "stages": ["b", "c", "d", "pre-ipo"],
     "check_range": "$20M-$500M", "ffs": 6},
]


# ── Core Functions ───────────────────────────────────────────────────


def _build_fund(data: dict) -> VCFund:
    """Build VCFund from raw dict."""
    return VCFund(
        name=data["name"],
        stages=data["stages"],
        check_range=data["check_range"],
        equity_pct=data.get("equity_pct", ""),
        ffs=data.get("ffs", 5),
        focus=data.get("focus", ""),
        region=data.get("region", "global"),
        pros=data.get("pros", ""),
        cons=data.get("cons", ""),
        url=data.get("url", ""),
        notable_portfolio=data.get("notable_portfolio", ""),
    )


def get_all_funds() -> list[VCFund]:
    """Get full VC database."""
    return [_build_fund(d) for d in VC_DATABASE]


def filter_funds(
    stage: str = "",
    sector: str = "",
    region: str = "",
    min_ffs: int = 0,
) -> list[VCFund]:
    """Filter and rank VC funds by criteria."""
    funds = get_all_funds()
    filtered = []

    for f in funds:
        if stage and stage not in f.stages:
            continue
        if region and region != "global" and f.region not in (region, "global"):
            continue
        if min_ffs and f.ffs < min_ffs:
            continue
        if sector and f.focus and sector.lower() not in f.focus.lower():
            # Don't filter out funds with no focus specified
            if f.focus:
                continue
        filtered.append(f)

    # Sort by FFS descending
    filtered.sort(key=lambda f: f.ffs, reverse=True)
    return filtered


def generate_outreach_intel(
    fund: VCFund,
    company_sector: str = "",
) -> OutreachIntel:
    """Generate outreach intelligence for a specific fund."""
    partner = f"Most active {company_sector or 'tech'} partner"
    warm_path = "LinkedIn 2nd connection / portfolio founder / mutual contact"
    angle = f"Their thesis on {fund.focus or 'technology'} aligns with our approach"

    recent = []
    if fund.notable_portfolio:
        recent = [p.strip() for p in fund.notable_portfolio.split(",")][:3]

    return OutreachIntel(
        fund_name=fund.name,
        partner_to_target=partner,
        warm_intro_path=warm_path,
        cold_email_angle=angle,
        recent_investments=recent,
    )


def build_vc_map(
    stage: str = "seed",
    sector: str = "",
    region: str = "",
    min_ffs: int = 0,
    top_n: int = 10,
) -> VCMapResult:
    """Build complete VC intelligence map."""
    matched = filter_funds(stage, sector, region, min_ffs)
    top = matched[:top_n]

    intel = [generate_outreach_intel(f, sector) for f in top]

    return VCMapResult(
        stage=stage,
        sector=sector,
        region=region,
        matched_funds=top,
        outreach_intel=intel,
        total_matched=len(matched),
    )


# ── Save Functions ───────────────────────────────────────────────────


def save_vc_map(output_dir: str, result: VCMapResult) -> list[str]:
    """Save VC map results."""
    base = Path(output_dir) / ".mekong" / "raise" / "vc-map"
    base.mkdir(parents=True, exist_ok=True)
    saved = []

    # Matched investors
    path = base / "matched-investors.json"
    path.write_text(json.dumps(
        [asdict(f) for f in result.matched_funds], indent=2,
    ))
    saved.append(str(path))

    # Outreach intel
    intel_path = base / "outreach-intel.json"
    intel_path.write_text(json.dumps(
        [asdict(o) for o in result.outreach_intel], indent=2,
    ))
    saved.append(str(intel_path))

    return saved
