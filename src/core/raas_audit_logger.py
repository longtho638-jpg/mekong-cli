"""
RaaS Audit Logger — Compliance & Observability

Posts audit events to RaaS Gateway:
  POST https://raas.agencyos.network/v2/audit
  Headers: Authorization: Bearer {mk_...}, X-JWT-Attribution: {jwt}
  Payload: {
    "project": "mekong-cli",
    "phase": 6,
    "event": "completion_verification",
    "timestamp": ISO8601,
    "commit_sha": GITHUB_SHA,
    "tenant_id": "...",
    "session_id": "..."
  }

Usage:
    from src.core.raas_audit_logger import RAASAuditLogger

    logger = RAASAuditLogger()
    logger.log_completion(commit_sha="abc123", event="phase6_complete")
"""

from __future__ import annotations

import json
import os
import time
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests

from .raas_auth import RaaSAuthClient, TenantContext, get_auth_client


@dataclass
class AuditEvent:
    """Audit event for RaaS Gateway."""

    project: str = "mekong-cli"
    phase: int = 6
    event: str = "completion_verification"
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    commit_sha: Optional[str] = None
    tenant_id: Optional[str] = None
    session_id: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class AuditResult:
    """Result of audit log submission."""

    success: bool
    status_code: int = 0
    event_id: Optional[str] = None
    error: Optional[str] = None
    elapsed_ms: float = 0.0
    payload: Optional[dict] = None
    headers_sent: Optional[dict] = None


@dataclass
class RaaSInteractionTrace:
    """Full trace of RaaS interaction for debugging."""

    timestamp: str
    event_type: str
    endpoint: str
    method: str
    headers_sent: Dict[str, str]
    payload_sent: Optional[dict]
    status_code: int
    response_body: Optional[str]
    elapsed_ms: float
    error: Optional[str] = None

    def to_dict(self) -> dict:
        return asdict(self)


class RAASAuditLogger:
    """
    RaaS Audit Logger for Phase 6 compliance.

    Posts audit events to RaaS Gateway with:
    - mk_ API key authentication
    - JWT-bound usage attribution
    - Full interaction tracing for --raas-debug

    Environment variables:
    - RAAS_GATEWAY_URL: Gateway endpoint (default: https://raas.agencyos.network)
    - RAAS_LICENSE_KEY: mk_ API key for authentication
    - RAAS_DEBUG: Enable debug tracing (default: False)
    - GITHUB_SHA: Commit SHA for audit events
    """

    DEFAULT_GATEWAY_URL = "https://raas.agencyos.network"
    AUDIT_ENDPOINT = "/v2/audit"

    def __init__(
        self,
        gateway_url: Optional[str] = None,
        auth_client: Optional[RaaSAuthClient] = None,
        debug_mode: bool = False,
    ):
        """
        Initialize RaaS Audit Logger.

        Args:
            gateway_url: RaaS Gateway URL
            auth_client: Optional auth client instance
            debug_mode: Enable debug tracing
        """
        self.gateway_url = gateway_url or os.getenv(
            "RAAS_GATEWAY_URL", self.DEFAULT_GATEWAY_URL
        )
        self.auth = auth_client or get_auth_client()
        self.debug_mode = debug_mode or os.getenv("RAAS_DEBUG", "false").lower() == "true"
        self._trace_log: List[RaaSInteractionTrace] = []
        self._session = requests.Session()

    def _get_github_sha(self) -> Optional[str]:
        """Get commit SHA from environment."""
        return os.getenv("GITHUB_SHA")

    def _get_auth_headers(self) -> tuple[dict[str, str], Optional[TenantContext]]:
        """
        Get authentication headers with JWT attribution.

        Returns:
            Tuple of (headers dict, tenant context)
        """
        creds = self.auth._load_credentials()
        token = creds.get("token") or os.getenv("RAAS_LICENSE_KEY")

        headers: Dict[str, str] = {
            "Content-Type": "application/json",
            "X-RaaS-Source": "mekong-cli",
            "X-RaaS-Phase": "6",
        }

        tenant = None
        if token:
            # Validate to get tenant context
            result = self.auth.validate_credentials(token)
            if result.valid and result.tenant:
                tenant = result.tenant
                headers["Authorization"] = f"Bearer {token}"

                # Add JWT attribution header if JWT token
                if "." in token:
                    headers["X-JWT-Attribution"] = token[:100]  # First 100 chars for tracing

        return headers, tenant

    def _build_payload(
        self,
        event: str,
        commit_sha: Optional[str] = None,
        session_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> tuple[dict, Optional[str]]:
        """
        Build audit event payload.

        Returns:
            Tuple of (payload dict, tenant_id)
        """
        headers, tenant = self._get_auth_headers()
        tenant_id = tenant.tenant_id if tenant else "anonymous"

        payload = {
            "project": "mekong-cli",
            "phase": 6,
            "event": event,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "commit_sha": commit_sha or self._get_github_sha(),
            "tenant_id": tenant_id,
            "session_id": session_id,
            "metadata": metadata or {},
        }

        return payload, tenant_id

    def log_event(
        self,
        event: str,
        commit_sha: Optional[str] = None,
        session_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> AuditResult:
        """
        Log audit event to RaaS Gateway.

        Args:
            event: Event name (e.g., "completion_verification", "command_executed")
            commit_sha: Optional commit SHA (defaults to GITHUB_SHA env)
            session_id: Optional session ID
            metadata: Optional additional metadata

        Returns:
            AuditResult with success status and trace info
        """
        start = time.perf_counter()

        headers, tenant = self._get_auth_headers()
        payload, tenant_id = self._build_payload(event, commit_sha, session_id, metadata)

        trace = RaaSInteractionTrace(
            timestamp=datetime.now(timezone.utc).isoformat(),
            event_type=event,
            endpoint=self.AUDIT_ENDPOINT,
            method="POST",
            headers_sent=headers,
            payload_sent=payload,
            status_code=0,
            response_body=None,
            elapsed_ms=0,
        )

        try:
            url = f"{self.gateway_url}{self.AUDIT_ENDPOINT}"
            response = self._session.post(
                url,
                headers=headers,
                json=payload,
                timeout=10,
            )
            elapsed_ms = (time.perf_counter() - start) * 1000

            trace.status_code = response.status_code
            trace.response_body = response.text[:500] if response.text else None
            trace.elapsed_ms = elapsed_ms

            if response.status_code == 200:
                data = response.json()
                event_id = data.get("event_id")

                if self.debug_mode:
                    self._trace_log.append(trace)

                return AuditResult(
                    success=True,
                    status_code=200,
                    event_id=event_id,
                    elapsed_ms=elapsed_ms,
                    payload=payload,
                    headers_sent=headers,
                )

            else:
                error_msg = response.text[:200] if response.text else f"HTTP {response.status_code}"
                if self.debug_mode:
                    trace.error = error_msg
                    self._trace_log.append(trace)

                return AuditResult(
                    success=False,
                    status_code=response.status_code,
                    error=error_msg,
                    elapsed_ms=elapsed_ms,
                    payload=payload,
                    headers_sent=headers,
                )

        except requests.RequestException as e:
            elapsed_ms = (time.perf_counter() - start) * 1000
            error_msg = f"Network error: {str(e)}"
            trace.error = error_msg
            trace.elapsed_ms = elapsed_ms

            if self.debug_mode:
                self._trace_log.append(trace)

            return AuditResult(
                success=False,
                status_code=0,
                error=error_msg,
                elapsed_ms=elapsed_ms,
                payload=payload,
                headers_sent=headers,
            )

    def log_completion(
        self,
        commit_sha: Optional[str] = None,
        event: str = "completion_verification",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> AuditResult:
        """
        Log phase completion event.

        Args:
            commit_sha: Optional commit SHA
            event: Event name (default: "completion_verification")
            metadata: Optional metadata

        Returns:
            AuditResult
        """
        return self.log_event(event=event, commit_sha=commit_sha, metadata=metadata)

    def get_trace_log(self) -> List[dict]:
        """Get trace log for debugging (used by --raas-debug)."""
        return [t.to_dict() for t in self._trace_log]

    def clear_trace_log(self) -> None:
        """Clear trace log."""
        self._trace_log.clear()

    def export_trace(self, output_path: str) -> str:
        """
        Export trace log to file.

        Args:
            output_path: Path to output file

        Returns:
            Path to exported file
        """
        output = Path(output_path).expanduser()
        output.parent.mkdir(parents=True, exist_ok=True)

        with open(output, "w") as f:
            json.dump(self.get_trace_log(), f, indent=2)

        return str(output)


# Singleton instance
_audit_logger: Optional[RAASAuditLogger] = None


def get_audit_logger(debug_mode: bool = False) -> RAASAuditLogger:
    """
    Get or create RAASAuditLogger singleton.

    Args:
        debug_mode: Enable debug tracing

    Returns:
        RAASAuditLogger instance
    """
    global _audit_logger
    if _audit_logger is None:
        _audit_logger = RAASAuditLogger(debug_mode=debug_mode)
    return _audit_logger


def log_audit(
    event: str,
    commit_sha: Optional[str] = None,
    session_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> AuditResult:
    """
    Log audit event (convenience function).

    Args:
        event: Event name
        commit_sha: Optional commit SHA
        session_id: Optional session ID
        metadata: Optional metadata

    Returns:
        AuditResult
    """
    logger = get_audit_logger()
    return logger.log_event(event, commit_sha, session_id, metadata)
