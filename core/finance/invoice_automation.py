"""
💳 Invoice Automation - Automated Invoicing (Proxy)
=============================================
This file is now a proxy for the modularized version in ./invoice_logic/
Please import from core.finance.invoice_logic instead.
"""
import warnings

from .invoice_logic import InvoiceAutomation, InvoiceStatus, InvoiceType

# Issue a deprecation warning
warnings.warn(
    "core.finance.invoice_automation is deprecated. "
    "Use core.finance.invoice_logic instead.",
    DeprecationWarning,
    stacklevel=2
)
