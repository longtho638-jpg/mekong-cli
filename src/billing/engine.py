"""
Mekong CLI - Billing Engine

Core billing calculation engine for API usage metering.
Calculates charges based on actual consumption with rate card application.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional

from src.db.repository import get_repository, LicenseRepository
from src.core.usage_metering import UsageEvent

logger = logging.getLogger(__name__)


@dataclass
class RateCard:
    """Rate card definition for pricing."""

    plan_tier: str
    event_type: str
    model_name: Optional[str]
    unit: str
    unit_price: Decimal
    included_quantity: Decimal
    overage_rate: Optional[Decimal]
    overage_threshold: Optional[Decimal]
    metadata: Dict[str, Any] = field(default_factory=dict)

    def calculate_charge(
        self,
        quantity: Decimal,
        included_remaining: Optional[Decimal] = None,
    ) -> tuple[Decimal, Decimal]:
        """
        Calculate charge for a given quantity.

        Args:
            quantity: Usage quantity
            included_remaining: Remaining included quantity (if None, use full included_quantity)

        Returns:
            Tuple of (charge_amount, overage_amount)
        """
        if included_remaining is None:
            included_remaining = self.included_quantity

        # If quantity within included amount, no charge
        if quantity <= included_remaining:
            return Decimal(0), Decimal(0)

        # Calculate overage
        overage = quantity - included_remaining

        # Apply overage rate if configured, otherwise unit_price
        rate = self.overage_rate if self.overage_rate is not None else self.unit_price

        charge = overage * rate
        return charge, overage


@dataclass
class LineItem:
    """Billing line item."""

    event_type: str
    model_name: Optional[str]
    quantity: Decimal
    unit: str
    unit_price: Decimal
    subtotal: Decimal
    discount: Decimal = Decimal(0)
    final_amount: Decimal = Decimal(0)
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    metadata: Dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if self.final_amount == Decimal(0):
            self.final_amount = self.subtotal - self.discount

    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary."""
        return {
            "event_type": self.event_type,
            "model_name": self.model_name,
            "quantity": str(self.quantity),
            "unit": self.unit,
            "unit_price": str(self.unit_price),
            "subtotal": str(self.subtotal),
            "discount": str(self.discount),
            "final_amount": str(self.final_amount),
            "timestamp": self.timestamp.isoformat(),
            "metadata": self.metadata,
        }


@dataclass
class BillingResult:
    """Result of billing calculation."""

    license_key: str
    key_id: str
    period_start: datetime
    period_end: datetime
    line_items: List[LineItem] = field(default_factory=list)
    subtotal: Decimal = Decimal(0)
    discount: Decimal = Decimal(0)
    total: Decimal = Decimal(0)
    currency: str = "USD"
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary."""
        return {
            "license_key": self.license_key,
            "key_id": self.key_id,
            "period_start": self.period_start.isoformat(),
            "period_end": self.period_end.isoformat(),
            "line_items": [item.to_dict() for item in self.line_items],
            "subtotal": str(self.subtotal),
            "discount": str(self.discount),
            "total": str(self.total),
            "currency": self.currency,
            "metadata": self.metadata,
        }


class RateCardResolver:
    """Resolve rate cards for license key and event type."""

    def __init__(self, repository: Optional[LicenseRepository] = None) -> None:
        self._repo = repository or get_repository()
        self._cache: Dict[str, RateCard] = {}

    async def resolve(
        self,
        license_key: str,
        event_type: str,
        model_name: Optional[str] = None,
    ) -> Optional[RateCard]:
        """
        Resolve rate card for license key and event type.

        Args:
            license_key: License key
            event_type: Event type (api_call, token_input, etc.)
            model_name: Optional model name for model-specific rates

        Returns:
            RateCard or None if not found
        """
        # Get license tier
        license_info = await self._repo.get_license_by_key(license_key)
        if not license_info:
            logger.warning(f"License not found: {license_key}")
            return None

        plan_tier = license_info.get("tier", "free")

        # Check cache
        cache_key = f"{plan_tier}:{event_type}:{model_name or '*'}"
        if cache_key in self._cache:
            return self._cache[cache_key]

        # Query rate card from database
        rate_card_data = await self._repo.get_rate_card(
            plan_tier=plan_tier,
            event_type=event_type,
            model_name=model_name,
        )

        if not rate_card_data:
            # Fallback to plan-wide rate (model_name=NULL)
            rate_card_data = await self._repo.get_rate_card(
                plan_tier=plan_tier,
                event_type=event_type,
                model_name=None,
            )

        if not rate_card_data:
            logger.warning(f"No rate card found for {cache_key}")
            return None

        rate_card = RateCard(
            plan_tier=rate_card_data["plan_tier"],
            event_type=rate_card_data["event_type"],
            model_name=rate_card_data.get("model_name"),
            unit=rate_card_data["unit"],
            unit_price=Decimal(str(rate_card_data["unit_price"])),
            included_quantity=Decimal(str(rate_card_data.get("included_quantity", 0))),
            overage_rate=(
                Decimal(str(rate_card_data["overage_rate"]))
                if rate_card_data.get("overage_rate")
                else None
            ),
            overage_threshold=(
                Decimal(str(rate_card_data["overage_threshold"]))
                if rate_card_data.get("overage_threshold")
                else None
            ),
            metadata=rate_card_data.get("metadata", {}),
        )

        self._cache[cache_key] = rate_card
        return rate_card

    def clear_cache(self) -> None:
        """Clear rate card cache."""
        self._cache.clear()


class BillingEngine:
    """
    Core billing calculation engine.

    Aggregates usage events and calculates charges based on rate cards.
    """

    def __init__(
        self,
        repository: Optional[LicenseRepository] = None,
        rate_resolver: Optional[RateCardResolver] = None,
    ) -> None:
        self._repo = repository or get_repository()
        self._rate_resolver = rate_resolver or RateCardResolver(self._repo)

    async def calculate_charges(
        self,
        license_key: str,
        usage_events: List[UsageEvent],
        period_start: Optional[datetime] = None,
        period_end: Optional[datetime] = None,
    ) -> BillingResult:
        """
        Calculate charges for a list of usage events.

        Args:
            license_key: License key
            usage_events: List of usage events to bill
            period_start: Billing period start (for included quantity calculation)
            period_end: Billing period end

        Returns:
            BillingResult with line items and totals
        """
        if not usage_events:
            return BillingResult(
                license_key=license_key,
                key_id="",
                period_start=period_start or datetime.now(timezone.utc),
                period_end=period_end or datetime.now(timezone.utc),
            )

        # Get key_id from first event
        key_id = usage_events[0].metadata.get("key_id", "")

        # Aggregate events by type and model
        aggregated = self._aggregate_events(usage_events)

        # Calculate line items
        line_items: List[LineItem] = []
        total = Decimal(0)

        # Track included quantity usage per rate card
        included_used: Dict[str, Decimal] = {}

        for (event_type, model_name), events in aggregated.items():
            # Resolve rate card
            rate_card = await self._rate_resolver.resolve(
                license_key=license_key,
                event_type=event_type,
                model_name=model_name,
            )

            if not rate_card:
                logger.warning(
                    f"No rate card for {event_type}/{model_name}, skipping"
                )
                continue

            # Calculate total quantity for this event type
            total_quantity = sum(
                Decimal(str(e.value)) for e in events
            )

            # Get remaining included quantity
            cache_key = f"{rate_card.plan_tier}:{event_type}:{model_name or '*'}"
            remaining_included = (
                rate_card.included_quantity - included_used.get(cache_key, Decimal(0))
            )

            # Calculate charge
            charge, overage = rate_card.calculate_charge(
                quantity=total_quantity,
                included_remaining=remaining_included,
            )

            # Update included usage tracking
            included_used[cache_key] = (
                included_used.get(cache_key, Decimal(0))
                + min(total_quantity, remaining_included)
            )

            # Create line item
            line_item = LineItem(
                event_type=event_type,
                model_name=model_name,
                quantity=total_quantity,
                unit=rate_card.unit,
                unit_price=rate_card.unit_price,
                subtotal=charge,
                final_amount=charge,
                metadata={
                    "event_count": len(events),
                    "overage_quantity": str(overage),
                    "included_used": str(included_used[cache_key]),
                },
            )

            line_items.append(line_item)
            total += charge

        # Get period dates
        if period_start is None:
            period_start = min(e.timestamp for e in usage_events)
        if period_end is None:
            period_end = max(e.timestamp for e in usage_events)

        return BillingResult(
            license_key=license_key,
            key_id=key_id,
            period_start=period_start,
            period_end=period_end,
            line_items=line_items,
            total=total,
        )

    def _aggregate_events(
        self,
        events: List[UsageEvent],
    ) -> Dict[tuple[str, Optional[str]], List[UsageEvent]]:
        """
        Aggregate events by event type and model name.

        Returns:
            Dict mapping (event_type, model_name) to list of events
        """
        aggregated: Dict[tuple[str, Optional[str]], List[UsageEvent]] = {}

        for event in events:
            event_type = event.event_type
            model_name = event.metadata.get("model")

            key = (event_type, model_name)
            if key not in aggregated:
                aggregated[key] = []
            aggregated[key].append(event)

        return aggregated

    async def calculate_period_charges(
        self,
        license_key: str,
        period_start: datetime,
        period_end: datetime,
    ) -> BillingResult:
        """
        Calculate charges for a billing period by querying usage from database.

        Args:
            license_key: License key
            period_start: Billing period start
            period_end: Billing period end

        Returns:
            BillingResult for the period
        """
        # Fetch usage events from database
        events = await self._repo.get_usage_events(
            license_key=license_key,
            start_date=period_start,
            end_date=period_end,
        )

        if not events:
            return BillingResult(
                license_key=license_key,
                key_id="",
                period_start=period_start,
                period_end=period_end,
            )

        # Convert to UsageEvent objects
        usage_events = [
            UsageEvent(
                event_type=e["event_type"],
                category=e.get("category", "usage"),
                metric=e["metric"],
                value=e["value"],
                timestamp=e["timestamp"].timestamp() if isinstance(e["timestamp"], datetime) else e["timestamp"],
                metadata=e.get("metadata", {}),
            )
            for e in events
        ]

        return await self.calculate_charges(
            license_key=license_key,
            usage_events=usage_events,
            period_start=period_start,
            period_end=period_end,
        )


# Module-level singleton
_engine: Optional[BillingEngine] = None
_resolver: Optional[RateCardResolver] = None


def get_engine() -> BillingEngine:
    """Get or create the billing engine singleton."""
    global _engine
    if _engine is None:
        _engine = BillingEngine()
    return _engine


def get_rate_resolver() -> RateCardResolver:
    """Get or create the rate card resolver singleton."""
    global _resolver
    if _resolver is None:
        _resolver = RateCardResolver()
    return _resolver


def reset_engine() -> None:
    """Reset singletons (for testing)."""
    global _engine, _resolver
    _engine = None
    _resolver = None


__all__ = [
    "RateCard",
    "LineItem",
    "BillingResult",
    "RateCardResolver",
    "BillingEngine",
    "get_engine",
    "get_rate_resolver",
    "reset_engine",
]
