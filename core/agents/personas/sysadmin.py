"""
🔧 Systems Administrator - System Operations (Proxy)
==============================================
This file is now a proxy for the modularized version in ./sysadmin/
Please import from core.agents.personas.sysadmin instead.
"""
import warnings

from .sysadmin import BackupStatus, ServerStatus, ServerType, SysAdmin

# Issue a deprecation warning
warnings.warn(
    "core.agents.personas.sysadmin is deprecated. "
    "Use core.agents.personas.sysadmin package instead.",
    DeprecationWarning,
    stacklevel=2
)
