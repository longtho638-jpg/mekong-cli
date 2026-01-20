from datetime import datetime, timedelta, timezone
from typing import List

from .models import QuotaModel

class MockQuotaGenerator:
    """Generates mock quota data for testing and development."""

    @staticmethod
    def get_mock_quota() -> List[QuotaModel]:
        """Return full model list matching vscode-antigravity-cockpit."""
        now = datetime.now(timezone.utc)
        return [
            # Chat sessions
            QuotaModel(
                model_id="chat_20706",
                model_name="chat_20706",
                remaining_percent=100.0,
                reset_time=None,
                pool_id="chat-pool",
                capabilities=["text"],
            ),
            QuotaModel(
                model_id="chat_23310",
                model_name="chat_23310",
                remaining_percent=100.0,
                reset_time=None,
                pool_id="chat-pool",
                capabilities=["text"],
            ),
            # Claude Models
            QuotaModel(
                model_id="claude-opus-4.5-thinking",
                model_name="Claude Opus 4.5 (Thinking)",
                remaining_percent=80.0,
                reset_time=now + timedelta(hours=1, minutes=3),
                pool_id="claude-pool",
                capabilities=["text", "code", "vision", "thinking"],
                context_window=200000,
            ),
            QuotaModel(
                model_id="claude-sonnet-4.5",
                model_name="Claude Sonnet 4.5",
                remaining_percent=80.0,
                reset_time=now + timedelta(hours=1, minutes=3),
                pool_id="claude-pool",
                capabilities=["text", "code", "vision"],
                context_window=200000,
            ),
            QuotaModel(
                model_id="claude-sonnet-4.5-thinking",
                model_name="Claude Sonnet 4.5 (Thinking)",
                remaining_percent=80.0,
                reset_time=now + timedelta(hours=1, minutes=3),
                pool_id="claude-pool",
                capabilities=["text", "code", "vision", "thinking"],
                context_window=200000,
            ),
            # Gemini 2.5 Models
            QuotaModel(
                model_id="gemini-2.5-flash",
                model_name="Gemini 2.5 Flash",
                remaining_percent=100.0,
                reset_time=now + timedelta(hours=1, minutes=24),
                pool_id="gemini-2.5-pool",
                capabilities=["text", "code", "vision"],
                context_window=1000000,
            ),
            QuotaModel(
                model_id="gemini-2.5-flash-thinking",
                model_name="Gemini 2.5 Flash (Thinking)",
                remaining_percent=100.0,
                reset_time=now + timedelta(hours=1, minutes=24),
                pool_id="gemini-2.5-pool",
                capabilities=["text", "code", "vision", "thinking"],
                context_window=1000000,
            ),
            QuotaModel(
                model_id="gemini-2.5-flash-lite",
                model_name="Gemini 2.5 Flash Lite",
                remaining_percent=100.0,
                reset_time=now + timedelta(hours=3, minutes=16),
                pool_id="gemini-2.5-pool",
                capabilities=["text", "code"],
                context_window=128000,
            ),
            QuotaModel(
                model_id="gemini-2.5-pro",
                model_name="Gemini 2.5 Pro",
                remaining_percent=100.0,
                reset_time=now + timedelta(hours=5),
                pool_id="gemini-2.5-pool",
                capabilities=["text", "code", "vision", "video"],
                context_window=1000000,
            ),
            # Gemini 3 Models
            QuotaModel(
                model_id="gemini-3-flash",
                model_name="Gemini 3 Flash",
                remaining_percent=80.0,
                reset_time=now + timedelta(hours=1, minutes=25),
                pool_id="gemini-3-pool",
                capabilities=["text", "code", "vision"],
                context_window=1000000,
            ),
            QuotaModel(
                model_id="gemini-3-pro-high",
                model_name="Gemini 3 Pro (High)",
                remaining_percent=100.0,
                reset_time=now + timedelta(hours=2, minutes=20),
                pool_id="gemini-3-pool",
                capabilities=["text", "code", "vision", "thinking"],
                context_window=2000000,
            ),
            QuotaModel(
                model_id="gemini-3-pro-low",
                model_name="Gemini 3 Pro (Low)",
                remaining_percent=100.0,
                reset_time=now + timedelta(hours=2, minutes=20),
                pool_id="gemini-3-pool",
                capabilities=["text", "code", "vision"],
                context_window=2000000,
            ),
            QuotaModel(
                model_id="gemini-3-pro-image",
                model_name="Gemini 3 Pro Image",
                remaining_percent=100.0,
                reset_time=now + timedelta(hours=5),
                pool_id="gemini-3-pool",
                capabilities=["text", "vision", "image-gen"],
                context_window=1000000,
            ),
            # Other Models
            QuotaModel(
                model_id="gpt-oss-120b-medium",
                model_name="GPT-OSS 120B (Medium)",
                remaining_percent=80.0,
                reset_time=now + timedelta(hours=1, minutes=3),
                pool_id="gpt-pool",
                capabilities=["text", "code"],
                context_window=128000,
            ),
            QuotaModel(
                model_id="rev19-uic3-1p",
                model_name="rev19-uic3-1p",
                remaining_percent=100.0,
                reset_time=now + timedelta(hours=5),
                pool_id="experimental-pool",
                capabilities=["text"],
            ),
            QuotaModel(
                model_id="tab-flash-lite-preview",
                model_name="tab_flash_lite_preview",
                remaining_percent=80.0,
                reset_time=now + timedelta(hours=1, minutes=3),
                pool_id="experimental-pool",
                capabilities=["text", "code"],
            ),
        ]
