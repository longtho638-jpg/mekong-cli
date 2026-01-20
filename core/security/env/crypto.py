"""
🔐 Environment Variable Cryptography
====================================
Secret generation and cryptographic utilities for environment variables.
"""

import secrets

from .manager import EnvironmentVariable, VariableType


def generate_secret(var_def: EnvironmentVariable) -> str:
    """Generate a secure secret value."""
    if var_def.var_type == VariableType.JWT_SECRET:
        return secrets.token_urlsafe(32)
    elif var_def.var_type == VariableType.API_KEY:
        return f"ak_{secrets.token_urlsafe(24)}"
    else:
        return secrets.token_urlsafe(32)
