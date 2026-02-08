"""Tests for Notifier EventBus subscriber."""

import unittest
from unittest.mock import MagicMock

from src.core.notifier import Notifier, NotifyConfig
from src.core.event_bus import EventBus, EventType, Event

import src.core.event_bus as _eb


class TestNotifyConfig(unittest.TestCase):
    """Test NotifyConfig dataclass."""

    def test_defaults(self):
        """Default config has 3 event types."""
        c = NotifyConfig()
        self.assertIn("goal_completed", c.events)
        self.assertIn("job_started", c.events)
        self.assertIn("job_completed", c.events)
        self.assertTrue(c.enabled)


class TestNotifier(unittest.TestCase):
    """Test Notifier subscribe/unsubscribe and event handling."""

    def setUp(self):
        self.bus = EventBus()
        _eb._default_bus = self.bus

    def tearDown(self):
        _eb._default_bus = None

    def test_subscribe_registers_events(self):
        """Subscribing increases subscriber count."""
        notifier = Notifier(bot=None)
        initial = self.bus.subscriber_count
        notifier.subscribe(self.bus)
        self.assertGreater(self.bus.subscriber_count, initial)

    def test_unsubscribe_removes(self):
        """Unsubscribing decreases subscriber count."""
        notifier = Notifier(bot=None)
        notifier.subscribe(self.bus)
        count_after_sub = self.bus.subscriber_count
        notifier.unsubscribe(self.bus)
        self.assertLess(self.bus.subscriber_count, count_after_sub)

    def test_should_notify_configured_event(self):
        """goal_completed is in default config -> True."""
        notifier = Notifier(bot=None)
        self.assertTrue(notifier._should_notify(EventType.GOAL_COMPLETED))

    def test_should_notify_unconfigured_event(self):
        """Events not in config -> False."""
        notifier = Notifier(bot=None)
        self.assertFalse(notifier._should_notify(EventType.GOAL_STARTED))

    def test_on_event_no_bot(self):
        """Silently skips when no bot."""
        notifier = Notifier(bot=None)
        event = Event(type=EventType.GOAL_COMPLETED, data={"goal": "test"})
        # Should not raise
        notifier.on_event(event)

    def test_on_event_bot_not_running(self):
        """Skips when bot exists but not running."""
        mock_bot = MagicMock()
        mock_bot.is_running.return_value = False
        notifier = Notifier(bot=mock_bot)
        event = Event(type=EventType.GOAL_COMPLETED, data={"goal": "test"})
        notifier.on_event(event)
        # send_notification should NOT be called
        mock_bot.send_notification.assert_not_called()

    def test_format_notification_goal_completed(self):
        """Formats goal_completed event."""
        notifier = Notifier(bot=None)
        event = Event(
            type=EventType.GOAL_COMPLETED,
            data={"goal": "deploy app", "status": "success"},
        )
        text = notifier._format_notification(event)
        self.assertIn("deploy app", text)
        self.assertIn("success", text)

    def test_format_notification_job_started(self):
        """Formats job_started event."""
        notifier = Notifier(bot=None)
        event = Event(
            type=EventType.JOB_STARTED,
            data={"name": "daily-backup"},
        )
        text = notifier._format_notification(event)
        self.assertIn("daily-backup", text)
        self.assertIn("started", text.lower())

    def test_format_notification_job_completed(self):
        """Formats job_completed event."""
        notifier = Notifier(bot=None)
        event = Event(
            type=EventType.JOB_COMPLETED,
            data={"name": "nightly-scan"},
        )
        text = notifier._format_notification(event)
        self.assertIn("nightly-scan", text)

    def test_load_config_defaults(self):
        """Default config when no file exists."""
        notifier = Notifier(bot=None)
        self.assertIsInstance(notifier.config, NotifyConfig)
        self.assertEqual(len(notifier.config.events), 3)

    def test_disabled_config_skips(self):
        """Disabled config skips notification."""
        notifier = Notifier(bot=None)
        notifier.config.enabled = False
        mock_bot = MagicMock()
        mock_bot.is_running.return_value = True
        notifier.bot = mock_bot
        event = Event(type=EventType.GOAL_COMPLETED, data={})
        notifier.on_event(event)
        mock_bot.send_notification.assert_not_called()


if __name__ == "__main__":
    unittest.main()
