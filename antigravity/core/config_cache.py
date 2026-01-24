"""
⚡ Config Cache - Fast Configuration Loading
============================================
Caches configuration files in memory and only reloads on file change.

This eliminates repeated file I/O and JSON parsing for frequently accessed configs.

Usage:
    from antigravity.core.config_cache import ConfigCache

    cache = ConfigCache()
    config = cache.load('config.json')  # First call: reads file
    config = cache.load('config.json')  # Subsequent: uses cache
"""

import json
import os
from pathlib import Path
from typing import Any, Dict, Optional
from datetime import datetime


class ConfigCache:
    """
    Configuration cache with file modification time tracking.

    Automatically invalidates cache when files are modified.
    """

    def __init__(self):
        """Initialize empty cache."""
        self._cache: Dict[str, Dict[str, Any]] = {}
        # Format: {filepath: {'data': {...}, 'mtime': timestamp}}

    def load(
        self,
        filepath: str | Path,
        default: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Load configuration from file with caching.

        Args:
            filepath: Path to config file
            default: Default value if file doesn't exist

        Returns:
            Configuration dictionary
        """
        filepath = str(filepath)

        # Check if file exists
        if not os.path.exists(filepath):
            if default is not None:
                return default
            raise FileNotFoundError(f"Config file not found: {filepath}")

        # Get current modification time
        current_mtime = os.path.getmtime(filepath)

        # Check cache
        if filepath in self._cache:
            cached_entry = self._cache[filepath]
            if cached_entry['mtime'] == current_mtime:
                # Cache hit - file unchanged
                return cached_entry['data'].copy()

        # Cache miss or file changed - read from disk
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)

            # Update cache
            self._cache[filepath] = {
                'data': data,
                'mtime': current_mtime,
            }

            return data.copy()

        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in {filepath}: {e}")

    def invalidate(self, filepath: Optional[str | Path] = None):
        """
        Invalidate cache for a specific file or all files.

        Args:
            filepath: File to invalidate, or None to clear entire cache
        """
        if filepath is None:
            self._cache.clear()
        else:
            filepath = str(filepath)
            if filepath in self._cache:
                del self._cache[filepath]

    def refresh(self, filepath: str | Path) -> Dict[str, Any]:
        """
        Force reload a config file, bypassing cache.

        Args:
            filepath: Path to config file

        Returns:
            Fresh configuration data
        """
        self.invalidate(filepath)
        return self.load(filepath)

    def preload(self, *filepaths: str | Path):
        """
        Preload multiple config files into cache.

        Args:
            *filepaths: Config files to preload
        """
        for filepath in filepaths:
            try:
                self.load(filepath)
            except Exception:
                # Skip files that can't be loaded
                pass

    def get_cache_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics.

        Returns:
            Dict with cache stats
        """
        return {
            'cached_files': len(self._cache),
            'files': list(self._cache.keys()),
        }


# Global singleton instance
_global_cache = ConfigCache()


def load_config(
    filepath: str | Path,
    default: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Load configuration using global cache.

    Args:
        filepath: Path to config file
        default: Default value if file doesn't exist

    Returns:
        Configuration dictionary
    """
    return _global_cache.load(filepath, default)


def invalidate_config(filepath: Optional[str | Path] = None):
    """
    Invalidate global config cache.

    Args:
        filepath: File to invalidate, or None to clear all
    """
    _global_cache.invalidate(filepath)


def preload_configs(*filepaths: str | Path):
    """
    Preload configs into global cache.

    Args:
        *filepaths: Config files to preload
    """
    _global_cache.preload(*filepaths)


__all__ = [
    'ConfigCache',
    'load_config',
    'invalidate_config',
    'preload_configs',
]
