"""Company Billing — /company billing backend.

Subcommands: status, history, topup, tenants, reconcile.
Wired to MCUGate SQLite ledger for all MCU operations.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from src.core.mcu_gate import MCUGate

logger = logging.getLogger(__name__)

# MCU pack pricing
MCU_PACKS = {
    500: {"price": 24.50, "per_mcu": 0.049, "discount": ""},
    2000: {"price": 90.00, "per_mcu": 0.045, "discount": "8%"},
    5000: {"price": 200.00, "per_mcu": 0.040, "discount": "18%"},
}

TIER_MCU_MONTHLY = {"starter": 50, "growth": 200, "premium": 1000}
TIER_PRICE = {"starter": 49, "growth": 149, "premium": 499}


@dataclass
class BillingStatus:
    """Billing status snapshot."""

    company_name: str
    balance: int
    locked: int
    lifetime_used: int
    tier: str
    avg_daily: float
    days_remaining: int
    projected_date: str
    low_balance: bool


def get_billing_status(
    base_dir: str | Path = ".",
    mcu_gate: MCUGate | None = None,
    tenant_id: str = "default",
) -> BillingStatus:
    """Get current billing status from config files and/or MCUGate."""
    base = Path(base_dir)

    # Read company info
    company_file = base / ".mekong" / "company.json"
    company_name = "Unknown"
    if company_file.exists():
        data = json.loads(company_file.read_text(encoding="utf-8"))
        company_name = data.get("company_name", "Unknown")

    # Get balance from MCUGate or file
    balance = 0
    locked = 0
    lifetime_used = 0
    tier = "starter"

    if mcu_gate:
        bal = mcu_gate.get_balance(tenant_id)
        balance = bal["balance"]
        locked = bal["locked"]
        lifetime_used = bal["lifetime_used"]
    else:
        balance_file = base / ".mekong" / "mcu_balance.json"
        if balance_file.exists():
            data = json.loads(balance_file.read_text(encoding="utf-8"))
            balance = data.get("balance", 0)
            locked = data.get("locked", 0)
            lifetime_used = data.get("lifetime_used", 0)
            tier = data.get("tier", "starter")

    # Calculate projections
    avg_daily = _calc_avg_daily(base, mcu_gate, tenant_id)
    available = balance - locked
    if avg_daily > 0:
        days_remaining = int(available / avg_daily)
        from datetime import timedelta

        projected = datetime.now(timezone.utc) + timedelta(days=days_remaining)
        projected_date = projected.strftime("%Y-%m-%d")
    else:
        days_remaining = -1  # infinite
        projected_date = "N/A"

    return BillingStatus(
        company_name=company_name,
        balance=balance,
        locked=locked,
        lifetime_used=lifetime_used,
        tier=tier,
        avg_daily=avg_daily,
        days_remaining=days_remaining,
        projected_date=projected_date,
        low_balance=available < 50,
    )


def _calc_avg_daily(
    base: Path, mcu_gate: MCUGate | None, tenant_id: str
) -> float:
    """Calculate average daily MCU usage from ledger."""
    entries = get_history(base_dir=base, mcu_gate=mcu_gate, tenant_id=tenant_id, limit=50)
    if not entries:
        return 0.0

    confirm_entries = [e for e in entries if e["type"] == "confirm"]
    if len(confirm_entries) < 2:
        return sum(abs(e["amount"]) for e in confirm_entries) / max(1, 1)

    dates = sorted(set(e["created_at"][:10] for e in confirm_entries))
    if len(dates) < 2:
        return sum(abs(e["amount"]) for e in confirm_entries)

    total_mcu = sum(abs(e["amount"]) for e in confirm_entries)
    day_span = max(1, len(dates))
    return round(total_mcu / day_span, 1)


def get_history(
    base_dir: str | Path = ".",
    mcu_gate: MCUGate | None = None,
    tenant_id: str = "default",
    limit: int = 20,
) -> list[dict]:
    """Get MCU transaction history."""
    if mcu_gate:
        return _history_from_gate(mcu_gate, tenant_id, limit)

    base = Path(base_dir)
    ledger_file = base / ".mekong" / "mcu_ledger.json"
    if not ledger_file.exists():
        return []

    data = json.loads(ledger_file.read_text(encoding="utf-8"))
    entries = data if isinstance(data, list) else data.get("entries", [])
    return entries[-limit:]


def _history_from_gate(gate: MCUGate, tenant_id: str, limit: int) -> list[dict]:
    """Read ledger entries directly from MCUGate SQLite."""
    rows = gate._conn.execute(
        "SELECT id, tenant_id, mission_id, amount, type, status, created_at, confirmed_at "
        "FROM mcu_ledger WHERE tenant_id = ? ORDER BY created_at DESC LIMIT ?",
        (tenant_id, limit),
    ).fetchall()
    return [
        {
            "id": r["id"],
            "tenant_id": r["tenant_id"],
            "mission_id": r["mission_id"],
            "amount": r["amount"],
            "type": r["type"],
            "status": r["status"],
            "created_at": r["created_at"] or "",
            "confirmed_at": r["confirmed_at"] or "",
        }
        for r in rows
    ]


def get_topup_info(amount: int) -> dict:
    """Get topup pack info for a given MCU amount.

    Returns pack details or error if invalid amount.
    """
    if amount not in MCU_PACKS:
        valid = sorted(MCU_PACKS.keys())
        return {"error": f"Invalid amount. Valid: {valid}"}

    pack = MCU_PACKS[amount]
    return {
        "amount": amount,
        "price": pack["price"],
        "per_mcu": pack["per_mcu"],
        "discount": pack["discount"],
        "checkout_url": f"https://app.agencyos.network/billing/topup/{amount}",
    }


def get_tenants(
    mcu_gate: MCUGate,
    sort_by: str = "mrr",
) -> list[dict]:
    """List all tenants with balance and usage info.

    Only available with MCUGate (SQLite backend).
    """
    rows = mcu_gate._conn.execute(
        "SELECT tenant_id, balance, locked, lifetime_used FROM mcu_balance "
        "ORDER BY lifetime_used DESC"
    ).fetchall()

    tenants = []
    for r in rows:
        tenant_id = r["tenant_id"]
        tier = _guess_tier(r["lifetime_used"])
        mrr = TIER_PRICE.get(tier, 0)
        tenants.append({
            "tenant_id": tenant_id,
            "tier": tier,
            "mrr": mrr,
            "balance": r["balance"],
            "locked": r["locked"],
            "lifetime_used": r["lifetime_used"],
        })

    if sort_by == "mrr":
        tenants.sort(key=lambda t: t["mrr"], reverse=True)
    elif sort_by == "usage":
        tenants.sort(key=lambda t: t["lifetime_used"], reverse=True)

    return tenants


def _guess_tier(lifetime_used: int) -> str:
    """Guess tier from lifetime usage patterns."""
    if lifetime_used > 500:
        return "premium"
    if lifetime_used > 100:
        return "growth"
    return "starter"


def reconcile(
    base_dir: str | Path = ".",
    mcu_gate: MCUGate | None = None,
    tenant_id: str = "default",
) -> dict:
    """Cross-check MCU sold vs recorded revenue.

    Returns reconciliation report dict.
    """
    entries = get_history(base_dir=base_dir, mcu_gate=mcu_gate, tenant_id=tenant_id, limit=9999)

    # Sum seed entries = MCU purchased
    seed_entries = [e for e in entries if e["type"] == "seed"]
    total_mcu_sold = sum(e["amount"] for e in seed_entries)

    # Expected revenue at avg $0.049/MCU
    expected_revenue = round(total_mcu_sold * 0.049, 2)

    # Read recorded revenue if available
    base = Path(base_dir)
    revenue_file = base / ".mekong" / "revenue.json"
    recorded_revenue = 0.0
    if revenue_file.exists():
        data = json.loads(revenue_file.read_text(encoding="utf-8"))
        recorded_revenue = data.get("total_revenue", 0.0)

    discrepancy = round(expected_revenue - recorded_revenue, 2)
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    report = {
        "date": now,
        "mcu_sold": total_mcu_sold,
        "expected_revenue": expected_revenue,
        "recorded_revenue": recorded_revenue,
        "discrepancy": discrepancy,
        "status": "reconciled" if discrepancy == 0 else "discrepancy_found",
        "seed_count": len(seed_entries),
    }

    # Save report
    report_dir = base / ".mekong"
    if report_dir.exists():
        report_file = report_dir / f"reconcile-{now}.json"
        report_file.write_text(json.dumps(report, indent=2), encoding="utf-8")

    return report
