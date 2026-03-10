"""Founder VC Cap Table — /founder cap-table backend.

Cap table simulator: dilution calculator, option pool modeling,
SAFE/convertible note conversion, exit waterfall analysis.
"""

from __future__ import annotations

import json
import logging
from dataclasses import asdict, dataclass, field
from pathlib import Path

logger = logging.getLogger(__name__)


# ── Data Models ──────────────────────────────────────────────────────


@dataclass
class Shareholder:
    """A single entry in the cap table."""

    name: str
    shares: int
    share_type: str = "common"  # "common" | "preferred" | "option_pool"
    round_name: str = "founding"
    investment_amount: float = 0.0
    liquidation_pref_multiple: float = 1.0
    participating: bool = False

    @property
    def is_preferred(self) -> bool:
        return self.share_type == "preferred"


@dataclass
class CapTable:
    """Full cap table state."""

    company_name: str
    shareholders: list[Shareholder] = field(default_factory=list)
    total_shares: int = 0

    def ownership_pct(self, holder: Shareholder) -> float:
        if self.total_shares <= 0:
            return 0.0
        return (holder.shares / self.total_shares) * 100

    def holder_by_name(self, name: str) -> Shareholder | None:
        for h in self.shareholders:
            if h.name == name:
                return h
        return None

    def recalculate_total(self) -> None:
        self.total_shares = sum(h.shares for h in self.shareholders)


@dataclass
class RoundModel:
    """Result of modeling a new funding round."""

    round_name: str
    investment_amount: float
    pre_money_valuation: float
    post_money_valuation: float
    new_shares_issued: int
    investor_pct: float
    option_pool_pct: float
    option_pool_pre_money: bool
    effective_pre_money: float
    cap_table_before: list[dict] = field(default_factory=list)
    cap_table_after: list[dict] = field(default_factory=list)


@dataclass
class SAFENote:
    """A SAFE or convertible note."""

    investor_name: str
    amount: float
    valuation_cap: float = 0.0
    discount_pct: float = 0.0
    mfn: bool = False


@dataclass
class WaterfallEntry:
    """Single entry in exit waterfall."""

    holder_name: str
    payout: float
    pct_of_exit: float
    share_type: str


@dataclass
class ExitWaterfall:
    """Complete exit waterfall at a given exit value."""

    exit_value: float
    entries: list[WaterfallEntry] = field(default_factory=list)
    total_distributed: float = 0.0


# ── Core Functions ───────────────────────────────────────────────────


def create_cap_table(
    company_name: str,
    founders: list[tuple[str, int]],
    option_pool_pct: float = 10.0,
) -> CapTable:
    """Create initial cap table with founders and option pool."""
    shareholders = []
    total_founder_shares = sum(s for _, s in founders)

    for name, shares in founders:
        shareholders.append(Shareholder(
            name=name, shares=shares, share_type="common",
            round_name="founding",
        ))

    # Option pool as % of total (including pool itself)
    if option_pool_pct > 0:
        pool_shares = int(
            total_founder_shares * option_pool_pct / (100 - option_pool_pct)
        )
        shareholders.append(Shareholder(
            name="Option Pool", shares=pool_shares,
            share_type="option_pool", round_name="founding",
        ))

    cap = CapTable(company_name=company_name, shareholders=shareholders)
    cap.recalculate_total()
    return cap


def model_round(
    cap_table: CapTable,
    round_name: str,
    investment_amount: float,
    pre_money_valuation: float,
    option_pool_pct: float = 0.0,
    option_pool_pre_money: bool = False,
    liquidation_pref: float = 1.0,
    participating: bool = False,
) -> RoundModel:
    """Model a new funding round and return updated cap table info."""
    # Snapshot before
    before = []
    for h in cap_table.shareholders:
        before.append({
            "name": h.name,
            "shares": h.shares,
            "pct": round(cap_table.ownership_pct(h), 2),
        })

    # Effective pre-money (option pool shuffle)
    post_money = pre_money_valuation + investment_amount
    if option_pool_pre_money and option_pool_pct > 0:
        effective_pre = pre_money_valuation - (option_pool_pct / 100) * post_money
    else:
        effective_pre = pre_money_valuation

    # Price per share
    price_per_share = pre_money_valuation / cap_table.total_shares if cap_table.total_shares > 0 else 1.0

    # New investor shares
    new_investor_shares = int(investment_amount / price_per_share) if price_per_share > 0 else 0

    # Add investor
    cap_table.shareholders.append(Shareholder(
        name=f"{round_name} Investor",
        shares=new_investor_shares,
        share_type="preferred",
        round_name=round_name,
        investment_amount=investment_amount,
        liquidation_pref_multiple=liquidation_pref,
        participating=participating,
    ))

    # Expand option pool if needed
    if option_pool_pct > 0:
        pool = cap_table.holder_by_name("Option Pool")
        new_total = cap_table.total_shares + new_investor_shares
        target_pool_shares = int(new_total * option_pool_pct / 100)
        current_pool = pool.shares if pool else 0
        additional = max(0, target_pool_shares - current_pool)
        if pool:
            pool.shares += additional
        else:
            cap_table.shareholders.append(Shareholder(
                name="Option Pool", shares=target_pool_shares,
                share_type="option_pool", round_name=round_name,
            ))

    cap_table.recalculate_total()

    # Investor ownership
    investor_pct = (new_investor_shares / cap_table.total_shares * 100) if cap_table.total_shares > 0 else 0

    # Snapshot after
    after = []
    for h in cap_table.shareholders:
        after.append({
            "name": h.name,
            "shares": h.shares,
            "pct": round(cap_table.ownership_pct(h), 2),
        })

    return RoundModel(
        round_name=round_name,
        investment_amount=investment_amount,
        pre_money_valuation=pre_money_valuation,
        post_money_valuation=post_money,
        new_shares_issued=new_investor_shares,
        investor_pct=round(investor_pct, 2),
        option_pool_pct=option_pool_pct,
        option_pool_pre_money=option_pool_pre_money,
        effective_pre_money=effective_pre,
        cap_table_before=before,
        cap_table_after=after,
    )


def convert_safes(
    cap_table: CapTable,
    safes: list[SAFENote],
    priced_round_pre_money: float,
    priced_round_investment: float,
) -> list[dict]:
    """Convert SAFEs/notes at a priced round. Returns conversion details."""
    conversions = []
    price_per_share = priced_round_pre_money / cap_table.total_shares if cap_table.total_shares > 0 else 1.0

    for safe in safes:
        # Determine conversion price
        if safe.valuation_cap > 0:
            cap_price = safe.valuation_cap / cap_table.total_shares if cap_table.total_shares > 0 else price_per_share
        else:
            cap_price = price_per_share

        if safe.discount_pct > 0:
            discount_price = price_per_share * (1 - safe.discount_pct / 100)
        else:
            discount_price = price_per_share

        # Use lower price (better for SAFE holder)
        conversion_price = min(cap_price, discount_price) if safe.valuation_cap > 0 else discount_price
        if conversion_price <= 0:
            conversion_price = price_per_share

        new_shares = int(safe.amount / conversion_price)
        ownership_pct = (new_shares / (cap_table.total_shares + new_shares)) * 100

        cap_table.shareholders.append(Shareholder(
            name=safe.investor_name,
            shares=new_shares,
            share_type="preferred",
            round_name="SAFE conversion",
            investment_amount=safe.amount,
        ))

        conversions.append({
            "investor": safe.investor_name,
            "amount": safe.amount,
            "conversion_price": round(conversion_price, 4),
            "shares": new_shares,
            "ownership_pct": round(ownership_pct, 2),
        })

    cap_table.recalculate_total()
    return conversions


def calculate_exit_waterfall(
    cap_table: CapTable,
    exit_value: float,
) -> ExitWaterfall:
    """Calculate who gets what at a given exit value."""
    entries = []
    remaining = exit_value

    # Step 1: Pay liquidation preferences (preferred shareholders)
    preferred = [h for h in cap_table.shareholders if h.is_preferred]
    preferred.sort(key=lambda h: h.round_name, reverse=True)  # Senior first

    pref_payouts: dict[str, float] = {}
    for h in preferred:
        pref_amount = h.investment_amount * h.liquidation_pref_multiple
        payout = min(pref_amount, remaining)
        pref_payouts[h.name] = payout
        remaining -= payout

    # Step 2: Participation or conversion
    for h in preferred:
        if h.participating and remaining > 0:
            # Participating: also gets share of remainder
            pct = cap_table.ownership_pct(h) / 100
            additional = remaining * pct
            pref_payouts[h.name] = pref_payouts.get(h.name, 0) + additional

    # Recalculate remaining after participation
    if any(h.participating for h in preferred):
        total_pref = sum(pref_payouts.values())
        remaining = max(0, exit_value - total_pref)

    # Step 3: Common shareholders split remainder
    common = [h for h in cap_table.shareholders
              if h.share_type in ("common", "option_pool")]
    common_total = sum(h.shares for h in common)

    for h in preferred:
        # Check if converting is better than pref
        if not h.participating:
            convert_value = (cap_table.ownership_pct(h) / 100) * exit_value
            if convert_value > pref_payouts.get(h.name, 0):
                pref_payouts[h.name] = convert_value
                # Adjust remaining
                remaining = exit_value - sum(pref_payouts.values())

    # Distribute to common
    common_payouts: dict[str, float] = {}
    if common_total > 0 and remaining > 0:
        for h in common:
            share = (h.shares / common_total) * remaining
            common_payouts[h.name] = share

    # Build entries
    for name, payout in pref_payouts.items():
        entries.append(WaterfallEntry(
            holder_name=name,
            payout=round(payout, 2),
            pct_of_exit=round((payout / exit_value * 100) if exit_value > 0 else 0, 2),
            share_type="preferred",
        ))

    for name, payout in common_payouts.items():
        entries.append(WaterfallEntry(
            holder_name=name,
            payout=round(payout, 2),
            pct_of_exit=round((payout / exit_value * 100) if exit_value > 0 else 0, 2),
            share_type="common",
        ))

    return ExitWaterfall(
        exit_value=exit_value,
        entries=entries,
        total_distributed=round(sum(e.payout for e in entries), 2),
    )


def model_full_journey(
    company_name: str,
    founders: list[tuple[str, int]],
    rounds: list[dict],
) -> list[RoundModel]:
    """Model dilution through multiple rounds."""
    cap = create_cap_table(company_name, founders)
    results = []
    for r in rounds:
        result = model_round(
            cap,
            round_name=r["name"],
            investment_amount=r["investment"],
            pre_money_valuation=r["pre_money"],
            option_pool_pct=r.get("option_pool_pct", 0),
            option_pool_pre_money=r.get("option_pool_pre_money", False),
            liquidation_pref=r.get("liq_pref", 1.0),
            participating=r.get("participating", False),
        )
        results.append(result)
    return results


# ── Save Functions ───────────────────────────────────────────────────


def save_cap_table(output_dir: str, cap_table: CapTable) -> str:
    """Save cap table to JSON."""
    base = Path(output_dir) / ".mekong" / "raise"
    base.mkdir(parents=True, exist_ok=True)
    path = base / "cap-table.json"
    path.write_text(json.dumps(asdict(cap_table), indent=2, default=str))
    return str(path)


def save_round_model(output_dir: str, model: RoundModel) -> str:
    """Save round model to JSON."""
    base = Path(output_dir) / ".mekong" / "raise"
    base.mkdir(parents=True, exist_ok=True)
    path = base / f"round-model-{model.round_name.lower().replace(' ', '-')}.json"
    path.write_text(json.dumps(asdict(model), indent=2, default=str))
    return str(path)


def save_exit_waterfall(output_dir: str, waterfall: ExitWaterfall) -> str:
    """Save exit waterfall to JSON."""
    base = Path(output_dir) / ".mekong" / "raise"
    base.mkdir(parents=True, exist_ok=True)
    ev_label = f"{waterfall.exit_value / 1e6:.0f}m"
    path = base / f"exit-waterfall-{ev_label}.json"
    path.write_text(json.dumps(asdict(waterfall), indent=2, default=str))
    return str(path)
