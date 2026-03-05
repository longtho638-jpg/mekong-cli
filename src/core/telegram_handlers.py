"""
Mekong CLI - Telegram Bot Command Handlers

Handler functions for Telegram bot commands.
"""

from typing import Any

from telegram import Update
from telegram.ext import ContextTypes

from .telegram_inbox import add_task, get_pending_tasks, _load_inbox


async def cook_handler(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
    config: Any,
    save_config: Any,
) -> None:
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

    if chat_id not in config.chat_ids:
        config.chat_ids.append(chat_id)
        save_config()

    await update.message.reply_text(
        f"📨 *Task Queued for Antigravity!*\n\n"
        f"🆔 `{task['id']}`\n"
        f"🎯 Goal: _{goal}_\n"
        f"⏰ {task['created_at_iso']}\n\n"
        f"Antigravity sẽ pick up và điều phối CC CLI.\n"
        f"Use /tasks to check status.",
        parse_mode="Markdown",
    )


async def spawn_handler(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
    config: Any,
    save_config: Any,
) -> None:
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

    if chat_id not in config.chat_ids:
        config.chat_ids.append(chat_id)
        save_config()

    await update.message.reply_text(
        f"📨 *Task Queued for `{project}`!*\n\n"
        f"🆔 `{task['id']}`\n"
        f"🎯 Goal: _{goal}_\n"
        f"📂 Project: `apps/{project}`\n\n"
        f"Antigravity sẽ pick up và điều phối CC CLI.",
        parse_mode="Markdown",
    )


async def tasks_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /tasks — view pending tasks in inbox."""
    inbox = _load_inbox()

    if not inbox:
        await update.message.reply_text(
            "📭 Inbox trống.\nDùng /cook <goal> để gửi task."
        )
        return

    lines = ["📬 *Tôm Hùm Inbox*\n"]
    for t in inbox[-10:]:
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
            f"   {t.get('created_at_iso', '')}"
        )

    await update.message.reply_text(
        "\n".join(lines),
        parse_mode="Markdown",
    )


async def sessions_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /sessions — list active CC CLI terminals."""
    try:
        from src.core.cc_spawner import get_spawner

        spawner = get_spawner()
        sessions = spawner.all_sessions

        if not sessions:
            await update.message.reply_text(
                "No CC CLI sessions.\nUse /cook <goal> to queue a task."
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
                f"   Duration: {s.duration:.0f}s | Lines: {len(s.output_buffer)}"
            )

        await update.message.reply_text(
            "\n".join(lines),
            parse_mode="Markdown",
        )
    except Exception:
        await update.message.reply_text("No CC CLI sessions active.")


async def status_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /status — system health."""
    from src.core.memory import MemoryStore

    store = MemoryStore()
    stats = store.stats()

    pending = len(get_pending_tasks())
    inbox_info = f"\n📬 Inbox: {pending} pending"

    cc_info = ""
    try:
        from src.core.cc_spawner import get_spawner

        spawner = get_spawner()
        active = len(spawner.active_sessions)
        total = len(spawner.all_sessions)
        cc_info = f"\n🤖 CC CLI: {active} active / {total} total"
    except Exception:
        pass

    text = (
        f"🟢 *Tôm Hùm Status*\n"
        f"Executions: {stats['total']}\n"
        f"Success Rate: {stats['success_rate']:.1f}%\n"
        f"Recent Failures: {stats['recent_failures']}"
        f"{inbox_info}"
        f"{cc_info}"
    )
    await update.message.reply_text(text, parse_mode="Markdown")


async def schedule_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
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


async def swarm_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
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


async def memory_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
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


async def cmd_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /cmd <goal> — execute via orchestrator."""
    from src.core.orchestrator import RecipeOrchestrator
    from src.core.llm_client import get_client

    goal = " ".join(context.args) if context.args else ""
    if not goal:
        await update.message.reply_text("Usage: /cmd <goal>")
        return

    await update.message.reply_text(f"⏳ Executing: {goal}...")

    llm_client = get_client()
    orchestrator = RecipeOrchestrator(
        llm_client=llm_client if llm_client.is_available else None,
    )
    result = orchestrator.run_from_goal(goal)

    await update.message.reply_text(
        _format_result(result),
        parse_mode="Markdown",
    )


def _format_result(result: Any) -> str:
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


__all__ = [
    "cook_handler",
    "spawn_handler",
    "tasks_handler",
    "sessions_handler",
    "status_handler",
    "schedule_handler",
    "swarm_handler",
    "memory_handler",
    "cmd_handler",
    "_format_result",
]
