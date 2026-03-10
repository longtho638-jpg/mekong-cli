"""
Tests for sync-raas command's --no-cache behavior
"""

import os
import json
from pathlib import Path
import time
import pytest
from unittest.mock import patch, MagicMock
from src.commands.sync_raas import (
    fetch_analytics,
    _get_cache,
    _save_cache,
    CACHE_DIR,
    CACHE_FILE,
    CACHE_TTL,
)


@pytest.fixture
def mock_license_key():
    """Fixture to mock RAAS_LICENSE_KEY environment variable"""
    with patch.dict(os.environ, {"RAAS_LICENSE_KEY": "test-license-key"}):
        yield "test-license-key"


@pytest.fixture
def mock_valid_response():
    """Fixture to mock a valid API response"""
    return {
        "usage": {
            "total_commands": 1000,
            "commands_today": 100,
            "commands_this_month": 500,
            "avg_commands_per_day": 50.5,
            "daily_active_users": 50,
            "monthly_active_users": 200,
            "unique_projects": 25
        },
        "quota": {
            "commands": {"used": 100, "total": 1000},
            "api_calls": {"used": 500, "total": 5000},
            "storage": {"used": 100, "total": 1000},
            "email_sends": {"used": 200, "total": 2000}
        },
        "features": [
            {"name": "cook", "count": 500},
            {"name": "plan", "count": 300},
            {"name": "build", "count": 200}
        ],
        "projects": [
            {"id": "1", "name": "Project 1", "command_count": 100, "last_activity": "2026-03-08"},
            {"id": "2", "name": "Project 2", "command_count": 50, "last_activity": "2026-03-07"}
        ]
    }


class TestSyncRaasNoCache:
    """Tests for sync-raas command's --no-cache behavior"""

    def test_cache_creation_and_retrieval(self, mock_license_key, mock_valid_response):
        """Test that analytics data is properly cached and retrieved"""
        # Remove existing cache file
        if CACHE_FILE.exists():
            CACHE_FILE.unlink()

        # Save mock data to cache
        _save_cache(mock_valid_response)

        # Verify cache file exists
        assert CACHE_FILE.exists()

        # Verify cache contains the mock data
        cached_data = _get_cache()
        assert cached_data is not None
        assert cached_data["usage"]["total_commands"] == 1000
        assert cached_data["quota"]["commands"]["used"] == 100
        assert len(cached_data["features"]) == 3

        # Cleanup
        if CACHE_FILE.exists():
            CACHE_FILE.unlink()

    def test_cache_expiration(self, mock_license_key, mock_valid_response):
        """Test that cache expires after TTL"""
        # Remove existing cache file
        if CACHE_FILE.exists():
            CACHE_FILE.unlink()

        # Save mock data to cache with timestamp in the past
        cache_data = {
            "timestamp": int(time.time()) - (CACHE_TTL + 60),  # Expired by 60 seconds
            "data": mock_valid_response
        }

        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        with open(CACHE_FILE, "w") as f:
            json.dump(cache_data, f)

        # Verify cache is expired and returns None
        cached_data = _get_cache()
        assert cached_data is None
        assert not CACHE_FILE.exists()

    @patch("requests.get")
    def test_fetch_analytics_with_cache(self, mock_get, mock_license_key, mock_valid_response):
        """Test that fetch_analytics uses cache when available"""
        # Remove existing cache file
        if CACHE_FILE.exists():
            CACHE_FILE.unlink()

        # Save mock data to cache
        _save_cache(mock_valid_response)

        # Mock API call should not be called
        mock_get.assert_not_called()

        # Call fetch_analytics without --no-cache
        data = fetch_analytics(mock_license_key, use_cache=True)

        # Verify we got data without making API call
        assert data is not None
        assert data["usage"]["total_commands"] == 1000
        mock_get.assert_not_called()

        # Cleanup
        if CACHE_FILE.exists():
            CACHE_FILE.unlink()

    @patch("requests.get")
    def test_fetch_analytics_with_no_cache(self, mock_get, mock_license_key, mock_valid_response):
        """Test that --no-cache bypasses cache and fetches fresh data"""
        # Remove existing cache file
        if CACHE_FILE.exists():
            CACHE_FILE.unlink()

        # Save mock data to cache
        _save_cache(mock_valid_response)

        # Mock API response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"usage": {"total_commands": 2000}}
        mock_get.return_value = mock_response

        # Call fetch_analytics with --no-cache
        data = fetch_analytics(mock_license_key, use_cache=False)

        # Verify we got fresh data from API
        assert data is not None
        assert data["usage"]["total_commands"] == 2000
        mock_get.assert_called_once()

        # Cleanup
        if CACHE_FILE.exists():
            CACHE_FILE.unlink()

    @patch("requests.get")
    def test_no_cache_behavior_when_cache_exists(self, mock_get, mock_license_key, mock_valid_response):
        """Test that --no-cache ignores existing cache and fetches fresh data"""
        # Remove existing cache file
        if CACHE_FILE.exists():
            CACHE_FILE.unlink()

        # Save old data to cache
        old_data = mock_valid_response.copy()
        old_data["usage"]["total_commands"] = 1000
        _save_cache(old_data)

        # Mock API response with new data
        new_data = mock_valid_response.copy()
        new_data["usage"]["total_commands"] = 2000

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = new_data
        mock_get.return_value = mock_response

        # Call fetch_analytics with --no-cache
        data = fetch_analytics(mock_license_key, use_cache=False)

        # Verify we got new data from API, not cache
        assert data is not None
        assert data["usage"]["total_commands"] == 2000
        mock_get.assert_called_once()

        # Cleanup
        if CACHE_FILE.exists():
            CACHE_FILE.unlink()

    def test_cache_file_location(self, mock_license_key, mock_valid_response):
        """Test that cache file is stored in correct location"""
        # Remove existing cache file
        if CACHE_FILE.exists():
            CACHE_FILE.unlink()

        # Save mock data to cache
        _save_cache(mock_valid_response)

        # Verify cache is in correct directory
        assert CACHE_FILE.exists()
        assert CACHE_DIR.exists()
        assert str(CACHE_FILE).startswith(str(Path.home()))
        assert "mekong" in str(CACHE_FILE)
        assert "cache" in str(CACHE_FILE)

        # Cleanup
        if CACHE_FILE.exists():
            CACHE_FILE.unlink()


class TestSyncRaasCommandLine:
    """Tests for sync-raas command line interface"""

    @patch("src.commands.sync_raas.fetch_analytics")
    @patch("src.commands.sync_raas.get_license_key")
    @patch("src.commands.sync_raas.validate_license")
    @patch("src.commands.sync_raas.register_cli_instance")
    @patch("src.commands.sync_raas.track_usage")
    def test_sync_command_with_no_cache_flag(
        self, mock_track, mock_register, mock_validate, mock_get_key, mock_fetch, mock_license_key, mock_valid_response
    ):
        """Test that sync command accepts --no-cache flag"""
        from src.commands.sync_raas import sync

        # Setup mocks
        mock_get_key.return_value = "test-key"
        mock_fetch.return_value = mock_valid_response
        mock_validate.return_value = True
        mock_register.return_value = True
        mock_track.return_value = True

        # Call sync function with --no-cache (simulated)
        with patch("src.commands.sync_raas.console"):
            with patch("src.commands.sync_raas.Progress"):
                sync(no_cache=True)

        # Verify fetch_analytics was called with use_cache=False
        mock_fetch.assert_called_once_with("test-key", use_cache=False)

    @patch("src.commands.sync_raas.fetch_analytics")
    @patch("src.commands.sync_raas.get_license_key")
    @patch("src.commands.sync_raas.validate_license")
    @patch("src.commands.sync_raas.register_cli_instance")
    @patch("src.commands.sync_raas.track_usage")
    def test_sync_command_without_no_cache_flag(
        self, mock_track, mock_register, mock_validate, mock_get_key, mock_fetch, mock_license_key, mock_valid_response
    ):
        """Test that sync command uses cache when --no-cache flag not provided"""
        from src.commands.sync_raas import sync

        # Setup mocks
        mock_get_key.return_value = "test-key"
        mock_fetch.return_value = mock_valid_response
        mock_validate.return_value = True
        mock_register.return_value = True
        mock_track.return_value = True

        # Call sync function without --no-cache (pass explicit no_cache=False)
        with patch("src.commands.sync_raas.console"):
            with patch("src.commands.sync_raas.Progress"):
                sync(no_cache=False)

        # Verify fetch_analytics was called with use_cache=True (default)
        mock_fetch.assert_called_once_with("test-key", use_cache=True)

    @patch("src.commands.sync_raas.fetch_analytics")
    @patch("src.commands.sync_raas.get_license_key")
    def test_analytics_command_with_no_cache_flag(
        self, mock_get_key, mock_fetch, mock_license_key, mock_valid_response
    ):
        """Test that analytics command accepts --no-cache flag"""
        from src.commands.sync_raas import analytics

        # Setup mocks
        mock_get_key.return_value = "test-key"
        mock_fetch.return_value = mock_valid_response

        # Call analytics function with --no-cache (simulated)
        with patch("src.commands.sync_raas.console"):
            with patch("src.commands.sync_raas.Progress"):
                analytics(no_cache=True)

        # Verify fetch_analytics was called with use_cache=False
        mock_fetch.assert_called_once_with("test-key", use_cache=False)
