"""
Langfuse Provider — wraps Langfuse SDK with graceful degradation.

All public methods return None on failure so callers never crash
even when Langfuse is unavailable or misconfigured.

Default host: http://localhost:3100 (local docker-compose).
Cloud option: https://cloud.langfuse.com
"""

import logging
import os
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

try:
    from langfuse import Langfuse
    from langfuse.model import ModelUsage

    _LANGFUSE_AVAILABLE = True
except ImportError:
    _LANGFUSE_AVAILABLE = False
    logger.debug("langfuse not installed — observability disabled")


class LangfuseProvider:
    """
    Thin wrapper around the Langfuse SDK.

    Reads credentials from environment variables by default:
      LANGFUSE_HOST        (default: http://localhost:3100)
      LANGFUSE_PUBLIC_KEY
      LANGFUSE_SECRET_KEY

    All methods are no-ops and return None when:
      - langfuse package is not installed
      - Credentials are missing / invalid
      - Any network error occurs
    """

    def __init__(
        self,
        host: Optional[str] = None,
        public_key: Optional[str] = None,
        secret_key: Optional[str] = None,
    ) -> None:
        """
        Initialise the provider.

        Args:
            host: Langfuse server URL. Falls back to LANGFUSE_HOST env var,
                  then http://localhost:3100.
            public_key: Falls back to LANGFUSE_PUBLIC_KEY env var.
            secret_key: Falls back to LANGFUSE_SECRET_KEY env var.
        """
        self._client: Optional[Any] = None

        if not _LANGFUSE_AVAILABLE:
            return

        resolved_host = host or os.getenv("LANGFUSE_HOST", "http://localhost:3100")
        resolved_pk = public_key or os.getenv("LANGFUSE_PUBLIC_KEY", "")
        resolved_sk = secret_key or os.getenv("LANGFUSE_SECRET_KEY", "")

        if not resolved_pk or not resolved_sk:
            logger.debug("LANGFUSE_PUBLIC_KEY / LANGFUSE_SECRET_KEY not set — skipping")
            return

        try:
            self._client = Langfuse(
                host=resolved_host,
                public_key=resolved_pk,
                secret_key=resolved_sk,
            )
            logger.debug("Langfuse connected: %s", resolved_host)
        except Exception as exc:
            logger.warning("Langfuse init failed: %s", exc)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def start_trace(
        self,
        name: str,
        user_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Optional[Any]:
        """
        Create a new Langfuse trace.

        Args:
            name: Human-readable trace name (usually the goal string).
            user_id: Optional user identifier for filtering in the UI.
            metadata: Arbitrary key-value pairs attached to the trace.

        Returns:
            Langfuse trace object or None on failure.
        """
        if self._client is None:
            return None
        try:
            return self._client.trace(
                name=name,
                user_id=user_id,
                metadata=metadata or {},
            )
        except Exception as exc:
            logger.warning("start_trace failed: %s", exc)
            return None

    def start_span(self, trace: Any, name: str) -> Optional[Any]:
        """
        Create a child span under an existing trace.

        Args:
            trace: Langfuse trace object returned by start_trace().
            name: Span label (e.g. step title).

        Returns:
            Langfuse span object or None on failure.
        """
        if self._client is None or trace is None:
            return None
        try:
            return trace.span(name=name)
        except Exception as exc:
            logger.warning("start_span failed: %s", exc)
            return None

    def record_generation(
        self,
        span: Any,
        model: str,
        input_text: str,
        output_text: str,
        usage: Optional[Dict[str, int]] = None,
    ) -> Optional[Any]:
        """
        Record an LLM generation event inside a span.

        Args:
            span: Parent span object.
            model: Model identifier string (e.g. "claude-opus-4-6").
            input_text: Prompt / input sent to the model.
            output_text: Completion / output received from the model.
            usage: Token counts — {"input": N, "output": M}.

        Returns:
            Langfuse generation object or None on failure.
        """
        if self._client is None or span is None:
            return None
        try:
            kwargs: Dict[str, Any] = {
                "name": "llm-call",
                "model": model,
                "input": input_text,
                "output": output_text,
            }
            if usage and _LANGFUSE_AVAILABLE:
                kwargs["usage"] = ModelUsage(
                    input=usage.get("input", 0),
                    output=usage.get("output", 0),
                )
            return span.generation(**kwargs)
        except Exception as exc:
            logger.warning("record_generation failed: %s", exc)
            return None

    def end_trace(self, trace: Any, status: str = "success") -> None:
        """
        Finalise a trace and flush pending events to Langfuse.

        Args:
            trace: Langfuse trace object.
            status: "success" | "error" | "cancelled".
        """
        if self._client is None or trace is None:
            return
        try:
            trace.update(status=status)
            self._client.flush()
        except Exception as exc:
            logger.warning("end_trace failed: %s", exc)

    def score(self, trace: Any, name: str, value: float) -> None:
        """
        Attach a quality score to a trace.

        Args:
            trace: Langfuse trace object.
            name: Score dimension name (e.g. "quality", "self_heal_rate").
            value: Numeric score value.
        """
        if self._client is None or trace is None:
            return
        try:
            self._client.score(
                trace_id=trace.id,
                name=name,
                value=value,
            )
        except Exception as exc:
            logger.warning("score failed: %s", exc)
