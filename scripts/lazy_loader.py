"""
🚀 Lazy Loader - Deferred Import System
========================================
Speeds up CLI startup by deferring heavy imports until actually needed.

Usage:
    from scripts.lazy_loader import LazyImporter

    # Create lazy importer
    np = LazyImporter('numpy', 'np')
    torch = LazyImporter('torch')

    # Import happens only when first used
    result = np.array([1, 2, 3])  # numpy imported here
"""

import importlib
import sys
from typing import Any, Optional


class LazyImporter:
    """
    Lazy import wrapper that defers module import until first attribute access.

    This reduces startup time by avoiding heavy imports until they're actually needed.
    """

    def __init__(self, module_name: str, attribute: Optional[str] = None):
        """
        Initialize lazy importer.

        Args:
            module_name: Full module name (e.g., 'numpy', 'torch.nn')
            attribute: Optional attribute to access (e.g., 'np' for numpy)
        """
        self._module_name = module_name
        self._attribute = attribute
        self._module = None
        self._import_attempted = False

    def _load_module(self) -> Any:
        """Load the module on first access."""
        if not self._import_attempted:
            self._import_attempted = True
            try:
                self._module = importlib.import_module(self._module_name)
                if self._attribute:
                    self._module = getattr(self._module, self._attribute)
            except ImportError as e:
                # Module not available - this is OK for optional dependencies
                self._module = None
                print(
                    f"Warning: Optional module '{self._module_name}' not available: {e}",
                    file=sys.stderr
                )
        return self._module

    def __getattr__(self, name: str) -> Any:
        """Proxy attribute access to the actual module."""
        module = self._load_module()
        if module is None:
            raise ImportError(
                f"Module '{self._module_name}' is not installed. "
                f"Install it with: pip install {self._module_name.split('.')[0]}"
            )
        return getattr(module, name)

    def __call__(self, *args, **kwargs) -> Any:
        """Allow calling the module directly if it's callable."""
        module = self._load_module()
        if module is None:
            raise ImportError(
                f"Module '{self._module_name}' is not installed."
            )
        return module(*args, **kwargs)

    def __repr__(self) -> str:
        """String representation."""
        status = "loaded" if self._module is not None else "not loaded"
        return f"<LazyImporter({self._module_name}) [{status}]>"


class LazyModule:
    """
    Context manager for lazy module imports.

    Usage:
        with LazyModule('numpy') as np:
            array = np.array([1, 2, 3])
    """

    def __init__(self, module_name: str):
        self.module_name = module_name
        self.module = None

    def __enter__(self):
        self.module = importlib.import_module(self.module_name)
        return self.module

    def __exit__(self, exc_type, exc_val, exc_tb):
        # Clean up if needed
        pass


def lazy_import(module_name: str, attribute: Optional[str] = None) -> LazyImporter:
    """
    Factory function for creating lazy importers.

    Args:
        module_name: Module to import
        attribute: Optional attribute to extract

    Returns:
        LazyImporter instance

    Example:
        >>> np = lazy_import('numpy', 'np')
        >>> # numpy not imported yet
        >>> arr = np.array([1, 2, 3])  # imported here
    """
    return LazyImporter(module_name, attribute)


# Pre-configured lazy importers for common heavy modules
numpy = LazyImporter('numpy')
np = numpy

torch = LazyImporter('torch')
transformers = LazyImporter('transformers')
sklearn = LazyImporter('sklearn')
tensorflow = LazyImporter('tensorflow')
tf = tensorflow
pandas = LazyImporter('pandas')
pd = pandas


__all__ = [
    'LazyImporter',
    'LazyModule',
    'lazy_import',
    'numpy',
    'np',
    'torch',
    'transformers',
    'sklearn',
    'tensorflow',
    'tf',
    'pandas',
    'pd',
]
