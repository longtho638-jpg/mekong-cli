"""
👥 Client Experience - WOW for Agency Clients (Proxy)
===============================================
This file is now a proxy for the modularized version in ./experience/
Please import from core.crm.experience instead.
"""
import warnings

from .experience import Client, ClientExperience, Project, ProjectStatus, Report, ServiceType

# Issue a deprecation warning
warnings.warn(
    "core.crm.client_experience is deprecated. "
    "Use core.crm.experience instead.",
    DeprecationWarning,
    stacklevel=2
)
