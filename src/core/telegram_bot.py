"""Mekong CLI - Telegram Commander Bot (Tôm Hùm Edition).

Remote command center via Telegram → Antigravity relay.
Commands received on Telegram are saved to inbox for Antigravity to pick up
and coordinate CC CLI execution.

Commands:
  /cook <goal>          — Queue task for Antigravity to execute
  /spawn <project> <g>  — Queue task targeting apps/<project>
  /tasks                — View pending tasks in inbox
  /sessions             — List active CC CLI terminals
  /status               — System health
  /schedule             — View scheduled jobs
  /help                 — This help message
"""

from __future__ import annotations

import asyncio
import contextlib
import json
import os
import time
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import TYPE_CHECKING

import yaml  # type: ignore[import-untyped]

if TYPE_CHECKING:
    from telegram import InlineKeyboardMarkup, Update
    from telegram.ext import Application, ContextTypes

    from src.core.orchestrator import OrchestrationResult

INBOX_PATH = Path(".mekong/inbox.json")


@dataclass
class BotConfig:
    """Telegram bot configuration."""

    token: str = ""
    chat_ids: list[int] = field(default_factory=list)
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


def _load_inbox() -> list:
    """Load inbox tasks from file."""
    if not INBOX_PATH.exists():
        return []
    try:
        result = json.loads(INBOX_PATH.read_text())
        return list(result)
    except (json.JSONDecodeError, OSError) as e:
        import logging
        logging.error(f"Failed to load inbox: {e}")
        return []


def _save_inbox(tasks: list) -> None:
    """Save inbox tasks to file."""
    INBOX_PATH.parent.mkdir(parents=True, exist_ok=True)
    INBOX_PATH.write_text(json.dumps(tasks, indent=2, ensure_ascii=False))


def add_task(goal: str, project: str | None = None, chat_id: int = 0) -> dict:
    """Add a new task to the inbox."""
    task = {
        "id": uuid.uuid4().hex[:8],
        "goal": goal,
        "project": project,
        "chat_id": chat_id,
        "status": "pending",
        "created_at": time.time(),
        "created_at_iso": time.strftime("%Y-%m-%d %H:%M:%S"),
    }
    inbox = _load_inbox()
    inbox.append(task)
    _save_inbox(inbox)
    return task


def get_pending_tasks() -> list:
    """Get all pending tasks from inbox."""
    return [t for t in _load_inbox() if t.get("status") == "pending"]


def mark_task(task_id: str, status: str, result: str = "") -> None:
    """Update a task's status."""
    inbox = _load_inbox()
    for t in inbox:
        if t["id"] == task_id:
            t["status"] = status
            t["result"] = result
            t["completed_at"] = time.strftime("%Y-%m-%d %H:%M:%S")
            break
    _save_inbox(inbox)


class MekongBot:
    """Telegram bot — relay commands to Antigravity for CC CLI coordination."""

    CONFIG_PATH = ".mekong/telegram.yaml"

    def __init__(self, token: str | None = None) -> None:
        """Initialize MekongBot with a Telegram bot token.

        Args:
            token: Telegram Bot API token. Falls back to MEKONG_TELEGRAM_TOKEN env var.

        """
        self.token = token or os.environ.get("MEKONG_TELEGRAM_TOKEN", "")
        self.config = self._load_config()
        self._running = False
        self._application: Application | None = None

    async def start(self) -> None:
        """Start the Telegram bot polling loop."""
        if not self.token:
            return

        try:
            from telegram.ext import (
                ApplicationBuilder,
                CallbackQueryHandler,
                CommandHandler,
                MessageHandler,
                filters,
            )
        except ImportError:
            return

        self._application = ApplicationBuilder().token(self.token).build()

        # Task relay commands
        self._application.add_handler(CommandHandler("cook", self.cook_handler))
        self._application.add_handler(CommandHandler("spawn", self.spawn_handler))
        self._application.add_handler(CommandHandler("tasks", self.tasks_handler))
        self._application.add_handler(CommandHandler("sessions", self.sessions_handler))

        # Original commands
        self._application.add_handler(CommandHandler("cmd", self.cmd_handler))
        self._application.add_handler(CommandHandler("status", self.status_handler))
        self._application.add_handler(CommandHandler("schedule", self.schedule_handler))
        self._application.add_handler(CommandHandler("swarm", self.swarm_handler))
        self._application.add_handler(CommandHandler("memory", self.memory_handler))
        self._application.add_handler(CommandHandler("help", self.help_handler))
        self._application.add_handler(CommandHandler("start", self.help_handler))

        # AGI commands
        self._application.add_handler(CommandHandler("agi", self.agi_handler))

        # NLP: catch ALL non-command text messages
        self._application.add_handler(
            MessageHandler(filters.TEXT & ~filters.COMMAND, self.nlp_message_handler),
        )

        self._application.add_handler(CallbackQueryHandler(self._callback_handler))

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
            except Exception as e:
                import logging
                logging.error(f"Failed to stop application: {e}")

    def is_running(self) -> bool:
        """Whether the Telegram bot polling loop is currently active."""
        return self._running

    # ============================================================
    # 🧠 NLP: Free-form message → Structured Command
    # ============================================================

    async def nlp_message_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Handle ANY non-command text message via NLP parsing."""
        message = update.message.text
        if not message or len(message.strip()) < 3:
            return

        chat_id = update.effective_chat.id

        # Save chat_id
        if chat_id not in self.config.chat_ids:
            self.config.chat_ids.append(chat_id)
            self._save_config()

        # Show "thinking" indicator
        thinking_msg = await update.message.reply_text("🧠 Đang phân tích...")

        try:
            from src.core.nlp_commander import get_commander

            commander = get_commander()
            task = commander.parse(message)

            if task.parse_error:
                await thinking_msg.edit_text(
                    f"⚠️ Không parse được: {task.parse_error}\n\n"
                    f"Thử dùng /cook <goal> trực tiếp.",
                )
                return

            if task.intent == "status":
                # Status queries don't need CC CLI
                await thinking_msg.delete()
                await self.status_handler(update, context)
                return

            # Show what Tôm Hùm understood
            confirmation = commander.format_confirmation(task)

            # Queue the structured task
            inbox_task = add_task(
                goal=task.cc_cli_prompt,
                project=task.project,
                chat_id=chat_id,
            )
            # Enrich inbox with NLP metadata
            inbox = _load_inbox()
            for t in inbox:
                if t["id"] == inbox_task["id"]:
                    t["raw_message"] = task.raw_message
                    t["intent"] = task.intent
                    t["summary"] = task.summary
                    t["claudekit_commands"] = task.claudekit_commands
                    t["priority"] = task.priority
                    break
            _save_inbox(inbox)

            await thinking_msg.edit_text(
                f"{confirmation}\n\n"
                f"📨 Task `{inbox_task['id']}` queued!\n"
                f"Antigravity sẽ pick up ngay.",
                parse_mode="Markdown",
            )

        except Exception as e:
            await thinking_msg.edit_text(
                f"❌ NLP error: {str(e)[:100]}\nThử /cook <goal> trực tiếp.",
            )

    # ============================================================
    # 🦞 TÔM HÙM: Task Relay (Telegram → Inbox → Antigravity)
    # ============================================================

    async def cook_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Handle /cook <goal> — queue task for Antigravity."""
        goal = " ".join(context.args) if context.args else ""
        if not goal:
            await update.message.reply_text(
                "🦞 Usage: /cook <goal>\n\n"
                "Example:\n"
                "`/cook Build auth module for AgencyOS`\n"
                "`/cook Fix the landing page hero section`",
                parse_mode="Markdown",
            )
            return

        chat_id = update.effective_chat.id
        task = add_task(goal=goal, chat_id=chat_id)

        # Save chat_id to config for Antigravity to reply back
        if chat_id not in self.config.chat_ids:
            self.config.chat_ids.append(chat_id)
            self._save_config()

        await update.message.reply_text(
            f"📨 *Task Queued for Antigravity!*\n\n"
            f"🆔 `{task['id']}`\n"
            f"🎯 Goal: _{goal}_\n"
            f"⏰ {task['created_at_iso']}\n\n"
            f"Antigravity sẽ pick up và điều phối CC CLI.\n"
            f"Use /tasks to check status.",
            parse_mode="Markdown",
        )

    async def spawn_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Handle /spawn <project> <goal> — queue task for specific project."""
        args = context.args or []
        if len(args) < 2:
            await update.message.reply_text(
                "🦞 Usage: /spawn <project> <goal>\n\n"
                "Example:\n"
                "`/spawn agencyos-web Add a dashboard sidebar`\n"
                "`/spawn openclaw-worker Fix Redis connection`",
                parse_mode="Markdown",
            )
            return

        project = args[0]
        goal = " ".join(args[1:])
        chat_id = update.effective_chat.id
        task = add_task(goal=goal, project=project, chat_id=chat_id)

        if chat_id not in self.config.chat_ids:
            self.config.chat_ids.append(chat_id)
            self._save_config()

        await update.message.reply_text(
            f"📨 *Task Queued for `{project}`!*\n\n"
            f"🆔 `{task['id']}`\n"
            f"🎯 Goal: _{goal}_\n"
            f"📂 Project: `apps/{project}`\n\n"
            f"Antigravity sẽ pick up và điều phối CC CLI.",
            parse_mode="Markdown",
        )

    async def tasks_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Handle /tasks — view pending tasks in inbox."""
        inbox = _load_inbox()

        if not inbox:
            await update.message.reply_text(
                "📭 Inbox trống.\nDùng /cook <goal> để gửi task.",
            )
            return

        lines = ["📬 *Tôm Hùm Inbox*\n"]
        for t in inbox[-10:]:  # Last 10 tasks
            icon = {
                "pending": "⏳",
                "running": "🔄",
                "completed": "✅",
                "failed": "❌",
            }.get(t.get("status", "pending"), "❓")

            project_str = f" → `{t['project']}`" if t.get("project") else ""
            lines.append(
                f"{icon} `{t['id']}`{project_str}\n"
                f"   {t['goal'][:50]}\n"
                f"   {t.get('created_at_iso', '')}",
            )

        await update.message.reply_text(
            "\n".join(lines),
            parse_mode="Markdown",
        )

    async def sessions_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Handle /sessions — list active CC CLI terminals."""
        try:
            from src.core.cc_spawner import get_spawner

            spawner = get_spawner()
            sessions = spawner.all_sessions

            if not sessions:
                await update.message.reply_text(
                    "No CC CLI sessions.\nUse /cook <goal> to queue a task.",
                )
                return

            lines = ["🦞 *Active CC CLI Sessions*\n"]
            for s in sessions:
                icon = {
                    "running": "🔄",
                    "completed": "✅",
                    "failed": "❌",
                    "timeout": "⏰",
                    "pending": "⏳",
                }.get(s.status.value, "❓")

                lines.append(
                    f"{icon} `{s.id}` — {s.status.value}\n"
                    f"   Goal: {s.goal[:40]}\n"
                    f"   Duration: {s.duration:.0f}s | Lines: {len(s.output_buffer)}",
                )

            await update.message.reply_text(
                "\n".join(lines),
                parse_mode="Markdown",
            )
        except Exception as e:
            import logging
            logging.error(f"Sessions handler error: {e}")
            await update.message.reply_text("No CC CLI sessions active.")

    # ============================================================
    # ♾️ AGI Loop Commands
    # ============================================================

    async def agi_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Handle /agi <subcommand> — AGI loop control."""
        args = context.args or []
        sub = args[0].lower() if args else "status"

        if sub == "start":
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

        elif sub == "stop":
            try:
                from src.core.agi_loop import get_agi_loop

                loop = get_agi_loop()
                loop.stop()
                await update.message.reply_text("🛑 AGI loop stopped.")
            except Exception as e:
                await update.message.reply_text(f"❌ Failed to stop AGI: {e}")

        elif sub == "status":
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
                    last_str = (
                        f"\n\n📌 *Last:* {icon} {last.get('title', 'Unknown')}"
                    )
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

        elif sub == "history":
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
                    lines.append(
                        f"{icon} `{d.get('id', '?')}` — {d.get('title', '?')}",
                    )
                await update.message.reply_text(
                    "\n".join(lines), parse_mode="Markdown",
                )
            except Exception as e:
                await update.message.reply_text(f"❌ AGI history error: {e}")

        elif sub == "config":
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

        else:
            await update.message.reply_text(
                "♾️ Usage: /agi <start|stop|status|history|config>",
            )

    # ============================================================
    # Original Command Handlers
    # ============================================================

    async def cmd_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Handle /cmd <goal> — execute via orchestrator."""
        goal = " ".join(context.args) if context.args else ""
        if not goal:
            await update.message.reply_text("Usage: /cmd <goal>")
            return

        await update.message.reply_text(f"⏳ Executing: {goal}...")
        result = await asyncio.to_thread(self._execute_goal, goal)
        await update.message.reply_text(
            self._format_result(result),
            parse_mode="Markdown",
        )

    async def status_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Handle /status — system health."""
        from src.core.memory import MemoryStore

        store = MemoryStore()
        stats = store.stats()

        # Include inbox info
        pending = len(get_pending_tasks())
        inbox_info = f"\n📬 Inbox: {pending} pending"

        # CC CLI session info
        cc_info = ""
        try:
            from src.core.cc_spawner import get_spawner

            spawner = get_spawner()
            active = len(spawner.active_sessions)
            total = len(spawner.all_sessions)
            cc_info = f"\n🤖 CC CLI: {active} active / {total} total"
        except Exception as e:
            import logging
            logging.debug(f"CC spawner not available: {e}")

        text = (
            f"🟢 *Tôm Hùm Status*\n"
            f"Executions: {stats['total']}\n"
            f"Success Rate: {stats['success_rate']:.1f}%\n"
            f"Recent Failures: {stats['recent_failures']}"
            f"{inbox_info}"
            f"{cc_info}"
        )
        await update.message.reply_text(text, parse_mode="Markdown")

    async def schedule_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
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

    async def swarm_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
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

    async def memory_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
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

    async def help_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Handle /help — show available commands."""
        kb = self._build_keyboard()
        await update.message.reply_text(
            HELP_TEXT,
            parse_mode="Markdown",
            reply_markup=kb,
        )

    async def _callback_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Handle inline keyboard button presses."""
        query = update.callback_query
        await query.answer()
        data = query.data or ""
        if data.startswith("cmd:"):
            action = data.split(":", 1)[1]
            mapping = {
                "cook": "/cook",
                "status": "/status",
                "memory": "/memory",
                "schedule": "/schedule",
                "tasks": "/tasks",
                "sessions": "/sessions",
            }
            await query.edit_message_text(f"Use: {mapping.get(action, data)}")

    # -- Utilities --

    async def send_notification(self, chat_id: int, message: str) -> None:
        """Send a push notification to a specific chat."""
        if not self._application or not self._running:
            return
        with contextlib.suppress(Exception):
            await self._application.bot.send_message(
                chat_id=chat_id,
                text=message,
                parse_mode="Markdown",
            )

    def _build_keyboard(self) -> InlineKeyboardMarkup | None:
        """Build inline keyboard for quick actions."""
        try:
            from telegram import InlineKeyboardButton, InlineKeyboardMarkup

            keyboard = [
                [
                    InlineKeyboardButton("🦞 Cook", callback_data="cmd:cook"),
                    InlineKeyboardButton("📊 Status", callback_data="cmd:status"),
                ],
                [
                    InlineKeyboardButton("📬 Tasks", callback_data="cmd:tasks"),
                    InlineKeyboardButton("🧠 Memory", callback_data="cmd:memory"),
                ],
            ]
            return InlineKeyboardMarkup(keyboard)
        except ImportError:
            return None

    def _execute_goal(self, goal: str) -> OrchestrationResult:
        """Execute goal via orchestrator (runs in thread)."""
        from src.core.llm_client import get_client
        from src.core.orchestrator import RecipeOrchestrator

        llm_client = get_client()
        orchestrator = RecipeOrchestrator(
            llm_client=llm_client if llm_client.is_available else None,
        )
        return orchestrator.run_from_goal(goal)

    def _format_result(self, result: OrchestrationResult | None) -> str:
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
    "HELP_TEXT",
    "BotConfig",
    "MekongBot",
    "add_task",
    "get_pending_tasks",
    "mark_task",
]
