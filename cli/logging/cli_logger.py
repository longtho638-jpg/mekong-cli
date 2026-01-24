"""
CLI Command Logging - Structured logging decorator for all CLI commands

Integrates with:
- backend.services.audit_service for persistent logging
- antigravity.core.observability for metrics tracking
- Performance monitoring for command duration

Usage:
    @cli_app.command("deploy")
    @log_cli_command(command="deploy", resource="deployment")
    def deploy_command(env: str):
        # Command implementation
        pass
"""

import time
import functools
import logging
import os
from typing import Optional, Callable, Any
from datetime import datetime

from backend.services.audit_service import AuditService, AuditEventType, AuditSeverity

logger = logging.getLogger(__name__)


class CLIAuditLogger:
    """
    Structured logger for CLI command execution

    Logs to:
    1. audit_service.db - Persistent audit trail
    2. Standard logs - For debugging
    3. Observability stack - For metrics
    """

    def __init__(self):
        self.audit_service = AuditService()

    def log_command(
        self,
        command: str,
        user: Optional[str] = None,
        duration_ms: Optional[float] = None,
        success: bool = True,
        error: Optional[str] = None,
        resource: Optional[str] = None,
        resource_id: Optional[str] = None,
        metadata: Optional[dict] = None
    ) -> int:
        """
        Log CLI command execution

        Args:
            command: Command name (e.g., "revenue dashboard")
            user: User executing command (from env or system user)
            duration_ms: Command execution time in milliseconds
            success: Whether command succeeded
            error: Error message if failed
            resource: Type of resource affected (e.g., "invoice", "deployment")
            resource_id: ID of specific resource
            metadata: Additional context data

        Returns:
            Audit log entry ID
        """
        # Get user from environment or system
        if user is None:
            user = os.environ.get("USER") or os.environ.get("USERNAME") or "unknown"

        # Build metadata
        full_metadata = {
            "command": command,
            "duration_ms": duration_ms,
            "timestamp": datetime.utcnow().isoformat(),
            "cwd": os.getcwd(),
        }

        if metadata:
            full_metadata.update(metadata)

        # Determine severity
        severity = AuditSeverity.INFO if success else AuditSeverity.WARNING

        # Log to audit service
        entry_id = self.audit_service.log_event(
            event_type=AuditEventType.API_CALL,  # Reuse API_CALL for CLI commands
            action=f"CLI: {command}",
            user_id=user,
            ip_address="127.0.0.1",  # Local CLI execution
            resource=resource,
            resource_id=resource_id,
            metadata=full_metadata,
            severity=severity,
            result="success" if success else "failure",
            error_message=error
        )

        # Also log to standard logger
        if success:
            logger.info(
                f"CLI command '{command}' completed in {duration_ms:.2f}ms by {user}",
                extra={"audit_id": entry_id}
            )
        else:
            logger.error(
                f"CLI command '{command}' failed: {error}",
                extra={"audit_id": entry_id, "duration_ms": duration_ms}
            )

        return entry_id


# Singleton instance
_cli_logger: Optional[CLIAuditLogger] = None


def get_cli_logger() -> CLIAuditLogger:
    """Get singleton CLI audit logger instance"""
    global _cli_logger
    if _cli_logger is None:
        _cli_logger = CLIAuditLogger()
    return _cli_logger


def log_cli_command(
    command: str,
    resource: Optional[str] = None,
    include_args: bool = True
):
    """
    Decorator for CLI commands to add structured logging

    Args:
        command: Command name (e.g., "revenue dashboard")
        resource: Type of resource affected (e.g., "invoice")
        include_args: Whether to log function arguments

    Usage:
        @revenue_app.command("dashboard")
        @log_cli_command(command="revenue dashboard", resource="revenue")
        def show_dashboard():
            # Implementation
            pass
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            cli_logger = get_cli_logger()
            start_time = time.time()

            # Build metadata
            metadata = {}
            if include_args:
                # Safely capture arguments (avoid sensitive data)
                metadata["args_count"] = len(args)
                metadata["kwargs_keys"] = list(kwargs.keys())

            try:
                # Execute command
                result = func(*args, **kwargs)

                # Log success
                duration_ms = (time.time() - start_time) * 1000
                cli_logger.log_command(
                    command=command,
                    duration_ms=duration_ms,
                    success=True,
                    resource=resource,
                    metadata=metadata
                )

                return result

            except Exception as e:
                # Log failure
                duration_ms = (time.time() - start_time) * 1000
                cli_logger.log_command(
                    command=command,
                    duration_ms=duration_ms,
                    success=False,
                    error=str(e),
                    resource=resource,
                    metadata=metadata
                )

                # Re-raise exception
                raise

        return wrapper
    return decorator


def get_command_stats(command: Optional[str] = None, days: int = 7) -> dict:
    """
    Get statistics for CLI command usage

    Args:
        command: Specific command to filter (None for all)
        days: Number of days to look back

    Returns:
        Dictionary with command usage statistics
    """
    audit_service = AuditService()

    from datetime import timedelta
    start_date = datetime.utcnow() - timedelta(days=days)

    # Get logs
    logs = audit_service.get_logs(
        event_type=AuditEventType.API_CALL.value,
        start_date=start_date,
        limit=10000
    )

    # Filter for CLI commands
    cli_logs = [
        log for log in logs
        if log.get("action", "").startswith("CLI:")
    ]

    if command:
        cli_logs = [
            log for log in cli_logs
            if command in log.get("action", "")
        ]

    # Calculate stats
    total_calls = len(cli_logs)
    success_calls = len([log for log in cli_logs if log.get("result") == "success"])
    failure_calls = total_calls - success_calls

    # Average duration
    durations = [
        log.get("metadata", {}).get("duration_ms", 0)
        for log in cli_logs
        if isinstance(log.get("metadata"), dict)
    ]
    avg_duration = sum(durations) / len(durations) if durations else 0

    return {
        "command": command or "all",
        "days": days,
        "total_calls": total_calls,
        "success_calls": success_calls,
        "failure_calls": failure_calls,
        "success_rate": success_calls / total_calls if total_calls > 0 else 0,
        "avg_duration_ms": avg_duration,
        "logs": cli_logs[:10]  # Return last 10 for inspection
    }
