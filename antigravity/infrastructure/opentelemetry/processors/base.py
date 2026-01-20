"""
OpenTelemetry Base Processor Module
===================================

Abstract base class for background processors.
"""

import time
import logging
import threading
from typing import Optional
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)


class BaseProcessor(ABC):
    """Abstract base class for background processors.

    Provides common lifecycle management for background processing loops.
    """

    def __init__(self, name: str, interval_seconds: float = 1.0):
        """Initialize processor.

        Args:
            name: Processor name for logging
            interval_seconds: Sleep interval between processing cycles
        """
        self.name = name
        self.interval_seconds = interval_seconds
        self.shutdown_requested = False
        self._thread: Optional[threading.Thread] = None
        self._lock = threading.Lock()

    @abstractmethod
    def process(self) -> None:
        """Execute one processing cycle. Subclasses must implement."""
        pass

    def run_loop(self) -> None:
        """Run the processing loop until shutdown requested."""
        logger.info(f"{self.name} started")

        while not self.shutdown_requested:
            try:
                self.process()
            except Exception as e:
                logger.error(f"Error in {self.name}: {e}")

            time.sleep(self.interval_seconds)

        logger.info(f"{self.name} stopped")

    def start(self) -> threading.Thread:
        """Start processor in background thread.

        Returns:
            The started thread
        """
        self._thread = threading.Thread(
            target=self.run_loop,
            daemon=True,
            name=self.name
        )
        self._thread.start()
        return self._thread

    def shutdown(self) -> None:
        """Signal shutdown to processor loop."""
        self.shutdown_requested = True
        logger.info(f"{self.name} shutdown requested")


__all__ = ["BaseProcessor"]
