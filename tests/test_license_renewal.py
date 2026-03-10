"""
License Renewal Flow Tests — ROIaaS Phase 6d

Tests for renewal commands, deep linking, and post-renewal sync.
"""

from unittest.mock import patch, MagicMock

import sys
sys.path.insert(0, '/Users/macbookprom1/mekong-cli')

from src.lib.quota_error_messages import get_renewal_url, format_license_expired_with_renewal


class TestGetRenewalUrl:
    """Tests for get_renewal_url function."""

    def test_renewal_url_base_without_params(self):
        """Returns base URL when no params provided."""
        url = get_renewal_url()
        assert url == "https://raas.mekong.dev/renew"

    def test_renewal_url_with_key_id(self):
        """Includes key_id in query params."""
        url = get_renewal_url(key_id="test-key-123")
        assert "key_id=test-key-123" in url
        assert "https://raas.mekong.dev/renew?" in url

    def test_renewal_url_with_tier(self):
        """Includes tier in query params."""
        url = get_renewal_url(tier="pro")
        assert "tier=pro" in url

    def test_renewal_url_with_email(self):
        """Includes email in query params."""
        url = get_renewal_url(email="user@example.com")
        assert "email=user%40example.com" in url or "email=user@example.com" in url

    def test_renewal_url_with_all_params(self):
        """Includes all params correctly."""
        url = get_renewal_url(key_id="key-123", tier="pro", email="user@example.com")
        assert "key_id=key-123" in url
        assert "tier=pro" in url
        assert "email=" in url

    def test_renewal_url_param_order(self):
        """URL has correct format with & separators."""
        url = get_renewal_url(key_id="k1", tier="pro")
        assert "?" in url
        assert "&" in url or url.count("=") == 2


class TestFormatLicenseExpiredWithRenewal:
    """Tests for format_license_expired_with_renewal function."""

    def test_format_with_date_and_url(self):
        """Formats correctly with date and URL."""
        msg = format_license_expired_with_renewal(
            expiry_date="2025-12-31",
            renewal_url="https://raas.mekong.dev/renew?key=123"
        )

        assert "2025-12-31" in msg
        assert "raas.mekong.dev/renew" in msg
        assert "expired" in msg.lower()

    def test_format_with_empty_date(self):
        """Uses default message when date is empty."""
        msg = format_license_expired_with_renewal(
            expiry_date="",
            renewal_url="https://raas.mekong.dev/renew"
        )

        assert "an unknown date" in msg

    def test_format_with_empty_url(self):
        """Uses default URL when empty."""
        msg = format_license_expired_with_renewal(
            expiry_date="2025-12-31",
            renewal_url=""
        )

        assert "raas.mekong.dev/renew" in msg

    def test_format_contains_required_elements(self):
        """Contains all required UI elements."""
        msg = format_license_expired_with_renewal(
            expiry_date="2025-12-31",
            renewal_url="https://raas.mekong.dev/renew"
        )

        assert "╔" in msg and "╝" in msg  # Boxed format
        assert "⏰" in msg  # Emoji
        assert "expired" in msg.lower()
        assert "renew" in msg.lower()
        assert "support@raas.mekong.dev" in msg

    def test_format_strips_whitespace(self):
        """Strips leading/trailing whitespace."""
        msg = format_license_expired_with_renewal(
            expiry_date="2025-12-31",
            renewal_url="https://raas.mekong.dev/renew"
        )

        assert msg == msg.strip()
        assert not msg.startswith("\n")
        assert not msg.endswith("\n")


class TestRenewalCommands:
    """Tests for renewal CLI commands."""

    @patch('src.commands.license_renewal.get_license_gate')
    @patch('src.commands.license_renewal.webbrowser.open')
    def test_renewal_open_with_auto(self, mock_open, mock_get_gate):
        """renewal_open --auto opens browser with deep link."""
        mock_gate = MagicMock()
        mock_gate._key_id = "test-key"
        mock_gate._license_tier = "pro"
        mock_get_gate.return_value = mock_gate

        from typer.testing import CliRunner
        from src.commands.license_renewal import app

        runner = CliRunner()
        result = runner.invoke(app, ["renewal-open", "--auto"])

        assert result.exit_code == 0
        assert mock_open.called
        called_url = mock_open.call_args[0][0]
        assert "key_id=test-key" in called_url
        assert "tier=pro" in called_url

    @patch('src.commands.license_renewal.get_license_gate')
    def test_renewal_open_without_auto(self, mock_get_gate):
        """renewal_open without --auto shows URL only."""
        mock_gate = MagicMock()
        mock_gate._key_id = "test-key"
        mock_gate._license_tier = "pro"
        mock_get_gate.return_value = mock_gate

        from typer.testing import CliRunner
        from src.commands.license_renewal import app

        runner = CliRunner()
        result = runner.invoke(app, ["renewal-open"])

        assert result.exit_code == 0
        assert "Use --auto to open in browser" in result.stdout

    @patch('src.commands.license_renewal.get_license_gate')
    def test_renewal_status_no_license(self, mock_get_gate):
        """renewal_status shows error when no license."""
        mock_gate = MagicMock()
        mock_gate.has_license = False
        mock_get_gate.return_value = mock_gate

        from typer.testing import CliRunner
        from src.commands.license_renewal import app

        runner = CliRunner()
        result = runner.invoke(app, ["renewal-status"])

        assert result.exit_code == 1
        assert "No license" in result.stdout

    @patch('src.commands.license_renewal.get_license_gate')
    def test_renewal_status_expired(self, mock_get_gate):
        """renewal_status shows renewal URL for expired license."""
        mock_gate = MagicMock()
        mock_gate.has_license = True
        mock_gate.license_key = "raas-pro-key-sig"
        mock_gate.validate_remote.return_value = (
            False,
            {"status": "expired", "tier": "pro", "key_id": "key-123", "expires_at": 1735689600},
            "License expired"
        )
        mock_get_gate.return_value = mock_gate

        from typer.testing import CliRunner
        from src.commands.license_renewal import app

        runner = CliRunner()
        result = runner.invoke(app, ["renewal-status"])

        # Expired license exits with 1 but shows renewal info
        assert result.exit_code == 1
        assert "expired" in result.stdout.lower()
        assert "raas.mekong.dev/renew" in result.stdout

    @patch('src.commands.license_renewal.get_license_gate')
    def test_renewal_status_active(self, mock_get_gate):
        """renewal_status shows active status."""
        mock_gate = MagicMock()
        mock_gate.has_license = True
        mock_gate.license_key = "raas-pro-key-sig"
        mock_gate.validate_remote.return_value = (
            True,
            {"status": "active", "tier": "pro", "key_id": "key-123"},
            ""
        )
        mock_get_gate.return_value = mock_gate

        from typer.testing import CliRunner
        from src.commands.license_renewal import app

        runner = CliRunner()
        result = runner.invoke(app, ["renewal-status"])

        assert result.exit_code == 0
        assert "active" in result.stdout.lower()

    @patch('src.commands.license_renewal.get_license_gate')
    def test_renewal_sync_success(self, mock_get_gate):
        """renewal_sync succeeds when license is valid."""
        mock_gate = MagicMock()
        mock_gate.has_license = True
        mock_gate.license_key = "raas-pro-key-sig"
        mock_gate.validate_remote.return_value = (
            True,
            {"status": "active", "tier": "pro"},
            ""
        )
        mock_get_gate.return_value = mock_gate

        from typer.testing import CliRunner
        from src.commands.license_renewal import app

        runner = CliRunner()
        result = runner.invoke(app, ["renewal-sync"])

        assert result.exit_code == 0
        assert "synced" in result.stdout.lower()

    @patch('src.commands.license_renewal.get_license_gate')
    def test_renewal_sync_no_license(self, mock_get_gate):
        """renewal_sync fails when no license."""
        mock_gate = MagicMock()
        mock_gate.has_license = False
        mock_get_gate.return_value = mock_gate

        from typer.testing import CliRunner
        from src.commands.license_renewal import app

        runner = CliRunner()
        result = runner.invoke(app, ["renewal-sync"])

        assert result.exit_code == 1
        assert "No license" in result.stdout

    @patch('src.commands.license_renewal.get_license_gate')
    def test_renewal_sync_failed(self, mock_get_gate):
        """renewal_sync shows renewal URL on failure."""
        mock_gate = MagicMock()
        mock_gate.has_license = True
        mock_gate.license_key = "raas-pro-key-sig"
        mock_gate.validate_remote.return_value = (
            False,
            None,
            "Validation failed"
        )
        mock_get_gate.return_value = mock_gate

        from typer.testing import CliRunner
        from src.commands.license_renewal import app

        runner = CliRunner()
        result = runner.invoke(app, ["renewal-sync"])

        assert result.exit_code == 1
        assert "Sync failed" in result.stdout
        assert "raas.mekong.dev/renew" in result.stdout


class TestRenewalDeepLinking:
    """Tests for deep linking features."""

    def test_deep_link_preserves_key_id(self):
        """Deep link preserves key_id for pre-fill."""
        url = get_renewal_url(key_id="user-key-789")
        assert "user-key-789" in url

    def test_deep_link_preserves_tier(self):
        """Deep link preserves tier for upgrade suggestions."""
        url = get_renewal_url(tier="enterprise")
        assert "tier=enterprise" in url

    def test_deep_link_url_encoding(self):
        """Deep link properly formats URL."""
        url = get_renewal_url(key_id="key-123", tier="pro")
        assert url.startswith("https://raas.mekong.dev/renew?")
        assert "key_id=key-123" in url
        assert "tier=pro" in url
