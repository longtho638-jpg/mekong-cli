"""
Structured Logging Configuration
================================
Configures JSON logging for production to facilitate log aggregation
(e.g., via CloudWatch, Datadog, or ELK).
"""

import logging
import sys
import json
from datetime import datetime
from typing import Any, Dict, Optional

class JSONFormatter(logging.Formatter):
    """
    Formatter that outputs JSON strings after parsing the LogRecord.
    """
    def format(self, record: logging.LogRecord) -> str:
        log_record = {
            "timestamp": datetime.utcfromtimestamp(record.created).isoformat() + "Z",
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add exception info if present
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)

        # Add extra fields if available via 'extra' dict
        # Note: standard python logging puts extra fields directly into record.__dict__
        # We handle specific known context fields if needed, or iterate safely

        # Example: trace_id from correlation middleware
        if hasattr(record, "trace_id"):
            log_record["trace_id"] = record.trace_id

        return json.dumps(log_record)

def setup_logging(level_str: str = "INFO") -> None:
    """
    Configure root logger with JSON formatter for stdout.

    Args:
        level_str: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    """
    level = getattr(logging, level_str.upper(), logging.INFO)

    root_logger = logging.getLogger()
    root_logger.setLevel(level)

    # Remove existing handlers to avoid duplication
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    # Create console handler with JSON formatter
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JSONFormatter())
    root_logger.addHandler(handler)

    # Configure uvicorn loggers to use our JSON format if desired,
    # or keep them somewhat quiet to avoid duplicate/unstructured logs
    # For production, we want everything in JSON.

    # Force uvicorn to use our handler
    for uvicorn_logger_name in ["uvicorn", "uvicorn.access", "uvicorn.error"]:
        logger = logging.getLogger(uvicorn_logger_name)
        logger.handlers = []
        logger.addHandler(handler)
        logger.propagate = False

    logging.info(f"Structured logging initialized at level {level_str}")
