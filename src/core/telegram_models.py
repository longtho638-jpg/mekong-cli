"""
Mekong CLI - Telegram Bot Models

Data models for Telegram bot configuration.
"""

from dataclasses import dataclass, field
from typing import List


@dataclass
class BotConfig:
    """Telegram bot configuration."""

    token: str = ""
    chat_ids: List[int] = field(default_factory=list)
    enabled: bool = True


HELP_TEXT = """🦞 *Tôm Hùm — Telegram Commander*

*Autonomous Coding (via Antigravity):*
/cook <goal> — Queue task → Antigravity executes
/spawn <project> <goal> — Task for specific app
/tasks — View pending inbox
/sessions — Active CC CLI terminals

*Operations:*
/status — System health
/schedule — View scheduled jobs
/memory — Recent 5 executions
/help — This help message

*AGI Self-Improvement:*
/agi start — Start AGI loop
/agi stop — Stop AGI loop
/agi status — Detailed AGI metrics
/agi history — Last 5 improvements
/agi config — Show AGI configuration

*Memory:*
/remember <content> — Store memory
"""


__all__ = ["BotConfig", "HELP_TEXT"]
