"""
Common string and email validation logic.
"""
import re


def validate_email(email: str) -> bool:
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, email))

def validate_phone(phone: str) -> bool:
    pattern = r"^\+?[\d\s\-]{7,20}$"
    return bool(re.match(pattern, phone))

def validate_required_string(value: str, min_length: int = 1) -> bool:
    return bool(value and len(value.strip()) >= min_length)
