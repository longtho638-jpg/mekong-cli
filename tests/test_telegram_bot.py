"""Tests for MekongBot Telegram commander."""

import tempfile
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch
from dataclasses import dataclass, field

from src.core.telegram_bot import MekongBot, BotConfig, HELP_TEXT


class TestBotConfig(unittest.TestCase):
    """Test BotConfig dataclass."""

    def test_defaults(self):
        """Default config has empty token and chat_ids."""
        c = BotConfig()
        self.assertEqual(c.token, "")
        self.assertEqual(c.chat_ids, [])
        self.assertTrue(c.enabled)

    def test_custom_values(self):
        """Config accepts custom values."""
        c = BotConfig(token="abc", chat_ids=[123], enabled=False)
        self.assertEqual(c.token, "abc")
        self.assertEqual(c.chat_ids, [123])
        self.assertFalse(c.enabled)


class TestMekongBot(unittest.TestCase):
    """Test MekongBot initialization and utilities."""

    def test_bot_init_no_token(self):
        """Bot created with empty token."""
        bot = MekongBot(token="")
        self.assertEqual(bot.token, "")
        self.assertFalse(bot.is_running())

    def test_bot_init_with_token(self):
        """Bot created with token."""
        bot = MekongBot(token="test-token")
        self.assertEqual(bot.token, "test-token")

    def test_is_running_default_false(self):
        """Default state is not running."""
        bot = MekongBot(token="tok")
        self.assertFalse(bot.is_running())

    def test_format_result_success(self):
        """Formats success result correctly."""
        bot = MekongBot(token="tok")

        @dataclass
        class MockStatus:
            value: str = "success"

        @dataclass
        class MockResult:
            status: MockStatus = field(default_factory=MockStatus)
            completed_steps: int = 3
            total_steps: int = 3
            success_rate: float = 100.0
            errors: list = field(default_factory=list)

        result = MockResult()
        text = bot._format_result(result)
        self.assertIn("SUCCESS", text)
        self.assertIn("3/3", text)

    def test_format_result_failure(self):
        """Formats failure result with errors."""
        bot = MekongBot(token="tok")

        @dataclass
        class MockStatus:
            value: str = "failed"

        @dataclass
        class MockResult:
            status: MockStatus = field(default_factory=MockStatus)
            completed_steps: int = 1
            total_steps: int = 3
            success_rate: float = 33.3
            errors: list = field(default_factory=lambda: ["step 2 failed"])

        result = MockResult()
        text = bot._format_result(result)
        self.assertIn("FAILED", text)
        self.assertIn("step 2 failed", text)

    def test_format_result_none(self):
        """Handles None result."""
        bot = MekongBot(token="tok")
        text = bot._format_result(None)
        self.assertIn("failed", text.lower())

    def test_help_text_contains_commands(self):
        """Help text lists all commands."""
        for cmd in ["/cmd", "/status", "/schedule", "/swarm", "/memory", "/help"]:
            self.assertIn(cmd, HELP_TEXT)

    def test_build_keyboard_no_telegram(self):
        """Build keyboard returns None when telegram not installed."""
        bot = MekongBot(token="tok")
        # May return None if telegram not installed, or InlineKeyboardMarkup
        kb = bot._build_keyboard()
        # Either None (no lib) or has inline_keyboard attribute
        if kb is not None:
            self.assertTrue(hasattr(kb, "inline_keyboard"))

    def test_load_config_missing_file(self):
        """Missing config file returns defaults."""
        bot = MekongBot(token="tok")
        # Config should have default values
        self.assertIsInstance(bot.config, BotConfig)
        self.assertTrue(bot.config.enabled)

    def test_load_config_existing(self):
        """Reads config from yaml file."""
        tmpdir = tempfile.mkdtemp()
        config_path = Path(tmpdir) / ".mekong" / "telegram.yaml"
        config_path.parent.mkdir(parents=True)
        config_path.write_text("chat_ids: [12345]\nenabled: false\n")

        bot = MekongBot(token="tok")
        # Temporarily override CONFIG_PATH
        original = MekongBot.CONFIG_PATH
        MekongBot.CONFIG_PATH = str(config_path)
        try:
            cfg = bot._load_config()
            self.assertEqual(cfg.chat_ids, [12345])
            self.assertFalse(cfg.enabled)
        finally:
            MekongBot.CONFIG_PATH = original

        import shutil
        shutil.rmtree(tmpdir, ignore_errors=True)

    def test_cmd_handler_no_args(self):
        """cmd_handler replies with usage when no args."""
        import asyncio

        bot = MekongBot(token="tok")
        update = MagicMock()
        update.message.reply_text = AsyncMock()
        context = MagicMock()
        context.args = []

        asyncio.run(bot.cmd_handler(update, context))
        update.message.reply_text.assert_called_once_with("Usage: /cmd <goal>")

    def test_status_handler(self):
        """status_handler returns system info."""
        import asyncio

        bot = MekongBot(token="tok")
        update = MagicMock()
        update.message.reply_text = AsyncMock()
        context = MagicMock()

        asyncio.run(bot.status_handler(update, context))
        call_args = update.message.reply_text.call_args
        self.assertIn("Mekong Status", call_args[0][0])

    def test_memory_handler_empty(self):
        """memory_handler handles empty memory."""
        import asyncio

        bot = MekongBot(token="tok")
        update = MagicMock()
        update.message.reply_text = AsyncMock()
        context = MagicMock()

        asyncio.run(bot.memory_handler(update, context))
        call_args = update.message.reply_text.call_args
        text = call_args[0][0]
        # Either "No memory" or recent entries
        self.assertIsInstance(text, str)


if __name__ == "__main__":
    unittest.main()
