"""Founder Grow — /founder grow backend.

GTM execution engine: cold outreach, content marketing, SEO audit,
community building, and partnership pipeline.
"""

from __future__ import annotations

import json
import logging
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal

logger = logging.getLogger(__name__)

Channel = Literal["cold", "content", "seo", "community", "partner"]


# ── Data Models ──────────────────────────────────────────────────────


@dataclass
class Prospect:
    """A cold outreach prospect."""

    name: str
    title: str
    company: str
    contact: str  # email or twitter handle
    source: str  # linkedin, github, producthunt, etc.
    priority: int = 1  # 1=high, 2=medium, 3=low


@dataclass
class EmailSequence:
    """A 3-email cold outreach sequence."""

    prospect_name: str
    day1_subject: str
    day1_body: str
    day4_followup: str
    day8_breakup: str


@dataclass
class ContentCalendar:
    """Weekly content plan."""

    week_number: int
    monday_blog: str
    wednesday_threads: list[str]
    friday_linkedin: str
    weekend_video_topic: str


@dataclass
class SEOKeyword:
    """An SEO keyword target."""

    keyword: str
    monthly_volume: int
    difficulty: str  # low, medium, high
    intent: str  # informational, navigational, transactional
    priority: str  # HIGH, MEDIUM, SKIP


@dataclass
class CommunityTarget:
    """A community to engage with."""

    name: str
    platform: str  # slack, discord, reddit, etc.
    size: int
    activity_level: str  # high, medium, low
    join_link: str = ""
    relevance: str = ""


@dataclass
class PartnerLead:
    """A potential partnership."""

    company: str
    type: str  # integration, bundle, affiliate, distribution
    contact: str
    pitch_angle: str
    status: str = "identified"  # identified, contacted, negotiating, active


@dataclass
class GrowthDashboard:
    """Growth engine status dashboard."""

    current_mrr: float
    target_mrr: float
    gap_mrr: float
    leads_needed: int
    channels: dict[str, dict]
    timestamp: str = ""

    def __post_init__(self) -> None:
        if not self.timestamp:
            self.timestamp = datetime.now(timezone.utc).isoformat()


# ── Cold Outreach ────────────────────────────────────────────────────


def build_prospect_list(
    pain_keyword: str,
    icp_title: str,
    count: int = 10,
) -> list[Prospect]:
    """Build prospect list template for cold outreach."""
    prospects: list[Prospect] = []
    sources = ["linkedin", "github", "producthunt", "twitter", "reddit"]

    for i in range(min(count, 50)):
        prospects.append(
            Prospect(
                name=f"Prospect_{i + 1}",
                title=icp_title,
                company=f"Company_{i + 1}",
                contact=f"prospect{i + 1}@example.com",
                source=sources[i % len(sources)],
                priority=1 if i < count // 3 else (2 if i < count * 2 // 3 else 3),
            )
        )

    return prospects


def generate_email_sequence(
    prospect: Prospect,
    pain_point: str,
    social_proof: str = "",
) -> EmailSequence:
    """Generate 3-email cold outreach sequence."""
    return EmailSequence(
        prospect_name=prospect.name,
        day1_subject=f"Re: {prospect.title} at {prospect.company}",
        day1_body=(
            f"Hi {prospect.name},\n\n"
            f"I noticed your work at {prospect.company}. "
            f"I'm building a solution for {pain_point}. "
            f"{social_proof + ' ' if social_proof else ''}"
            f"Worth a 15-min chat?\n\nBest"
        ),
        day4_followup=(
            f"Hi {prospect.name}, quick follow up on my last note. "
            f"Would love to hear your perspective on {pain_point}."
        ),
        day8_breakup=(
            f"Hi {prospect.name}, I'll stop reaching out — but if "
            f"{pain_point} ever becomes a priority, I'm here."
        ),
    )


# ── Content Marketing ────────────────────────────────────────────────


def build_content_calendar(
    pillars: list[str],
    week_number: int = 1,
) -> ContentCalendar:
    """Build weekly content calendar from content pillars."""
    if not pillars:
        raise ValueError("At least one content pillar is required")

    pillar = pillars[(week_number - 1) % len(pillars)]

    return ContentCalendar(
        week_number=week_number,
        monday_blog=f"Deep dive: {pillar} — 1500-2000 words, SEO-optimized",
        wednesday_threads=[
            f"Thread 1: Key insight from {pillar} blog",
            f"Thread 2: Data point about {pillar}",
            f"Thread 3: Hot take on {pillar}",
        ],
        friday_linkedin=f"B2B insight post about {pillar} with data",
        weekend_video_topic=f"Tutorial: How to solve {pillar} step by step",
    )


def generate_content_pillars(
    product_type: str,
    pain_points: list[str],
) -> list[dict[str, str]]:
    """Generate content pillar strategy from pain points."""
    pillars = []
    for i, pain in enumerate(pain_points[:3]):
        stage = ["awareness", "consideration", "decision"][i % 3]
        pillars.append({
            "pillar": pain,
            "stage": stage,
            "content_types": "blog, thread, video",
        })
    return pillars


# ── SEO ──────────────────────────────────────────────────────────────


def build_keyword_map(
    seed_keywords: list[str],
) -> list[SEOKeyword]:
    """Build SEO keyword priority map from seed keywords."""
    keywords: list[SEOKeyword] = []

    for i, kw in enumerate(seed_keywords):
        # Alternate difficulty/intent for variety
        diff = ["low", "medium", "high"][i % 3]
        intent = ["informational", "transactional", "navigational"][i % 3]
        priority = "HIGH" if diff == "low" else ("MEDIUM" if diff == "medium" else "SKIP")

        keywords.append(SEOKeyword(
            keyword=kw,
            monthly_volume=500 * (len(seed_keywords) - i),
            difficulty=diff,
            intent=intent,
            priority=priority,
        ))

    return keywords


def generate_seo_brief(keyword: SEOKeyword) -> dict:
    """Generate content brief for an SEO keyword."""
    return {
        "keyword": keyword.keyword,
        "title_h1": f"How to {keyword.keyword}: Complete Guide",
        "meta_description": (
            f"Learn {keyword.keyword} with practical steps. "
            f"Updated guide with examples."
        ),
        "target_word_count": 1500 if keyword.priority == "HIGH" else 1000,
        "outline": [
            f"What is {keyword.keyword}?",
            f"Why {keyword.keyword} matters",
            "Step-by-step guide",
            "Common mistakes",
            "Tools and resources",
        ],
    }


def generate_technical_seo_checklist() -> list[dict[str, str]]:
    """Generate technical SEO audit checklist."""
    return [
        {"check": "sitemap.xml exists at /sitemap.xml", "priority": "high"},
        {"check": "robots.txt configured", "priority": "high"},
        {"check": "Page speed (Lighthouse > 90)", "priority": "high"},
        {"check": "Mobile-friendly", "priority": "high"},
        {"check": "Core Web Vitals passing", "priority": "medium"},
        {"check": "Canonical tags on all pages", "priority": "medium"},
        {"check": "Alt text on all images", "priority": "medium"},
        {"check": "Open Graph tags for social sharing", "priority": "low"},
    ]


# ── Community ────────────────────────────────────────────────────────


def map_communities(
    product_type: str, count: int = 10
) -> list[CommunityTarget]:
    """Generate community target list template."""
    platforms = ["slack", "discord", "reddit", "linkedin_group", "facebook_group"]
    communities: list[CommunityTarget] = []

    for i in range(min(count, 20)):
        communities.append(CommunityTarget(
            name=f"{product_type}_community_{i + 1}",
            platform=platforms[i % len(platforms)],
            size=1000 * (count - i),
            activity_level="high" if i < 3 else ("medium" if i < 7 else "low"),
            relevance=f"Target audience for {product_type}",
        ))

    return communities


def generate_engagement_plan() -> dict[str, str]:
    """Generate community engagement timeline."""
    return {
        "week_1_2": "Join, observe, introduce yourself (no product mention)",
        "week_3_4": "Answer 3 questions/day in your expertise area",
        "week_5": "Share useful resource (your content, not product pitch)",
        "week_6_plus": "Natural mention when directly relevant",
        "rule": "Give value 10x before promoting once",
    }


# ── Partnerships ─────────────────────────────────────────────────────


PARTNER_TYPES = [
    ("integration", "Tools your customers already use"),
    ("bundle", "Non-competing products to same ICP"),
    ("affiliate", "Consultants/agencies serving your ICP"),
    ("distribution", "Platforms where your ICP already is"),
]


def build_partner_pipeline(
    product_type: str, count: int = 5
) -> list[PartnerLead]:
    """Build initial partner pipeline template."""
    leads: list[PartnerLead] = []
    for i in range(min(count, 20)):
        ptype, desc = PARTNER_TYPES[i % len(PARTNER_TYPES)]
        leads.append(PartnerLead(
            company=f"Partner_{i + 1}",
            type=ptype,
            contact=f"partner{i + 1}@example.com",
            pitch_angle=desc,
        ))
    return leads


# ── Dashboard ────────────────────────────────────────────────────────


def build_growth_dashboard(
    base_dir: str,
    current_mrr: float = 0.0,
    avg_deal_size: float = 49.0,
) -> GrowthDashboard:
    """Build growth engine status dashboard."""
    target_mrr = 83000.0  # $1M ARR / 12
    gap = max(0, target_mrr - current_mrr)
    leads_needed = int(gap / avg_deal_size) if avg_deal_size > 0 else 0

    # Check which channels have data
    base = Path(base_dir)
    grow_dir = base / ".mekong" / "grow"
    channels: dict[str, dict] = {}

    for channel in ["cold", "content", "seo", "community", "partner"]:
        ch_dir = grow_dir / channel
        channels[channel] = {
            "active": ch_dir.exists(),
            "files": len(list(ch_dir.glob("*"))) if ch_dir.exists() else 0,
        }

    return GrowthDashboard(
        current_mrr=current_mrr,
        target_mrr=target_mrr,
        gap_mrr=gap,
        leads_needed=leads_needed,
        channels=channels,
    )


# ── File I/O ─────────────────────────────────────────────────────────


def save_channel_data(
    base_dir: str,
    channel: Channel,
    data: dict | list,
    filename: str = "data.json",
) -> str:
    """Save channel-specific data to .mekong/grow/{channel}/."""
    ch_dir = Path(base_dir) / ".mekong" / "grow" / channel
    ch_dir.mkdir(parents=True, exist_ok=True)

    path = ch_dir / filename
    content = data if isinstance(data, (dict, list)) else [data]
    path.write_text(json.dumps(content, indent=2, ensure_ascii=False, default=str))
    return str(path)


def save_dashboard(base_dir: str, dashboard: GrowthDashboard) -> str:
    """Save growth dashboard snapshot."""
    reports_dir = Path(base_dir) / ".mekong" / "reports"
    reports_dir.mkdir(parents=True, exist_ok=True)

    ts = datetime.now(timezone.utc).strftime("%Y%m%d")
    path = reports_dir / f"growth-{ts}.json"
    path.write_text(json.dumps(asdict(dashboard), indent=2, ensure_ascii=False))
    return str(path)
