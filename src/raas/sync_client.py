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

import os
import time
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Optional

from src.core.gateway_client import GatewayClient, GatewayError
from src.core.telemetry_reporter import TelemetryReporter
from src.lib.raas_gate_validator import RaasGateValidator


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
    ):
        """
        Initialize Sync Client.

        Args:
            gateway_client: Optional GatewayClient instance
            telemetry: Optional TelemetryReporter instance
        """
        self.gateway = gateway_client or GatewayClient()
        self.telemetry = telemetry or TelemetryReporter()
        self.validator = RaasGateValidator()
        self._license_valid: Optional[bool] = None

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
