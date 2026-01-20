"""
🎨 Digital Merchandiser - Visual & UX (Proxy)
=======================================
This file is now a proxy for the modularized version in ./merchandiser_logic/
Please import from core.growth.merchandiser_logic instead.
"""
import warnings

from .merchandiser_logic import DigitalMerchandiser, DisplayStatus, DisplayType

# Issue a deprecation warning
warnings.warn(
    "core.growth.digital_merchandiser is deprecated. "
    "Use core.growth.merchandiser_logic package instead.",
    DeprecationWarning,
    stacklevel=2
)
