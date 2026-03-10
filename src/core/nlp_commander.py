"""Mekong CLI - NLP Commander (Tôm Hùm Brain).

Uses Gemini 2.5 Pro to parse free-form Vietnamese/English messages
into structured ClaudeKit/Mekong CLI commands for CC CLI execution.
"""

from __future__ import annotations

import json
import logging
import time
from dataclasses import asdict, dataclass, field
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from src.core.llm_client import LLMClient

logger = logging.getLogger(__name__)

# Known projects in apps/ directory
KNOWN_PROJECTS = [
    "agencyos-web",
    "sophia-ai-factory",
    "openclaw-worker",
    "84tea",
    "wellnexus",
]

SYSTEM_PROMPT = """You are Tôm Hùm's NLP brain — an AI command parser for a software development automation system.

Your job: Parse a user's free-form message (Vietnamese or English) into a structured JSON task for autonomous code execution.

## ⚔️ BINH PHÁP MASTER STRATEGY (13 CHAPTERS)

You are part of "The Trinity" (Antigravity Brain + CC CLI Brain + Tôm Hùm Brain).
You must interpret commands through the lens of the 13 Strategic Chapters:

1.  **Ch.1 始計 (Thủy Kế/Planning):** `/plan`, `/ke-hoach` — Strategic assessment & architecture.
2.  **Ch.2 作戰 (Tác Chiến/Resources):** `/runway`, `/tac-chien` — Cost/Resource management.
3.  **Ch.3 謀攻 (Mưu Công/Stratagem):** `/muu-cong` — CI/CD, winning via systems.
4.  **Ch.4 形勢 (Hình Thế/Disposition):** `/hinh-the` — Structural moats, Architecture.
5.  **Ch.5 勢 (Thế/Momentum):** `/the-tran` — KPIs, Growth, Force measurement.
6.  **Ch.6 虛實 (Hư Thực/Weakness & Strength):** `/hu-thuc`, `/test` — Security, Testing, Defense.
7.  **Ch.7 軍爭 (Quân Tranh/Maneuvering):** `/quan-tranh`, `/deploy` — Speed, Execution, Deployment.
8.  **Ch.8 九變 (Cửu Biến/Variation):** `/cuu-bien` — Feature Flags, Adaptation.
9.  **Ch.9 行軍 (Hành Quân/Marching):** `/hanh-quan` — Jobs, Queues, Operations.
10. **Ch.10 地形 (Địa Hình/Terrain):** `/dia-hinh` — System Health, Monitoring.
11. **Ch.11 九地 (Cửu Địa/Nine Grounds):** `/cuu-dia` — Disaster Recovery, Critical Fixes.
12. **Ch.12 火攻 (Hỏa Công/Fire Attack):** `/hoa-cong` — Notifications, Marketing, Disruption.
13. **Ch.13 用間 (Dụng Gian/Espionage):** `/dung-gian` — Logging, Observability, Analytics.

## Context: Mekong CLI + ClaudeKit Engineer

The user runs a monorepo with these projects in apps/:
- agencyos-web: Next.js 16 RaaS platform (Tailwind v4, Shadcn/UI, Supabase auth)
- sophia-ai-factory: AI video content factory (Next.js, Telegram bot, Supabase, Polar.sh payments)
- openclaw-worker: Cloudflare Worker API gateway
- 84tea: Tea e-commerce (Next.js)
- wellnexus: Wellness platform (Next.js, PayOS payments, i18n)

## ClaudeKit Engineer Commands (50+ available):

### Planning (Ch.1):
- /plan [description] — Create implementation plan
- /plan:fast [description] — Quick planning
- /plan:hard [complex feature] — Deep research & planning
- /binh-phap [query] — Query the Master Strategy

### Implementation (Ch.2, 3, 4, 8, 9):
- /cook [description] — Build/implement (Hành Quân/Tác Chiến)
- /coding-level [level] — Set complexity

### Quality & Defense (Ch.6, 13):
- /review — Code review
- /test — Run tests
- /debug [issue] — Debug (Hư Thực)

### Execution & Maneuver (Ch.7, 12):
- /check-and-commit — Commit & Deploy
- /worktree [feature] — Branching
- /ship — Deploy to production

## Intent Classification & Mapping:

Map the user's message to one of these intents/chapters:
- "plan" (Ch.1) — Planning, research, architecture.
- "implement" (Ch.2,3,4,8,9) — Build, code, create.
- "fix" (Ch.6,11) — Bug fix, critical issue, remediation.
- "review" (Ch.6) — Audit, check, review.
- "test" (Ch.6) — Test, validate.
- "deploy" (Ch.7,12) — Ship, release, deploy.
- "status" (Ch.5,10) — Health check, status.
- "strategy" (Ch.1-13) — Questions about Binh Pháp/Strategy.

## Critical Rules:
1. **TRINITY SYNCHRONIZATION**: Ensure the `cc_cli_prompt` uses terminology from the 13 Chapters where appropriate (e.g., "Execute Ch.7 Deployment...").
2. ALWAYS detect the target project.
3. Generate detailed, specific `cc_cli_prompt`.
4. Respond ONLY with valid JSON.

## Output JSON:
{
  "intent": "implement",
  "project": "agencyos-web",
  "summary": "Build authentication module (Ch.6 Defense)",
  "cc_cli_prompt": "Execute Ch.6 (Defense) for apps/agencyos-web: Implement Supabase Auth module...",
  "claudekit_commands": ["/cook Implement Supabase Auth (Ch.6)"],
  "priority": "normal",
  "needs_confirmation": false
}"""


@dataclass
class StructuredTask:
    """Parsed NLP command → structured task for CC CLI."""

    intent: str = "implement"
    project: str | None = None
    summary: str = ""
    cc_cli_prompt: str = ""
    claudekit_commands: list[str] = field(default_factory=list)
    priority: str = "normal"
    needs_confirmation: bool = False
    raw_message: str = ""
    parse_error: str | None = None

    def to_dict(self) -> dict[str, Any]:
        """Convert the structured task to a plain dictionary."""
        return asdict(self)


class NLPCommander:
    """Gemini-powered NLP → structured command parser."""

    MEMORY_CONTEXT_MAX = 1000

    def __init__(self) -> None:
        self._client: LLMClient | None = None

    def _get_client(self) -> "LLMClient":
        """Lazy-load LLM client."""
        if self._client is None:
            from src.core.llm_client import get_client

            self._client = get_client()
        return self._client  # type: ignore[return-value]

    def parse(self, message: str) -> StructuredTask:
        """Parse free-form message into structured task."""
        client = self._get_client()

        if not client.is_available:
            logger.warning("Gemini offline. Using fallback parser.")
            return self._fallback_parse(message, error_detail="LLM offline")

        try:
            t0 = time.time()
            response = client.chat(
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": message},
                ],
                temperature=0.3,
                max_tokens=1024,
                json_mode=True,
            )
            elapsed = time.time() - t0
            logger.info(f"NLP LLM call took {elapsed:.1f}s (provider={client.mode})")

            # Guard against None/empty content — retry with simplified prompt
            content = response.content
            if not content or not content.strip():
                logger.warning(
                    f"NLP: empty response from {client.mode}. "
                    "Retrying with simplified prompt...",
                )
                simplified = (
                    f"Parse this into JSON with keys: intent, project, summary, "
                    f"cc_cli_prompt, claudekit_commands, priority, needs_confirmation.\n\n"
                    f"Message: {message}"
                )
                retry_response = client.chat(
                    messages=[{"role": "user", "content": simplified}],
                    temperature=0.2,
                    max_tokens=1024,
                    json_mode=True,
                )
                content = retry_response.content
                if not content or not content.strip():
                    return self._fallback_parse(
                        message,
                        error_detail=f"provider={client.mode}, both attempts empty",
                    )

            content = content.strip()

            # Strip markdown code fences if present
            if content.startswith("```"):
                lines = content.split("\n")
                if len(lines) > 1:
                    content = "\n".join(lines[1:])
                content = content.removesuffix("```")
                content = content.strip()

            data = json.loads(content)

            task = StructuredTask(
                intent=data.get("intent", "implement"),
                project=data.get("project"),
                summary=data.get("summary", message[:60]),
                cc_cli_prompt=data.get("cc_cli_prompt", message),
                claudekit_commands=data.get("claudekit_commands", ["/cook"]),
                priority=data.get("priority", "normal"),
                needs_confirmation=data.get("needs_confirmation", False),
                raw_message=message,
            )

            # Validate project name
            if task.project and task.project not in KNOWN_PROJECTS:
                for p in KNOWN_PROJECTS:
                    if (
                        task.project.lower() in p.lower()
                        or p.lower() in task.project.lower()
                    ):
                        task.project = p
                        break

            logger.info(f"NLP parsed: intent={task.intent}, project={task.project}")
            return task

        except Exception as e:
            logger.exception(f"NLP parse error: {e}")
            return self._fallback_parse(
                message, error_detail=f"exception: {str(e)[:80]}",
            )

    def _fallback_parse(self, message: str, error_detail: str = "") -> StructuredTask:
        """Fallback regex/keyword parser when AI fails."""
        msg_lower = message.lower()

        # Detect Project
        project = None
        for p in KNOWN_PROJECTS:
            if (
                p in msg_lower
                or p.replace("-", "") in msg_lower
                or p.split("-")[0] in msg_lower
            ):
                project = p
                break
        if not project and "agency" in msg_lower:
            project = "agencyos-web"
        if not project and "sophia" in msg_lower:
            project = "sophia-ai-factory"
        if not project and "tea" in msg_lower:
            project = "84tea"

        # Detect Intent
        intent = "implement"
        claudekit_commands = ["/cook"]

        if any(w in msg_lower for w in ["plan", "lên kế hoạch", "nghiên cứu"]):
            intent = "plan"
            claudekit_commands = ["/plan:fast"]
        elif any(w in msg_lower for w in ["fix", "sửa", "bug", "lỗi", "debug"]):
            intent = "fix"
            claudekit_commands = ["/debug"]
        elif any(
            w in msg_lower for w in ["review", "kiểm tra", "đánh giá", "xem giúp"]
        ):
            intent = "review"
            claudekit_commands = ["/review"]
        elif any(w in msg_lower for w in ["test", "kiểm thử"]):
            intent = "test"
            claudekit_commands = ["/test"]
        elif any(w in msg_lower for w in ["deploy", "triển khai", "commit"]):
            intent = "deploy"
            claudekit_commands = ["/check-and-commit"]
        elif any(w in msg_lower for w in ["status", "trạng thái", "tình hình"]):
            intent = "status"
            claudekit_commands = ["/status"]

        # Synthesize prompt
        prompt = f"{message}"
        if project:
            prompt += f" (Project: {project})"

        return StructuredTask(
            intent=intent,
            project=project,
            summary=message[:60],
            cc_cli_prompt=prompt,
            claudekit_commands=claudekit_commands,
            priority="normal",
            needs_confirmation=True,  # Always confirm on fallback
            raw_message=message,
            parse_error=error_detail or "Gemini returned empty -> Fallback used",
        )

    def format_confirmation(self, task: StructuredTask) -> str:
        """Format parsed task for Telegram confirmation message."""
        intent_icons = {
            "plan": "📝",
            "implement": "🔨",
            "fix": "🔧",
            "debug": "🔧",
            "review": "👀",
            "test": "🧪",
            "deploy": "🚀",
            "refactor": "♻️",
            "status": "📊",
            "docs": "📚",
        }
        icon = intent_icons.get(task.intent, "🦞")
        project_str = f"\n📂 Project: `{task.project}`" if task.project else ""
        commands_str = (
            " → ".join(task.claudekit_commands) if task.claudekit_commands else ""
        )

        return (
            f"🧠 *Tôm Hùm hiểu:*\n\n"
            f"{icon} Intent: *{task.intent.upper()}*{project_str}\n"
            f"🎯 {task.summary}\n"
            f"⚙️ Commands: `{commands_str}`\n\n"
            f"⚡ Đang gửi cho Antigravity xử lý..."
        )


# Singleton
_commander = None


def get_commander() -> NLPCommander:
    """Get or create NLP commander singleton."""
    global _commander
    if _commander is None:
        _commander = NLPCommander()
    return _commander


__all__ = ["NLPCommander", "StructuredTask", "get_commander"]
