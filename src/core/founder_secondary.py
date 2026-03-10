"""Founder Secondary — /founder secondary backend.

Secondary market liquidity management: secondary in round,
tender offers, SPV secondary, tax optimization, liquidity calculator.
"""

from __future__ import annotations

import json
import logging
from dataclasses import asdict, dataclass, field
from pathlib import Path

logger = logging.getLogger(__name__)


# ── Data Models ──────────────────────────────────────────────────────


@dataclass
class SecondaryMechanism:
    """A mechanism for founder liquidity."""

    name: str
    description: str
    typical_stage: str
    typical_amount_pct: str  # "10-20% of round"
    pros: list[str] = field(default_factory=list)
    cons: list[str] = field(default_factory=list)


@dataclass
class TaxScenario:
    """Tax impact of a secondary sale."""

    name: str
    tax_rate_pct: float
    gross_proceeds: float
    tax_amount: float
    net_proceeds: float
    notes: str = ""

    @classmethod
    def calculate(
        cls,
        name: str,
        rate: float,
        gross: float,
        notes: str = "",
    ) -> TaxScenario:
        tax = gross * rate / 100
        return cls(
            name=name,
            tax_rate_pct=rate,
            gross_proceeds=gross,
            tax_amount=round(tax, 2),
            net_proceeds=round(gross - tax, 2),
            notes=notes,
        )


@dataclass
class SecondaryPlatform:
    """A secondary market platform."""

    name: str
    url: str
    description: str
    typical_discount_pct: str


@dataclass
class LiquidityAnalysis:
    """Complete liquidity analysis for a founder."""

    current_stake_pct: float
    current_valuation: float
    secondary_amount: float
    shares_to_sell_pct: float
    remaining_stake_pct: float
    tax_scenarios: list[TaxScenario] = field(default_factory=list)
    diversification_before: dict = field(default_factory=dict)
    diversification_after: dict = field(default_factory=dict)
    recommendation: str = ""


@dataclass
class TenderOffer:
    """Tender offer structure."""

    company_valuation: float
    tender_price_discount_pct: float
    tender_valuation: float
    founder_shares_to_sell: int
    total_proceeds: float
    checklist: list[str] = field(default_factory=list)


# ── Constants ────────────────────────────────────────────────────────

SECONDARY_MECHANISMS = [
    SecondaryMechanism(
        "Secondary in Financing Round",
        "New investor buys existing shares alongside primary investment",
        "Series B+",
        "10-20% of round",
        ["Most common", "Clean structure", "VC-approved"],
        ["Need VC agreement", "May reduce primary capital"],
    ),
    SecondaryMechanism(
        "Tender Offer",
        "Company offers to buy shares from founders + employees",
        "Pre-IPO / Series C+",
        "15-30% as tender",
        ["Organized", "Institutional buyers", "Board-approved"],
        ["Discount to last round", "Complexity", "Board approval required"],
    ),
    SecondaryMechanism(
        "SPV Secondary",
        "Third party SPV buys shares directly from founder",
        "Series B+",
        "Variable",
        ["No VC consent needed sometimes", "Market pricing"],
        ["ROFR may apply", "10-40% discount", "Transfer approval needed"],
    ),
    SecondaryMechanism(
        "Direct Secondary Sale",
        "Founder sells directly to accredited investor",
        "Any post-seed",
        "Variable",
        ["Simple", "Direct negotiation"],
        ["ROFR applies", "Company approval", "Limited buyer pool"],
    ),
]

SECONDARY_PLATFORMS = [
    SecondaryPlatform("Forge Global", "forge.com", "Pre-IPO marketplace", "10-30%"),
    SecondaryPlatform("CartaX", "carta.com/secondary", "Carta secondary market", "10-25%"),
    SecondaryPlatform("EquityZen", "equityzen.com", "Pre-IPO investing platform", "15-35%"),
    SecondaryPlatform("Nasdaq Private Market", "nasdaqprivatemarket.com",
                      "Nasdaq-operated private secondary", "10-20%"),
]

TENDER_CHECKLIST = [
    "10b5-1 plan setup (US) for legal safe harbor",
    "Board approval obtained",
    "Securities counsel review completed",
    "Employee communications prepared",
    "ROFR waiver from existing investors",
    "Price negotiation vs last round",
    "Transfer agent notified",
    "Tax advisor consulted",
]


# ── Core Functions ───────────────────────────────────────────────────


def get_mechanisms() -> list[SecondaryMechanism]:
    """Get all secondary liquidity mechanisms."""
    return list(SECONDARY_MECHANISMS)


def get_platforms() -> list[SecondaryPlatform]:
    """Get secondary market platforms."""
    return list(SECONDARY_PLATFORMS)


def calculate_tax_scenarios(
    gross_proceeds: float,
    jurisdiction: str = "us",
) -> list[TaxScenario]:
    """Calculate tax scenarios for secondary sale."""
    scenarios = []

    if jurisdiction == "us":
        scenarios.append(TaxScenario.calculate(
            "Long-term capital gains (held > 1yr)",
            20.0, gross_proceeds,
            "Standard LTCG rate for high earners",
        ))
        scenarios.append(TaxScenario.calculate(
            "QSBS eligible (held > 5yr, C-Corp)",
            0.0, gross_proceeds,
            "Up to $10M gain excluded federally — file 83(b)!",
        ))
        scenarios.append(TaxScenario.calculate(
            "Short-term / no 83(b) election",
            37.0, gross_proceeds,
            "Ordinary income rate — most expensive scenario",
        ))
    elif jurisdiction == "singapore":
        scenarios.append(TaxScenario.calculate(
            "Singapore capital gains", 0.0, gross_proceeds,
            "Singapore has 0% capital gains tax",
        ))
    elif jurisdiction == "vietnam":
        scenarios.append(TaxScenario.calculate(
            "Vietnam stock sale tax", 20.0, gross_proceeds,
            "20% capital gains on stock sales",
        ))
    else:
        scenarios.append(TaxScenario.calculate(
            "Standard capital gains (estimate)", 20.0, gross_proceeds,
            "Consult local CPA for exact rate",
        ))

    return scenarios


def analyze_liquidity(
    current_stake_pct: float,
    current_valuation: float,
    secondary_amount: float,
    jurisdiction: str = "us",
    liquid_assets: float = 0.0,
) -> LiquidityAnalysis:
    """Analyze a potential secondary sale."""
    stake_value = current_stake_pct / 100 * current_valuation
    if stake_value <= 0:
        shares_to_sell_pct = 0.0
    else:
        shares_to_sell_pct = round(secondary_amount / stake_value * 100, 2)

    remaining = current_stake_pct - (current_stake_pct * shares_to_sell_pct / 100)
    tax_scenarios = calculate_tax_scenarios(secondary_amount, jurisdiction)

    total_before = stake_value + liquid_assets
    startup_pct_before = (stake_value / total_before * 100) if total_before > 0 else 100
    cash_pct_before = 100 - startup_pct_before

    # Best-case net (QSBS or 0% jurisdiction)
    best_net = max(s.net_proceeds for s in tax_scenarios) if tax_scenarios else secondary_amount
    total_after = (stake_value - secondary_amount) + liquid_assets + best_net
    startup_pct_after = ((stake_value - secondary_amount) / total_after * 100) if total_after > 0 else 0

    # Recommendation
    if shares_to_sell_pct > 30:
        rec = "HIGH SALE — consider selling less to maintain alignment signal"
    elif shares_to_sell_pct > 15:
        rec = "MODERATE — standard range for Series B+ secondary"
    elif shares_to_sell_pct > 5:
        rec = "CONSERVATIVE — good for derisking without signaling doubt"
    else:
        rec = "MINIMAL — consider if this addresses your liquidity needs"

    return LiquidityAnalysis(
        current_stake_pct=current_stake_pct,
        current_valuation=current_valuation,
        secondary_amount=secondary_amount,
        shares_to_sell_pct=shares_to_sell_pct,
        remaining_stake_pct=round(remaining, 2),
        tax_scenarios=tax_scenarios,
        diversification_before={
            "startup_equity_pct": round(startup_pct_before, 1),
            "liquid_pct": round(cash_pct_before, 1),
        },
        diversification_after={
            "startup_equity_pct": round(startup_pct_after, 1),
            "liquid_pct": round(100 - startup_pct_after, 1),
        },
        recommendation=rec,
    )


def model_tender_offer(
    company_valuation: float,
    discount_pct: float,
    founder_shares: int,
    price_per_share: float,
    shares_to_sell: int,
) -> TenderOffer:
    """Model a tender offer for founder liquidity."""
    tender_val = company_valuation * (1 - discount_pct / 100)
    tender_price = price_per_share * (1 - discount_pct / 100)
    proceeds = shares_to_sell * tender_price

    return TenderOffer(
        company_valuation=company_valuation,
        tender_price_discount_pct=discount_pct,
        tender_valuation=tender_val,
        founder_shares_to_sell=shares_to_sell,
        total_proceeds=round(proceeds, 2),
        checklist=list(TENDER_CHECKLIST),
    )


# ── Save Functions ───────────────────────────────────────────────────


def save_liquidity_analysis(
    output_dir: str,
    analysis: LiquidityAnalysis,
) -> list[str]:
    """Save liquidity analysis files."""
    base = Path(output_dir) / ".mekong" / "raise" / "liquidity"
    base.mkdir(parents=True, exist_ok=True)
    saved = []

    path = base / "secondary-analysis.json"
    path.write_text(json.dumps(asdict(analysis), indent=2, default=str))
    saved.append(str(path))

    tax_path = base / "tax-scenarios.json"
    tax_path.write_text(json.dumps(
        [asdict(t) for t in analysis.tax_scenarios], indent=2,
    ))
    saved.append(str(tax_path))

    mech_path = base / "secondary-options.json"
    mech_path.write_text(json.dumps(
        [asdict(m) for m in get_mechanisms()], indent=2,
    ))
    saved.append(str(mech_path))

    return saved
