"""
Content Module - Service Logic (Proxy)
"""
import warnings

from .generator import ContentGenerator

# Issue a deprecation warning
warnings.warn(
    "core.modules.content.services is deprecated. "
    "Use core.modules.content.generator or core.modules.content directly instead.",
    DeprecationWarning,
    stacklevel=2
)
