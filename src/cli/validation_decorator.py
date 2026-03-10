"""
CLI Validation Decorator - Input validation for CLI commands

Usage:
    @validate_input(
        goal=validators.not_empty(max_length=1000),
        recipe=validators.file_exists(),
    )
    def cook(goal: str, recipe: str | None = None):
        ...
"""

from __future__ import annotations

import functools
import inspect
from typing import Any, Callable, Optional

import typer
from rich.console import Console
from rich.panel import Panel

console = Console()


class ValidationError(Exception):
    """Validation error with field information."""

    def __init__(self, field: str, message: str, value: Any = None):
        self.field = field
        self.message = message
        self.value = value
        super().__init__(f"Validation error for '{field}': {message}")


def _format_validation_error(error: ValidationError, func_name: str) -> str:
    """Format validation error as Rich panel."""
    return (
        f"[bold red]Validation Error[/bold red]\n\n"
        f"[yellow]Command:[/yellow] {func_name}\n"
        f"[yellow]Field:[/yellow] {error.field}\n"
        f"[yellow]Issue:[/yellow] {error.message}\n"
        f"[yellow]Value:[/yellow] {repr(error.value) if error.value is not None else 'N/A'}"
    )


def validate_input(**field_validators: Callable) -> Callable:
    """
    Decorator for validating CLI command inputs.

    Args:
        **field_validators: Keyword arguments mapping field names to validator functions

    Returns:
        Decorated function with input validation

    Example:
        @validate_input(
            goal=validators.not_empty(max_length=1000),
            recipe=validators.file_exists(),
            tier=validators.one_of(["free", "pro", "enterprise"]),
        )
        def cook(goal: str, recipe: str | None = None, tier: str = "free"):
            ...
    """

    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            # Get function signature
            sig = inspect.signature(func)
            bound_args = sig.bind(*args, **kwargs)
            bound_args.apply_defaults()

            # Validate each field
            for field_name, validator in field_validators.items():
                if field_name in bound_args.arguments:
                    value = bound_args.arguments[field_name]

                    # Skip validation for None values on optional fields
                    if value is None:
                        continue

                    try:
                        validator(value, field_name=field_name)
                    except ValidationError as e:
                        _print_validation_error(e, func.__name__)
                        raise typer.Exit(code=1) from e
                    except (ValueError, TypeError) as e:
                        error = ValidationError(
                            field=field_name,
                            message=str(e),
                            value=value,
                        )
                        _print_validation_error(error, func.__name__)
                        raise typer.Exit(code=1) from e

            return func(*args, **kwargs)

        return wrapper

    return decorator


def _print_validation_error(error: ValidationError, func_name: str) -> None:
    """Print validation error as Rich panel."""
    message = _format_validation_error(error, func_name)
    console.print(
        Panel(
            message,
            title="⚠️ Validation Error",
            border_style="red",
        )
    )


# ============= Validator Functions =============


def not_empty(max_length: int = 1000) -> Callable:
    """
    Validator: String must not be empty and within max length.

    Args:
        max_length: Maximum allowed string length

    Returns:
        Validator function
    """

    def validate(value: Any, field_name: str) -> None:
        if not isinstance(value, str):
            raise ValidationError(
                field=field_name,
                message=f"Must be a string, got {type(value).__name__}",
                value=value,
            )
        if not value.strip():
            raise ValidationError(
                field=field_name,
                message="Cannot be empty or whitespace only",
                value=value,
            )
        if len(value) > max_length:
            raise ValidationError(
                field=field_name,
                message=f"Exceeds maximum length of {max_length} characters (got {len(value)})",
                value=value,
            )

    return validate


def file_exists(check_readable: bool = True) -> Callable:
    """
    Validator: File path must exist and optionally be readable.

    Args:
        check_readable: Whether to check if file is readable

    Returns:
        Validator function
    """

    def validate(value: Any, field_name: str) -> None:
        from pathlib import Path

        if isinstance(value, str):
            value = Path(value)

        if not value.exists():
            raise ValidationError(
                field=field_name,
                message=f"File not found: {value}",
                value=str(value),
            )
        if not value.is_file():
            raise ValidationError(
                field=field_name,
                message=f"Not a file: {value}",
                value=str(value),
            )
        if check_readable:
            try:
                with open(value, "r"):
                    pass
            except (IOError, PermissionError) as e:
                raise ValidationError(
                    field=field_name,
                    message=f"File not readable: {e}",
                    value=str(value),
                )

    return validate


def directory_exists() -> Callable:
    """
    Validator: Directory path must exist.

    Returns:
        Validator function
    """

    def validate(value: Any, field_name: str) -> None:
        from pathlib import Path

        if isinstance(value, str):
            value = Path(value)

        if not value.exists():
            raise ValidationError(
                field=field_name,
                message=f"Directory not found: {value}",
                value=str(value),
            )
        if not value.is_dir():
            raise ValidationError(
                field=field_name,
                message=f"Not a directory: {value}",
                value=str(value),
            )

    return validate


def valid_email() -> Callable:
    """
    Validator: Email must be RFC 5322 compliant.

    Returns:
        Validator function
    """
    import re

    pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"

    def validate(value: Any, field_name: str) -> None:
        if not isinstance(value, str):
            raise ValidationError(
                field=field_name,
                message=f"Must be a string, got {type(value).__name__}",
                value=value,
            )
        if not re.match(pattern, value):
            raise ValidationError(
                field=field_name,
                message="Invalid email format",
                value=value,
            )

    return validate


def valid_url(require_https: bool = True) -> Callable:
    """
    Validator: URL must be valid format.

    Args:
        require_https: Whether HTTPS is required

    Returns:
        Validator function
    """
    import re

    pattern = r"^https?://[^\s/$.?#].[^\s]*$"

    def validate(value: Any, field_name: str) -> None:
        if not isinstance(value, str):
            raise ValidationError(
                field=field_name,
                message=f"Must be a string, got {type(value).__name__}",
                value=value,
            )
        if not re.match(pattern, value):
            raise ValidationError(
                field=field_name,
                message="Invalid URL format",
                value=value,
            )
        if require_https and not value.startswith("https://"):
            raise ValidationError(
                field=field_name,
                message="HTTPS URL required",
                value=value,
            )

    return validate


def one_of(choices: list[str]) -> Callable:
    """
    Validator: Value must be one of the allowed choices.

    Args:
        choices: List of allowed values

    Returns:
        Validator function
    """

    def validate(value: Any, field_name: str) -> None:
        if value not in choices:
            raise ValidationError(
                field=field_name,
                message=f"Must be one of: {', '.join(choices)}",
                value=value,
            )

    return validate


def license_key_format() -> Callable:
    """
    Validator: License key must match RPP-/REP- format.

    Returns:
        Validator function
    """
    import re

    pattern = r"^(RPP|REP)-[A-Za-z0-9]{16,}$"

    def validate(value: Any, field_name: str) -> None:
        if not isinstance(value, str):
            raise ValidationError(
                field=field_name,
                message=f"Must be a string, got {type(value).__name__}",
                value=value,
            )
        if not re.match(pattern, value):
            raise ValidationError(
                field=field_name,
                message="License key must be in format: RPP-XXXXXXXXXXXXXXXX or REP-XXXXXXXXXXXXXXXX (16+ alphanumeric chars)",
                value=value,
            )

    return validate


def port_number() -> Callable:
    """
    Validator: Port must be 1-65535.

    Returns:
        Validator function
    """

    def validate(value: Any, field_name: str) -> None:
        if not isinstance(value, int):
            raise ValidationError(
                field=field_name,
                message=f"Must be an integer, got {type(value).__name__}",
                value=value,
            )
        if value < 1 or value > 65535:
            raise ValidationError(
                field=field_name,
                message=f"Port must be between 1 and 65535, got {value}",
                value=value,
            )

    return validate


def positive_int(max_value: Optional[int] = None) -> Callable:
    """
    Validator: Integer must be positive.

    Args:
        max_value: Optional maximum value

    Returns:
        Validator function
    """

    def validate(value: Any, field_name: str) -> None:
        if not isinstance(value, int):
            raise ValidationError(
                field=field_name,
                message=f"Must be an integer, got {type(value).__name__}",
                value=value,
            )
        if value <= 0:
            raise ValidationError(
                field=field_name,
                message="Must be a positive integer",
                value=value,
            )
        if max_value and value > max_value:
            raise ValidationError(
                field=field_name,
                message=f"Must be at most {max_value}, got {value}",
                value=value,
            )

    return validate


__all__ = [
    "validate_input",
    "ValidationError",
    "not_empty",
    "file_exists",
    "directory_exists",
    "valid_email",
    "valid_url",
    "one_of",
    "license_key_format",
    "port_number",
    "positive_int",
]
