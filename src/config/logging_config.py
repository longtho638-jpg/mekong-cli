"""
Structured Logging Configuration for Mekong CLI

Uses structlog for structured, JSON-formatted logs optimized for:
- Production log aggregation (GCP Logging, ELK, etc.)
- High-signal debugging with contextual information
- ROIaaS telemetry integration
"""

from __future__ import annotations

import logging
import sys
from typing import Any

import structlog
from structlog.types import Processor


def get_logger(name: str = __name__) -> Any:
    """
    Get a structured logger instance.

    Args:
        name: Logger name (usually __name__ of the calling module)

    Returns:
        A bound logger with all processors configured

    Example:
        logger = get_logger(__name__)
        logger.info("webhook.received", event_type="subscription.created")
    """
    return structlog.get_logger(name)


def setup_logging(
    log_level: str = "INFO",
    json_format: bool = False,
    debug: bool = False,
) -> None:
    """
    Configure structlog with shared processors and handlers.

    Args:
        log_level: Minimum log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        json_format: If True, output JSON for production; if False, human-readable console
        debug: If True, override log_level to DEBUG
    """
    if debug:
        log_level = "DEBUG"

    # Shared processors for all log formats
    shared_processors: list[Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.StackInfoRenderer(),
    ]

    if json_format:
        # Production: JSON output for log aggregators
        processors: list[Processor] = [
            *shared_processors,
            structlog.processors.dict_tracebacks,
            structlog.processors.JSONRenderer(),
        ]
    else:
        # Development: Console-friendly colored output
        processors = [
            *shared_processors,
            structlog.dev.ConsoleRenderer(
                colors=True,
                exception_formatter=structlog.dev.rich_traceback,
            ),
        ]

    # Configure structlog
    structlog.configure(
        processors=processors,
        wrapper_class=structlog.make_filtering_bound_logger(
            getattr(logging, log_level.upper(), logging.INFO)
        ),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory() if not sys.stdout.isatty() else None,
        cache_logger_on_first_use=True,
    )

    # Configure stdlib logging (for libraries that use logging)
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, log_level.upper(), logging.INFO),
    )


# Convenience logger for immediate use
logger = get_logger("mekong")


__all__ = ["get_logger", "setup_logging", "logger"]
