"""
👥 Client Portal Service - Core Business Logic (Proxy)
==============================================

This file is now a proxy for the modularized version in ./client_portal/
Please import from core.services.client_portal instead.
"""
import warnings

from .client_portal import (
    Client,
    ClientPortalService,
    ClientStatus,
    Invoice,
    InvoiceStatus,
    Message,
    Project,
    ProjectStatus,
    ProjectTask,
    TaskStatus,
)

# Issue a deprecation warning
warnings.warn(
    "core.services.client_portal_service is deprecated. "
    "Use core.services.client_portal instead.",
    DeprecationWarning,
    stacklevel=2
)
