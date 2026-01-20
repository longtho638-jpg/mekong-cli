"""
🏷️ Naming Convention Utilities
==============================
Utilities for handling different naming conventions (kebab-case, snake_case, etc.)
"""

import re


def to_snake_case(name: str) -> str:
    """Convert a string to snake_case."""
    name = re.sub(r'(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub(r'([a-z0-9])([A-Z])', r'\1_\2', name).lower().replace("-", "_").replace(" ", "_")

def to_kebab_case(name: str) -> str:
    """Convert a string to kebab-case."""
    return to_snake_case(name).replace("_", "-")

def to_pascal_case(name: str) -> str:
    """Convert a string to PascalCase."""
    return "".join(word.capitalize() for word in to_snake_case(name).split("_"))

def to_camel_case(name: str) -> str:
    """Convert a string to camelCase."""
    pascal = to_pascal_case(name)
    return pascal[0].lower() + pascal[1:] if pascal else ""
