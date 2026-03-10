"""
RaaS Sync Client - Usage Metrics Synchronization

Synchronizes local usage metrics with RaaS Gateway billing system.
Features:
- License validation
- Rate limit enforcement
- Hourly bucket aggregation
- Circuit breaker failover

Usage:
    from src.raas.sync_client import SyncClient

    client = SyncClient()
    result = client.sync_metrics()
"""

from __future__ import annotations

import json
import os
import time
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Optional

from src.core.gateway_client import GatewayClient, GatewayError
from src.core.telemetry_reporter import TelemetryReporter
from src.lib.raas_gate_validator import RaasGateValidator

# Phase 5: Encryption and webhook integration
from .usage_event_schema import (
    SyncRequest,
    UsageSummary as SchemaUsageSummary,
)
from .payload_encryptor import PayloadEncryptor, get_encryptor
from .webhook_bridge import WebhookBridge, get_bridge, BillingProvider


@dataclass
class SyncResult:
    """Result of metrics synchronization."""

    success: bool
    synced_count: int
    total_payload_size: int
    rate_limit_remaining: Optional[int] = None
    rate_limit_reset_in: Optional[int] = None
    error: Optional[str] = None
    gateway_response: Optional[dict] = None
    elapsed_ms: float = 0.0


@dataclass
class UsageSummary:
    """Summary of local usage metrics."""

    total_requests: int = 0
    total_payload_size: int = 0
    hours_active: int = 0
    peak_hour: Optional[str] = None
    peak_requests: int = 0
    endpoints: dict[str, int] = field(default_factory=dict)
    methods: dict[str, int] = field(default_factory=dict)


class SyncClient:
    """
    RaaS Sync Client for usage metrics synchronization.

    Syncs local telemetry with RaaS Gateway billing system.
    Handles rate limiting, license validation, and circuit breaker failover.
    """

    def __init__(
        self,
        gateway_client: Optional[GatewayClient] = None,
        telemetry: Optional[TelemetryReporter] = None,
        encryptor: Optional[PayloadEncryptor] = None,
        webhook_bridge: Optional[WebhookBridge] = None,
    ):
        """
        Initialize Sync Client.

        Args:
            gateway_client: Optional GatewayClient instance
            telemetry: Optional TelemetryReporter instance
            encryptor: Optional PayloadEncryptor instance (Phase 5)
            webhook_bridge: Optional WebhookBridge instance (Phase 5)
        """
        self.gateway = gateway_client or GatewayClient()
        self.telemetry = telemetry or TelemetryReporter()
        self.validator = RaasGateValidator()
        self.encryptor = encryptor or get_encryptor()
        self.webhook_bridge = webhook_bridge or get_bridge()
        self._license_valid: Optional[bool] = None
        self._tenant_id: Optional[str] = None

    def validate_license(self) -> tuple[bool, Optional[str]]:
        """
        Validate RAAS_LICENSE_KEY.

        Returns:
            Tuple of (is_valid, error_message)
        """
        is_valid, error = self.validator.validate()
        self._license_valid = is_valid
        return is_valid, error

    def get_usage_summary(self) -> UsageSummary:
        """
        Get summary of local usage metrics.

        Returns:
            UsageSummary with aggregated metrics
        """
        summary = UsageSummary()

        try:
            # Get telemetry data
            metrics = self.telemetry.get_metrics()

            if not metrics:
                return summary

            # Aggregate totals
            endpoint_counts: dict[str, int] = {}
            method_counts: dict[str, int] = {}
            hour_buckets: dict[str, int] = {}
            total_payload = 0

            for metric in metrics:
                # Count by endpoint
                endpoint = metric.get("endpoint", "unknown")
                endpoint_counts[endpoint] = endpoint_counts.get(endpoint, 0) + 1

                # Count by method
                method = metric.get("method", "unknown")
                method_counts[method] = method_counts.get(method, 0) + 1

                # Track payload size
                payload = metric.get("payload_size", 0)
                total_payload += payload

                # Track hourly buckets
                timestamp = metric.get("timestamp", "")
                if timestamp:
                    try:
                        dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
                        hour_bucket = dt.strftime("%Y-%m-%d-%H")
                        hour_buckets[hour_bucket] = hour_buckets.get(hour_bucket, 0) + 1
                    except (ValueError, AttributeError):
                        pass

                summary.total_requests += 1
                summary.total_payload_size += payload

            # Find peak hour
            if hour_buckets:
                peak_hour = max(hour_buckets.keys(), key=lambda h: hour_buckets[h])
                summary.peak_hour = peak_hour
                summary.peak_requests = hour_buckets[peak_hour]
                summary.hours_active = len(hour_buckets)

            summary.endpoints = endpoint_counts
            summary.methods = method_counts

        except Exception as e:
            # Return empty summary on error
            import logging
            logging.debug(f"Usage summary error: {e}")

        return summary

    def _build_hourly_buckets(self) -> list[dict[str, Any]]:
        """
        Build hourly bucket metrics for RaaS Gateway.

        Returns:
            List of hourly bucket metrics
        """
        metrics = self.telemetry.get_metrics()
        if not metrics:
            return []

        # Aggregate by hour bucket
        buckets: dict[str, dict[str, Any]] = {}

        for metric in metrics:
            timestamp = metric.get("timestamp", "")
            if not timestamp:
                continue

            try:
                dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
                hour_bucket = dt.strftime("%Y-%m-%d-%H")

                if hour_bucket not in buckets:
                    buckets[hour_bucket] = {
                        "hour_bucket": hour_bucket,
                        "request_count": 0,
                        "payload_size": 0,
                        "endpoints": {},
                        "methods": {},
                    }

                bucket = buckets[hour_bucket]
                bucket["request_count"] += 1
                bucket["payload_size"] += metric.get("payload_size", 0)

                # Track endpoint breakdown
                endpoint = metric.get("endpoint", "unknown")
                bucket["endpoints"][endpoint] = (
                    bucket["endpoints"].get(endpoint, 0) + 1
                )

                # Track method breakdown
                method = metric.get("method", "unknown")
                bucket["methods"][method] = bucket["methods"].get(method, 0) + 1

            except (ValueError, AttributeError):
                continue

        # Sort by hour bucket and convert to list
        sorted_buckets = sorted(buckets.values(), key=lambda b: b["hour_bucket"])
        return sorted_buckets

    def sync_metrics(
        self,
        license_key: Optional[str] = None,
        dry_run: bool = False,
    ) -> SyncResult:
        """
        Synchronize local usage metrics with RaaS Gateway.

        Args:
            license_key: Optional license key (defaults to env var)
            dry_run: If True, calculate but don't upload

        Returns:
            SyncResult with sync status
        """
        start_time = time.perf_counter()

        # Step 1: Validate license
        is_valid, error = self.validate_license()
        if not is_valid:
            return SyncResult(
                success=False,
                synced_count=0,
                total_payload_size=0,
                error=error,
                elapsed_ms=(time.perf_counter() - start_time) * 1000,
            )

        # Step 2: Get usage summary
        summary = self.get_usage_summary()

        if dry_run:
            return SyncResult(
                success=True,
                synced_count=summary.total_requests,
                total_payload_size=summary.total_payload_size,
                elapsed_ms=(time.perf_counter() - start_time) * 1000,
                gateway_response={"dry_run": True, "summary": summary.__dict__},
            )

        # Step 3: Build hourly buckets for sync
        hourly_buckets = self._build_hourly_buckets()

        if not hourly_buckets:
            return SyncResult(
                success=True,
                synced_count=0,
                total_payload_size=0,
                gateway_response={"message": "No metrics to sync"},
                elapsed_ms=(time.perf_counter() - start_time) * 1000,
            )

        # Step 4: Sync to RaaS Gateway
        try:
            response = self.gateway.post(
                "/v1/usage/sync",
                json={
                    "license_key": license_key or os.getenv("RAAS_LICENSE_KEY"),
                    "metrics": hourly_buckets,
                    "summary": {
                        "total_requests": summary.total_requests,
                        "total_payload_size": summary.total_payload_size,
                        "hours_active": summary.hours_active,
                    },
                },
            )

            return SyncResult(
                success=True,
                synced_count=summary.total_requests,
                total_payload_size=summary.total_payload_size,
                rate_limit_remaining=response.rate_limit_remaining,
                gateway_response=response.data,
                elapsed_ms=(time.perf_counter() - start_time) * 1000,
            )

        except GatewayError as e:
            # Handle rate limit
            if e.status_code == 429:
                return SyncResult(
                    success=False,
                    synced_count=0,
                    total_payload_size=0,
                    error="Rate limit exceeded. Please wait before syncing.",
                    rate_limit_reset_in=60,  # Default reset time
                    elapsed_ms=(time.perf_counter() - start_time) * 1000,
                )

            return SyncResult(
                success=False,
                synced_count=0,
                total_payload_size=0,
                error=str(e),
                elapsed_ms=(time.perf_counter() - start_time) * 1000,
            )

        except Exception as e:
            return SyncResult(
                success=False,
                synced_count=0,
                total_payload_size=0,
                error=f"Sync failed: {str(e)}",
                elapsed_ms=(time.perf_counter() - start_time) * 1000,
            )

    def get_sync_status(self) -> dict[str, Any]:
        """
        Get current sync status without uploading.

        Returns:
            Dict with sync status info
        """
        # Check license
        is_valid, error = self.validate_license()

        # Get usage summary
        summary = self.get_usage_summary()

        # Get circuit breaker status
        circuit_status = self.gateway.get_circuit_status()

        return {
            "license_valid": is_valid,
            "license_error": error,
            "metrics_count": summary.total_requests,
            "total_payload_size": summary.total_payload_size,
            "hours_active": summary.hours_active,
            "peak_hour": summary.peak_hour,
            "peak_requests": summary.peak_requests,
            "endpoints": summary.endpoints,
            "methods": summary.methods,
            "circuit_breakers": circuit_status,
        }

    # =====================================================================
    # Phase 5: Enhanced Features (Encryption, Entitlements, Webhooks)
    # =====================================================================

    def fetch_entitlements(self, license_key: Optional[str] = None) -> dict[str, Any]:
        """
        Fetch license entitlements from RaaS Gateway.

        Args:
            license_key: Optional license key (defaults to env var)

        Returns:
            Dict with entitlement info:
            - tenant_id: Tenant identifier
            - tier: License tier (free/pro/enterprise)
            - features: List of enabled features
            - rate_limit: Requests per minute
            - max_payload_size: Max payload bytes
            - retention_days: Data retention period
            - expires_at: License expiry timestamp
        """
        try:
            response = self.gateway.get(
                "/v1/license/entitlements",
                headers={
                    "Authorization": f"Bearer {license_key or os.getenv('RAAS_LICENSE_KEY', '')}"
                },
            )
            return {
                "tenant_id": response.data.get("tenant_id"),
                "tier": response.data.get("tier"),
                "features": response.data.get("features", []),
                "rate_limit": response.data.get("rateLimit", 60),
                "max_payload_size": response.data.get("maxPayloadSize", 1048576),
                "retention_days": response.data.get("retentionDays", 30),
                "expires_at": response.data.get("expiresAt"),
            }
        except GatewayError as e:
            return {
                "error": str(e),
                "tenant_id": None,
                "tier": "free",
                "features": [],
            }
        except Exception as e:
            return {
                "error": f"Failed to fetch entitlements: {str(e)}",
                "tenant_id": None,
                "tier": "free",
                "features": [],
            }

    def _get_tenant_id(self) -> Optional[str]:
        """
        Get tenant ID from validated license.

        Returns:
            Tenant ID or None if not validated
        """
        if self._tenant_id:
            return self._tenant_id

        # Try to get from validator
        result = self.validator.get_last_result()
        if result:
            self._tenant_id = result.get("tenant_id")
        return self._tenant_id

    def _build_encrypted_payload(
        self,
        events: list[dict[str, Any]],
        license_key: str,
        tenant_id: str,
        summary: SchemaUsageSummary,
    ) -> SyncRequest:
        """
        Build encrypted sync request payload.

        Args:
            events: List of usage event dictionaries
            license_key: License key for auth
            tenant_id: Tenant identifier
            summary: Usage summary

        Returns:
            SyncRequest with encrypted payload
        """
        return self.encryptor.encrypt_sync_request(
            events=events,
            license_key=license_key,
            tenant_id=tenant_id,
            summary=summary,
        )

    def sync_metrics_encrypted(
        self,
        license_key: Optional[str] = None,
        dry_run: bool = False,
        push_to_billing: bool = True,
    ) -> SyncResult:
        """
        Synchronize usage metrics with encrypted payload.

        Phase 5: Uses AES-256-GCM encryption for payload security.

        Args:
            license_key: Optional license key (defaults to env var)
            dry_run: If True, calculate but don't upload
            push_to_billing: If True, push to Stripe/Polar after sync

        Returns:
            SyncResult with sync status
        """
        start_time = time.perf_counter()
        license_key = license_key or os.getenv("RAAS_LICENSE_KEY", "")

        # Step 1: Validate license
        is_valid, error = self.validate_license()
        if not is_valid:
            return SyncResult(
                success=False,
                synced_count=0,
                total_payload_size=0,
                error=error,
                elapsed_ms=(time.perf_counter() - start_time) * 1000,
            )

        # Step 2: Get tenant ID
        tenant_id = self._get_tenant_id()
        if not tenant_id:
            return SyncResult(
                success=False,
                synced_count=0,
                total_payload_size=0,
                error="Cannot determine tenant ID from license",
                elapsed_ms=(time.perf_counter() - start_time) * 1000,
            )

        # Step 3: Get usage summary (Phase 5 schema)
        summary = self._get_phase5_summary()

        # Step 4: Build events list
        events = self._build_events_list()

        if dry_run:
            return SyncResult(
                success=True,
                synced_count=len(events),
                total_payload_size=len(json.dumps(events)),
                elapsed_ms=(time.perf_counter() - start_time) * 1000,
                gateway_response={"dry_run": True, "event_count": len(events)},
            )

        # Step 5: Build encrypted payload
        sync_request = self._build_encrypted_payload(
            events=events,
            license_key=license_key,
            tenant_id=tenant_id,
            summary=summary,
        )

        # Step 6: Sync to RaaS Gateway
        try:
            response = self.gateway.post(
                "/v1/usage/sync",
                json={
                    "license_key": license_key,
                    "tenant_id": tenant_id,
                    "encrypted_payload": sync_request.encrypted_payload.dict(),
                    "summary": summary.dict(),
                    "checksum": sync_request.checksum,
                    "synced_at": sync_request.synced_at.isoformat(),
                },
            )

            # Step 7: Push to billing providers (optional)
            if push_to_billing:
                self._push_to_billing_async(events, tenant_id)

            return SyncResult(
                success=True,
                synced_count=len(events),
                total_payload_size=len(json.dumps(events)),
                rate_limit_remaining=response.rate_limit_remaining,
                gateway_response=response.data,
                elapsed_ms=(time.perf_counter() - start_time) * 1000,
            )

        except GatewayError as e:
            if e.status_code == 429:
                return SyncResult(
                    success=False,
                    synced_count=0,
                    total_payload_size=0,
                    error="Rate limit exceeded",
                    rate_limit_reset_in=60,
                    elapsed_ms=(time.perf_counter() - start_time) * 1000,
                )
            return SyncResult(
                success=False,
                synced_count=0,
                total_payload_size=0,
                error=str(e),
                elapsed_ms=(time.perf_counter() - start_time) * 1000,
            )
        except Exception as e:
            return SyncResult(
                success=False,
                synced_count=0,
                total_payload_size=0,
                error=f"Sync failed: {str(e)}",
                elapsed_ms=(time.perf_counter() - start_time) * 1000,
            )

    def _get_phase5_summary(self) -> SchemaUsageSummary:
        """
        Get Phase 5 compatible usage summary.

        Returns:
            SchemaUsageSummary with Phase 5 fields
        """
        metrics = self.telemetry.get_metrics()

        if not metrics:
            return SchemaUsageSummary()

        # Calculate summary from metrics
        total_payload = sum(m.get("payload_size", 0) for m in metrics)
        timestamps = [m.get("timestamp", "") for m in metrics if m.get("timestamp")]

        first_request = None
        last_request = None
        if timestamps:
            try:
                first_request = datetime.fromisoformat(
                    min(timestamps).replace("Z", "+00:00")
                )
                last_request = datetime.fromisoformat(
                    max(timestamps).replace("Z", "+00:00")
                )
            except ValueError:
                pass

        # Find peak hour
        hour_buckets: dict[str, int] = {}
        for ts in timestamps:
            try:
                dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                hour = dt.strftime("%Y-%m-%d-%H")
                hour_buckets[hour] = hour_buckets.get(hour, 0) + 1
            except ValueError:
                pass

        peak_hour = max(hour_buckets.keys(), key=lambda h: hour_buckets[h]) if hour_buckets else None

        return SchemaUsageSummary(
            total_requests=len(metrics),
            total_payload_size=total_payload,
            hours_active=len(hour_buckets),
            peak_hour=peak_hour,
            peak_requests=hour_buckets.get(peak_hour, 0) if peak_hour else 0,
            first_request=first_request,
            last_request=last_request,
        )

    def _build_events_list(self) -> list[dict[str, Any]]:
        """
        Build list of usage events from telemetry.

        Returns:
            List of event dictionaries ready for sync
        """
        metrics = self.telemetry.get_metrics()
        events = []

        for metric in metrics:
            event = {
                "event_type": "cli:command",
                "endpoint": metric.get("endpoint", "unknown"),
                "timestamp": metric.get("timestamp", ""),
                "input_tokens": metric.get("input_tokens", 0),
                "output_tokens": metric.get("output_tokens", 0),
                "duration_ms": metric.get("duration_ms", 0),
                "metadata": {
                    "method": metric.get("method", "unknown"),
                    "status_code": metric.get("status_code", 200),
                },
            }
            events.append(event)

        return events

    async def _push_to_billing_async(
        self,
        events: list[dict[str, Any]],
        tenant_id: str,
    ) -> None:
        """
        Push usage events to billing providers asynchronously.

        Args:
            events: List of usage events
            tenant_id: Tenant identifier
        """
        import asyncio

        # Aggregate events into hourly buckets
        hourly_buckets = self._build_hourly_buckets()

        # Transform to webhook events
        stripe_events = self.webhook_bridge.transform_hourly_buckets(
            hourly_buckets, BillingProvider.STRIPE
        )
        polar_events = self.webhook_bridge.transform_hourly_buckets(
            hourly_buckets, BillingProvider.POLAR
        )

        # Push to gateway for relay (async)
        if stripe_events:
            asyncio.create_task(
                self.webhook_bridge.push_to_gateway(stripe_events)
            )
        if polar_events:
            asyncio.create_task(
                self.webhook_bridge.push_to_gateway(polar_events)
            )

    # =====================================================================
    # Phase 6: CLI Integration & Real-time Usage Metering
    # =====================================================================

    def register_webhook(
        self,
        push_to_billing: bool = True,
        provider: Optional[str] = None,
    ) -> dict[str, Any]:
        """
        Register CLI instance with webhook system for usage events.

        Args:
            push_to_billing: Whether to push to Stripe/Polar
            provider: Specific provider ('stripe' or 'polar'), None for both

        Returns:
            Dict with registration result:
            - success: bool
            - provider: str
            - error: Optional[str]
        """
        try:
            # Get tenant ID
            tenant_id = self._get_tenant_id()
            if not tenant_id:
                return {"success": False, "error": "No tenant ID available"}

            # Validate license first
            is_valid, error = self.validate_license()
            if not is_valid:
                return {"success": False, "error": error or "License invalid"}

            # Register with gateway
            license_key = os.getenv("RAAS_LICENSE_KEY", "")
            response = self.gateway.post(
                "/v1/webhooks/register",
                json={
                    "tenant_id": tenant_id,
                    "license_key": license_key,
                    "client_type": "cli",
                    "push_to_billing": push_to_billing,
                    "provider": provider,
                },
            )

            return {
                "success": True,
                "provider": response.data.get("provider", "billing"),
                "webhook_url": response.data.get("webhook_url"),
            }

        except GatewayError as e:
            return {"success": False, "error": str(e)}
        except Exception as e:
            return {"success": False, "error": f"Registration failed: {str(e)}"}

    def push_analytics(self) -> dict[str, Any]:
        """
        Push anonymized analytics to AgencyOS dashboard.

        Returns:
            Dict with push result:
            - success: bool
            - error: Optional[str]
        """
        try:
            # Get tenant ID
            tenant_id = self._get_tenant_id()
            if not tenant_id:
                return {"success": False, "error": "No tenant ID available"}

            # Get usage summary
            summary = self.get_usage_summary()

            # Build anonymized analytics payload
            analytics = {
                "tenant_id": tenant_id,
                "client_type": "cli",
                "cli_version": self._get_cli_version(),
                "total_requests": summary.total_requests,
                "total_payload_size": summary.total_payload_size,
                "hours_active": summary.hours_active,
                "endpoint_count": len(summary.endpoints),
                "unique_endpoints": list(summary.endpoints.keys())[:10],  # Top 10
            }

            # Push to AgencyOS analytics endpoint
            license_key = os.getenv("RAAS_LICENSE_KEY", "")
            self.gateway.post(
                "/v1/analytics/push",
                json=analytics,
                headers={
                    "Authorization": f"Bearer {license_key}"
                },
            )

            return {
                "success": True,
                "dashboard_url": "https://agencyos.network/analytics",
            }

        except GatewayError as e:
            return {"success": False, "error": str(e)}
        except Exception as e:
            return {"success": False, "error": f"Analytics push failed: {str(e)}"}

    def _get_cli_version(self) -> str:
        """Get CLI version for analytics."""
        try:
            from importlib.metadata import version
            return version("mekong-cli")
        except Exception:
            return "0.2.0-dev"

    def sync_usage_batch(self, events: list[dict[str, Any]]) -> dict[str, Any]:
        """
        Sync batch of usage events to RaaS Gateway.

        Args:
            events: List of usage event dicts with fields:
                - event_id: UUID v4
                - event_type: e.g., 'cli:command'
                - timestamp: ISO 8601
                - endpoint: API endpoint
                - metadata: Additional data

        Returns:
            Dict with sync result:
            - success: bool
            - synced_count: int
            - error: Optional[str]
        """
        try:
            # Validate license
            is_valid, error = self.validate_license()
            if not is_valid:
                return {"success": False, "error": error or "License invalid"}

            # Get tenant ID
            tenant_id = self._get_tenant_id()
            license_key = os.getenv("RAAS_LICENSE_KEY", "")

            # Build payload with idempotency keys
            payload = {
                "tenant_id": tenant_id,
                "license_key": license_key,
                "events": events,
            }

            # Send to v2/usage endpoint (Phase 6)
            response = self.gateway.post(
                "/v2/usage",
                json=payload,
                headers={
                    "Authorization": f"Bearer {license_key}",
                    "X-Idempotency-Key": events[0].get("event_id") if events else None,
                },
            )

            return {
                "success": True,
                "synced_count": len(events),
                "rate_limit_remaining": response.rate_limit_remaining,
            }

        except GatewayError as e:
            if e.status_code == 429:
                return {
                    "success": False,
                    "error": "Rate limit exceeded",
                    "rate_limit_reset_in": 60,
                }
            return {"success": False, "error": str(e)}
        except Exception as e:
            return {"success": False, "error": f"Batch sync failed: {str(e)}"}

    def get_webhook_status(self) -> dict[str, Any]:
        """
        Get webhook configuration status.

        Returns:
            Dict with webhook status:
            - configured: bool
            - providers: list of configured providers
            - last_delivery: timestamp of last delivery
        """
        try:
            license_key = os.getenv("RAAS_LICENSE_KEY", "")
            response = self.gateway.get(
                "/v1/webhooks/status",
                headers={"Authorization": f"Bearer {license_key}"},
            )
            return {
                "configured": response.data.get("configured", False),
                "providers": response.data.get("providers", []),
                "last_delivery": response.data.get("last_delivery"),
            }
        except Exception:
            return {"configured": False}

    def get_analytics_status(self) -> dict[str, Any]:
        """
        Get analytics pipeline status.

        Returns:
            Dict with analytics status:
            - healthy: bool
            - dashboard_url: str
            - last_push: timestamp
            - events_pushed: int
        """
        try:
            license_key = os.getenv("RAAS_LICENSE_KEY", "")
            response = self.gateway.get(
                "/v1/analytics/status",
                headers={"Authorization": f"Bearer {license_key}"},
            )
            return {
                "healthy": response.data.get("healthy", False),
                "dashboard_url": response.data.get("dashboard_url", "https://agencyos.network/analytics"),
                "last_push": response.data.get("last_push"),
                "events_pushed": response.data.get("events_pushed", 0),
            }
        except Exception:
            return {"healthy": False, "error": "Analytics not configured"}


# Global instance
_sync_client: Optional[SyncClient] = None


def get_sync_client() -> SyncClient:
    """Get global sync client instance."""
    global _sync_client
    if _sync_client is None:
        _sync_client = SyncClient()
    return _sync_client


def reset_sync_client() -> None:
    """Reset global sync client (for testing)."""
    global _sync_client
    _sync_client = None
