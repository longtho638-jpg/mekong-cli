"""
Sentry Configuration for Error Tracking and Performance Monitoring
"""
import os
from typing import Optional

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.logging import LoggingIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration


def init_sentry(
    dsn: Optional[str] = None,
    environment: Optional[str] = None,
    release: Optional[str] = None,
    traces_sample_rate: float = 0.1,
    profiles_sample_rate: float = 0.1,
) -> None:
    """
    Initialize Sentry SDK for error tracking and performance monitoring.

    Args:
        dsn: Sentry Data Source Name (DSN). Falls back to SENTRY_DSN env var.
        environment: Environment name (dev, staging, production). Falls back to ENV env var.
        release: Release version. Falls back to VERSION env var or git commit.
        traces_sample_rate: Percentage of transactions to sample (0.0 to 1.0)
        profiles_sample_rate: Percentage of transactions to profile (0.0 to 1.0)

    Environment Variables:
        SENTRY_DSN: Required - Sentry project DSN
        ENV: Optional - Environment name (defaults to 'development')
        VERSION: Optional - Release version (defaults to 'dev')
        SENTRY_ENABLED: Optional - Set to 'false' to disable Sentry (defaults to 'true')
    """
    # Check if Sentry is explicitly disabled
    if os.getenv("SENTRY_ENABLED", "true").lower() == "false":
        print("ℹ️  Sentry monitoring is disabled (SENTRY_ENABLED=false)")
        return

    # Get DSN from parameter or environment
    sentry_dsn = dsn or os.getenv("SENTRY_DSN")

    if not sentry_dsn:
        print("⚠️  Sentry DSN not provided. Error tracking disabled.")
        print("   Set SENTRY_DSN environment variable to enable Sentry.")
        return

    # Get environment and release
    env = environment or os.getenv("ENV", "development")
    version = release or os.getenv("VERSION", "dev")

    # Initialize Sentry
    sentry_sdk.init(
        dsn=sentry_dsn,
        environment=env,
        release=version,

        # Integrations
        integrations=[
            FastApiIntegration(transaction_style="url"),
            StarletteIntegration(transaction_style="url"),
            LoggingIntegration(
                level=None,  # Capture all log levels
                event_level=None,  # Don't send logs as events (too noisy)
            ),
        ],

        # Performance Monitoring
        traces_sample_rate=traces_sample_rate,

        # Profiling (requires profiling mode enabled in Sentry project)
        profiles_sample_rate=profiles_sample_rate,

        # Additional options
        send_default_pii=False,  # Don't send personally identifiable information
        attach_stacktrace=True,  # Attach stack traces to messages
        max_breadcrumbs=50,  # Keep last 50 breadcrumbs for context

        # Before send hook to filter/modify events
        before_send=before_send_hook,
    )

    print("✅ Sentry initialized successfully")
    print(f"   Environment: {env}")
    print(f"   Release: {version}")
    print(f"   Traces Sample Rate: {traces_sample_rate * 100}%")
    print(f"   Profiles Sample Rate: {profiles_sample_rate * 100}%")


def before_send_hook(event, hint):
    """
    Hook to filter or modify events before sending to Sentry.

    Args:
        event: The event dictionary
        hint: Additional information about the event

    Returns:
        Modified event or None to drop the event
    """
    # Filter out certain errors
    if "exc_info" in hint:
        exc_type, exc_value, tb = hint["exc_info"]

        # Don't send 404 errors to Sentry
        if "404" in str(exc_value):
            return None

        # Don't send certain known errors
        ignored_errors = [
            "ConnectionError",
            "TimeoutError",
            # Add more error types to ignore
        ]

        if exc_type.__name__ in ignored_errors:
            return None

    # Add custom tags
    event.setdefault("tags", {})
    event["tags"]["service"] = "agencyos-backend"

    return event


def set_user_context(user_id: str, email: Optional[str] = None, username: Optional[str] = None):
    """
    Set user context for Sentry events.

    Args:
        user_id: Unique user identifier
        email: User email (optional, will be redacted if send_default_pii=False)
        username: Username (optional)
    """
    sentry_sdk.set_user({
        "id": user_id,
        "email": email,
        "username": username,
    })


def set_transaction_context(transaction_name: str, **tags):
    """
    Set transaction context for better grouping in Sentry.

    Args:
        transaction_name: Name of the transaction (e.g., "api.payments.create_invoice")
        **tags: Additional tags to add to the transaction
    """
    with sentry_sdk.configure_scope() as scope:
        scope.set_transaction_name(transaction_name)
        for key, value in tags.items():
            scope.set_tag(key, value)


def capture_exception_with_context(exception: Exception, **extra):
    """
    Capture an exception with additional context.

    Args:
        exception: The exception to capture
        **extra: Additional context data
    """
    with sentry_sdk.push_scope() as scope:
        for key, value in extra.items():
            scope.set_extra(key, value)
        sentry_sdk.capture_exception(exception)


def capture_message(message: str, level: str = "info", **extra):
    """
    Capture a message (not an exception) with context.

    Args:
        message: The message to capture
        level: Severity level (debug, info, warning, error, fatal)
        **extra: Additional context data
    """
    with sentry_sdk.push_scope() as scope:
        for key, value in extra.items():
            scope.set_extra(key, value)
        sentry_sdk.capture_message(message, level=level)
