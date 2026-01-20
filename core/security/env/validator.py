"""
✅ Environment Variable Validation
==================================
Type conversion and validation logic for environment variables.
"""

import re
from typing import Any

from .manager import EnvironmentVariable, VariableType


def convert_type(value: str, var_type: VariableType) -> Any:
    """Convert string value to appropriate type."""
    if var_type == VariableType.STRING:
        return value
    elif var_type == VariableType.INTEGER:
        return int(value)
    elif var_type == VariableType.FLOAT:
        return float(value)
    elif var_type == VariableType.BOOLEAN:
        return value.lower() in ("true", "1", "yes", "on")
    elif var_type == VariableType.URL:
        if not value.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")
        return value
    elif var_type == VariableType.EMAIL:
        if "@" not in value:
            raise ValueError("Invalid email format")
        return value
    elif var_type in (VariableType.API_KEY, VariableType.JWT_SECRET):
        return value
    elif var_type == VariableType.DATABASE_URL:
        if not value.startswith(("postgresql://", "mysql://", "sqlite://")):
            raise ValueError("Invalid database URL format")
        return value
    return value

def validate_format(value: Any, var_def: EnvironmentVariable) -> bool:
    """Validate the format and length of a variable value."""
    str_value = str(value)

    # Pattern validation
    if var_def.validation_pattern:
        if not re.match(var_def.validation_pattern, str_value):
            return False

    # Length validation
    if isinstance(value, str) or isinstance(value, bytes):
        if var_def.min_length and len(str_value) < var_def.min_length:
            return False
        if var_def.max_length and len(str_value) > var_def.max_length:
            return False

    return True
