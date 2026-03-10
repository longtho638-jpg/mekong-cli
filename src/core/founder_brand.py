"""Founder Brand — /founder brand backend.

Brand identity engine: name generation (3 tracks x 5 = 15 candidates),
domain availability check, positioning (Moore template), tagline variants,
and brand voice guide.
"""

from __future__ import annotations

import json
import logging
import subprocess
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Literal

logger = logging.getLogger(__name__)

NamingTrack = Literal["descriptive", "invented", "metaphorical"]
TonePosition = Literal["minimal", "playful", "professional", "bold"]


@dataclass
class NameCandidate:
    """A brand name candidate with scoring."""

    name: str
    track: NamingTrack
    pronounceable: int  # 1-5
    memorable: int  # 1-5
    brandable: int  # 1-5
    domain_friendly: int  # 1-5
    available: str = "TBD"  # "FREE" | "TAKEN" | "TBD"

    @property
    def score(self) -> float:
        return (
            self.pronounceable
            + self.memorable
            + self.brandable
            + self.domain_friendly
        ) / 4.0


@dataclass
class DomainCheck:
    """Domain availability check result."""

    name: str
    dot_com: str = "TBD"
    dot_io: str = "TBD"
    dot_co: str = "TBD"
    github: str = "TBD"


@dataclass
class Positioning:
    """Geoffrey Moore positioning statement."""

    target_customer: str
    problem: str
    product_category: str
    key_benefit: str
    primary_alternative: str
    differentiator: str

    def render(self, company_name: str) -> str:
        return (
            f"FOR: {self.target_customer}\n"
            f"WHO: {self.problem}\n"
            f"{company_name} IS: {self.product_category}\n"
            f"THAT: {self.key_benefit}\n"
            f"UNLIKE: {self.primary_alternative}\n"
            f"OUR PRODUCT: {self.differentiator}"
        )


@dataclass
class Tagline:
    """A tagline variant."""

    strategy: str
    text: str
    word_count: int = 0

    def __post_init__(self) -> None:
        self.word_count = len(self.text.split())


@dataclass
class BrandVoice:
    """Brand voice guide."""

    personality: list[str]  # 3 adjectives
    never_sounds_like: list[str]  # 3 to avoid
    writing_rules: list[str]
    tone: str = "professional"  # overall feel


@dataclass
class BrandKit:
    """Complete brand identity kit."""

    company_name: str
    candidates: list[NameCandidate]
    domain_checks: list[DomainCheck]
    positioning: Positioning
    taglines: list[Tagline]
    voice: BrandVoice


# ── Name Generation ──────────────────────────────────────────────────

TRACK_PATTERNS = {
    "descriptive": "action/benefit + domain/object (e.g., Dropbox, Basecamp)",
    "invented": "portmanteau, morphed word (e.g., Spotify, Figma)",
    "metaphorical": "unrelated concept, evocative (e.g., Apple, Stripe)",
}


def generate_name_candidates(
    product_desc: str,
    audience: str,
    tone: TonePosition = "professional",
) -> list[NameCandidate]:
    """Generate 15 name candidates across 3 tracks (placeholder names).

    In production, this calls LLM to generate creative names.
    Here we generate structured placeholders for the pipeline.
    """
    if not product_desc.strip():
        raise ValueError("Product description is required")

    candidates: list[NameCandidate] = []
    tracks: list[NamingTrack] = ["descriptive", "invented", "metaphorical"]

    # Generate 5 per track with descending scores
    for track in tracks:
        for i in range(5):
            candidates.append(
                NameCandidate(
                    name=f"{track.capitalize()}{i + 1}",
                    track=track,
                    pronounceable=max(1, 5 - i),
                    memorable=max(1, 5 - i),
                    brandable=max(1, 4 - i),
                    domain_friendly=max(1, 4 - i),
                )
            )

    return candidates


# ── Domain Check ─────────────────────────────────────────────────────


def check_domain_whois(name: str) -> DomainCheck:
    """Check domain availability via whois (best-effort)."""
    result = DomainCheck(name=name)

    for suffix, attr in [
        (".com", "dot_com"),
        (".io", "dot_io"),
        (".co", "dot_co"),
    ]:
        domain = f"{name.lower()}{suffix}"
        try:
            out = subprocess.run(
                ["whois", domain],
                capture_output=True,
                text=True,
                timeout=10,
            )
            text = out.stdout.lower()
            if any(kw in text for kw in ["no match", "not found", "available"]):
                setattr(result, attr, "FREE")
            elif out.returncode == 0 and text.strip():
                setattr(result, attr, "TAKEN")
            else:
                setattr(result, attr, "UNKNOWN")
        except (subprocess.TimeoutExpired, FileNotFoundError):
            setattr(result, attr, "UNKNOWN")

    return result


def check_domains_batch(names: list[str]) -> list[DomainCheck]:
    """Check domain availability for multiple names."""
    return [check_domain_whois(name) for name in names]


# ── Positioning ──────────────────────────────────────────────────────


def build_positioning(
    target_customer: str,
    problem: str,
    product_category: str,
    key_benefit: str,
    primary_alternative: str,
    differentiator: str,
) -> Positioning:
    """Build Geoffrey Moore positioning statement."""
    for name, val in [
        ("target_customer", target_customer),
        ("problem", problem),
        ("product_category", product_category),
    ]:
        if not val or not val.strip():
            raise ValueError(f"{name} is required")

    return Positioning(
        target_customer=target_customer,
        problem=problem,
        product_category=product_category,
        key_benefit=key_benefit or "unique value proposition",
        primary_alternative=primary_alternative or "existing tools",
        differentiator=differentiator or "specific differentiating claim",
    )


def generate_elevator_pitches(
    company_name: str, positioning: Positioning, traction: str = ""
) -> dict[str, str]:
    """Generate elevator pitches at different lengths."""
    return {
        "10s_party": (
            f"{company_name} lets {positioning.target_customer} "
            f"{positioning.key_benefit} without {positioning.problem}."
        ),
        "30s_investor": (
            f"We built {positioning.product_category} for "
            f"{positioning.target_customer}. {traction or 'Early traction.'}  "
            f"Unlike {positioning.primary_alternative}, "
            f"{positioning.differentiator}."
        ),
        "2min_demo": "Problem → Solution → Traction → Why now → Ask",
    }


# ── Taglines ─────────────────────────────────────────────────────────

TAGLINE_STRATEGIES = [
    "outcome-focused",
    "contrast",
    "provocative",
    "audience-call",
    "minimalist",
]


def generate_taglines(
    company_name: str,
    key_benefit: str,
    target: str,
) -> list[Tagline]:
    """Generate tagline variants across 5 strategies."""
    taglines = [
        Tagline("outcome-focused", f"Your {key_benefit}, fully automated"),
        Tagline("outcome-focused", f"From idea to revenue, via {company_name}"),
        Tagline("outcome-focused", f"{key_benefit}. No team required."),
        Tagline("contrast", "Not a tool. An operating system."),
        Tagline("contrast", "Not AI-assisted. AI-operated."),
        Tagline("contrast", "Beyond automation. Full operation."),
        Tagline("provocative", "The last hire you'll ever need"),
        Tagline("provocative", "Your startup runs while you sleep"),
        Tagline("provocative", "One founder. Zero limits."),
        Tagline("audience-call", f"For {target} who build alone"),
        Tagline("audience-call", "If you can type, you can scale"),
        Tagline("audience-call", f"Built for {target}, by {target}"),
        Tagline("minimalist", f"{company_name}. Ship. Scale."),
        Tagline("minimalist", "Operate at agent speed."),
        Tagline("minimalist", "Type. Build. Revenue."),
    ]
    return taglines


# ── Brand Voice ──────────────────────────────────────────────────────


def build_voice_guide(
    tone: TonePosition = "professional",
) -> BrandVoice:
    """Generate brand voice guide based on desired tone."""
    tone_map = {
        "minimal": {
            "personality": ["precise", "clean", "confident"],
            "avoid": ["flowery", "corporate", "dramatic"],
        },
        "playful": {
            "personality": ["witty", "approachable", "energetic"],
            "avoid": ["corporate", "dry", "overly formal"],
        },
        "professional": {
            "personality": ["expert", "trustworthy", "clear"],
            "avoid": ["casual", "slangy", "buzzword-heavy"],
        },
        "bold": {
            "personality": ["provocative", "direct", "ambitious"],
            "avoid": ["timid", "passive", "apologetic"],
        },
    }

    config = tone_map.get(tone, tone_map["professional"])

    return BrandVoice(
        personality=config["personality"],
        never_sounds_like=config["avoid"],
        writing_rules=[
            "Write like talking to a smart friend",
            "Use active voice",
            "Lead with benefit, not feature",
            "Use numbers when possible",
            "Short sentences for punch. Then longer for rhythm.",
            "Never use: leverage, synergy, world-class, cutting-edge",
            "Never start with 'We are...' — start with what you do",
        ],
        tone=tone,
    )


# ── File I/O ─────────────────────────────────────────────────────────


def save_brand_kit(base_dir: str, kit: BrandKit) -> list[str]:
    """Save complete brand kit to .mekong/brand/."""
    brand_dir = Path(base_dir) / ".mekong" / "brand"
    brand_dir.mkdir(parents=True, exist_ok=True)
    saved: list[str] = []

    # Name candidates
    path = brand_dir / "name-candidates.json"
    path.write_text(json.dumps(
        [asdict(c) for c in kit.candidates],
        indent=2, ensure_ascii=False,
    ))
    saved.append(str(path))

    # Domain availability
    path = brand_dir / "domain-availability.json"
    path.write_text(json.dumps(
        [asdict(d) for d in kit.domain_checks],
        indent=2, ensure_ascii=False,
    ))
    saved.append(str(path))

    # Positioning
    path = brand_dir / "positioning.json"
    path.write_text(json.dumps(asdict(kit.positioning), indent=2, ensure_ascii=False))
    saved.append(str(path))

    # Taglines
    path = brand_dir / "taglines.json"
    path.write_text(json.dumps(
        [asdict(t) for t in kit.taglines],
        indent=2, ensure_ascii=False,
    ))
    saved.append(str(path))

    # Voice guide
    path = brand_dir / "voice-guide.json"
    path.write_text(json.dumps(asdict(kit.voice), indent=2, ensure_ascii=False))
    saved.append(str(path))

    logger.info("Saved %d brand files to %s", len(saved), brand_dir)
    return saved
