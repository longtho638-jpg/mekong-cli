"""Mekong CLI - AGI Infinite Loop (Tôm Hùm Self-Improvement Engine).

Runs CC CLI in an infinite loop. Each cycle:
  1. ASSESS: Query NeuralMemory + Gemini for gaps/improvements
  2. PLAN: Generate improvement prompt
  3. EXECUTE: Spawn CC CLI session to implement
  4. VERIFY: Check results
  5. MEMORIZE: Encode success/failure into NeuralMemory
  6. REPORT: Notify via Telegram
  7. COOLDOWN: Wait before next cycle

Usage:
  python3 src/core/agi_loop.py
  or via Telegram: /agi start
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import signal
import time
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

HISTORY_PATH = Path.home() / ".mekong" / "agi_history.json"

# Improvement areas Tôm Hùm should focus on
IMPROVEMENT_AREAS = [
    "error handling and resilience",
    "test coverage and quality",
    "code documentation and comments",
    "performance optimization",
    "security hardening",
    "new Telegram commands for user convenience",
    "NeuralMemory integration depth",
    "NLP understanding accuracy",
    "logging and observability",
    "configuration management",
    "modular architecture refactoring",
    "API endpoint design",
    "graceful shutdown and recovery",
    "rate limiting and throttling",
    "user experience improvements",
]

AGI_ASSESS_PROMPT = """You are Tôm Hùm's Self-Improvement Engine. You are analyzing the mekong-cli codebase to find the SINGLE most impactful improvement to make RIGHT NOW.

## Previously Completed Improvements (DO NOT REPEAT):
{completed_improvements}

## Focus Areas:
{focus_areas}

## Current Codebase Context:
{memory_context}

## Instructions:
1. Pick ONE specific, actionable improvement (not already done)
2. It must be completable in under 5 minutes by CC CLI
3. Prefer improvements that make Tôm Hùm smarter, more resilient, or more useful
4. Be VERY specific about which file to modify and what to change

Return JSON:
{{
  "improvement_id": "short-kebab-case-id",
  "title": "Human readable title",
  "description": "What to improve and why",
  "cc_cli_prompt": "The exact prompt to give CC CLI to implement this",
  "target_files": ["src/core/file.py"],
  "estimated_minutes": 3,
  "priority": "high|medium|low",
  "category": "one of the focus areas"
}}
"""


class AGILoop:
    """Autonomous self-improvement engine for Tôm Hùm."""

    DEFAULT_COOLDOWN = 90  # seconds between cycles
    MAX_CONSECUTIVE_FAILURES = 3

    def __init__(
        self,
        cooldown: int = DEFAULT_COOLDOWN,
        telegram_notify: bool = True,
        max_iterations: int | None = None,
    ) -> None:
        self.cooldown = cooldown
        self.telegram_notify = telegram_notify
        self.max_iterations = max_iterations
        self.iteration = 0
        self.consecutive_failures = 0
        self._running = False
        self._shutdown_event = asyncio.Event()
        # Persistent history
        self._history = self._load_history()
        self.completed_improvements: list[str] = self._history.get("completed", [])
        self.start_time = time.time()
        self.last_success_time: float | None = None

    def _load_history(self) -> dict[str, Any]:
        """Load persistent improvement history from disk."""
        if HISTORY_PATH.exists():
            try:
                result = json.loads(HISTORY_PATH.read_text())
                return dict(result)
            except (json.JSONDecodeError, OSError):
                return {"completed": [], "blacklist": {}, "details": []}
        return {"completed": [], "blacklist": {}, "details": []}

    def _save_history(self) -> None:
        """Persist history to disk (keep last 100 entries)."""
        HISTORY_PATH.parent.mkdir(parents=True, exist_ok=True)
        self._history["completed"] = self._history["completed"][-100:]
        self._history["details"] = self._history["details"][-100:]
        HISTORY_PATH.write_text(json.dumps(self._history, indent=2))

    def _is_blacklisted(self, improvement_id: str) -> bool:
        """Check if improvement failed 2+ times within 24h."""
        bl = self._history.get("blacklist", {}).get(improvement_id, {})
        if bool(bl.get("count", 0)) and int(bl.get("count", 0)) >= 2:
            return (time.time() - float(bl.get("last", 0))) < 86400
        return False

    def _calculate_cooldown(self) -> int:
        """Adaptive cooldown: faster on success streak, slower on failure."""
        if self.consecutive_failures == 0:
            streak = len([d for d in self._history.get("details", [])[-5:]
                         if d.get("success")])
            if streak >= 3:
                return int(max(30, self.cooldown // 2))
            return int(self.cooldown)
        return int(min(self.cooldown * (2 ** self.consecutive_failures), 600))

    def get_status(self) -> dict[str, Any]:
        """Return AGI loop metrics for Telegram and monitoring."""
        uptime = time.time() - self.start_time if self.start_time else 0
        total = len(self._history.get("details", []))
        successes = len([d for d in self._history.get("details", []) if d.get("success")])
        rate = (successes / total * 100) if total > 0 else 0
        last = self._history.get("details", [])[-1] if self._history.get("details") else None
        return {
            "running": self._running,
            "iteration": self.iteration,
            "improvements": len(self.completed_improvements),
            "consecutive_failures": self.consecutive_failures,
            "success_rate": round(rate, 1),
            "uptime_seconds": int(uptime),
            "last_improvement": last,
            "cooldown": self._calculate_cooldown(),
        }

    async def run_forever(self) -> None:
        """Main infinite loop."""
        self._running = True
        logger.info("🦞 AGI Loop started! Tôm Hùm is now self-improving...")

        # Register signal handlers
        loop = asyncio.get_event_loop()
        for sig in (signal.SIGINT, signal.SIGTERM):
            loop.add_signal_handler(sig, self._handle_shutdown)

        while self._running:
            self.iteration += 1

            if self.max_iterations and self.iteration > self.max_iterations:
                logger.info(
                    f"🏁 Reached max iterations ({self.max_iterations}). Stopping.",
                )
                break

            if self.consecutive_failures >= self.MAX_CONSECUTIVE_FAILURES:
                logger.warning(
                    f"⚠️ {self.consecutive_failures} consecutive failures. Cooling down 5min...",
                )
                await self._safe_sleep(300)
                self.consecutive_failures = 0

            logger.info(f"\n{'=' * 60}")
            logger.info(f"♾️  AGI LOOP — Iteration #{self.iteration}")
            logger.info(f"{'=' * 60}")

            try:
                # === STEP 1: ASSESS ===
                improvement = await self._assess()
                if not improvement:
                    logger.warning("No improvement found. Sleeping...")
                    await self._safe_sleep(self.cooldown)
                    continue

                # === STEP 1.5: BLACKLIST CHECK ===
                imp_id = improvement.get("improvement_id", "")
                if self._is_blacklisted(imp_id):
                    logger.info(f"Skipping blacklisted improvement: {imp_id}")
                    continue

                # === STEP 2: EXECUTE ===
                success = await self._execute(improvement)

                # === STEP 3: MEMORIZE ===
                await self._memorize(improvement, success)

                # === STEP 4: REPORT ===
                await self._report(improvement, success)

                # === STEP 4.5: PERSIST HISTORY ===
                if success:
                    self.consecutive_failures = 0
                    self.completed_improvements.append(imp_id)
                    self.last_success_time = time.time()
                    self._history["completed"] = self.completed_improvements
                    self._history["details"].append({
                        "id": imp_id, "title": improvement.get("title", ""),
                        "category": improvement.get("category", ""),
                        "timestamp": time.time(), "success": True,
                    })
                else:
                    self.consecutive_failures += 1
                    bl = self._history.setdefault("blacklist", {})
                    entry = bl.setdefault(imp_id, {"count": 0, "last": 0})
                    entry["count"] += 1
                    entry["last"] = time.time()
                self._save_history()

            except Exception as e:
                logger.exception(f"❌ Loop iteration #{self.iteration} failed: {e}")
                self.consecutive_failures += 1
                await self._report_error(str(e))

            # === STEP 5: COOLDOWN ===
            if self._running:
                actual_cooldown = self._calculate_cooldown()
                logger.info(f"😴 Cooling down {actual_cooldown}s... (M1 protection)")
                await self._safe_sleep(actual_cooldown)

        logger.info("🛑 AGI Loop stopped.")

    async def _assess(self) -> dict[str, Any] | None:
        """Step 1: Query Gemini + NeuralMemory for next improvement."""
        logger.info("🧠 ASSESS: Analyzing codebase for improvements...")

        # Get memory context
        memory_context = "No memory available"
        try:
            from src.core.memory_client import get_memory_client

            mem = get_memory_client()
            if mem.is_available:
                ctx = mem.query_memory(
                    "mekong-cli codebase improvements needed", depth=2,
                )
                if ctx:
                    memory_context = ctx
        except Exception as e:
            logger.warning(f"Memory query failed: {e}")

        # Build prompt
        completed_str = (
            "\n".join(f"- {imp}" for imp in self.completed_improvements[-20:])
            or "None yet"
        )
        focus_str = "\n".join(f"- {area}" for area in IMPROVEMENT_AREAS)

        prompt = AGI_ASSESS_PROMPT.format(
            completed_improvements=completed_str,
            focus_areas=focus_str,
            memory_context=memory_context[:3000],
        )

        # Call Gemini
        try:
            from src.core.llm_client import get_client

            client = get_client()

            if not client.is_available:
                logger.warning("LLM offline, cannot assess.")
                return None

            response = client.chat(
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=2048,
                json_mode=True,
            )

            content = response.content
            if not content:
                return None

            # Clean markdown fences
            content = content.strip()
            if content.startswith("```"):
                lines = content.split("\n")
                content = "\n".join(lines[1:])
                content = content.removesuffix("```")
                content = content.strip()

            improvement: dict[str, Any] = dict(json.loads(content))
            logger.info(f"🎯 Next improvement: {improvement.get('title', 'Unknown')}")
            return improvement

        except Exception as e:
            logger.exception(f"Assessment failed: {e}")
            return None

    async def _execute(self, improvement: dict[str, Any]) -> bool:
        """Step 2: Spawn CC CLI to implement the improvement."""
        title = improvement.get("title", "Unknown")
        cc_prompt = improvement.get("cc_cli_prompt", "")

        if not cc_prompt:
            logger.warning("No CC CLI prompt generated. Skipping.")
            return False

        logger.info(f"🔨 EXECUTE: {title}")
        logger.info(f"  Prompt: {cc_prompt[:100]}...")

        try:
            from src.core.cc_spawner import get_spawner

            spawner = get_spawner()

            session = await spawner.spawn(
                goal=cc_prompt,
                timeout=300,  # 5 min max per improvement
            )

            # Wait for completion
            wait_start = time.time()
            while (
                session.status.value == "running" and (time.time() - wait_start) < 310
            ):
                await asyncio.sleep(5)

            if session.status.value == "completed":
                logger.info(f"✅ CC CLI completed! Exit code: {session.exit_code}")
                logger.info(
                    f"  Output (last 5 lines):\n{chr(10).join(session.output_buffer[-5:])}",
                )
                return True
            logger.warning(
                f"❌ CC CLI failed: {session.status.value} - {session.error}",
            )
            return False

        except Exception as e:
            logger.exception(f"Execution failed: {e}")
            return False

    async def _memorize(self, improvement: dict[str, Any], success: bool) -> None:
        """Step 3: Encode result into NeuralMemory."""
        try:
            from src.core.memory_client import get_memory_client

            mem = get_memory_client()
            if not mem.is_available:
                return

            status = "SUCCESS" if success else "FAILED"
            content = (
                f"AGI Loop #{self.iteration}: {status} - "
                f"{improvement.get('title', 'Unknown')}. "
                f"Category: {improvement.get('category', 'unknown')}. "
                f"Files: {', '.join(improvement.get('target_files', []))}."
            )

            mem.add_memory(
                content,
                metadata={
                    "type": "agi_loop",
                    "iteration": self.iteration,
                    "success": success,
                    "improvement_id": improvement.get("improvement_id", "unknown"),
                },
            )

            logger.info(f"🧠 Memorized: {status}")

        except Exception as e:
            logger.warning(f"Memorization failed: {e}")

    async def _report(self, improvement: dict[str, Any], success: bool) -> None:
        """Step 4: Report to Telegram."""
        if not self.telegram_notify:
            return

        emoji = "✅" if success else "❌"
        title = improvement.get("title", "Unknown")
        category = improvement.get("category", "unknown")

        msg = (
            f"♾️ *AGI Loop #{self.iteration}*\n\n"
            f"{emoji} *{title}*\n"
            f"📂 Category: {category}\n"
            f"⏱ Completed improvements: {len(self.completed_improvements)}\n"
            f"🔄 Consecutive failures: {self.consecutive_failures}"
        )

        await self._send_telegram(msg)

    async def _report_error(self, error: str) -> None:
        """Report error to Telegram."""
        if not self.telegram_notify:
            return

        msg = f"⚠️ *AGI Loop #{self.iteration} Error*\n\n```\n{error[:500]}\n```"
        await self._send_telegram(msg)

    async def _send_telegram(self, message: str) -> None:
        """Send message via Telegram bot."""
        try:
            import requests  # type: ignore[import-untyped]

            token = os.getenv("MEKONG_TELEGRAM_TOKEN", "")
            if not token:
                return

            # Read chat_id from config
            chat_ids = []
            config_path = os.path.expanduser("~/.mekong/config.yaml")
            if os.path.exists(config_path):
                import yaml  # type: ignore[import-untyped]

                with open(config_path) as f:
                    cfg = yaml.safe_load(f) or {}
                    tg = cfg.get("telegram", {})
                    chat_ids = tg.get("chat_ids", [])

            if not chat_ids:
                # Fallback: try env
                cid = os.getenv("MEKONG_CHAT_ID", "")
                if cid:
                    chat_ids = [int(cid)]

            for cid in chat_ids:
                requests.post(
                    f"https://api.telegram.org/bot{token}/sendMessage",
                    json={
                        "chat_id": cid,
                        "text": message,
                        "parse_mode": "Markdown",
                    },
                    timeout=10,
                )
        except Exception as e:
            logger.warning(f"Telegram send failed: {e}")

    async def _safe_sleep(self, seconds: int) -> None:
        """Sleep that can be interrupted by shutdown."""
        try:
            await asyncio.wait_for(self._shutdown_event.wait(), timeout=seconds)
        except TimeoutError:
            pass  # Normal: timeout means sleep completed

    def _handle_shutdown(self) -> None:
        """Handle SIGINT/SIGTERM."""
        logger.info("\n🛑 Shutdown signal received. Finishing current cycle...")
        self._running = False
        self._shutdown_event.set()

    def stop(self) -> None:
        """Stop the AGI loop gracefully, allowing the current cycle to finish."""
        self._handle_shutdown()


# Module-level singleton
_agi_loop: AGILoop | None = None


def get_agi_loop() -> AGILoop:
    """Get or create the AGI loop instance."""
    global _agi_loop
    if _agi_loop is None:
        _agi_loop = AGILoop()
    return _agi_loop


async def main() -> None:
    """Entry point for standalone execution."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [AGI] %(message)s",
        datefmt="%H:%M:%S",
    )

    logger.info("🦞 Tôm Hùm AGI Loop — Starting self-improvement engine...")
    logger.info("   Press Ctrl+C to stop gracefully.\n")

    loop = AGILoop(
        cooldown=90,
        telegram_notify=True,
    )

    await loop.run_forever()


if __name__ == "__main__":
    asyncio.run(main())
