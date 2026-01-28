"""
CDN Optimization Service
Handles asset optimization (minification, compression) before upload or serving.
"""

import gzip
import logging
import os
import shutil
from typing import List, Optional

logger = logging.getLogger(__name__)

class OptimizationService:
    """Service for optimizing static assets."""

    def __init__(self):
        pass

    def compress_file(self, file_path: str, output_path: Optional[str] = None) -> Optional[str]:
        """
        Compress a file using GZIP.

        Args:
            file_path: Path to the source file.
            output_path: Path to the destination file. If None, appends .gz to source.

        Returns:
            Path to compressed file or None if failure.
        """
        if not os.path.exists(file_path):
            logger.error(f"File not found: {file_path}")
            return None

        if output_path is None:
            output_path = f"{file_path}.gz"

        try:
            with open(file_path, 'rb') as f_in:
                with gzip.open(output_path, 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)
            logger.info(f"Compressed {file_path} to {output_path}")
            return output_path
        except Exception as e:
            logger.error(f"Compression failed for {file_path}: {str(e)}")
            return None

    def optimize_assets(self, directory: str, extensions: List[str] = None) -> dict:
        """
        Optimize all matching assets in a directory.

        Args:
            directory: Root directory to scan.
            extensions: List of extensions to process (e.g. ['.js', '.css']).

        Returns:
            Stats dict with count of processed files.
        """
        if extensions is None:
            extensions = ['.js', '.css', '.html', '.svg', '.json']

        stats = {
            "processed": 0,
            "failed": 0,
            "bytes_saved": 0
        }

        for root, _, files in os.walk(directory):
            for file in files:
                _, ext = os.path.splitext(file)
                if ext.lower() in extensions:
                    file_path = os.path.join(root, file)
                    original_size = os.path.getsize(file_path)

                    compressed_path = self.compress_file(file_path)

                    if compressed_path:
                        compressed_size = os.path.getsize(compressed_path)
                        stats["processed"] += 1
                        stats["bytes_saved"] += (original_size - compressed_size)
                    else:
                        stats["failed"] += 1

        return stats

    # Future: Add image optimization (WebP/AVIF conversion) using Pillow or similar
    # Future: Add minification for JS/CSS using external tools or libraries
