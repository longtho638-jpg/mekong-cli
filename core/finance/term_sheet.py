"""
📋 Term Sheet Analyzer - Fundraising Intelligence (Proxy)
==================================================

This file is now a proxy for the modularized version in ./term_sheet_opt/
Please import from antigravity.core.finance.term_sheet_opt instead.
"""
import warnings

from .term_sheet_opt import (
    CapTableEntry,
    DealType,
    TermCategory,
    TermSheet,
    TermSheetAnalyzer,
    TermSheetTerm,
)

# Issue a deprecation warning
warnings.warn(
    "core.finance.term_sheet is deprecated. "
    "Use core.finance.term_sheet_opt instead.",
    DeprecationWarning,
    stacklevel=2
)
