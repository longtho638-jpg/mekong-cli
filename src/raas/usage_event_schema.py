"""
RaaS Usage Event Schema - Phase 5 Analytics Dashboard Compatible

Defines Pydantic schemas for usage events sent to RaaS Gateway.
Compatible with Phase 5 Analytics Dashboard event schemas.

Event Types:
- cli:command - CLI command execution
- agent:spawn - Agent spawned
- llm:call - LLM API call
- usage:tokens - Token consumption
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


class UsageEventType(str, Enum):
    """Supported usage event types."""

    CLI_COMMAND = "cli:command"
    AGENT_SPAWN = "agent:spawn"
    LLM_CALL = "llm:call"
    USAGE_TOKENS = "usage:tokens"
    SYNC_METRICS = "sync:metrics"


class UsageEvent(BaseModel):
    """
    Single usage event record.

    Attributes:
        event_id: Unique event identifier (UUID v4)
        event_type: Type of usage event
        tenant_id: Tenant identifier from license
        license_key: License key (mk_* or JWT)
        timestamp: Event timestamp (UTC)
        endpoint: API endpoint or CLI command
        model: LLM model used (if applicable)
        input_tokens: Input token count
        output_tokens: Output token count
        duration_ms: Operation duration in milliseconds
        metadata: Additional event-specific data
    """

    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_type: UsageEventType
    tenant_id: str
    license_key: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    endpoint: Optional[str] = None
    model: Optional[str] = None
    input_tokens: int = 0
    output_tokens: int = 0
    duration_ms: float = 0.0
    metadata: Dict[str, Any] = Field(default_factory=dict)

    @field_validator("timestamp", mode="before")
    @classmethod
    def ensure_utc(cls, v):
        """Ensure timestamp is UTC."""
        if isinstance(v, datetime) and v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "event_id": self.event_id,
            "event_type": self.event_type.value,
            "tenant_id": self.tenant_id,
            "license_key": self.license_key,
            "timestamp": self.timestamp.isoformat(),
            "endpoint": self.endpoint,
            "model": self.model,
            "input_tokens": self.input_tokens,
            "output_tokens": self.output_tokens,
            "duration_ms": self.duration_ms,
            "metadata": self.metadata,
        }


class HourlyBucket(BaseModel):
    """
    Aggregated usage metrics for one hour bucket.

    Attributes:
        hour_bucket: Hour bucket in YYYY-MM-DD-HH format
        tenant_id: Tenant identifier
        event_count: Total events in bucket
        total_tokens: Total tokens consumed
        events_by_type: Breakdown by event type
        total_duration_ms: Total duration of all events
        unique_endpoints: Count of unique endpoints
    """

    hour_bucket: str  # YYYY-MM-DD-HH
    tenant_id: str
    event_count: int = 0
    total_tokens: int = 0
    events_by_type: Dict[str, int] = Field(default_factory=dict)
    total_duration_ms: float = 0.0
    unique_endpoints: int = 0

    @classmethod
    def from_events(cls, events: List[UsageEvent]) -> "HourlyBucket":
        """Build hourly bucket from list of events."""
        if not events:
            return cls(hour_bucket="", tenant_id="")

        # Get hour bucket from first event
        first_event = events[0]
        hour_bucket = first_event.timestamp.strftime("%Y-%m-%d-%H")
        tenant_id = first_event.tenant_id

        # Aggregate metrics
        events_by_type: Dict[str, int] = {}
        total_tokens = 0
        total_duration = 0.0
        endpoints = set()

        for event in events:
            # Count by type
            event_type = event.event_type.value
            events_by_type[event_type] = events_by_type.get(event_type, 0) + 1

            # Sum tokens
            total_tokens += event.input_tokens + event.output_tokens

            # Sum duration
            total_duration += event.duration_ms

            # Track endpoints
            if event.endpoint:
                endpoints.add(event.endpoint)

        return cls(
            hour_bucket=hour_bucket,
            tenant_id=tenant_id,
            event_count=len(events),
            total_tokens=total_tokens,
            events_by_type=events_by_type,
            total_duration_ms=total_duration,
            unique_endpoints=len(endpoints),
        )


class UsageSummary(BaseModel):
    """
    Summary of usage metrics for sync.

    Attributes:
        total_requests: Total API requests
        total_payload_size: Total payload bytes
        hours_active: Number of active hours
        peak_hour: Hour with most requests
        peak_requests: Request count in peak hour
        first_request: First request timestamp
        last_request: Last request timestamp
    """

    total_requests: int = 0
    total_payload_size: int = 0
    hours_active: int = 0
    peak_hour: Optional[str] = None
    peak_requests: int = 0
    first_request: Optional[datetime] = None
    last_request: Optional[datetime] = None


class EncryptedPayload(BaseModel):
    """
    Encrypted usage payload for secure transmission.

    Attributes:
        nonce: Base64-encoded nonce (12 bytes for AES-GCM)
        ciphertext: Base64-encoded encrypted data
        version: Encryption version for future compatibility
    """

    nonce: str
    ciphertext: str
    version: str = "v1"

    @classmethod
    def from_bytes(cls, nonce: bytes, ciphertext: bytes) -> "EncryptedPayload":
        """Create from raw bytes."""
        import base64
        return cls(
            nonce=base64.b64encode(nonce).decode("ascii"),
            ciphertext=base64.b64encode(ciphertext).decode("ascii"),
        )

    def to_bytes(self) -> tuple[bytes, bytes]:
        """Convert back to raw bytes."""
        import base64
        return (
            base64.b64decode(self.nonce),
            base64.b64decode(self.ciphertext),
        )


class SyncRequest(BaseModel):
    """
    Request payload for /v1/usage/sync endpoint.

    Attributes:
        license_key: License key for auth
        tenant_id: Tenant identifier
        encrypted_payload: Encrypted usage data
        summary: Unencrypted summary for quick stats
        checksum: SHA256 checksum of original payload
    """

    license_key: str
    tenant_id: str
    encrypted_payload: EncryptedPayload
    summary: UsageSummary
    checksum: str
    synced_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class EntitlementResponse(BaseModel):
    """
    Response from /v1/license/entitlements endpoint.

    Attributes:
        tenant_id: Tenant identifier
        tier: License tier (free/pro/enterprise)
        features: List of enabled features
        rate_limit: Requests per minute limit
        rate_limit_window: Window in seconds
        max_payload_size: Max payload size in bytes
        retention_days: Data retention period
        expires_at: License expiry timestamp
    """

    tenant_id: str
    tier: str
    features: List[str] = Field(default_factory=list)
    rate_limit: int = 60
    rate_limit_window: int = 60
    max_payload_size: int = 1048576  # 1MB
    retention_days: int = 30
    expires_at: Optional[datetime] = None


class WebhookEvent(BaseModel):
    """
    Webhook event for Stripe/Polar integration.

    Attributes:
        id: Event ID
        type: Webhook type (stripe/polar)
        tenant_id: Tenant for attribution
        usage_data: Usage metrics
        created_at: Event timestamp
    """

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str  # "stripe" or "polar"
    tenant_id: str
    usage_data: Dict[str, Any]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    def to_stripe_format(self) -> Dict[str, Any]:
        """Convert to Stripe Usage Record format."""
        return {
            "type": "usage_record.create",
            "object": "billing.usage_record",
            "data": {
                "subscription_item": self.usage_data.get("subscription_item_id"),
                "quantity": self.usage_data.get("total_tokens", 0),
                "timestamp": int(self.created_at.timestamp()),
                "action": "set",  # or "increment"
            },
        }

    def to_polar_format(self) -> Dict[str, Any]:
        """Convert to Polar Webhook format."""
        return {
            "type": "benefit.usage.reported",
            "object": "benefit_usage",
            "data": {
                "benefit_id": self.usage_data.get("benefit_id"),
                "customer_id": self.tenant_id,
                "used": self.usage_data.get("total_tokens", 0),
                "unit": "tokens",
                "reported_at": self.created_at.isoformat(),
            },
        }
