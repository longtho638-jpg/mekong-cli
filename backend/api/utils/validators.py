"""
API Validators (Proxy).
=====================
This file is now a proxy for the modularized version in ./validation_logic/
Please import from backend.api.utils.validation_logic instead.
"""
import warnings

from .validation_logic import (
    sanitize_filename,
    sanitize_html,
    sanitize_sql,
    sanitize_user_input,
    validate_amount,
    validate_email,
    validate_items_match_total,
    validate_json_depth,
    validate_phone,
    validate_required_string,
    validate_string_length,
    validate_url,
)

# Issue a deprecation warning
warnings.warn(
    "backend.api.utils.validators is deprecated. "
    "Use backend.api.utils.validation_logic instead.",
    DeprecationWarning,
    stacklevel=2
)

__all__ = [
    'validate_email',
    'validate_phone',
    'validate_required_string',
    'validate_amount',
    'validate_items_match_total',
    'sanitize_filename',
    'sanitize_html',
    'sanitize_sql',
    'sanitize_user_input',
    'validate_json_depth',
    'validate_string_length',
    'validate_url',
]
