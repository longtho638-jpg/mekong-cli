"""Mekong CLI - Telegram Client.

Telegram Bot API client for sending alerts to ops channel.
Supports markdown formatting and built-in rate limiting.
"""

from __future__ import annotations

import os
import time
from collections import deque
from dataclasses import dataclass

import requests


@dataclass
class TelegramConfig:
    """Telegram bot configuration."""

    bot_token: str
    rate_limit: int = 30  # Messages per second (Telegram limit: ~30/sec)
    rate_window: float = 1.0  # Time window in seconds
    max_retries: int = 3
    timeout: int = 30  # Request timeout in seconds


class TelegramClient:
    """Telegram Bot API client with rate limiting."""

    BASE_URL = "https://api.telegram.org/bot{token}/{method}"

    def __init__(
        self,
        bot_token: str | None = None,
        config: TelegramConfig | None = None,
    ) -> None:
        """Initialize Telegram client."""
        self.config = config or TelegramConfig(
            bot_token=bot_token or os.getenv("TELEGRAM_BOT_TOKEN", ""),
        )

        if not self.config.bot_token:
            raise ValueError("TELEGRAM_BOT_TOKEN environment variable is required")

        # Rate limiting: deque of timestamps
        self._rate_queue: deque[float] = deque()
        self._session = requests.Session()

    def _wait_for_rate_limit(self) -> None:
        """Wait if rate limit is exceeded."""
        now = time.time()
        cutoff = now - self.config.rate_window

        # Remove old entries
        while self._rate_queue and self._rate_queue[0] < cutoff:
            self._rate_queue.popleft()

        # Check if at limit
        if len(self._rate_queue) >= self.config.rate_limit:
            oldest = self._rate_queue[0]
            sleep_time = self.config.rate_window - (now - oldest)
            if sleep_time > 0:
                time.sleep(sleep_time)

    def _request(self, method: str, data: dict[str, str]) -> dict | None:
        """Make API request to Telegram Bot API."""
        url = self.BASE_URL.format(token=self.config.bot_token, method=method)

        for attempt in range(self.config.max_retries):
            try:
                response = self._session.post(
                    url,
                    data=data,
                    timeout=self.config.timeout,
                )
                result = response.json()

                if result.get("ok"):
                    return result.get("result", {})

                # Handle errors
                error_code = result.get("error_code", 0)
                if error_code == 429:  # Rate limited
                    retry_after = result.get("parameters", {}).get("retry_after", 1)
                    time.sleep(retry_after)
                    continue

            except requests.RequestException:
                if attempt == self.config.max_retries - 1:
                    raise
                time.sleep(2 ** attempt)  # Exponential backoff

        return None

    def send_message(
        self,
        chat_id: str,
        text: str,
        parse_mode: str = "Markdown",
        disable_notification: bool = False,
    ) -> str | None:
        """Send message to Telegram channel.

        Args:
            chat_id: Channel ID (e.g., @channel or -100123456789)
            text: Message text (supports markdown if parse_mode set)
            parse_mode: Message parsing mode (Markdown, MarkdownV2, HTML)
            disable_notification: Send silently

        Returns:
            Message ID if successful, None otherwise.
        """
        # Rate limiting
        self._wait_for_rate_limit()
        self._rate_queue.append(time.time())

        data: dict[str, str] = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": parse_mode,
        }

        if disable_notification:
            data["disable_notification"] = "true"

        result = self._request("sendMessage", data)

        if result:
            return str(result.get("message_id"))
        return None

    def send_alert(
        self,
        chat_id: str,
        title: str,
        message: str,
        severity: str = "info",
    ) -> str | None:
        """Send formatted alert message.

        Args:
            chat_id: Channel ID
            title: Alert title
            message: Alert body
            severity: critical/warning/info

        Returns:
            Message ID if successful, None otherwise.
        """
        emoji = {"critical": "🚨", "warning": "⚠️", "info": "ℹ️"}
        formatted = (
            f"{emoji.get(severity, '📢')} *{title.upper()}*\n\n"
            f"{message}\n\n"
            f"_Time: {time.strftime('%Y-%m-%d %H:%M:%S')}_\n"
            f"_Severity: {severity}_"
        )
        return self.send_message(chat_id, formatted, parse_mode="Markdown")

    def get_me(self) -> dict | None:
        """Get bot info."""
        return self._request("getMe", {})

    def send_test_message(self, chat_id: str) -> str | None:
        """Send test message to verify bot is working."""
        return self.send_message(
            chat_id,
            "✅ *Mekong CLI Alert System Test*\n\n"
            "Bot is configured and ready to receive alerts.",
            parse_mode="Markdown",
        )


# Convenience function
def send_alert(
    title: str,
    message: str,
    severity: str = "info",
    chat_id: str | None = None,
) -> str | None:
    """Send alert to Telegram ops channel.

    Args:
        title: Alert title
        message: Alert body
        severity: critical/warning/info
        chat_id: Optional channel ID (defaults to TELEGRAM_OPS_CHANNEL_ID)

    Returns:
        Message ID if successful, None otherwise.
    """
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    channel = chat_id or os.getenv("TELEGRAM_OPS_CHANNEL_ID")

    if not token or not channel:
        return None

    client = TelegramClient(token)
    return client.send_alert(channel, title, message, severity)


__all__ = [
    "TelegramClient",
    "TelegramConfig",
    "send_alert",
]
