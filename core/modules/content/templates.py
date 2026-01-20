"""
Content templates for various pillars and niches (Proxy).
"""
import warnings

from .templates_data.pillars import get_default_templates

# Issue a deprecation warning
warnings.warn(
    "core.modules.content.templates is deprecated. "
    "Use core.modules.content.templates_data instead.",
    DeprecationWarning,
    stacklevel=2
)
