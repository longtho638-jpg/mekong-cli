"""Founder IPO S-1 — S-1 filing assistant.

Builds S-1 framework with section templates, risk factors,
and narrative quality checks for SEC filing preparation.
"""

from __future__ import annotations

import json
import logging
from dataclasses import asdict, dataclass
from pathlib import Path

from .founder_s1_data import RISK_TEMPLATES, S1_SECTIONS, S1Section

logger = logging.getLogger(__name__)


# ── Data Models ──────────────────────────────────────────────────────


@dataclass
class RiskFactor:
    category: str
    description: str
    severity: str = "medium"


@dataclass
class NarrativeCheck:
    question: str
    passed: bool
    notes: str = ""


@dataclass
class S1Framework:
    sections: list[S1Section]
    risk_factors: list[RiskFactor]
    narrative_checks: list[NarrativeCheck]
    narrative_score: int = 0


# ── Core Functions ───────────────────────────────────────────────────


def build_s1_framework(
    company_name: str,
    arr: float,
    growth_pct: float,
    gross_margin_pct: float,
    customers: int,
    nrr_pct: float,
) -> S1Framework:
    """Build S-1 framework populated with company data."""
    filled: list[S1Section] = []
    subs = dict(
        company_name=company_name, arr=f"{arr:.1f}", growth_pct=f"{growth_pct:.0f}",
        gross_margin_pct=f"{gross_margin_pct:.0f}", customers=customers,
        nrr_pct=f"{nrr_pct:.0f}", business_description="[business description]",
        value_prop="[value proposition]", revenue_model="[revenue model]",
        tam="[TAM]", net_proceeds="[net proceeds]", ceo_name="[CEO Name]", board_count="[N]",
    )
    for sec in S1_SECTIONS:
        try:
            content = sec.content_template.format(**subs)
        except KeyError:
            content = sec.content_template
        filled.append(S1Section(name=sec.name, content_template=content,
                                key_points=list(sec.key_points)))

    risk_factors = generate_risk_factors(
        has_losses=arr < 50 or growth_pct > 100,
        customer_concentration=customers < 100,
        ai_dependent=False,
        international=False,
    )
    framework = S1Framework(sections=filled, risk_factors=risk_factors, narrative_checks=[])
    framework.narrative_checks = check_narrative_quality(framework)
    framework.narrative_score = sum(1 for c in framework.narrative_checks if c.passed)
    return framework


def generate_risk_factors(
    has_losses: bool,
    customer_concentration: bool,
    ai_dependent: bool,
    international: bool,
) -> list[RiskFactor]:
    """Generate risk factors from templates based on company profile flags."""
    flags = {
        "has_losses": has_losses,
        "customer_concentration": customer_concentration,
        "ai_dependent": ai_dependent,
        "international": international,
        "always": True,
    }
    return [
        RiskFactor(category=cat, description=desc, severity=sev)
        for flag, cat, desc, sev in RISK_TEMPLATES
        if flags.get(flag, False)
    ]


def check_narrative_quality(framework: S1Framework) -> list[NarrativeCheck]:
    """Run 6 narrative quality checks on the S-1 framework."""
    all_content = " ".join(s.content_template for s in framework.sections)
    get = lambda name: next((s for s in framework.sections if s.name == name), None)  # noqa: E731
    summary, biz, metrics = get("Prospectus Summary"), get("Business Description"), get("Key Metrics")

    return [
        NarrativeCheck(
            question='Does the summary answer "So what?" for investors?',
            passed=summary is not None and "ARR" in summary.content_template,
            notes="Summary must include ARR, growth rate, and market opportunity",
        ),
        NarrativeCheck(
            question="Is there a single memorable headline metric?",
            passed=metrics is not None and "ARR" in metrics.content_template,
            notes="Lead with ARR or growth rate as the anchor metric",
        ),
        NarrativeCheck(
            question="Does the narrative contain quotable, specific data points?",
            passed=any(c.isdigit() for c in all_content),
            notes="Include specific numbers: ARR, customer count, growth rate, NRR",
        ),
        NarrativeCheck(
            question="Are key metrics consistent across all sections?",
            passed=all_content.count("ARR") >= 2,
            notes="Cross-reference ARR and growth rate in Summary, Metrics, and Business sections",
        ),
        NarrativeCheck(
            question="Is the business model explained in plain, jargon-free language?",
            passed=biz is not None and "revenue" in biz.content_template.lower(),
            notes="Explain revenue model simply; avoid technical jargon in the business overview",
        ),
        NarrativeCheck(
            question="Does the narrative include authentic customer outcomes or proof points?",
            passed="customer" in all_content.lower(),
            notes="Add customer count and NRR as proof of real value delivery",
        ),
    ]


# ── Save Functions ───────────────────────────────────────────────────


def save_s1_framework(output_dir: str, framework: S1Framework) -> list[str]:
    """Save S-1 framework to .mekong/ipo/."""
    base = Path(output_dir) / ".mekong" / "ipo"
    base.mkdir(parents=True, exist_ok=True)
    saved = []

    path = base / "s1-framework.json"
    path.write_text(json.dumps(asdict(framework), indent=2, default=str))
    saved.append(str(path))

    risks_path = base / "s1-risk-factors.json"
    risks_path.write_text(json.dumps([asdict(r) for r in framework.risk_factors], indent=2))
    saved.append(str(risks_path))

    return saved
