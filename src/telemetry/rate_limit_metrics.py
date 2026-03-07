"""
Rate Limit Metrics Emitter — ROIaaS Phase 6

Emits rate limit events to telemetry pipeline for dashboard integration.
Persists events to rate_limit_events table and provides query methods.
"""

import logging
import json
from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Dict, Any, Optional

from src.db.database import DatabaseConnection

logger = logging.getLogger("mekong.rate_limits.metrics")


@dataclass
class RateLimitEvent:
    """Rate limit event data structure."""
    tenant_id: str
    tier: str
    endpoint: str
    preset: str
    event_type: str  # 'override_applied', 'request_allowed', 'rate_limited'

    # Quota information
    quota_limit: Optional[int] = None
    quota_remaining: Optional[int] = None
    quota_utilization_pct: Optional[float] = None

    # Request details
    client_ip: Optional[str] = None
    method: Optional[str] = None
    path: Optional[str] = None
    user_agent: Optional[str] = None

    # Response details
    response_status: Optional[int] = None
    retry_after: Optional[int] = None

    # Metadata
    metadata: Optional[Dict[str, Any]] = None
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


class RateLimitMetricsEmitter:
    """
    Emits and queries rate limit metrics.

    Features:
    - Persist events to rate_limit_events table
    - Query throttle counts per tenant
    - Calculate quota utilization
    - Aggregate metrics by tier/tenant/time
    """

    def __init__(self, db: Optional[DatabaseConnection] = None) -> None:
        """Initialize emitter with database connection."""
        self._db = db or DatabaseConnection()
        self._batch_buffer: List[RateLimitEvent] = []
        self._batch_size: int = 100  # Flush after N events

    async def emit_event(self, event: RateLimitEvent) -> bool:
        """
        Emit a single rate limit event.

        Args:
            event: RateLimitEvent to persist

        Returns:
            True if successfully emitted, False otherwise
        """
        try:
            await self._persist_event(event)
            logger.debug(f"Emitted rate limit event: {event.event_type} for tenant {event.tenant_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to emit rate limit event: {e}")
            return False

    async def emit_batch(self, events: List[RateLimitEvent]) -> int:
        """
        Emit batch of events.

        Args:
            events: List of RateLimitEvent objects

        Returns:
            Number of successfully emitted events
        """
        success_count = 0
        for event in events:
            if await self.emit_event(event):
                success_count += 1

        logger.info(f"Emitted {success_count}/{len(events)} rate limit events")
        return success_count

    async def _persist_event(self, event: RateLimitEvent) -> str:
        """Persist event to database."""
        query = """
            INSERT INTO rate_limit_events (
                tenant_id, tier, endpoint, preset, event_type,
                quota_limit, quota_remaining, quota_utilization_pct,
                client_ip, method, path, user_agent,
                response_status, retry_after, metadata, created_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
            )
            RETURNING id
        """

        params = (
            event.tenant_id,
            event.tier,
            event.endpoint,
            event.preset,
            event.event_type,
            event.quota_limit,
            event.quota_remaining,
            event.quota_utilization_pct,
            event.client_ip,
            event.method,
            event.path,
            event.user_agent,
            event.response_status,
            event.retry_after,
            json.dumps(event.metadata) if event.metadata else None,
            event.created_at,
        )

        result = await self._db.execute(query, params)
        return result

    async def get_throttle_count(self, tenant_id: str, hours: int = 24) -> int:
        """
        Get count of rate limit violations (429s) for tenant in time window.

        Args:
            tenant_id: Tenant identifier
            hours: Time window in hours (default: 24)

        Returns:
            Count of rate_limited events
        """
        query = """
            SELECT COUNT(*) as count
            FROM rate_limit_events
            WHERE tenant_id = $1
              AND event_type = 'rate_limited'
              AND created_at > NOW() - INTERVAL '%s hours'
        """ % hours

        result = await self._db.fetch_one(query, (tenant_id,))
        return int(result.get('count', 0)) if result else 0

    async def get_quota_utilization(self, tenant_id: str, hours: int = 24) -> Dict[str, Any]:
        """
        Get quota utilization stats for tenant.

        Args:
            tenant_id: Tenant identifier
            hours: Time window in hours

        Returns:
            Dict with avg/max utilization percentages
        """
        query = """
            SELECT
                AVG(quota_utilization_pct) as avg_utilization,
                MAX(quota_utilization_pct) as max_utilization,
                COUNT(*) as total_requests
            FROM rate_limit_events
            WHERE tenant_id = $1
              AND created_at > NOW() - INTERVAL '%s hours'
        """ % hours

        result = await self._db.fetch_one(query, (tenant_id,))
        if not result:
            return {"avg_utilization": 0, "max_utilization": 0, "total_requests": 0}

        return {
            "avg_utilization": float(result.get('avg_utilization', 0) or 0),
            "max_utilization": float(result.get('max_utilization', 0) or 0),
            "total_requests": int(result.get('total_requests', 0)),
        }

    async def get_events_by_tier(self, hours: int = 24) -> List[Dict[str, Any]]:
        """
        Get rate limit events aggregated by tier.

        Args:
            hours: Time window in hours

        Returns:
            List of dicts with tier, event_type, count
        """
        query = """
            SELECT
                tier,
                event_type,
                COUNT(*) as count
            FROM rate_limit_events
            WHERE created_at > NOW() - INTERVAL '%s hours'
            GROUP BY tier, event_type
            ORDER BY tier, count DESC
        """ % hours

        results = await self._db.fetch_all(query)
        return [dict(row) for row in results]

    async def get_top_violated_tenants(self, limit: int = 10, hours: int = 24) -> List[Dict[str, Any]]:
        """
        Get tenants with most rate limit violations.

        Args:
            limit: Max tenants to return
            hours: Time window in hours

        Returns:
            List of dicts with tenant_id, tier, violation_count
        """
        query = """
            SELECT
                tenant_id,
                tier,
                COUNT(*) as violation_count
            FROM rate_limit_events
            WHERE event_type = 'rate_limited'
              AND created_at > NOW() - INTERVAL '%s hours'
            GROUP BY tenant_id, tier
            ORDER BY violation_count DESC
            LIMIT %s
        """ % (hours, limit)

        results = await self._db.fetch_all(query)
        return [dict(row) for row in results]

    async def get_recent_events(
        self,
        tenant_id: Optional[str] = None,
        event_type: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Get recent rate limit events with optional filters.

        Args:
            tenant_id: Filter by tenant (optional)
            event_type: Filter by event type (optional)
            limit: Max events to return

        Returns:
            List of event records
        """
        conditions = ["created_at > NOW() - INTERVAL '24 hours'"]
        params: List[Any] = []
        param_count = 1

        if tenant_id:
            conditions.append(f"tenant_id = ${param_count}")
            params.append(tenant_id)
            param_count += 1

        if event_type:
            conditions.append(f"event_type = ${param_count}")
            params.append(event_type)
            param_count += 1

        query = f"""
            SELECT
                id, tenant_id, tier, endpoint, preset, event_type,
                quota_limit, quota_remaining, quota_utilization_pct,
                response_status, retry_after, created_at
            FROM rate_limit_events
            WHERE {' AND '.join(conditions)}
            ORDER BY created_at DESC
            LIMIT ${param_count}
        """
        params.append(limit)

        results = await self._db.fetch_all(query, tuple(params))
        return [dict(row) for row in results]

    async def get_violations_summary(self, hours: int = 24) -> Dict[str, Any]:
        """
        Get summary of rate limit violations.

        Args:
            hours: Time window in hours

        Returns:
            Dict with total violations, by_tenant breakdown, top_endpoints
        """
        # Total violations
        total_query = """
            SELECT COUNT(*) as total
            FROM rate_limit_events
            WHERE event_type = 'rate_limited'
              AND created_at > NOW() - INTERVAL '%s hours'
        """ % hours
        total_result = await self._db.fetch_one(total_query)
        total = int(total_result.get('total', 0)) if total_result else 0

        # By tenant
        by_tenant_query = """
            SELECT tenant_id, COUNT(*) as count
            FROM rate_limit_events
            WHERE event_type = 'rate_limited'
              AND created_at > NOW() - INTERVAL '%s hours'
            GROUP BY tenant_id
            ORDER BY count DESC
        """ % hours
        by_tenant = await self._db.fetch_all(by_tenant_query)

        # Top endpoints
        top_endpoints_query = """
            SELECT endpoint, COUNT(*) as count
            FROM rate_limit_events
            WHERE event_type = 'rate_limited'
              AND created_at > NOW() - INTERVAL '%s hours'
            GROUP BY endpoint
            ORDER BY count DESC
            LIMIT 10
        """ % hours
        top_endpoints = await self._db.fetch_all(top_endpoints_query)

        return {
            "total": total,
            "by_tenant": [dict(row) for row in by_tenant],
            "top_endpoints": [dict(row) for row in top_endpoints],
        }


# Integration with TelemetryCollector
class TelemetryIntegration:
    """
    Integrates rate limit metrics with core telemetry system.

    Wraps RateLimitMetricsEmitter to provide TelemetryCollector-compatible interface.
    """

    def __init__(self, emitter: Optional[RateLimitMetricsEmitter] = None) -> None:
        """Initialize integration."""
        self._emitter = emitter or RateLimitMetricsEmitter()

    async def record_rate_limit_event(
        self,
        tenant_id: str,
        tier: str,
        event_type: str,
        endpoint: str = "",
        preset: str = "api_default",
        **kwargs: Any
    ) -> bool:
        """
        Record rate limit event via emitter.

        Args:
            tenant_id: Tenant identifier
            tier: License tier
            event_type: Event type
            endpoint: Endpoint path
            preset: Rate limit preset
            **kwargs: Additional event fields

        Returns:
            True if recorded successfully
        """
        event = RateLimitEvent(
            tenant_id=tenant_id,
            tier=tier,
            endpoint=endpoint,
            preset=preset,
            event_type=event_type,
            **kwargs
        )
        return await self._emitter.emit_event(event)


__all__ = [
    "RateLimitEvent",
    "RateLimitMetricsEmitter",
    "TelemetryIntegration",
]
