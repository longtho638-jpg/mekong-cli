"""
Mekong CLI - Telegram Commander Bot

Remote command center via Telegram. Users chat commands, Mekong executes locally.
Supports /cmd, /status, /schedule, /swarm, /memory, /help with inline keyboards.
"""

import asyncio
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml


@dataclass
class BotConfig:
    """Telegram bot configuration."""

    token: str = ""
    chat_ids: List[int] = field(default_factory=list)
    enabled: bool = True


HELP_TEXT = """🚀 *Mekong CLI — Telegram Commander*

/cmd <goal> — Execute a goal
/status — System health
/schedule — View scheduled jobs
/swarm — Swarm node status
/memory — Recent 5 executions
/help — This help message
"""


class MekongBot:
    """Telegram bot for remote Mekong CLI control."""

    CONFIG_PATH = ".mekong/telegram.yaml"

    def __init__(self, token: Optional[str] = None) -> None:
        """
        Initialize bot.

        Args:
            token: Telegram bot token (or reads MEKONG_TELEGRAM_TOKEN env)
        """
        self.token = token or os.environ.get("MEKONG_TELEGRAM_TOKEN", "")
        self.config = self._load_config()
        self._running = False
        self._application: Any = None

    async def start(self) -> None:
        """Start the Telegram bot polling loop."""
        if not self.token:
            return

        try:
            from telegram.ext import (
                ApplicationBuilder,
                CommandHandler,
                CallbackQueryHandler,
            )
        except ImportError:
            return

        self._application = (
            ApplicationBuilder().token(self.token).build()
        )

        self._application.add_handler(CommandHandler("cmd", self.cmd_handler))
        self._application.add_handler(CommandHandler("status", self.status_handler))
        self._application.add_handler(CommandHandler("schedule", self.schedule_handler))
        self._application.add_handler(CommandHandler("swarm", self.swarm_handler))
        self._application.add_handler(CommandHandler("memory", self.memory_handler))
        self._application.add_handler(CommandHandler("help", self.help_handler))
        self._application.add_handler(CommandHandler("start", self.help_handler))
        self._application.add_handler(
            CallbackQueryHandler(self._callback_handler)
        )

        self._running = True
        await self._application.initialize()
        await self._application.start()
        await self._application.updater.start_polling()

    async def stop(self) -> None:
        """Stop the Telegram bot."""
        self._running = False
        if self._application:
            try:
                await self._application.updater.stop()
                await self._application.stop()
                await self._application.shutdown()
            except Exception:
                pass

    def is_running(self) -> bool:
        """Check if bot is running."""
        return self._running

    # -- Command handlers --

    async def cmd_handler(self, update: Any, context: Any) -> None:
        """Handle /cmd <goal> — execute via orchestrator."""
        goal = " ".join(context.args) if context.args else ""
        if not goal:
            await update.message.reply_text("Usage: /cmd <goal>")
            return

        await update.message.reply_text(f"⏳ Executing: {goal}...")
        result = await asyncio.to_thread(self._execute_goal, goal)
        await update.message.reply_text(
            self._format_result(result), parse_mode="Markdown",
        )

    async def status_handler(self, update: Any, context: Any) -> None:
        """Handle /status — system health."""
        from src.core.memory import MemoryStore

        store = MemoryStore()
        stats = store.stats()
        text = (
            f"🟢 *Mekong Status*\n"
            f"Executions: {stats['total']}\n"
            f"Success Rate: {stats['success_rate']:.1f}%\n"
            f"Recent Failures: {stats['recent_failures']}"
        )
        await update.message.reply_text(text, parse_mode="Markdown")

    async def schedule_handler(self, update: Any, context: Any) -> None:
        """Handle /schedule — list scheduled jobs."""
        from src.core.scheduler import Scheduler

        scheduler = Scheduler()
        jobs = scheduler.list_jobs()
        if not jobs:
            await update.message.reply_text("No scheduled jobs.")
            return

        lines = ["📅 *Scheduled Jobs*"]
        for j in jobs[:10]:
            lines.append(f"• {j.name}: {j.goal[:30]} ({j.job_type})")
        await update.message.reply_text("\n".join(lines), parse_mode="Markdown")

    async def swarm_handler(self, update: Any, context: Any) -> None:
        """Handle /swarm — swarm node status."""
        from src.core.swarm import SwarmRegistry

        registry = SwarmRegistry()
        nodes = registry.list_nodes()
        if not nodes:
            await update.message.reply_text("No swarm nodes registered.")
            return

        lines = ["🐝 *Swarm Nodes*"]
        for n in nodes:
            lines.append(f"• {n.name} ({n.host}:{n.port}) — {n.status}")
        await update.message.reply_text("\n".join(lines), parse_mode="Markdown")

    async def memory_handler(self, update: Any, context: Any) -> None:
        """Handle /memory — recent 5 executions."""
        from src.core.memory import MemoryStore

        store = MemoryStore()
        entries = store.recent(5)
        if not entries:
            await update.message.reply_text("No memory entries yet.")
            return

        lines = ["🧠 *Recent Executions*"]
        for e in reversed(entries):
            icon = "✅" if e.status == "success" else "❌"
            lines.append(f"{icon} {e.goal[:30]} — {e.status}")
        await update.message.reply_text("\n".join(lines), parse_mode="Markdown")

    async def help_handler(self, update: Any, context: Any) -> None:
        """Handle /help — show available commands."""
        kb = self._build_keyboard()
        await update.message.reply_text(
            HELP_TEXT, parse_mode="Markdown", reply_markup=kb,
        )

    async def _callback_handler(self, update: Any, context: Any) -> None:
        """Handle inline keyboard button presses."""
        query = update.callback_query
        await query.answer()
        data = query.data or ""
        if data.startswith("cmd:"):
            action = data.split(":", 1)[1]
            mapping = {
                "deploy": "/cmd deploy",
                "status": "/status",
                "memory": "/memory",
                "schedule": "/schedule",
            }
            await query.edit_message_text(f"Use: {mapping.get(action, data)}")

    # -- Utilities --

    async def send_notification(self, chat_id: int, message: str) -> None:
        """Send a push notification to a specific chat."""
        if not self._application or not self._running:
            return
        try:
            await self._application.bot.send_message(
                chat_id=chat_id, text=message, parse_mode="Markdown",
            )
        except Exception:
            pass

    def _build_keyboard(self) -> Any:
        """Build inline keyboard for quick actions."""
        try:
            from telegram import InlineKeyboardButton, InlineKeyboardMarkup

            keyboard = [
                [
                    InlineKeyboardButton("🚀 Deploy", callback_data="cmd:deploy"),
                    InlineKeyboardButton("📊 Status", callback_data="cmd:status"),
                ],
                [
                    InlineKeyboardButton("🧠 Memory", callback_data="cmd:memory"),
                    InlineKeyboardButton("📅 Schedule", callback_data="cmd:schedule"),
                ],
            ]
            return InlineKeyboardMarkup(keyboard)
        except ImportError:
            return None

    def _execute_goal(self, goal: str) -> Any:
        """Execute goal via orchestrator (runs in thread)."""
        from src.core.orchestrator import RecipeOrchestrator
        from src.core.llm_client import get_client

        llm_client = get_client()
        orchestrator = RecipeOrchestrator(
            llm_client=llm_client if llm_client.is_available else None,
        )
        return orchestrator.run_from_goal(goal)

    def _format_result(self, result: Any) -> str:
        """Format OrchestrationResult for Telegram message."""
        if result is None:
            return "❌ Execution failed — no result"

        status = getattr(result, "status", None)
        if status is None:
            return f"Result: {result}"

        icon = "✅" if status.value == "success" else "❌"
        lines = [
            f"{icon} *Result: {status.value.upper()}*",
            f"Steps: {result.completed_steps}/{result.total_steps}",
            f"Success Rate: {result.success_rate:.0f}%",
        ]
        if result.errors:
            lines.append(f"Errors: {'; '.join(result.errors[:3])}")
        return "\n".join(lines)

    def _load_config(self) -> BotConfig:
        """Load bot config from .mekong/telegram.yaml."""
        path = Path(self.CONFIG_PATH)
        if not path.exists():
            return BotConfig(token=self.token)
        try:
            data = yaml.safe_load(path.read_text()) or {}
            return BotConfig(
                token=self.token,
                chat_ids=data.get("chat_ids", []),
                enabled=data.get("enabled", True),
            )
        except Exception:
            return BotConfig(token=self.token)

    def _save_config(self) -> None:
        """Save bot config to .mekong/telegram.yaml."""
        path = Path(self.CONFIG_PATH)
        path.parent.mkdir(parents=True, exist_ok=True)
        data = {
            "chat_ids": self.config.chat_ids,
            "enabled": self.config.enabled,
        }
        path.write_text(yaml.dump(data, default_flow_style=False))


__all__ = [
    "MekongBot",
    "BotConfig",
    "HELP_TEXT",
]
