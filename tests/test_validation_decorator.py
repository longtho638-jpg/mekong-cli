"""
Tests for Validation Decorator

Tests cover:
- Decorator blocks invalid input
- Error messages are Rich-formatted
- Works with optional parameters
- All validator functions work correctly
"""

import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock

from src.cli.validation_decorator import (
    validate_input,
    ValidationError,
    not_empty,
    file_exists,
    directory_exists,
    valid_email,
    valid_url,
    one_of,
    license_key_format,
    port_number,
    positive_int,
)


class TestValidateInputDecorator:
    """Test @validate_input decorator."""

    def test_valid_input_passes(self):
        """Test that valid input passes validation."""

        @validate_input(name=not_empty(max_length=100))
        def test_func(name: str):
            return f"Hello {name}"

        result = test_func(name="World")
        assert result == "Hello World"

    def test_invalid_input_raises(self):
        """Test that invalid input raises ValidationError."""
        import typer

        @validate_input(name=not_empty(max_length=100))
        def test_func(name: str):
            return f"Hello {name}"

        # The decorator catches ValidationError and raises typer.Exit
        with pytest.raises(typer.Exit) as exc_info:
            test_func(name="")
        assert exc_info.value.exit_code == 1

    def test_multiple_validators(self):
        """Test multiple validators on different fields."""

        @validate_input(
            name=not_empty(max_length=50),
            email=valid_email(),
        )
        def test_func(name: str, email: str):
            return f"{name} <{email}>"

        result = test_func(name="Test", email="test@example.com")
        assert "Test <test@example.com>" in result

    def test_optional_parameters(self):
        """Test that optional parameters work correctly."""

        @validate_input(
            required_field=not_empty(max_length=100),
            optional_field=not_empty(max_length=100),
        )
        def test_func(required_field: str, optional_field: str | None = None):
            return optional_field

        # None should skip validation
        result = test_func(required_field="valid", optional_field=None)
        assert result is None

    def test_typer_exit_on_validation_error(self):
        """Test that validation errors trigger typer.Exit."""
        import typer

        @validate_input(name=not_empty(max_length=100))
        def test_func(name: str):
            return name

        with pytest.raises(typer.Exit) as exc_info:
            test_func(name="")
        assert exc_info.value.exit_code == 1


class TestNotEmptyValidator:
    """Test not_empty validator."""

    def test_valid_string(self):
        """Test valid non-empty string."""
        validator = not_empty(max_length=100)
        validator("Hello", "field")  # Should not raise

    def test_empty_string(self):
        """Test that empty string raises error."""
        validator = not_empty(max_length=100)
        with pytest.raises(ValidationError) as exc_info:
            validator("", "field")
        assert "Cannot be empty" in str(exc_info.value)

    def test_whitespace_only(self):
        """Test that whitespace-only string raises error."""
        validator = not_empty(max_length=100)
        with pytest.raises(ValidationError) as exc_info:
            validator("   ", "field")
        assert "Cannot be empty" in str(exc_info.value)

    def test_exceeds_max_length(self):
        """Test that string exceeding max_length raises error."""
        validator = not_empty(max_length=10)
        with pytest.raises(ValidationError) as exc_info:
            validator("x" * 20, "field")
        assert "Exceeds maximum length" in str(exc_info.value)

    def test_not_string(self):
        """Test that non-string raises error."""
        validator = not_empty(max_length=100)
        with pytest.raises(ValidationError) as exc_info:
            validator(123, "field")
        assert "Must be a string" in str(exc_info.value)


class TestFileExistsValidator:
    """Test file_exists validator."""

    def test_file_exists(self, tmp_path):
        """Test that existing file passes."""
        test_file = tmp_path / "test.txt"
        test_file.write_text("content")

        validator = file_exists()
        validator(test_file, "field")  # Should not raise

    def test_file_not_exists(self, tmp_path):
        """Test that non-existent file raises error."""
        non_existent = tmp_path / "not_found.txt"

        validator = file_exists()
        with pytest.raises(ValidationError) as exc_info:
            validator(non_existent, "field")
        assert "File not found" in str(exc_info.value)

    def test_directory_not_file(self, tmp_path):
        """Test that directory raises error."""
        validator = file_exists()
        with pytest.raises(ValidationError) as exc_info:
            validator(tmp_path, "field")
        assert "Not a file" in str(exc_info.value)


class TestDirectoryExistsValidator:
    """Test directory_exists validator."""

    def test_directory_exists(self, tmp_path):
        """Test that existing directory passes."""
        validator = directory_exists()
        validator(tmp_path, "field")  # Should not raise

    def test_not_directory(self, tmp_path):
        """Test that file (not directory) raises error."""
        test_file = tmp_path / "file.txt"
        test_file.write_text("content")

        validator = directory_exists()
        with pytest.raises(ValidationError) as exc_info:
            validator(test_file, "field")
        assert "Not a directory" in str(exc_info.value)


class TestEmailValidator:
    """Test valid_email validator."""

    def test_valid_email(self):
        """Test valid email addresses."""
        validator = valid_email()
        valid_emails = [
            "user@example.com",
            "test.user@company.org",
            "admin+test@subdomain.example.com",
        ]
        for email in valid_emails:
            validator(email, "field")  # Should not raise

    def test_invalid_email(self):
        """Test invalid email addresses."""
        validator = valid_email()
        invalid_emails = [
            "not-an-email",
            "@example.com",
            "user@",
            "user@domain",
        ]
        for email in invalid_emails:
            with pytest.raises(ValidationError) as exc_info:
                validator(email, "field")
            assert "Invalid email format" in str(exc_info.value)


class TestUrlValidator:
    """Test valid_url validator."""

    def test_valid_https_url(self):
        """Test valid HTTPS URL."""
        validator = valid_url(require_https=True)
        validator("https://example.com", "field")  # Should not raise

    def test_valid_http_url(self):
        """Test valid HTTP URL when HTTPS not required."""
        validator = valid_url(require_https=False)
        validator("http://example.com", "field")  # Should not raise

    def test_invalid_url(self):
        """Test invalid URL format."""
        validator = valid_url(require_https=False)
        with pytest.raises(ValidationError) as exc_info:
            validator("not-a-url", "field")
        assert "Invalid URL format" in str(exc_info.value)

    def test_http_when_https_required(self):
        """Test HTTP URL raises error when HTTPS required."""
        validator = valid_url(require_https=True)
        with pytest.raises(ValidationError) as exc_info:
            validator("http://example.com", "field")
        assert "HTTPS URL required" in str(exc_info.value)


class TestOneOfValidator:
    """Test one_of validator."""

    def test_valid_choice(self):
        """Test valid choice from list."""
        validator = one_of(["red", "green", "blue"])
        validator("red", "field")  # Should not raise
        validator("green", "field")  # Should not raise

    def test_invalid_choice(self):
        """Test invalid choice raises error."""
        validator = one_of(["red", "green", "blue"])
        with pytest.raises(ValidationError) as exc_info:
            validator("yellow", "field")
        assert "Must be one of" in str(exc_info.value)


class TestLicenseKeyFormatValidator:
    """Test license_key_format validator."""

    def test_valid_rpp_prefix(self):
        """Test valid RPP- prefix."""
        validator = license_key_format()
        validator("RPP-ABC123DEF456GHI7", "field")  # Should not raise

    def test_valid_rep_prefix(self):
        """Test valid REP- prefix."""
        validator = license_key_format()
        validator("REP-XYZ789ABC123DEF4", "field")  # Should not raise

    def test_invalid_no_prefix(self):
        """Test that key without prefix raises error."""
        validator = license_key_format()
        with pytest.raises(ValidationError) as exc_info:
            validator("ABC123DEF456GHI7", "field")
        assert "RPP-XXXXXXXXXXXXXXXX or REP-XXXXXXXXXXXXXXXX" in str(exc_info.value)

    def test_invalid_too_short(self):
        """Test that key too short raises error."""
        validator = license_key_format()
        with pytest.raises(ValidationError) as exc_info:
            validator("RPP-SHORT", "field")
        assert "RPP-XXXXXXXXXXXXXXXX or REP-XXXXXXXXXXXXXXXX" in str(exc_info.value)


class TestPortNumberValidator:
    """Test port_number validator."""

    def test_valid_port(self):
        """Test valid port numbers."""
        validator = port_number()
        validator(80, "field")  # Should not raise
        validator(443, "field")  # Should not raise
        validator(8080, "field")  # Should not raise

    def test_port_zero(self):
        """Test that port 0 raises error."""
        validator = port_number()
        with pytest.raises(ValidationError) as exc_info:
            validator(0, "field")
        assert "Port must be between 1 and 65535" in str(exc_info.value)

    def test_port_too_high(self):
        """Test that port > 65535 raises error."""
        validator = port_number()
        with pytest.raises(ValidationError) as exc_info:
            validator(70000, "field")
        assert "Port must be between 1 and 65535" in str(exc_info.value)

    def test_not_integer(self):
        """Test that non-integer raises error."""
        validator = port_number()
        with pytest.raises(ValidationError) as exc_info:
            validator("8080", "field")
        assert "Must be an integer" in str(exc_info.value)


class TestPositiveIntValidator:
    """Test positive_int validator."""

    def test_valid_positive(self):
        """Test valid positive integer."""
        validator = positive_int()
        validator(1, "field")  # Should not raise
        validator(100, "field")  # Should not raise

    def test_zero(self):
        """Test that zero raises error."""
        validator = positive_int()
        with pytest.raises(ValidationError) as exc_info:
            validator(0, "field")
        assert "Must be a positive integer" in str(exc_info.value)

    def test_negative(self):
        """Test that negative raises error."""
        validator = positive_int()
        with pytest.raises(ValidationError) as exc_info:
            validator(-5, "field")
        assert "Must be a positive integer" in str(exc_info.value)

    def test_exceeds_max(self):
        """Test that value > max_value raises error."""
        validator = positive_int(max_value=100)
        with pytest.raises(ValidationError) as exc_info:
            validator(150, "field")
        assert "Must be at most" in str(exc_info.value)
