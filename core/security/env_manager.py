"""
🔐 Legacy Environment Manager Proxy
==================================
This file exists for backward compatibility.
Please use `from core.security.env import validate_environment` instead.
"""

from .env import (
    EnvironmentType,
    EnvironmentVariable,
    SecureEnvironmentManager,
    VariableType,
    validate_environment,
)
