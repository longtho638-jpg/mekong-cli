from typing import List, Dict, Any, Optional
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.expression import text

from app.models.subscriber import Subscriber, SubscriberStatus

class SegmentationService:
    """
    Service to filter subscribers based on segmentation rules.
    Rules are expected to be a JSON structure (list of conditions).
    """

    async def get_segment_query(self, rules: List[Dict[str, Any]]):
        """
        Constructs a SQLAlchemy query based on rules.
        Example rule:
        [
            {"field": "status", "operator": "eq", "value": "active"},
            {"field": "attributes.location", "operator": "eq", "value": "US"},
            {"field": "attributes.ltv", "operator": "gte", "value": 100}
        ]
        """
        # Start with base query
        query = select(Subscriber)

        if not rules:
            return query.where(Subscriber.status == SubscriberStatus.ACTIVE)

        conditions = []
        for rule in rules:
            field = rule.get("field")
            operator = rule.get("operator")
            value = rule.get("value")

            if not field or not operator:
                continue

            # Handle standard fields
            if field == "status":
                if operator == "eq":
                    conditions.append(Subscriber.status == value)
                elif operator == "neq":
                    conditions.append(Subscriber.status != value)

            # Handle attributes (JSONB)
            elif field.startswith("attributes."):
                attr_key = field.split("attributes.")[1]

                # PostgreSQL JSONB operators
                # We assume attributes is a JSONB column or compatible
                if operator == "eq":
                    conditions.append(Subscriber.attributes[attr_key].astext == str(value))
                elif operator == "neq":
                    conditions.append(Subscriber.attributes[attr_key].astext != str(value))
                elif operator == "contains":
                    conditions.append(Subscriber.attributes[attr_key].astext.contains(str(value)))
                # Add numeric comparisons if needed by casting, e.g. .cast(Integer)

        if conditions:
            query = query.where(and_(*conditions))
        else:
            # If rules provided but none valid, default to active only?
            # Or return nothing? Let's return active only for safety.
            query = query.where(Subscriber.status == SubscriberStatus.ACTIVE)

        return query

    async def get_subscribers_count(self, db: AsyncSession, rules: List[Dict[str, Any]]) -> int:
        query = await self.get_segment_query(rules)
        # Wrap in subquery for count
        from sqlalchemy import func
        count_query = select(func.count()).select_from(query.subquery())
        result = await db.execute(count_query)
        return result.scalar_one()

    async def get_subscribers(self, db: AsyncSession, rules: List[Dict[str, Any]], limit: int = 1000, offset: int = 0) -> List[Subscriber]:
        query = await self.get_segment_query(rules)
        query = query.limit(limit).offset(offset)
        result = await db.execute(query)
        return result.scalars().all()

segmentation_service = SegmentationService()
