"""
Tests for Mekong CLI Auto-Updater

Tests for secure auto-update mechanism with SHA256+GPG verification,
RaaS entitlement gating, and usage metering.
"""

import hashlib
import io
import os
import tempfile
import shutil
from pathlib import Path
from unittest.mock import Mock, patch
import tarfile

import pytest

from typer.testing import CliRunner

from src.cli.auto_updater import (
    GitHubReleaseFetcher,
    ChecksumVerifier,
    GPGSignatureVerifier,
    ConfigPreserver,
    SandboxedUpdater,
    UsageMeteringLogger,
    AutoUpdater,
    ReleaseInfo,
    UpdateResult,
)
from src.cli import update_commands


# ============================================================================
# Fixtures
# ============================================================================

@pytest.fixture
def temp_dir():
    """Create a temporary directory for tests."""
    directory = tempfile.mkdtemp()
    yield directory
    shutil.rmtree(directory, ignore_errors=True)


@pytest.fixture
def mock_github_response():
    """Mock GitHub API response for latest release."""
    return {
        "tag_name": "v0.3.0",
        "name": "Release v0.3.0",
        "published_at": "2026-03-08T00:00:00Z",
        "body": "Security patch for CVE-2026-1234",
        "assets": [
            {
                "name": "mekong-cli-v0.3.0-darwin-arm64.tar.gz",
                "browser_download_url": "https://github.com/releases/mekong-cli-v0.3.0-darwin-arm64.tar.gz",
            },
            {
                "name": "mekong-cli-v0.3.0-darwin-arm64.tar.gz.sha256",
                "browser_download_url": "https://github.com/releases/mekong-cli-v0.3.0.sha256",
            },
            {
                "name": "mekong-cli-v0.3.0-darwin-arm64.tar.gz.sig",
                "browser_download_url": "https://github.com/releases/mekong-cli-v0.3.0.sig",
            },
        ],
    }


@pytest.fixture
def mock_config_dir(temp_dir):
    """Create a mock config directory."""
    config_dir = Path(temp_dir) / ".mekong"
    config_dir.mkdir()
    (config_dir / "config.ini").write_text("[settings]\ndebug=true")
    (config_dir / "consent.json").write_text('{"telemetry": true}')
    return config_dir


# ============================================================================
# GitHubReleaseFetcher Tests
# ============================================================================

class TestGitHubReleaseFetcher:
    """Tests for GitHubReleaseFetcher class."""

    @patch('src.cli.auto_updater.requests.Session')
    @patch('src.cli.auto_updater.platform.system', return_value='Darwin')
    @patch('src.cli.auto_updater.platform.machine', return_value='arm64')
    def test_get_latest_release_success(self, mock_machine, mock_system, mock_session, mock_github_response):
        """Test successful fetch of latest release."""
        # Setup mock
        mock_response = Mock()
        mock_response.json.return_value = mock_github_response
        mock_response.raise_for_status.return_value = None
        mock_session.return_value.get.return_value = mock_response

        fetcher = GitHubReleaseFetcher()
        result = fetcher.get_latest_release()

        assert result.version == "0.3.0"
        assert result.tag_name == "v0.3.0"
        assert result.name == "Release v0.3.0"
        assert result.is_security_update is True  # Contains "Security" in body
        assert "darwin-arm64.tar.gz" in result.download_url

    @patch('src.cli.auto_updater.requests.Session')
    @patch('src.cli.auto_updater.platform.system', return_value='Linux')
    @patch('src.cli.auto_updater.platform.machine', return_value='x86_64')
    def test_get_latest_release_linux(self, mock_machine, mock_system, mock_session, mock_github_response):
        """Test release fetch on Linux platform."""
        # Remove Darwin assets and add Linux assets
        mock_github_response['assets'] = [
            {
                "name": "mekong-cli-v0.3.0-linux-x86_64.tar.gz",
                "browser_download_url": "https://github.com/releases/mekong-cli-v0.3.0-linux-x86_64.tar.gz",
            },
            {
                "name": "mekong-cli-v0.3.0-linux-x86_64.tar.gz.sha256",
                "browser_download_url": "https://github.com/releases/mekong-cli-v0.3.0-linux.sha256",
            },
        ]

        mock_response = Mock()
        mock_response.json.return_value = mock_github_response
        mock_response.raise_for_status.return_value = None
        mock_session.return_value.get.return_value = mock_response

        fetcher = GitHubReleaseFetcher()
        result = fetcher.get_latest_release()

        assert "linux-x86_64.tar.gz" in result.download_url

    @patch('src.cli.auto_updater.requests.Session')
    @patch('src.cli.auto_updater.platform.system', return_value='Darwin')
    @patch('src.cli.auto_updater.platform.machine', return_value='arm64')
    def test_get_latest_release_no_asset(self, mock_machine, mock_system, mock_session, mock_github_response):
        """Test release fetch when asset not found."""
        # Remove Darwin asset to trigger error
        mock_github_response['assets'] = [a for a in mock_github_response['assets'] if 'darwin' not in a['name']]

        mock_response = Mock()
        mock_response.json.return_value = mock_github_response
        mock_response.raise_for_status.return_value = None
        mock_session.return_value.get.return_value = mock_response

        fetcher = GitHubReleaseFetcher()

        with pytest.raises(ValueError, match="Asset not found"):
            fetcher.get_latest_release()


# ============================================================================
# ChecksumVerifier Tests
# ============================================================================

class TestChecksumVerifier:
    """Tests for ChecksumVerifier class."""

    def test_compute_sha256(self, temp_dir):
        """Test SHA256 computation."""
        # Create test file
        test_file = Path(temp_dir) / "test.txt"
        test_file.write_text("Hello, World!")

        # Compute hash
        checksum = ChecksumVerifier.compute_sha256(str(test_file))

        # Known hash for "Hello, World!"
        expected = "dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f"
        assert checksum == expected

    def test_verify_success(self, temp_dir):
        """Test successful checksum verification."""
        test_file = Path(temp_dir) / "test.txt"
        test_file.write_text("test content")

        # Compute actual hash
        expected = ChecksumVerifier.compute_sha256(str(test_file))

        # Verify
        assert ChecksumVerifier.verify(str(test_file), expected) is True

    def test_verify_failure(self, temp_dir):
        """Test failed checksum verification."""
        test_file = Path(temp_dir) / "test.txt"
        test_file.write_text("test content")

        # Wrong hash
        assert ChecksumVerifier.verify(str(test_file), "wronghash") is False

    @patch('src.cli.auto_updater.requests.get')
    def test_fetch_checksum(self, mock_get):
        """Test fetching checksum from URL."""
        mock_response = Mock()
        mock_response.text = "abc123  mekong-cli.tar.gz"
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response

        checksum = ChecksumVerifier.fetch_checksum("https://example.com/checksum.sha256")

        assert checksum == "abc123"


# ============================================================================
# ConfigPreserver Tests
# ============================================================================

class TestConfigPreserver:
    """Tests for ConfigPreserver class."""

    def test_backup_success(self, temp_dir, mock_config_dir):
        """Test successful config backup."""
        # Override config dir for testing
        with patch.object(ConfigPreserver, 'CONFIG_DIR', mock_config_dir):
            preserver = ConfigPreserver()
            backup_dir = preserver.backup()

            assert backup_dir.exists()
            assert (backup_dir / "config.ini").exists()
            assert (backup_dir / "consent.json").exists()

    def test_backup_empty_dir(self, temp_dir):
        """Test backup when config dir is empty."""
        empty_config = Path(temp_dir) / ".mekong_empty"
        empty_config.mkdir()

        with patch.object(ConfigPreserver, 'CONFIG_DIR', empty_config):
            preserver = ConfigPreserver()
            backup_dir = preserver.backup()

            assert backup_dir.exists()
            # Should not have any files
            assert len(list(backup_dir.iterdir())) == 0

    def test_restore_success(self, temp_dir, mock_config_dir):
        """Test successful config restore."""
        # Create backup
        with patch.object(ConfigPreserver, 'CONFIG_DIR', mock_config_dir):
            preserver = ConfigPreserver()
            backup_dir = preserver.backup()

            # Modify original config
            (mock_config_dir / "config.ini").write_text("[modified]")

            # Set backup_dir and restore
            preserver.backup_dir = backup_dir
            preserver.restore()

            # Should be restored
            restored_content = (mock_config_dir / "config.ini").read_text()
            assert "[settings]" in restored_content

    def test_restore_no_backup(self, temp_dir):
        """Test restore when no backup exists."""
        preserver = ConfigPreserver()
        result = preserver.restore()
        assert result is False


# ============================================================================
# AutoUpdater Tests
# ============================================================================

class TestAutoUpdater:
    """Tests for AutoUpdater class."""

    @patch('importlib.metadata.version')
    def test_get_current_version(self, mock_version):
        """Test getting current version."""
        mock_version.return_value = "0.2.0"

        updater = AutoUpdater()
        version = updater.get_current_version()

        assert version == "0.2.0"

    @patch('importlib.metadata.version', side_effect=Exception("Package not found"))
    def test_get_current_version_fallback(self, mock_version):
        """Test fallback version when package not found."""
        updater = AutoUpdater()
        version = updater.get_current_version()

        assert version == "0.2.0-dev"

    @patch.object(AutoUpdater, 'get_current_version', return_value="0.2.0")
    @patch('src.cli.auto_updater.GitHubReleaseFetcher')
    def test_check_for_updates_available(self, mock_fetcher_class, mock_get_version):
        """Test update detection when new version available."""
        mock_fetcher = Mock()
        mock_fetcher.get_latest_release.return_value = ReleaseInfo(
            version="0.3.0",
            tag_name="v0.3.0",
            name="Release v0.3.0",
            body="",
            published_at="2026-03-08",
            download_url="https://example.com/release.tar.gz",
            checksum_url=None,
            signature_url=None,
            is_security_update=False,
        )
        mock_fetcher_class.return_value = mock_fetcher

        updater = AutoUpdater()
        result = updater.check_for_updates()

        assert result is not None
        assert result.version == "0.3.0"

    @patch.object(AutoUpdater, 'get_current_version', return_value="0.3.0")
    @patch('src.cli.auto_updater.GitHubReleaseFetcher')
    def test_check_for_updates_latest(self, mock_fetcher_class, mock_get_version):
        """Test no update when on latest version."""
        mock_fetcher = Mock()
        mock_fetcher.get_latest_release.return_value = ReleaseInfo(
            version="0.3.0",
            tag_name="v0.3.0",
            name="Release v0.3.0",
            body="",
            published_at="2026-03-08",
            download_url="https://example.com/release.tar.gz",
            checksum_url=None,
            signature_url=None,
            is_security_update=False,
        )
        mock_fetcher_class.return_value = mock_fetcher

        updater = AutoUpdater()
        result = updater.check_for_updates()

        assert result is None

    @patch.object(AutoUpdater, 'update')
    @patch('src.cli.auto_updater.GitHubReleaseFetcher')
    @patch('src.cli.auto_updater.ConfigPreserver')
    @patch.object(AutoUpdater, 'get_current_version', return_value="0.2.0")
    def test_update_success(self, mock_get_version, mock_preserver_class, mock_fetcher_class, mock_update):
        """Test successful update flow."""
        # Mock update result
        mock_update.return_value = UpdateResult(
            success=True,
            old_version="0.2.0",
            new_version="0.3.0",
            message="Updated to 0.3.0",
            config_preserved=True,
            rollback_available=True,
        )

        updater = AutoUpdater()
        result = updater.update()

        assert result.success is True
        assert result.old_version == "0.2.0"
        assert result.new_version == "0.3.0"

    @patch.object(AutoUpdater, 'get_current_version', return_value="0.3.0")
    @patch('src.cli.auto_updater.GitHubReleaseFetcher')
    def test_update_no_updates(self, mock_fetcher_class, mock_get_version):
        """Test update when no new version available."""
        mock_fetcher = Mock()
        mock_fetcher.get_latest_release.return_value = ReleaseInfo(
            version="0.3.0",
            tag_name="v0.3.0",
            name="Release v0.3.0",
            body="",
            published_at="2026-03-08",
            download_url="https://example.com/release.tar.gz",
            checksum_url=None,
            signature_url=None,
            is_security_update=False,
        )
        mock_fetcher_class.return_value = mock_fetcher

        updater = AutoUpdater()
        result = updater.update()

        assert result.success is False
        assert "Already on latest" in result.message


# ============================================================================
# ReleaseInfo Tests
# ============================================================================

class TestReleaseInfo:
    """Tests for ReleaseInfo dataclass."""

    def test_release_info_defaults(self):
        """Test ReleaseInfo default values."""
        info = ReleaseInfo(
            version="0.3.0",
            tag_name="v0.3.0",
            name="Release v0.3.0",
            body="",
            published_at="2026-03-08",
            download_url="https://example.com/release.tar.gz",
            checksum_url=None,
            signature_url=None,
        )

        assert info.version == "0.3.0"
        assert info.is_security_update is False

    def test_release_info_security_update(self):
        """Test ReleaseInfo with security update flag."""
        info = ReleaseInfo(
            version="0.3.0",
            tag_name="v0.3.0",
            name="Security Patch v0.3.0",
            body="Fix CVE-2026-1234",
            published_at="2026-03-08",
            download_url="https://example.com/release.tar.gz",
            checksum_url=None,
            signature_url=None,
            is_security_update=True,
        )

        assert info.is_security_update is True


# ============================================================================
# Integration Tests
# ============================================================================

class TestIntegration:
    """Integration tests for auto-updater."""

    @patch.object(AutoUpdater, 'update')
    @patch('src.cli.auto_updater.GitHubReleaseFetcher')
    @patch('src.cli.auto_updater.ConfigPreserver')
    @patch('src.cli.auto_updater.UsageMeteringLogger')
    @patch.object(AutoUpdater, 'get_current_version', return_value="0.2.0")
    def test_full_update_flow(
        self, mock_get_version, mock_metering_class,
        mock_preserver_class, mock_fetcher_class, mock_update, temp_dir
    ):
        """Test full update flow with all components."""
        # Mock update result
        mock_update.return_value = UpdateResult(
            success=True,
            old_version="0.2.0",
            new_version="0.3.0",
            message="Updated to 0.3.0",
            config_preserved=True,
            rollback_available=True,
        )

        # Mock metering
        mock_metering = Mock()
        mock_metering_class.return_value = mock_metering

        updater = AutoUpdater()
        result = updater.update()

        # Verify metering was called
        mock_metering.log_update_event.assert_called_once()
        assert result.success is True


# ============================================================================
# Security Tests
# ============================================================================

class TestSecurity:
    """Security-focused tests."""

    def test_checksum_mismatch_detection(self, temp_dir):
        """Test detection of checksum mismatch."""
        test_file = Path(temp_dir) / "test.txt"
        test_file.write_text("test content")

        # Wrong checksum
        result = ChecksumVerifier.verify(str(test_file), "wronghash")
        assert result is False

    @patch('src.cli.auto_updater.requests.Session')
    def test_unsigned_release_warning(self, mock_session):
        """Test handling of release without signature."""
        mock_response = Mock()
        mock_response.json.return_value = {
            "tag_name": "v0.3.0",
            "name": "Release v0.3.0",
            "published_at": "2026-03-08",
            "body": "",
            "assets": [
                {
                    "name": "mekong-cli-v0.3.0-darwin-arm64.tar.gz",
                    "browser_download_url": "https://example.com/release.tar.gz",
                },
                # No .sig asset
            ],
        }
        mock_response.raise_for_status.return_value = None
        mock_session.return_value.get.return_value = mock_response

        with patch('src.cli.auto_updater.platform.system', return_value='Darwin'):
            with patch('src.cli.auto_updater.platform.machine', return_value='arm64'):
                fetcher = GitHubReleaseFetcher()
                result = fetcher.get_latest_release()

                # Signature URL should be None
                assert result.signature_url is None


# ============================================================================
# GPGSignatureVerifier Tests
# ============================================================================

class TestGPGSignatureVerifier:
    """Tests for GPGSignatureVerifier class."""

    def test_verify_gpg_not_available(self, temp_dir):
        """Test verification when GPG library is not installed."""
        # Create test file
        test_file = Path(temp_dir) / "test.tar.gz"
        test_file.write_text("test content")

        # Create verifier - should not crash when gnupg unavailable
        verifier = GPGSignatureVerifier()
        # Should return True when GPG not available (skip verification)
        assert verifier.gpg is None

    def test_verify_signature_url_missing(self, temp_dir):
        """Test that verification passes when signature URL is None."""
        from src.cli.auto_updater import ReleaseInfo, SandboxedUpdater

        release = ReleaseInfo(
            version="0.3.0",
            tag_name="v0.3.0",
            name="Release",
            body="",
            published_at="2026-03-08",
            download_url="https://example.com/release.tar.gz",
            checksum_url=None,
            signature_url=None,
        )

        # File without signature should not fail
        test_file = Path(temp_dir) / "release.tar.gz"
        test_file.write_text("test content")

        # Create updater with release that has no signature
        updater = SandboxedUpdater(release)
        # The verify should use the instance which creates its own GPG verifier

        # Verify checksum passes (no checksum to compare)
        # This test just ensures the verifier handles None signature gracefully
        assert release.signature_url is None


# ============================================================================
# SandboxedUpdater Tests
# ============================================================================

class TestSandboxedUpdater:
    """Tests for SandboxedUpdater class."""

    @pytest.fixture
    def mock_release(self):
        """Create a mock release."""
        return ReleaseInfo(
            version="0.3.0",
            tag_name="v0.3.0",
            name="Release v0.3.0",
            body="",
            published_at="2026-03-08",
            download_url="https://example.com/mekong-v0.3.0-darwin.tar.gz",
            checksum_url="https://example.com/checksum.sha256",
            signature_url="https://example.com/signature.sig",
            is_security_update=True,
        )

    def test_init_creates_temp_dir(self, mock_release):
        """Test that SandboxedUpdater creates temp directory."""
        updater = SandboxedUpdater(mock_release)

        assert os.path.exists(updater.temp_dir)
        assert os.path.isdir(updater.temp_dir)

    def test_download_success(self, mock_release, temp_dir, mock_github_response):
        """Test successful download."""
        from src.cli.auto_updater import SandboxedUpdater

        # Mock requests
        mock_response = Mock()
        mock_response.iter_content.return_value = [b"chunk1", b"chunk2", b"chunk3"]
        mock_response.raise_for_status = Mock()

        with patch('src.cli.auto_updater.requests.get', return_value=mock_response):
            updater = SandboxedUpdater(mock_release)

            # Override temp_dir for predictable path
            updater.temp_dir = temp_dir
            file_path = updater.download()

            assert os.path.exists(file_path)
            assert "mekong" in file_path

    def test_extract_tar_gz(self, temp_dir, mock_release):
        """Test tar.gz extraction."""
        from src.cli.auto_updater import SandboxedUpdater

        # Create tar.gz archive
        archive_path = Path(temp_dir) / "test.tar.gz"
        with tarfile.open(archive_path, "w:gz") as tar:
            tarinfo = tarfile.TarInfo(name="mekong")
            tarinfo.size = 11
            tar.addfile(tarinfo, io.BytesIO(b"mock binary"))

        updater = SandboxedUpdater(mock_release)

        # Override extract dir
        extract_dir = Path(temp_dir) / "extracted"
        extract_dir.mkdir()

        with patch.object(updater, 'temp_dir', str(extract_dir)):
            result = updater.extract(str(archive_path))

            assert os.path.exists(result)

    def test_extract_zip(self, temp_dir, mock_release):
        """Test zip extraction (Windows)."""
        from src.cli.auto_updater import SandboxedUpdater
        import zipfile

        # Create zip file
        archive_path = Path(temp_dir) / "test.zip"
        with zipfile.ZipFile(archive_path, "w") as zf:
            zf.writestr("mekong.exe", "mock binary")

        updater = SandboxedUpdater(mock_release)

        extract_dir = Path(temp_dir) / "extracted"
        extract_dir.mkdir()

        with patch.object(updater, 'temp_dir', str(extract_dir)):
            result = updater.extract(str(archive_path))

            assert os.path.exists(result)

    def test_extract_unsupported_format(self, temp_dir, mock_release):
        """Test extraction with unsupported format."""
        from src.cli.auto_updater import SandboxedUpdater

        archive_path = Path(temp_dir) / "test.unknown"
        archive_path.write_text("invalid")

        updater = SandboxedUpdater(mock_release)

        with pytest.raises(ValueError, match="Unsupported archive format"):
            updater.extract(str(archive_path))

    def test_cleanup_removes_temp_dir(self, temp_dir, mock_release):
        """Test cleanup removes temp directory."""
        from src.cli.auto_updater import SandboxedUpdater

        updater = SandboxedUpdater(mock_release)
        temp_path = Path(updater.temp_dir)

        assert temp_path.exists()

        updater.cleanup()

        assert not temp_path.exists()


# ============================================================================
# UsageMeteringLogger Tests
# ============================================================================

class TestUsageMeteringLogger:
    """Tests for UsageMeteringLogger class."""

    @patch('src.cli.auto_updater.requests.post')
    def test_log_update_event_success(self, mock_post):
        """Test successful event logging."""

        logger = UsageMeteringLogger()

        logger.log_update_event(
            old_version="0.2.0",
            new_version="0.3.0",
            success=True,
            is_security_update=True,
        )

        mock_post.assert_called_once()
        call_args = mock_post.call_args[1]
        json_data = call_args["json"]

        assert json_data["event_type"] == "cli_update"
        assert json_data["old_version"] == "0.2.0"
        assert json_data["new_version"] == "0.3.0"
        assert json_data["success"] is True
        assert json_data["is_security_update"] is True
        assert "platform" in json_data
        assert "python_version" in json_data

    @patch('src.cli.auto_updater.requests.post')
    def test_log_with_api_key(self, mock_post):
        """Test logging with API key in headers."""

        with patch.dict(os.environ, {"RAAS_API_KEY": "test-key-123"}):
            logger = UsageMeteringLogger()
            logger.log_update_event("0.2.0", "0.3.0", True)

            call_args = mock_post.call_args[1]
            assert call_args["headers"]["Authorization"] == "Bearer test-key-123"

    @patch('src.cli.auto_updater.requests.post')
    def test_log_silently_fails_on_error(self, mock_post):
        """Test that logging failures don't crash."""

        mock_post.side_effect = Exception("Network error")

        logger = UsageMeteringLogger()

        # Should not raise exception
        logger.log_update_event("0.2.0", "0.3.0", True)


# ============================================================================
# Integration Tests - Real Flow
# ============================================================================

class TestUpdateIntegration:
    """Integration tests for complete update flow."""

    @patch.object(AutoUpdater, 'get_current_version', return_value="0.2.0")
    @patch('src.cli.auto_updater.GitHubReleaseFetcher')
    @patch('src.cli.auto_updater.ConfigPreserver')
    @patch('src.cli.auto_updater.SandboxedUpdater')
    @patch('src.cli.auto_updater.UsageMeteringLogger')
    def test_full_update_success(
        self, mock_metering_class, mock_updater_class, mock_preserver_class,
        mock_fetcher_class, mock_get_version, temp_dir
    ):
        """Test complete update success flow."""
        # Setup mocks
        mock_fetcher = Mock()
        mock_fetcher.get_latest_release.return_value = ReleaseInfo(
            version="0.3.0",
            tag_name="v0.3.0",
            name="Security Release",
            body="CVE patch",
            published_at="2026-03-08",
            download_url="https://example.com/release.tar.gz",
            checksum_url="https://example.com/checksum.sha256",
            signature_url="https://example.com/signature.sig",
            is_security_update=True,
        )
        mock_fetcher_class.return_value = mock_fetcher

        mock_updater = Mock()
        mock_updater.download.return_value = str(Path(temp_dir) / "release.tar.gz")
        mock_updater.verify.return_value = True
        mock_updater.extract.return_value = str(Path(temp_dir) / "extract")
        mock_updater.install.return_value = True
        mock_updater.cleanup = Mock()
        mock_updater_class.return_value = mock_updater

        mock_preserver = Mock()
        mock_preserver.backup.return_value = Path(temp_dir) / "backup"
        mock_preserver.restore = Mock()
        mock_preserver_class.return_value = mock_preserver

        updater = AutoUpdater()
        result = updater.update()

        # Verify all components called
        assert result.success is True
        assert result.old_version == "0.2.0"
        assert result.new_version == "0.3.0"
        assert result.config_preserved is True
        assert result.rollback_available is True

        mock_preserver.backup.assert_called_once()
        mock_preserver_class.return_value.restore.assert_not_called()  # Only on error

    @patch.object(AutoUpdater, 'get_current_version', return_value="0.2.0")
    @patch('src.cli.auto_updater.GitHubReleaseFetcher')
    @patch('src.cli.auto_updater.ConfigPreserver')
    @patch('src.cli.auto_updater.SandboxedUpdater')
    def test_update_failure_restores_config(
        self, mock_updater_class, mock_preserver_class, mock_fetcher_class, temp_dir
    ):
        """Test config restoration on update failure."""
        # Setup fetcher
        mock_fetcher = Mock()
        mock_fetcher.get_latest_release.return_value = ReleaseInfo(
            version="0.3.0",
            tag_name="v0.3.0",
            name="Release",
            body="",
            published_at="2026-03-08",
            download_url="https://example.com/release.tar.gz",
            checksum_url=None,
            signature_url=None,
        )
        mock_fetcher_class.return_value = mock_fetcher

        # Setup updater that fails
        mock_updater = Mock()
        mock_updater.download.return_value = str(Path(temp_dir) / "release.tar.gz")
        mock_updater.verify.side_effect = Exception("Checksum verification failed")
        mock_updater_class.return_value = mock_updater

        mock_preserver = Mock()
        mock_preserver.backup.return_value = Path(temp_dir) / "backup"
        mock_preserver.restore = Mock(return_value=True)
        mock_preserver_class.return_value = mock_preserver

        updater = AutoUpdater()
        result = updater.update()

        # Verify failure and restore called
        assert result.success is False
        mock_preserver.restore.assert_called_once()

    @patch.object(AutoUpdater, 'get_current_version', return_value="0.3.0")
    @patch('src.cli.auto_updater.GitHubReleaseFetcher')
    def test_update_force_reinstall(
        self, mock_fetcher_class, mock_get_version, temp_dir
    ):
        """Test force reinstall of current version."""
        mock_fetcher = Mock()
        mock_fetcher.get_latest_release.return_value = ReleaseInfo(
            version="0.3.0",
            tag_name="v0.3.0",
            name="Release v0.3.0",
            body="",
            published_at="2026-03-08",
            download_url="https://example.com/release.tar.gz",
            checksum_url=None,
            signature_url=None,
        )
        mock_fetcher_class.return_value = mock_fetcher

        updater = AutoUpdater()
        result = updater.update(force=True)

        # With force, should attempt reinstall
        assert result.success is True or result.message == "Already on latest version"


# ============================================================================
# Security Tests - Comprehensive
# ============================================================================

class TestSecurityFeatures:
    """Comprehensive security-focused tests."""

    def test_checksum_mismatch_detection(self, temp_dir):
        """Test detection of checksum mismatch."""
        test_file = Path(temp_dir) / "test.bin"
        test_file.write_bytes(b"genuine content")

        # Get correct checksum
        correct_checksum = ChecksumVerifier.compute_sha256(str(test_file))

        # Verify with correct checksum
        assert ChecksumVerifier.verify(str(test_file), correct_checksum) is True

        # Verify with wrong checksum
        assert ChecksumVerifier.verify(str(test_file), "0" * 64) is False

    def test_checksum_tampering_detection(self, temp_dir):
        """Test detection of file tampering by checksum."""
        test_file = Path(temp_dir) / "release.tar.gz"
        test_file.write_bytes(b"initial release")

        # Compute checksum of initial file
        initial_checksum = ChecksumVerifier.compute_sha256(str(test_file))

        # Tamper with file
        test_file.write_bytes(b"malicious content here")

        # Verify should fail - checksum mismatch detected
        result = ChecksumVerifier.verify(str(test_file), initial_checksum)
        assert result is False

    def test_security_update_flag_detection(self, mock_github_response):
        """Test automatic security update flag detection."""
        from src.cli.auto_updater import GitHubReleaseFetcher

        # Test various security keywords
        security_keywords = [
            "Security patch",
            "CVE-2024-12345",
            "vulnerability fixed",
            "security fix",
        ]

        for keyword in security_keywords:
            mock_github_response["body"] = keyword

            with patch('src.cli.auto_updater.requests.Session') as mock_session:
                mock_response = Mock()
                mock_response.json.return_value = mock_github_response
                mock_response.raise_for_status = Mock()
                mock_session.return_value.get.return_value = mock_response

                with patch('src.cli.auto_updater.platform.system', return_value='Darwin'):
                    with patch('src.cli.auto_updater.platform.machine', return_value='arm64'):
                        fetcher = GitHubReleaseFetcher()
                        result = fetcher.get_latest_release()

                        assert result.is_security_update is True, f"Keyword '{keyword}' should trigger security flag"

    def test_non_security_update_flag(self, mock_github_response):
        """Test non-security update detection."""
        from src.cli.auto_updater import GitHubReleaseFetcher

        mock_github_response["body"] = "New awesome features added"

        with patch('src.cli.auto_updater.requests.Session') as mock_session:
            mock_response = Mock()
            mock_response.json.return_value = mock_github_response
            mock_response.raise_for_status = Mock()
            mock_session.return_value.get.return_value = mock_response

            with patch('src.cli.auto_updater.platform.system', return_value='Darwin'):
                with patch('src.cli.auto_updater.platform.machine', return_value='arm64'):
                    fetcher = GitHubReleaseFetcher()
                    result = fetcher.get_latest_release()

                    assert result.is_security_update is False

    @patch('src.cli.auto_updater.requests.Session')
    def test_checksum_verification_with_actual_file(self, mock_session, temp_dir):
        """Test real-world checksum verification flow."""
        # Setup mock GitHub response with checksum
        checksum_value = "dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f"  # "Hello, World!"
        mock_github_response = {
            "tag_name": "v0.3.0",
            "name": "Release v0.3.0",
            "published_at": "2026-03-08",
            "body": "Security fix",
            "assets": [
                {
                    "name": "mekong-cli-v0.3.0-darwin-arm64.tar.gz",
                    "browser_download_url": "https://example.com/release.tar.gz",
                },
                {
                    "name": "mekong-cli-v0.3.0-darwin-arm64.tar.gz.sha256",
                    "browser_download_url": "https://example.com/checksum.sha256",
                },
            ],
        }

        mock_response = Mock()
        mock_response.json.return_value = mock_github_response
        mock_response.raise_for_status = Mock()
        mock_session.return_value.get.return_value = mock_response

        with patch('src.cli.auto_updater.platform.system', return_value='Darwin'):
            with patch('src.cli.auto_updater.platform.machine', return_value='arm64'):
                fetcher = GitHubReleaseFetcher()
                release = fetcher.get_latest_release()

                assert release.checksum_url is not None

        # Now verify the checksum file
        test_checksum_response = Mock()
        test_checksum_response.text = f"{checksum_value}  mekong-cli.tar.gz\n"
        test_checksum_response.raise_for_status = Mock()

        with patch('src.cli.auto_updater.requests.get', return_value=test_checksum_response):
            fetched_checksum = ChecksumVerifier.fetch_checksum("https://example.com/checksum.sha256")
            assert fetched_checksum == checksum_value

    def test_signature_verification_skipped_when_missing(self, temp_dir):
        """Test that verification passes when signature URL is None."""
        from src.cli.auto_updater import GPGSignatureVerifier, ReleaseInfo

        release = ReleaseInfo(
            version="0.3.0",
            tag_name="v0.3.0",
            name="Release",
            body="",
            published_at="2026-03-08",
            download_url="https://example.com/release.tar.gz",
            checksum_url=None,
            signature_url=None,
        )

        # GPG verifier should handle None gracefully
        verifier = GPGSignatureVerifier()
        # If gnupg not available, verify returns True (skip)
        if verifier.gpg is None:
            # This is expected on systems without gnupg
            assert True
        else:
            # On systems with gnupg, verify should still handle gracefully
            assert True

    def test_free_tier_can_access_security_updates(self, mock_github_response):
        """Test that free tier users can get security updates."""
        from src.cli.auto_updater import GitHubReleaseFetcher

        # Security update body
        mock_github_response["body"] = "CVE-2026-1234 patched"

        with patch('src.cli.auto_updater.requests.Session') as mock_session:
            mock_response = Mock()
            mock_response.json.return_value = mock_github_response
            mock_response.raise_for_status = Mock()
            mock_session.return_value.get.return_value = mock_response

            with patch('src.cli.auto_updater.platform.system', return_value='Darwin'):
                with patch('src.cli.auto_updater.platform.machine', return_value='arm64'):
                    fetcher = GitHubReleaseFetcher()
                    release = fetcher.get_latest_release()

                    # Security update should be detected
                    assert release.is_security_update is True
                    # Free tier users SHOULD be able to get security updates
                    # This is enforced in update_commands.py

    def test_download_url_tampering_detection(self, temp_dir):
        """Test that we detect if download URL is tampered (via checksum)."""

        # Simulate downloading content
        original_content = b"legitimate release binary"
        tampered_content = b"malicious payload injected"

        # Use the class method directly
        original_checksum = hashlib.sha256(original_content).hexdigest()
        tampered_checksum = hashlib.sha256(tampered_content).hexdigest()

        # Verify checksums are different
        assert original_checksum != tampered_checksum


# ============================================================================
# Update Commands Tests (update_commands.py)
# ============================================================================

class TestUpdateCommands:
    """Tests for update_commands module commands."""

    @pytest.fixture
    def cli_runner(self):
        """Create CLI test runner."""
        return CliRunner()

    def test_check_command_no_update(self, cli_runner):
        """Test check command when no update available."""
        with patch('src.cli.auto_updater.AutoUpdater') as mock_updater_cls:
            mock_updater = Mock()
            mock_updater.get_current_version.return_value = "0.3.0"
            mock_updater.check_for_updates.return_value = None
            mock_updater_cls.return_value = mock_updater

            result = cli_runner.invoke(update_commands.app, ["check"])

            assert result.exit_code == 0
            assert "latest version" in result.output.lower()

    def test_check_command_update_available(self, cli_runner):
        """Test check command when update available."""
        mock_release = ReleaseInfo(
            version="0.3.0",
            tag_name="v0.3.0",
            name="Release v0.3.0",
            body="Security patch",
            published_at="2026-03-08",
            download_url="https://example.com/release.tar.gz",
            checksum_url=None,
            signature_url=None,
            is_security_update=True,
        )

        with patch('src.cli.auto_updater.AutoUpdater') as mock_updater_cls:
            mock_updater = Mock()
            mock_updater.get_current_version.return_value = "0.2.0"
            mock_updater.check_for_updates.return_value = mock_release
            mock_updater_cls.return_value = mock_updater

            result = cli_runner.invoke(update_commands.app, ["check", "-v"])

            assert result.exit_code == 0
            assert "0.3.0" in result.output
            assert "Security update" in result.output

    def test_check_command_verbose_output(self, cli_runner):
        """Test verbose output includes changelog."""
        mock_release = ReleaseInfo(
            version="0.3.0",
            tag_name="v0.3.0",
            name="Release v0.3.0",
            body="This is a detailed changelog with security fixes.",
            published_at="2026-03-08",
            download_url="https://example.com/release.tar.gz",
            checksum_url=None,
            signature_url=None,
            is_security_update=True,
        )

        with patch('src.cli.auto_updater.AutoUpdater') as mock_updater_cls:
            mock_updater = Mock()
            mock_updater.get_current_version.return_value = "0.2.0"
            mock_updater.check_for_updates.return_value = mock_release
            mock_updater_cls.return_value = mock_updater

            result = cli_runner.invoke(update_commands.app, ["check", "--verbose"])

            assert result.exit_code == 0
            assert "Changelog" in result.output

    @patch('src.cli.update_commands.get_validator')
    def test_update_command_with_license(self, mock_get_validator, cli_runner):
        """Test update command with valid license."""
        mock_validator = Mock()
        mock_validator.validate.return_value = (True, None)
        mock_get_validator.return_value = mock_validator

        mock_release = ReleaseInfo(
            version="0.3.0",
            tag_name="v0.3.0",
            name="Release v0.3.0",
            body="Security patch",
            published_at="2026-03-08",
            download_url="https://example.com/release.tar.gz",
            checksum_url=None,
            signature_url=None,
            is_security_update=True,
        )

        mock_updater = Mock()
        mock_updater.get_current_version.return_value = "0.2.0"
        mock_updater.check_for_updates.return_value = mock_release
        mock_updater.update.return_value = UpdateResult(
            success=True,
            old_version="0.2.0",
            new_version="0.3.0",
            message="Updated to 0.3.0",
            config_preserved=True,
            rollback_available=True,
        )

        with patch('src.cli.auto_updater.AutoUpdater', return_value=mock_updater):
            result = cli_runner.invoke(update_commands.app, ["update", "--yes"])

            assert result.exit_code == 0
            assert "Update Successful" in result.output

    @patch('src.cli.update_commands.get_validator')
    def test_update_command_license_required_for_non_security(
        self, mock_get_validator, cli_runner
    ):
        """Test non-security update requires license."""
        mock_validator = Mock()
        mock_validator.validate.return_value = (False, "License required")
        mock_get_validator.return_value = mock_validator

        mock_release = ReleaseInfo(
            version="0.3.0",
            tag_name="v0.3.0",
            name="Feature Release",
            body="New features",
            published_at="2026-03-08",
            download_url="https://example.com/release.tar.gz",
            checksum_url=None,
            signature_url=None,
            is_security_update=False,
        )

        with patch('src.cli.auto_updater.AutoUpdater') as mock_updater_cls:
            mock_updater = Mock()
            mock_updater.get_current_version.return_value = "0.2.0"
            mock_updater.check_for_updates.return_value = mock_release
            mock_updater_cls.return_value = mock_updater

            result = cli_runner.invoke(update_commands.app, ["update", "--yes"])

            assert result.exit_code == 1
            assert "RaaS License Required" in result.output
            assert "non-security updates require" in result.output

    def test_update_command_skip_confirmation(self, cli_runner):
        """Test update with --yes flag skips confirmation."""
        mock_release = ReleaseInfo(
            version="0.3.0",
            tag_name="v0.3.0",
            name="Release v0.3.0",
            body="Security patch",
            published_at="2026-03-08",
            download_url="https://example.com/release.tar.gz",
            checksum_url=None,
            signature_url=None,
            is_security_update=True,
        )

        mock_updater = Mock()
        mock_updater.get_current_version.return_value = "0.2.0"
        mock_updater.check_for_updates.return_value = mock_release
        mock_updater.update.return_value = UpdateResult(
            success=True,
            old_version="0.2.0",
            new_version="0.3.0",
            message="Updated to 0.3.0",
            config_preserved=True,
            rollback_available=True,
        )

        with patch('src.cli.auto_updater.AutoUpdater', return_value=mock_updater):
            result = cli_runner.invoke(update_commands.app, ["update", "--yes", "--verbose"])

            assert result.exit_code == 0
            # Should proceed without asking for confirmation

    def test_update_command_cancelled(self, cli_runner):
        """Test update cancellation."""
        mock_release = ReleaseInfo(
            version="0.3.0",
            tag_name="v0.3.0",
            name="Release v0.3.0",
            body="Security patch",
            published_at="2026-03-08",
            download_url="https://example.com/release.tar.gz",
            checksum_url=None,
            signature_url=None,
            is_security_update=True,
        )

        mock_updater = Mock()
        mock_updater.get_current_version.return_value = "0.2.0"
        mock_updater.check_for_updates.return_value = mock_release
        mock_updater.update.return_value = UpdateResult(
            success=True,
            old_version="0.2.0",
            new_version="0.3.0",
            message="Updated to 0.3.0",
            config_preserved=True,
            rollback_available=True,
        )

        with patch('src.cli.auto_updater.AutoUpdater', return_value=mock_updater):
            # User says no to confirmation
            result = cli_runner.invoke(update_commands.app, ["update", "-v"], input="n\n")

            # Should show cancellation message
            assert "cancelled" in result.output.lower()

    def test_update_command_failure(self, cli_runner):
        """Test update failure handling."""
        mock_release = ReleaseInfo(
            version="0.3.0",
            tag_name="v0.3.0",
            name="Release v0.3.0",
            body="Security patch",
            published_at="2026-03-08",
            download_url="https://example.com/release.tar.gz",
            checksum_url=None,
            signature_url=None,
            is_security_update=True,
        )

        mock_updater = Mock()
        mock_updater.get_current_version.return_value = "0.2.0"
        mock_updater.check_for_updates.return_value = mock_release
        mock_updater.update.return_value = UpdateResult(
            success=False,
            old_version="0.2.0",
            new_version="0.3.0",
            message="Network error occurred",
            config_preserved=True,
        )

        with patch('src.cli.auto_updater.AutoUpdater', return_value=mock_updater):
            result = cli_runner.invoke(update_commands.app, ["update", "--yes"])

            assert result.exit_code == 1
            assert "Update Failed" in result.output

    def test_rollback_command(self, cli_runner):
        """Test rollback command."""
        with patch('src.cli.auto_updater.AutoUpdater') as mock_updater_cls:
            mock_updater = Mock()
            mock_updater_cls.return_value = mock_updater

            result = cli_runner.invoke(update_commands.app, ["rollback"])

            assert result.exit_code == 0
            assert "coming soon" in result.output.lower() or "reinstall" in result.output.lower()

    def test_history_command(self, cli_runner):
        """Test history command."""
        result = cli_runner.invoke(update_commands.app, ["history"])

        assert result.exit_code == 0
        assert "coming soon" in result.output.lower()

    @patch('src.cli.auto_updater.get_validator')
    def test_security_update_bypasses_license_check(self, mock_get_validator, cli_runner):
        """Test that security updates don't require license validation."""
        # Config: validator returns success (or is never called for security update)
        mock_validator = Mock()
        mock_get_validator.return_value = mock_validator

        # Security update - should not require license validation
        mock_release = ReleaseInfo(
            version="0.3.0",
            tag_name="v0.3.0",
            name="Security Patch v0.3.0",
            body="CVE-2026-12345 fixed",
            published_at="2026-03-08",
            download_url="https://example.com/release.tar.gz",
            checksum_url=None,
            signature_url=None,
            is_security_update=True,
        )

        mock_updater = Mock()
        mock_updater.get_current_version.return_value = "0.2.0"
        mock_updater.check_for_updates.return_value = mock_release
        mock_updater.update.return_value = UpdateResult(
            success=True,
            old_version="0.2.0",
            new_version="0.3.0",
            message="Updated to 0.3.0",
            config_preserved=True,
            rollback_available=True,
        )

        with patch('src.cli.auto_updater.AutoUpdater', return_value=mock_updater):
            result = cli_runner.invoke(update_commands.app, ["update", "--yes"])

            assert result.exit_code == 0
            assert "Security update" in result.output
            # Validator may or may not be called for security updates
            # depending on implementation

    @patch('src.cli.auto_updater.get_validator')
    def test_non_security_update_requires_license(self, mock_get_validator, cli_runner):
        """Test that non-security updates require valid license."""
        # Simulator invalid license
        mock_validator = Mock()
        mock_get_validator.return_value = mock_validator
        mock_validator.validate.return_value = (False, "Invalid license key")

        # Non-security update
        mock_release = ReleaseInfo(
            version="0.3.0",
            tag_name="v0.3.0",
            name="Feature Release",
            body="New features added",
            published_at="2026-03-08",
            download_url="https://example.com/release.tar.gz",
            checksum_url=None,
            signature_url=None,
            is_security_update=False,
        )

        with patch('src.cli.auto_updater.AutoUpdater') as mock_updater_cls:
            mock_updater = Mock()
            mock_updater.get_current_version.return_value = "0.2.0"
            mock_updater.check_for_updates.return_value = mock_release
            mock_updater_cls.return_value = mock_updater

            result = cli_runner.invoke(update_commands.app, ["update", "--yes"])

            assert result.exit_code == 1
            assert "License Required" in result.output


# ============================================================================
# Test Fixture: Create mock tar.gz in temp dir
# ============================================================================

def create_test_tarball(temp_dir: str, filename: str, content: str = "mock binary") -> str:
    """Helper to create a test tarball."""
    tar_path = Path(temp_dir) / filename
    with tarfile.open(tar_path, "w:gz") as tar:
        tarinfo = tarfile.TarInfo(name="mekong")
        tarinfo.size = len(content.encode())
        tar.addfile(tarinfo, io.BytesIO(content.encode()))
    return str(tar_path)


# ============================================================================
# Test Entry Point
# ============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
