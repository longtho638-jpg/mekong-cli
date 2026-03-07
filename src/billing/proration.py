"""
Mekong CLI - Proration Calculator

Prorated overage calculation for mid-cycle plan changes and usage exceedances.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


@dataclass
class ProrationResult:
    """Result of proration calculation."""

    license_key: str
    period_start: date
    period_end: date
    days_in_period: int
    days_elapsed: int
    days_remaining: int
    original_plan: str
    new_plan: Optional[str]
    prorated_base_fee: Decimal
    prorated_included_quantity: Dict[str, Decimal]
    overage_charges: Decimal
    total_charge: Decimal
    breakdown: Dict[str, Any]
    timestamp: datetime = None

    def __post_init__(self) -> None:
        if self.timestamp is None:
            self.timestamp = datetime.now(timezone.utc)

    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary."""
        return {
            "license_key": self.license_key,
            "period_start": self.period_start.isoformat(),
            "period_end": self.period_end.isoformat(),
            "days_in_period": self.days_in_period,
            "days_elapsed": self.days_elapsed,
            "days_remaining": self.days_remaining,
            "original_plan": self.original_plan,
            "new_plan": self.new_plan,
            "prorated_base_fee": str(self.prorated_base_fee),
            "prorated_included_quantity": {
                k: str(v) for k, v in self.prorated_included_quantity.items()
            },
            "overage_charges": str(self.overage_charges),
            "total_charge": str(self.total_charge),
            "breakdown": self.breakdown,
            "timestamp": self.timestamp.isoformat(),
        }


@dataclass
class OverageCalculation:
    """Overage charge calculation."""

    event_type: str
    model_name: Optional[str]
    total_usage: Decimal
    included_quantity: Decimal
    overage_quantity: Decimal
    unit_price: Decimal
    overage_rate: Decimal
    charge: Decimal
    metadata: Dict[str, Any] = None

    def __post_init__(self) -> None:
        if self.metadata is None:
            self.metadata = {}

    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary."""
        return {
            "event_type": self.event_type,
            "model_name": self.model_name,
            "total_usage": str(self.total_usage),
            "included_quantity": str(self.included_quantity),
            "overage_quantity": str(self.overage_quantity),
            "unit_price": str(self.unit_price),
            "overage_rate": str(self.overage_rate),
            "charge": str(self.charge),
            "metadata": self.metadata,
        }


class ProrationCalculator:
    """
    Calculate prorated charges for mid-cycle changes.

    Handles:
    - Plan upgrades/downgrades mid-cycle
    - Prorated included quantities
    - Overage calculations with partial periods
    """

    def __init__(self) -> None:
        pass

    def calculate_proration(
        self,
        license_key: str,
        period_start: date,
        period_end: date,
        change_date: date,
        original_plan: str,
        new_plan: str,
        original_base_fee: Decimal,
        new_base_fee: Decimal,
        original_included: Dict[str, Decimal],
        new_included: Dict[str, Decimal],
    ) -> ProrationResult:
        """
        Calculate prorated fees for mid-cycle plan change.

        Args:
            license_key: License key
            period_start: Billing period start date
            period_end: Billing period end date
            change_date: Date of plan change
            original_plan: Original plan tier
            new_plan: New plan tier
            original_base_fee: Original monthly base fee
            new_base_fee: New monthly base fee
            original_included: Original included quantities per event type
            new_included: New included quantities per event type

        Returns:
            ProrationResult with calculated charges
        """
        # Calculate days
        days_in_period = (period_end - period_start).days
        if days_in_period == 0:
            days_in_period = 1  # Prevent division by zero

        days_elapsed = (change_date - period_start).days
        days_remaining = (period_end - change_date).days

        # Ensure non-negative
        days_elapsed = max(0, days_elapsed)
        days_remaining = max(0, days_remaining)

        # Calculate prorated base fee
        # Days before change: original plan
        # Days after change: new plan
        original_portion = Decimal(days_elapsed) / Decimal(days_in_period)
        new_portion = Decimal(days_remaining) / Decimal(days_in_period)

        prorated_base_fee = (
            original_base_fee * original_portion +
            new_base_fee * new_portion
        )

        # Calculate prorated included quantities
        prorated_included = {}
        all_event_types = set(original_included.keys()) | set(new_included.keys())

        for event_type in all_event_types:
            orig_qty = original_included.get(event_type, Decimal(0))
            new_qty = new_included.get(event_type, Decimal(0))

            prorated_qty = (
                orig_qty * original_portion +
                new_qty * new_portion
            )
            prorated_included[event_type] = prorated_qty

        return ProrationResult(
            license_key=license_key,
            period_start=period_start,
            period_end=period_end,
            days_in_period=days_in_period,
            days_elapsed=days_elapsed,
            days_remaining=days_remaining,
            original_plan=original_plan,
            new_plan=new_plan,
            prorated_base_fee=round(prorated_base_fee, 2),
            prorated_included_quantity=prorated_included,
            overage_charges=Decimal(0),  # Calculated separately
            total_charge=round(prorated_base_fee, 2),
            breakdown={
                "original_portion": float(original_portion),
                "new_portion": float(new_portion),
                "original_base_portion": str(original_base_fee * original_portion),
                "new_base_portion": str(new_base_fee * new_portion),
            },
        )

    def calculate_overage(
        self,
        usage: Dict[str, Decimal],
        included_quantities: Dict[str, Decimal],
        rate_cards: Dict[str, Dict[str, Any]],
    ) -> tuple[Decimal, List[OverageCalculation]]:
        """
        Calculate overage charges for exceeded limits.

        Args:
            usage: Actual usage per event type
            included_quantities: Included quantities per event type
            rate_cards: Rate card info per event type
                        {event_type: {"unit_price": Decimal, "overage_rate": Decimal, "model_name": str}}

        Returns:
            Tuple of (total_overage_charge, list of OverageCalculation)
        """
        calculations: List[OverageCalculation] = []
        total_overage = Decimal(0)

        for event_type, used in usage.items():
            included = included_quantities.get(event_type, Decimal(0))

            if used <= included:
                # No overage
                continue

            overage_qty = used - included
            rate_info = rate_cards.get(event_type, {})

            unit_price = Decimal(str(rate_info.get("unit_price", 0)))
            overage_rate = Decimal(str(rate_info.get("overage_rate", unit_price)))
            model_name = rate_info.get("model_name")

            charge = overage_qty * overage_rate
            total_overage += charge

            calculations.append(OverageCalculation(
                event_type=event_type,
                model_name=model_name,
                total_usage=used,
                included_quantity=included,
                overage_quantity=overage_qty,
                unit_price=unit_price,
                overage_rate=overage_rate,
                charge=round(charge, 4),
                metadata={
                    "overage_percentage": float((overage_qty / used * 100) if used > 0 else 0),
                },
            ))

        return total_overage, calculations

    def calculate_partial_day_overage(
        self,
        usage: Dict[str, Decimal],
        included_monthly: Dict[str, Decimal],
        days_in_period: int,
        days_remaining: int,
        rate_cards: Dict[str, Dict[str, Any]],
    ) -> tuple[Decimal, List[OverageCalculation]]:
        """
        Calculate overage with prorated remaining allowance.

        This handles the case where a customer has used some portion
        of their monthly allowance, and we need to calculate overage
        based on what they should have remaining.

        Args:
            usage: Usage to date
            included_monthly: Full monthly included quantities
            days_in_period: Total days in billing period
            days_remaining: Days remaining in period
            rate_cards: Rate card information

        Returns:
            Tuple of (total_overage, calculations)
        """
        # Calculate daily allowance
        daily_allowance = {}
        for event_type, monthly_qty in included_monthly.items():
            daily_allowance[event_type] = monthly_qty / Decimal(days_in_period)

        # Calculate prorated remaining allowance
        prorated_remaining = {}
        for event_type, daily in daily_allowance.items():
            prorated_remaining[event_type] = daily * Decimal(days_remaining)

        # Calculate effective allowance already "consumed" by time
        # If 10 days into 30-day period, customer has "used" 10/30 of allowance
        days_elapsed = days_in_period - days_remaining
        effective_allowance = {}
        for event_type, monthly in included_monthly.items():
            effective_allowance[event_type] = (
                monthly * Decimal(days_elapsed) / Decimal(days_in_period)
            )

        # Calculate overage based on effective allowance
        prorated_usage = {}
        for event_type, used in usage.items():
            # Prorate usage to match the effective period
            prorated_usage[event_type] = used

        return self.calculate_overage(
            usage=prorated_usage,
            included_quantities=effective_allowance,
            rate_cards=rate_cards,
        )

    def handle_plan_downgrade_credit(
        self,
        license_key: str,
        period_start: date,
        period_end: date,
        downgrade_date: date,
        original_fee: Decimal,
        new_fee: Decimal,
        already_charged: Decimal,
    ) -> tuple[Decimal, str]:
        """
        Calculate credit for mid-cycle plan downgrade.

        Args:
            license_key: License key
            period_start: Period start date
            period_end: Period end date
            downgrade_date: Date of downgrade
            original_fee: Original monthly fee
            new_fee: New (lower) monthly fee
            already_charged: Amount already charged to customer

        Returns:
            Tuple of (credit_amount, reason)
        """
        days_in_period = (period_end - period_start).days
        if days_in_period == 0:
            days_in_period = 1

        days_remaining = (period_end - downgrade_date).days
        days_remaining = max(0, days_remaining)

        # Calculate unused portion of original plan
        unused_portion = Decimal(days_remaining) / Decimal(days_in_period)
        unused_original = original_fee * unused_portion

        # Calculate cost of new plan for remaining days
        new_portion = new_fee * unused_portion

        # Credit = unused original - new plan cost
        credit = unused_original - new_portion

        if credit < 0:
            credit = Decimal(0)
            reason = "No credit due (new plan exceeds unused original)"
        else:
            reason = f"Credit for {days_remaining} days remaining at {new_fee - original_fee} difference"

        return round(credit, 2), reason


class OverageTracker:
    """
    Track and accumulate overage charges throughout a billing period.
    """

    def __init__(self) -> None:
        self._overage_by_type: Dict[str, OverageCalculation] = {}
        self._total_overage = Decimal(0)

    def add_overage(self, calculation: OverageCalculation) -> None:
        """Add or update an overage calculation."""
        event_type = calculation.event_type
        if event_type in self._overage_by_type:
            # Update existing
            existing = self._overage_by_type[event_type]
            existing.overage_quantity += calculation.overage_quantity
            existing.total_usage = calculation.total_usage
            existing.charge += calculation.charge
        else:
            self._overage_by_type[event_type] = calculation

        self._total_overage += calculation.charge

    def get_total(self) -> Decimal:
        """Get total accumulated overage."""
        return self._total_overage

    def get_breakdown(self) -> List[Dict[str, Any]]:
        """Get breakdown of overage by type."""
        return [calc.to_dict() for calc in self._overage_by_type.values()]

    def reset(self) -> None:
        """Reset all tracking."""
        self._overage_by_type.clear()
        self._total_overage = Decimal(0)


# Module-level singleton
_calculator: Optional[ProrationCalculator] = None


def get_calculator() -> ProrationCalculator:
    """Get or create the proration calculator singleton."""
    global _calculator
    if _calculator is None:
        _calculator = ProrationCalculator()
    return _calculator


def reset_calculator() -> None:
    """Reset singleton (for testing)."""
    global _calculator
    _calculator = None


__all__ = [
    "ProrationResult",
    "OverageCalculation",
    "ProrationCalculator",
    "OverageTracker",
    "get_calculator",
    "reset_calculator",
]
