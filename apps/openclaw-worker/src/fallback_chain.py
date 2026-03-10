"""Hybrid LLM Router - Fallback Chain (ALGO 7) - Stub for testing."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Callable

if TYPE_CHECKING:
    from .model_selector import ModelConfig
    from .task_classifier import TaskProfile


@dataclass
class ExecutionResult:
    """Result của execution với fallback."""

    success: bool
    model_used: str | None = None
    error: str | None = None
    tokens_output: int | None = None
    attempts: list[str] = field(default_factory=list)


class RateLimitError(Exception):
    """Rate limit exception."""
    pass


class ModelUnavailableError(Exception):
    """Model unavailable exception."""
    pass


class FallbackChain:
    """ALGO 7: Fallback chain khi model fail."""

    FALLBACK_HIERARCHY = {
        "claude-opus-4-6": ["claude-sonnet-4-6", "gemini-2.0-pro"],
        "claude-sonnet-4-6": ["claude-haiku-4-5", "gemini-2.0-flash"],
        "claude-haiku-4-5": ["gemini-2.0-flash", "gpt-4o-mini"],
        "gemini-2.0-pro": ["claude-sonnet-4-6", "gpt-4o"],
        "gemini-2.0-flash": ["gpt-4o-mini", "claude-haiku-4-5"],
        "gemini-2.0-flash-lite": ["gpt-4o-mini", "ollama:llama3.2:3b"],
        "ollama:deepseek-coder-v2:33b": ["claude-sonnet-4-6", "gemini-2.0-flash"],
        "ollama:llama3.3:70b": ["gemini-2.0-flash", "gpt-4o-mini"],
        "ollama:llama3.2:3b": ["gemini-2.0-flash-lite"],
        "ollama:qwen2.5:7b": ["gemini-2.0-flash-lite"],
        "ollama:mistral:7b": ["claude-haiku-4-5", "gemini-2.0-flash"],
    }

    MAX_RETRIES = 3
    RETRY_DELAYS = [1, 3, 9]  # Exponential backoff

    async def execute_with_fallback(
        self,
        model_config: ModelConfig,
        messages: list[dict],
        system_prompt: str,
        on_token_cb: Callable[[str], asyncio.Future],
        profile: TaskProfile,
    ) -> ExecutionResult:
        """Execute với fallback chain khi model fail.

        Args:
            model_config: Model configuration
            messages: Message chain
            system_prompt: System prompt
            on_token_cb: Callback cho mỗi token
            profile: Task profile

        Returns:
            ExecutionResult
        """
        attempted: list[str] = []
        current_model = model_config.model_id

        for attempt in range(self.MAX_RETRIES):
            try:
                attempted.append(current_model)
                tokens_used = 0

                # Execute
                if current_model.startswith("ollama:"):
                    # Local execution stub
                    output = await self._execute_local(
                        current_model, messages, on_token_cb
                    )
                else:
                    # API execution stub
                    output = await self._execute_api(
                        model_config, messages, system_prompt, on_token_cb
                    )

                tokens_used = len(output.split())

                return ExecutionResult(
                    success=True,
                    model_used=current_model,
                    tokens_output=tokens_used,
                    attempts=attempted,
                )

            except RateLimitError:
                # Retry same model với backoff
                await asyncio.sleep(self.RETRY_DELAYS[attempt])

            except (ModelUnavailableError, ConnectionError, TimeoutError):
                # Try fallback
                fallbacks = self.FALLBACK_HIERARCHY.get(current_model, [])
                next_models = [m for m in fallbacks if m not in attempted]

                if not next_models:
                    break

                # Sensitivity check
                if profile.data_sensitivity == "sensitive":
                    api_fallbacks = [
                        m for m in next_models if not m.startswith("ollama:")
                    ]
                    if api_fallbacks:
                        next_models = [
                            m for m in next_models if m.startswith("ollama:")
                        ]

                if next_models:
                    current_model = next_models[0]
                else:
                    break

        # All attempts failed
        return ExecutionResult(
            success=False,
            model_used=None,
            error="all_models_failed",
            attempts=attempted,
        )

    async def _execute_local(
        self,
        model: str,
        messages: list[dict],
        on_token_cb: Callable[[str], asyncio.Future],
    ) -> str:
        """Stub: Execute local Ollama model."""
        # Simulate streaming output
        output = f"[Local {model} response]"
        for word in output.split():
            await on_token_cb(word + " ")
            await asyncio.sleep(0.01)
        return output

    async def _execute_api(
        self,
        model_config: ModelConfig,
        messages: list[dict],
        system_prompt: str,
        on_token_cb: Callable[[str], asyncio.Future],
    ) -> str:
        """Stub: Execute API model."""
        # Simulate streaming output
        output = f"[API {model_config.model_id} response]"
        for word in output.split():
            await on_token_cb(word + " ")
            await asyncio.sleep(0.01)
        return output
