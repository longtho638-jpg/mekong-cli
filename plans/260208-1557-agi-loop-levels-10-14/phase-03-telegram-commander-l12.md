# Phase 03: Telegram Commander (Level 12)

## Context Links
- [AGI Roadmap](../../plans/agi-roadmap-levels-10-14.md)
- [NLU](../../src/core/nlu.py) — (created in L11) parse Telegram /cmd goals
- [Memory Store](../../src/core/memory.py) — (created in L10) for /memory command
- [Orchestrator](../../src/core/orchestrator.py) — execute goals from Telegram
- [EventBus](../../src/core/event_bus.py) — subscribe for push notifications
- [Scheduler](../../src/core/scheduler.py) — list/add scheduled jobs from Telegram
- [Gateway](../../src/core/gateway.py) — start bot on gateway startup

## Overview
- **Priority:** P1
- **Status:** pending
- **Version:** v0.9.0
- **Description:** Remote command center via Telegram bot. Users chat commands, Mekong executes locally. Push notifications on important events. Inline keyboards for common actions.

## Key Insights
- `python-telegram-bot` is the standard async Python Telegram library
- Bot runs in its own asyncio event loop, separate from gateway
- Notifier subscribes to EventBus — decoupled from bot logic
- Token via `MEKONG_TELEGRAM_TOKEN` env var — no token = bot disabled silently
- Keep bot logic thin: delegate to orchestrator/memory/scheduler for actual work

## Requirements

### Functional
- Telegram commands: /cmd, /status, /schedule, /swarm, /memory, /help
- /cmd <goal> executes via orchestrator, sends result summary
- /status shows system health + running jobs
- /schedule list|add shows/adds scheduled jobs
- /swarm shows swarm node status
- /memory shows recent 5 executions
- /help lists available commands
- Inline keyboard buttons for Quick Deploy, Check Status
- Push notifications on GOAL_COMPLETED, JOB_STARTED, JOB_COMPLETED
- Configurable notification events via `.mekong/notify.yaml`

### Non-Functional
- Bot startup < 2s
- Message response < 500ms (excluding goal execution time)
- Graceful shutdown on SIGTERM
- No crash if Telegram API unreachable

## Architecture

```
Telegram Chat
    └─> python-telegram-bot (async handlers)
            ├─> /cmd <goal> -> Orchestrator.run_from_goal()
            ├─> /status -> System health check
            ├─> /schedule -> Scheduler.list_jobs()
            ├─> /swarm -> SwarmRegistry.list_nodes()
            ├─> /memory -> MemoryStore.recent(5)
            └─> /help -> Command list

EventBus
    └─> Notifier (subscriber)
            └─> Telegram bot.send_message()
```

## Related Code Files

### Create
| File | Lines | Purpose |
|------|-------|---------|
| `src/core/telegram_bot.py` | ~200 | Telegram bot with command handlers |
| `src/core/notifier.py` | ~80 | EventBus subscriber for push notifications |
| `tests/test_telegram_bot.py` | ~130 | Bot handler tests (mocked Telegram API) |
| `tests/test_notifier.py` | ~60 | Notifier subscription tests |

### Modify
| File | Change |
|------|--------|
| `src/core/gateway.py` | Auto-start bot on gateway startup if token configured, GET /telegram/status, VERSION 0.9.0 |
| `src/core/__init__.py` | Export MekongBot, Notifier |
| `src/main.py` | Add `telegram` Typer sub-app, version 0.9.0 |

## Implementation Steps

### 1. Create Telegram Bot (src/core/telegram_bot.py)

```python
from typing import Optional, Dict, Any
from dataclasses import dataclass

@dataclass
class BotConfig:
    """Telegram bot configuration."""
    token: str = ""
    chat_ids: list = field(default_factory=list)  # Authorized chat IDs
    enabled: bool = True

class MekongBot:
    """Telegram bot for remote Mekong CLI control."""

    def __init__(self, token: Optional[str] = None) -> None: ...
    async def start(self) -> None: ...
    async def stop(self) -> None: ...
    def is_running(self) -> bool: ...

    # Command handlers
    async def cmd_handler(self, update, context) -> None: ...
    async def status_handler(self, update, context) -> None: ...
    async def schedule_handler(self, update, context) -> None: ...
    async def swarm_handler(self, update, context) -> None: ...
    async def memory_handler(self, update, context) -> None: ...
    async def help_handler(self, update, context) -> None: ...

    # Utilities
    async def send_notification(self, chat_id: int, message: str) -> None: ...
    def _build_keyboard(self) -> Any: ...  # InlineKeyboardMarkup
    def _format_result(self, result: Any) -> str: ...
    def _load_config(self) -> BotConfig: ...
    def _save_config(self) -> None: ...
```

Command handler details:

**/cmd <goal>**:
```python
async def cmd_handler(self, update, context):
    goal = " ".join(context.args) if context.args else ""
    if not goal:
        await update.message.reply_text("Usage: /cmd <goal>")
        return
    await update.message.reply_text(f"Executing: {goal}...")
    # Run in thread to not block bot
    result = await asyncio.to_thread(self._execute_goal, goal)
    await update.message.reply_text(self._format_result(result))
```

**/help**:
```python
HELP_TEXT = """
Mekong CLI - Telegram Commander

/cmd <goal> - Execute a goal
/status - System health
/schedule - View scheduled jobs
/swarm - Swarm node status
/memory - Recent 5 executions
/help - This help message
"""
```

**Inline keyboard** (sent with /help and after /cmd results):
```python
def _build_keyboard(self):
    from telegram import InlineKeyboardButton, InlineKeyboardMarkup
    keyboard = [
        [InlineKeyboardButton("Deploy", callback_data="cmd:deploy"),
         InlineKeyboardButton("Status", callback_data="cmd:status")],
        [InlineKeyboardButton("Memory", callback_data="cmd:memory"),
         InlineKeyboardButton("Schedule", callback_data="cmd:schedule")],
    ]
    return InlineKeyboardMarkup(keyboard)
```

### 2. Create Notifier (src/core/notifier.py)

```python
@dataclass
class NotifyConfig:
    """Notification configuration."""
    events: List[str] = field(default_factory=lambda: [
        "goal_completed", "job_started", "job_completed"
    ])
    enabled: bool = True

class Notifier:
    """EventBus subscriber that pushes notifications to Telegram."""

    def __init__(self, bot: Optional[MekongBot] = None) -> None: ...
    def subscribe(self, bus: EventBus) -> None: ...
    def unsubscribe(self, bus: EventBus) -> None: ...
    def on_event(self, event: Event) -> None: ...
    def _should_notify(self, event_type: EventType) -> bool: ...
    def _format_notification(self, event: Event) -> str: ...
    def _load_config(self) -> NotifyConfig: ...
```

Key behaviors:
- `subscribe()` registers `on_event` for GOAL_COMPLETED, JOB_STARTED, JOB_COMPLETED
- `on_event()` checks `_should_notify()`, formats message, calls `bot.send_notification()`
- Config from `.mekong/notify.yaml` — which events to notify on
- If bot is None or not running, silently skip

### 3. Gateway integration (src/core/gateway.py)

Add bot auto-start in `create_app()`:
```python
import os
telegram_token = os.environ.get("MEKONG_TELEGRAM_TOKEN", "")
bot = None
if telegram_token:
    from src.core.telegram_bot import MekongBot
    from src.core.notifier import Notifier
    bot = MekongBot(token=telegram_token)
    notifier = Notifier(bot=bot)
    notifier.subscribe(get_event_bus())

@gateway.on_event("startup")
async def startup_bot():
    if bot:
        asyncio.create_task(bot.start())

@gateway.on_event("shutdown")
async def shutdown_bot():
    if bot:
        await bot.stop()

@gateway.get("/telegram/status")
def telegram_status():
    return {"running": bot.is_running() if bot else False, "configured": bool(telegram_token)}
```

### 4. CLI commands (src/main.py)

```python
telegram_app = typer.Typer(help="Telegram: remote commander bot")
app.add_typer(telegram_app, name="telegram")

@telegram_app.command("start")
def telegram_start(): ...  # Start bot in foreground (blocking)

@telegram_app.command("status")
def telegram_status(): ...  # Check if token configured, bot reachable
```

### 5. Version bump
- `src/core/gateway.py`: `VERSION = "0.9.0"`
- `src/main.py`: version string to "0.9.0"

### 6. Write tests

**tests/test_telegram_bot.py** — `class TestMekongBot(unittest.TestCase)`:
- `test_bot_init_no_token` — bot created but not startable
- `test_bot_init_with_token` — bot configured
- `test_is_running_default_false` — default state
- `test_format_result_success` — formats OrchestrationResult
- `test_format_result_failure` — includes error messages
- `test_help_text_contains_commands` — all commands listed
- `test_build_keyboard` — returns InlineKeyboardMarkup with buttons
- `test_cmd_handler_no_args` — replies with usage message
- `test_cmd_handler_with_goal` — executes and replies (mocked orchestrator)
- `test_status_handler` — returns system info
- `test_memory_handler` — returns recent entries
- `test_schedule_handler` — returns job list
- `test_load_config_missing_file` — defaults
- `test_load_config_existing` — reads .mekong/telegram.yaml

**tests/test_notifier.py** — `class TestNotifier(unittest.TestCase)`:
- `test_subscribe_registers_events` — subscriber count increases
- `test_unsubscribe_removes` — subscriber count decreases
- `test_should_notify_configured_event` — goal_completed = True
- `test_should_notify_unconfigured_event` — step_started = False
- `test_on_event_no_bot` — silently skips
- `test_format_notification_goal_completed` — readable message
- `test_load_config_defaults` — default events list
- `test_format_notification_job_started` — includes job name

### 7. Run tests
```bash
python3 -m pytest tests/ -v --tb=short
```

## Todo List
- [ ] Create src/core/telegram_bot.py with MekongBot, BotConfig
- [ ] Create src/core/notifier.py with Notifier, NotifyConfig
- [ ] Add gateway bot auto-start and /telegram/status endpoint
- [ ] Add CLI telegram sub-app (start, status)
- [ ] Bump version to 0.9.0
- [ ] Write tests/test_telegram_bot.py (14 tests)
- [ ] Write tests/test_notifier.py (8 tests)
- [ ] Update src/core/__init__.py exports
- [ ] Run full test suite, verify 285+

## Success Criteria
- `python3 -m pytest tests/ -v` passes with 285+ tests
- Bot starts when MEKONG_TELEGRAM_TOKEN set
- /cmd <goal> executes and returns result
- /memory shows recent entries
- Notifier sends messages on GOAL_COMPLETED
- GET /telegram/status returns running state

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
| python-telegram-bot not installed | High | Check import, skip gracefully |
| Telegram API rate limiting | Medium | Queue messages, max 1/sec |
| Bot blocks main gateway thread | High | Run bot in asyncio task |
| Unauthorized users sending commands | High | Chat ID whitelist in config |

## Security Considerations
- MEKONG_TELEGRAM_TOKEN must be in env, never in code
- Chat ID whitelist to restrict who can execute commands
- /cmd executes shell commands — must validate/sanitize goals
- Destructive actions should require confirmation (L14 governance)

## Next Steps
- L13 Self-Evolution can notify via Telegram when new recipe generated
- L14 Governance uses Telegram for human-approval of destructive actions
