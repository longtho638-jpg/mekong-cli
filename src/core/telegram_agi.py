"""Mekong CLI - Telegram Bot AGI Handlers.

Handler functions for AGI loop commands.
"""

from __future__ import annotations

import asyncio

from telegram import Update
from telegram.ext import ContextTypes


async def agi_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /agi <subcommand> — AGI loop control."""
    args = context.args or []
    sub = args[0].lower() if args else "status"

    if sub == "start":
        await _agi_start(update)
    elif sub == "stop":
        await _agi_stop(update)
    elif sub == "status":
        await _agi_status(update)
    elif sub == "history":
        await _agi_history(update)
    elif sub == "config":
        await _agi_config(update)
    else:
        await update.message.reply_text(
            "♾️ Usage: /agi <start|stop|status|history|config>",
        )


async def _agi_start(update: Update) -> None:
    """Handle /agi start."""
    try:
        from src.core.agi_loop import get_agi_loop

        loop = get_agi_loop()
        if loop._running:
            await update.message.reply_text("♾️ AGI loop is already running.")
            return
        asyncio.create_task(loop.run_forever())
        await update.message.reply_text(
            "♾️ *AGI Loop Started!*\n"
            "Tôm Hùm is now self-improving...\n"
            "Use /agi status to monitor.",
            parse_mode="Markdown",
        )
    except Exception as e:
        await update.message.reply_text(f"❌ Failed to start AGI: {e}")


async def _agi_stop(update: Update) -> None:
    """Handle /agi stop."""
    try:
        from src.core.agi_loop import get_agi_loop

        loop = get_agi_loop()
        loop.stop()
        await update.message.reply_text("🛑 AGI loop stopped.")
    except Exception as e:
        await update.message.reply_text(f"❌ Failed to stop AGI: {e}")


async def _agi_status(update: Update) -> None:
    """Handle /agi status."""
    try:
        from src.core.agi_loop import get_agi_loop

        loop = get_agi_loop()
        s = loop.get_status()
        running_icon = "🟢" if s["running"] else "🔴"
        uptime_min = s["uptime_seconds"] // 60
        cooldown = s["cooldown"]
        last = s.get("last_improvement")
        last_str = ""
        if last:
            icon = "✅" if last.get("success") else "❌"
            last_str = f"\n\n📌 *Last:* {icon} {last.get('title', 'Unknown')}"
        await update.message.reply_text(
            f"♾️ *AGI Loop Status*\n\n"
            f"{running_icon} Running: {'Yes' if s['running'] else 'No'}\n"
            f"🔄 Iteration: {s['iteration']}\n"
            f"✅ Improvements: {s['improvements']}\n"
            f"📊 Success Rate: {s['success_rate']}%\n"
            f"❌ Consecutive Failures: {s['consecutive_failures']}\n"
            f"⏱ Uptime: {uptime_min}m\n"
            f"😴 Cooldown: {cooldown}s"
            f"{last_str}",
            parse_mode="Markdown",
        )
    except Exception as e:
        await update.message.reply_text(f"❌ AGI status error: {e}")


async def _agi_history(update: Update) -> None:
    """Handle /agi history."""
    try:
        from src.core.agi_loop import get_agi_loop

        loop = get_agi_loop()
        details = loop._history.get("details", [])
        if not details:
            await update.message.reply_text("No AGI history yet.")
            return
        lines = ["♾️ *AGI History (last 5)*\n"]
        for d in details[-5:]:
            icon = "✅" if d.get("success") else "❌"
            lines.append(f"{icon} `{d.get('id', '?')}` — {d.get('title', '?')}")
        await update.message.reply_text(
            "\n".join(lines), parse_mode="Markdown",
        )
    except Exception as e:
        await update.message.reply_text(f"❌ AGI history error: {e}")


async def _agi_config(update: Update) -> None:
    """Handle /agi config."""
    try:
        from src.core.agi_loop import get_agi_loop

        loop = get_agi_loop()
        await update.message.reply_text(
            f"⚙️ *AGI Configuration*\n\n"
            f"Cooldown: {loop.cooldown}s\n"
            f"Max Iterations: {loop.max_iterations or '∞'}\n"
            f"Max Consecutive Failures: {loop.MAX_CONSECUTIVE_FAILURES}\n"
            f"Telegram Notify: {loop.telegram_notify}\n"
            f"Completed: {len(loop.completed_improvements)}\n"
            f"Blacklisted: {len(loop._history.get('blacklist', {}))}",
            parse_mode="Markdown",
        )
    except Exception as e:
        await update.message.reply_text(f"❌ AGI config error: {e}")


__all__ = ["agi_handler"]
