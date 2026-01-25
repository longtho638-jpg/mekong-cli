"""Tests for quota account selector config loading."""
import json
import os
import shutil
import tempfile
import unittest
from antigravity.mcp_servers.quota_server.account_selector import AccountSelector, QuotaAccount


class TestAccountSelectorConfigLoading(unittest.TestCase):
    """Test secure config loading without hardcoded credentials."""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.config_path = os.path.join(self.temp_dir, "quota_accounts.json")
        # Save original HOME to restore later
        self.original_home = os.environ.get("HOME")
        # Point to temp dir for testing
        os.environ["HOME"] = self.temp_dir

    def tearDown(self):
        """Clean up test fixtures."""
        if self.original_home:
            os.environ["HOME"] = self.original_home
        # Clean up temp files and directory tree
        if os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)

    def test_load_from_config_file(self):
        """Test loading accounts from config file."""
        # Create test config
        config_data = {
            "accounts": [
                {
                    "email": "test@example.com",
                    "remaining_percent": 75.0,
                    "model_quotas": {
                        "claude-sonnet-4-5": 80.0,
                        "gemini-3-pro-high": 70.0
                    },
                    "is_active": True,
                    "priority": 1
                }
            ]
        }

        # Create .mekong directory in temp home
        mekong_dir = os.path.join(self.temp_dir, ".mekong")
        os.makedirs(mekong_dir, exist_ok=True)
        config_file = os.path.join(mekong_dir, "quota_accounts.json")

        with open(config_file, 'w') as f:
            json.dump(config_data, f)

        # Load accounts
        selector = AccountSelector()

        # Verify accounts loaded
        self.assertEqual(len(selector.accounts), 1)
        self.assertEqual(selector.accounts[0].email, "test@example.com")
        self.assertEqual(selector.accounts[0].remaining_percent, 75.0)
        self.assertTrue(selector.accounts[0].is_active)

    def test_no_hardcoded_credentials(self):
        """Test that no accounts are loaded without config file."""
        # Don't create config file - selector should have empty accounts
        selector = AccountSelector()

        # Verify no hardcoded accounts
        self.assertEqual(len(selector.accounts), 0)

    def test_invalid_json_handling(self):
        """Test graceful handling of corrupted config file."""
        # Create invalid JSON
        mekong_dir = os.path.join(self.temp_dir, ".mekong")
        os.makedirs(mekong_dir, exist_ok=True)
        config_file = os.path.join(mekong_dir, "quota_accounts.json")

        with open(config_file, 'w') as f:
            f.write("{ invalid json }")

        # Should not crash, just log error and return empty accounts
        selector = AccountSelector()
        self.assertEqual(len(selector.accounts), 0)

    def test_missing_file_warning(self):
        """Test warning when config file doesn't exist."""
        # Don't create config - should warn but not crash
        selector = AccountSelector()
        self.assertEqual(len(selector.accounts), 0)
        # In production, this would log a warning


if __name__ == "__main__":
    unittest.main()
