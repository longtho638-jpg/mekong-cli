"""
RaaS Task Client — Subagent Delegation via Gateway

Client để delegate tasks lên RaaS Gateway subagents.
Hỗ trợ:
  - JWT-signed requests với certificate headers
  - Subagent type routing (cook, plan, debug, etc.)
  - Rate limit enforcement via Cloudflare KV
  - Usage metric logging cho Phase 4 metering

Usage:
    from src.lib.raas_task_client import RaasTaskClient

    client = RaasTaskClient()
    result = client.delegate_task(
        subagent_type="cook",
        goal="Add authentication to the app",
        complexity="moderate"
    )
"""

from __future__ import annotations

import time
import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Optional, Dict, List
from enum import Enum

import requests

from src.core.raas_auth import RaaSAuthClient, get_auth_client
from src.core.raas_audit_logger import get_audit_logger


logger = logging.getLogger(__name__)


class SubagentType(str, Enum):
    """Supported subagent types for delegation."""
    COOK = "cook"
    PLANNER = "planner"
    DEBUGGER = "debugger"
    RESEARCHER = "researcher"
    CODE_REVIEWER = "code-reviewer"
    TESTER = "tester"
    FULLSTACK_DEVELOPER = "fullstack-developer"
    UI_UX_DESIGNER = "ui-ux-designer"
    DOCS_MANAGER = "docs-manager"
    PROJECT_MANAGER = "project-manager"
    GIT_MANAGER = "git-manager"
    LICENSE = "license"
    BILLING = "billing"
    ANALYTICS = "analytics"


class TaskStatus(str, Enum):
    """Task execution status."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    TIMEOUT = "timeout"


@dataclass
class TaskRequest:
    """Request payload for subagent delegation."""
    subagent_type: SubagentType
    goal: str
    complexity: str = "moderate"
    context: Optional[Dict[str, Any]] = None
    options: Dict[str, Any] = field(default_factory=dict)
    timeout_seconds: int = 300  # 5 minutes default

    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary."""
        return {
            "subagent_type": self.subagent_type.value,
            "goal": self.goal,
            "complexity": self.complexity,
            "context": self.context,
            "options": self.options,
            "timeout_seconds": self.timeout_seconds,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }


@dataclass
class TaskResult:
    """Result from subagent execution."""
    task_id: str
    status: TaskStatus
    output: Optional[str] = None
    error: Optional[str] = None
    subagent_type: Optional[str] = None
    execution_time_ms: Optional[float] = None
    credits_consumed: int = 0
    metadata: Dict[str, Any] = field(default_factory=dict)

    @property
    def success(self) -> bool:
        """Check if task completed successfully."""
        return self.status == TaskStatus.COMPLETED

    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary."""
        return {
            "task_id": self.task_id,
            "status": self.status.value,
            "output": self.output,
            "error": self.error,
            "subagent_type": self.subagent_type,
            "execution_time_ms": self.execution_time_ms,
            "credits_consumed": self.credits_consumed,
            "metadata": self.metadata,
        }


@dataclass
class GatewayConfig:
    """RaaS Gateway configuration."""
    base_url: str = "https://raas.agencyos.network"
    api_version: str = "v2"
    timeout_seconds: int = 30
    retry_attempts: int = 3
    retry_delay_seconds: float = 1.0


class RaasTaskClient:
    """
    RaaS Task Client for subagent delegation.

    Features:
    - JWT-signed requests với certificate headers
    - Subagent type routing
    - Rate limit enforcement
    - Usage metric logging
    """

    def __init__(
        self,
        gateway_url: Optional[str] = None,
        auth_client: Optional[RaaSAuthClient] = None,
        config: Optional[GatewayConfig] = None,
    ):
        """
        Initialize RaaS Task Client.

        Args:
            gateway_url: RaaS Gateway URL (default: from env or config)
            auth_client: RaaS auth client for credentials
            config: Gateway configuration
        """
        self.config = config or GatewayConfig()
        if gateway_url:
            self.config.base_url = gateway_url

        self.auth_client = auth_client or get_auth_client()
        self._audit_logger = get_audit_logger()
        self._session = requests.Session()

        # Setup session với default headers
        self._session.headers.update({
            "Content-Type": "application/json",
            "User-Agent": "mekong-cli/0.2.0",
        })

    def _get_base_url(self) -> str:
        """Get gateway base URL with API version."""
        return f"{self.config.base_url}/{self.config.api_version}"

    def _get_auth_headers(self) -> Dict[str, str]:
        """
        Get authentication headers for requests.

        Includes:
        - Authorization: Bearer token
        - X-Cert-ID: Certificate ID (if available)
        - X-Cert-Sig: Certificate signature (if available)
        """
        headers = {}

        # Get token from auth client
        creds = self.auth_client._load_credentials()
        token = creds.get("token")

        if token:
            headers["Authorization"] = f"Bearer {token}"

        # Add certificate headers if available
        cert_headers = self.auth_client._get_certificate_headers()
        if cert_headers:
            headers.update(cert_headers)

        return headers

    def _make_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        timeout: Optional[int] = None,
    ) -> requests.Response:
        """
        Make authenticated request to gateway.

        Args:
            method: HTTP method
            endpoint: API endpoint (without base URL)
            data: Request payload
            timeout: Request timeout in seconds

        Returns:
            requests.Response object

        Raises:
            requests.RequestException: On network error
            HTTPError: On HTTP error status
        """
        url = f"{self._get_base_url()}/{endpoint.lstrip('/')}"
        headers = self._get_auth_headers()

        response = self._session.request(
            method=method,
            url=url,
            headers=headers,
            json=data,
            timeout=timeout or self.config.timeout_seconds,
        )

        response.raise_for_status()
        return response

    def delegate_task(
        self,
        subagent_type: SubagentType,
        goal: str,
        complexity: str = "moderate",
        context: Optional[Dict[str, Any]] = None,
        options: Optional[Dict[str, Any]] = None,
        timeout_seconds: int = 300,
    ) -> TaskResult:
        """
        Delegate task to subagent via RaaS Gateway.

        Args:
            subagent_type: Type of subagent to delegate to
            goal: High-level goal or task description
            complexity: Task complexity (simple/moderate/complex)
            context: Additional context for the task
            options: Subagent-specific options
            timeout_seconds: Execution timeout

        Returns:
            TaskResult with execution status and output

        Raises:
            requests.RequestException: On network error
            HTTPError: On HTTP error status
        """
        start_time = time.time()

        # Build request payload
        request = TaskRequest(
            subagent_type=subagent_type,
            goal=goal,
            complexity=complexity,
            context=context,
            options=options or {},
            timeout_seconds=timeout_seconds,
        )

        # Log delegation attempt
        self._audit_logger.log_event(
            event_type="subagent_delegation",
            data={
                "subagent_type": subagent_type.value,
                "goal": goal[:100],  # Truncate for logging
                "complexity": complexity,
            },
        )

        try:
            # Make delegation request
            response = self._make_request(
                method="POST",
                endpoint="/tasks/delegate",
                data=request.to_dict(),
                timeout=timeout_seconds + 10,  # Extra buffer
            )

            response_data = response.json()

            # Parse response
            execution_time_ms = (time.time() - start_time) * 1000

            result = TaskResult(
                task_id=response_data.get("task_id", "unknown"),
                status=TaskStatus(response_data.get("status", "completed")),
                output=response_data.get("output"),
                error=response_data.get("error"),
                subagent_type=subagent_type.value,
                execution_time_ms=execution_time_ms,
                credits_consumed=response_data.get("credits_consumed", 1),
                metadata=response_data.get("metadata", {}),
            )

            # Log successful delegation
            self._audit_logger.log_event(
                event_type="subagent_result",
                data={
                    "task_id": result.task_id,
                    "status": result.status.value,
                    "execution_time_ms": execution_time_ms,
                    "credits_consumed": result.credits_consumed,
                },
            )

            return result

        except requests.HTTPError as e:
            # Handle HTTP errors
            execution_time_ms = (time.time() - start_time) * 1000

            error_data = e.response.json() if e.response.content else {}
            error_message = error_data.get("error", str(e))

            # Log error
            self._audit_logger.log_event(
                event_type="subagent_error",
                data={
                    "subagent_type": subagent_type.value,
                    "error": error_message,
                    "status_code": e.response.status_code,
                },
            )

            return TaskResult(
                task_id="unknown",
                status=TaskStatus.FAILED,
                error=error_message,
                subagent_type=subagent_type.value,
                execution_time_ms=execution_time_ms,
            )

        except requests.RequestException as e:
            # Network error - return failed result
            execution_time_ms = (time.time() - start_time) * 1000

            logger.warning("Gateway unavailable, task delegation failed: %s", e)

            return TaskResult(
                task_id="unknown",
                status=TaskStatus.FAILED,
                error=f"Gateway unavailable: {str(e)}",
                subagent_type=subagent_type.value,
                execution_time_ms=execution_time_ms,
            )

    async def delegate_task_async(
        self,
        subagent_type: SubagentType,
        goal: str,
        complexity: str = "moderate",
        context: Optional[Dict[str, Any]] = None,
        options: Optional[Dict[str, Any]] = None,
        timeout_seconds: int = 300,
    ) -> TaskResult:
        """
        Async version of delegate_task.

        Same parameters and return value as delegate_task.
        """
        # For now, wrap sync call in async
        import asyncio
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            lambda: self.delegate_task(
                subagent_type=subagent_type,
                goal=goal,
                complexity=complexity,
                context=context,
                options=options,
                timeout_seconds=timeout_seconds,
            ),
        )

    def get_task_status(self, task_id: str) -> TaskResult:
        """
        Get status of delegated task.

        Args:
            task_id: Task ID from delegation response

        Returns:
            TaskResult with current status
        """
        try:
            response = self._make_request(
                method="GET",
                endpoint=f"/tasks/{task_id}",
            )

            data = response.json()

            return TaskResult(
                task_id=task_id,
                status=TaskStatus(data.get("status", "pending")),
                output=data.get("output"),
                error=data.get("error"),
                subagent_type=data.get("subagent_type"),
                execution_time_ms=data.get("execution_time_ms"),
                credits_consumed=data.get("credits_consumed", 0),
                metadata=data.get("metadata", {}),
            )

        except requests.RequestException as e:
            return TaskResult(
                task_id=task_id,
                status=TaskStatus.FAILED,
                error=f"Status check failed: {str(e)}",
            )

    def cancel_task(self, task_id: str) -> bool:
        """
        Cancel running task.

        Args:
            task_id: Task ID to cancel

        Returns:
            True if cancelled, False otherwise
        """
        try:
            self._make_request(
                method="POST",
                endpoint=f"/tasks/{task_id}/cancel",
            )
            return True
        except requests.RequestException:
            return False

    def get_available_subagents(self) -> List[Dict[str, Any]]:
        """
        Get list of available subagents from gateway.

        Returns:
            List of subagent info dicts
        """
        try:
            response = self._make_request(
                method="GET",
                endpoint="/subagents",
            )
            return response.json().get("subagents", [])
        except requests.RequestException:
            # Return default list
            return [{"type": t.value, "name": t.value.replace("-", " ").title()}
                    for t in SubagentType]

    def get_usage_summary(self) -> Dict[str, Any]:
        """
        Get usage summary from gateway.

        Returns:
            Dict with usage stats (credits consumed, tasks executed, etc.)
        """
        try:
            response = self._make_request(
                method="GET",
                endpoint="/usage/summary",
            )
            return response.json()
        except requests.RequestException as e:
            return {"error": str(e), "available": False}


# Global instance
_task_client: Optional[RaasTaskClient] = None


def get_task_client(
    gateway_url: Optional[str] = None,
    auth_client: Optional[RaaSAuthClient] = None,
) -> RaasTaskClient:
    """
    Get or create global task client instance.

    Args:
        gateway_url: Optional custom gateway URL
        auth_client: Optional auth client

    Returns:
        RaasTaskClient instance
    """
    global _task_client
    if _task_client is None:
        _task_client = RaasTaskClient(
            gateway_url=gateway_url,
            auth_client=auth_client,
        )
    return _task_client


def reset_task_client() -> None:
    """Reset global task client instance (for testing)."""
    global _task_client
    _task_client = None


def delegate_to_subagent(
    subagent_type: str,
    goal: str,
    complexity: str = "moderate",
    context: Optional[Dict[str, Any]] = None,
) -> TaskResult:
    """
    Convenience function to delegate task to subagent.

    Args:
        subagent_type: Subagent type (cook, planner, debugger, etc.)
        goal: Task goal
        complexity: Task complexity
        context: Additional context

    Returns:
        TaskResult with execution status
    """
    client = get_task_client()

    # Map string to enum
    try:
        agent_type = SubagentType(subagent_type.lower().replace("_", "-"))
    except ValueError:
        return TaskResult(
            task_id="unknown",
            status=TaskStatus.FAILED,
            error=f"Unknown subagent type: {subagent_type}",
        )

    return client.delegate_task(
        subagent_type=agent_type,
        goal=goal,
        complexity=complexity,
        context=context,
    )


__all__ = [
    "RaasTaskClient",
    "SubagentType",
    "TaskStatus",
    "TaskRequest",
    "TaskResult",
    "GatewayConfig",
    "get_task_client",
    "delegate_to_subagent",
]
