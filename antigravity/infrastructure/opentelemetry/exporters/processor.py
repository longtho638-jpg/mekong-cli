"""
OpenTelemetry Export Processor Module
=====================================

Background processor for batching and exporting telemetry data.
"""

import time
import logging
from typing import Dict, Any, List, Optional
from collections import deque

from .base import BaseExporter

logger = logging.getLogger(__name__)


class ExportProcessor:
    """Background processor for batching and exporting telemetry data.

    Manages export queue and handles batch processing with proper error handling.
    """

    def __init__(
        self,
        exporters: Optional[List[BaseExporter]] = None,
        batch_size: int = 100,
        export_interval_seconds: int = 60
    ):
        """Initialize export processor.

        Args:
            exporters: List of exporters to use
            batch_size: Maximum spans per batch
            export_interval_seconds: Seconds between export cycles
        """
        self.exporters = exporters or []
        self.batch_size = batch_size
        self.export_interval_seconds = export_interval_seconds
        self.export_queue: deque = deque(maxlen=1000)
        self.shutdown_requested = False

    def add_span(self, span_dict: Dict[str, Any]) -> None:
        """Add span to export queue.

        Args:
            span_dict: Span dictionary to queue for export
        """
        self.export_queue.append(span_dict)

    def process_export_batch(self) -> int:
        """Process a batch of spans from the queue.

        Returns:
            Number of spans processed
        """
        if not self.export_queue:
            return 0

        # Collect batch
        batch: List[Dict[str, Any]] = []
        while self.export_queue and len(batch) < self.batch_size:
            batch.append(self.export_queue.popleft())

        if not batch:
            return 0

        # Export to all configured exporters
        for exporter in self.exporters:
            try:
                success = exporter.export_spans(batch)
                if success:
                    # Mark spans as exported
                    for span_dict in batch:
                        span_dict["exported"] = True
                    logger.debug(
                        f"Exported {len(batch)} spans via "
                        f"{exporter.__class__.__name__}"
                    )
                else:
                    logger.warning(
                        f"Failed to export batch via "
                        f"{exporter.__class__.__name__}"
                    )
            except Exception as e:
                logger.error(
                    f"Error exporting via {exporter.__class__.__name__}: {e}"
                )

        return len(batch)

    def run_export_loop(self) -> None:
        """Run export processing loop.

        This method is designed to run in a background thread.
        """
        while not self.shutdown_requested:
            try:
                time.sleep(self.export_interval_seconds)

                # Process export batch
                exported_count = self.process_export_batch()

                if exported_count > 0:
                    logger.info(f"Processed export batch of {exported_count} spans")

            except Exception as e:
                logger.error(f"Error in export processor loop: {e}")

    def shutdown(self) -> None:
        """Signal shutdown to export loop."""
        self.shutdown_requested = True

        # Flush remaining spans
        while self.export_queue:
            self.process_export_batch()

        logger.info("Export processor shutdown complete")


__all__ = ["ExportProcessor"]
