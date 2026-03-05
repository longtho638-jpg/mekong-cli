"""Mekong CLI - LLM Client.

Thin router over pluggable LLMProvider backends.
Priority (auto-detected from env vars when no providers passed):
1. GEMINI_API_KEY  → GeminiProvider
2. ANTIGRAVITY_PROXY_URL / LLM_BASE_URL  → OpenAICompatibleProvider
3. OPENAI_API_KEY  → OpenAICompatibleProvider
4. Fallback  → OfflineProvider

Runtime failover: if one provider fails, tries the next in priority order.
Circuit breaker: after 3 consecutive failures, provider cools down for 60s.
Portkey-inspired: status-code based failover, hooks pipeline, LRU cache.
"""

from __future__ import annotations

import json
import logging
import os
import re
import time
import hashlib
from dataclasses import dataclass
from typing import Any

import requests  # type: ignore[import-untyped]

from .hooks import HookContext, HookPhase, HookPipeline, create_default_pipeline
from .llm_cache import LLMCache
from .providers import (
    GeminiProvider,
    LLMProvider,
    LLMResponse,
    OfflineProvider,
    OpenAICompatibleProvider,
)

logger = logging.getLogger(__name__)


@dataclass
class ProviderHealth:
    """Tracks consecutive failures per provider for circuit breaker."""

    failures: int = 0
    last_failure: float = 0.0
    cooldown_secs: float = 15.0  # Giảm từ 60 → 15s (nhanh recovery hơn)

    @property
    def is_healthy(self) -> bool:
        """True if fewer than 3 failures, or cooldown has elapsed."""
        if self.failures < 3:
            return True
        return (time.time() - self.last_failure) > self.cooldown_secs

    def record_failure(self) -> None:
        self.failures += 1
        self.last_failure = time.time()

    def record_success(self) -> None:
        self.failures = 0


class LLMClient:
    """LLMClient — thin router over List[LLMProvider] with circuit-breaker failover.

    Usage:
        # Auto-detect from env vars (backward-compatible)
        client = LLMClient()

        # Explicit providers
        from src.core.providers import GeminiProvider
        client = LLMClient(providers=[GeminiProvider(os.getenv("GEMINI_API_KEY"))])

        # From YAML config
        client = LLMClient.from_config("configs/default.yaml")
    """

    def __init__(
        self,
        proxy_url: str | None = None,
        api_key: str | None = None,
        gemini_key: str | None = None,
        model: str = "gemini-2.5-pro",
        timeout: int = 60,
        enable_cache: bool = True,
        enable_hooks: bool = True,
        providers: list[LLMProvider] | None = None,
    ) -> None:
        """Initialize LLMClient.

        Args:
            proxy_url: Proxy base URL. Falls back to ANTIGRAVITY_PROXY_URL / LLM_BASE_URL env var.
            api_key: OpenAI API key. Falls back to OPENAI_API_KEY env var.
            gemini_key: Gemini API key. Falls back to GEMINI_API_KEY env var.
            model: Default model name.
            timeout: HTTP timeout in seconds.
            enable_cache: Enable LRU response caching.
            enable_hooks: Enable hooks middleware pipeline.
            providers: Explicit provider list. If None, auto-detects from env vars.

        """
        self.model = model
        self.timeout = timeout

        # Keep legacy attrs for backward compat (some callers read them directly)
        self.proxy_url = proxy_url or os.getenv("ANTIGRAVITY_PROXY_URL", "") or os.getenv("LLM_BASE_URL", "")
        self.api_key = api_key or os.getenv("OPENAI_API_KEY", "")
        self.gemini_key = gemini_key or os.getenv("GEMINI_API_KEY", "")

        # Portkey-inspired: hooks pipeline + LRU cache
        self.hooks: HookPipeline | None = create_default_pipeline() if enable_hooks else None
        self.cache: LLMCache | None = LLMCache() if enable_cache else None

        # Request deduplication — in-flight requests
        self._pending_requests: dict[str, LLMResponse | None] = {}  # Keyed by hash

        # Build provider list
        if providers is not None:
            self.providers: list[LLMProvider] = providers
        else:
            self.providers = self._build_providers_from_env()

        # Circuit breaker health keyed by provider.name
        self._provider_health: dict[str, ProviderHealth] = {
            p.name: ProviderHealth() for p in self.providers
        }

        # Legacy mode attr (used by is_available property)
        available_names = {p.name for p in self.providers if p.is_available()}
        if "gemini" in available_names:
            self.mode = "vertex"
        elif any(n not in ("offline",) for n in available_names):
            self.mode = "proxy"  # generic "online" mode
        else:
            self.mode = "offline"

    # ------------------------------------------------------------------
    # Class method constructor (from YAML config)
    # ------------------------------------------------------------------

    @classmethod
    def from_config(
        cls,
        config_path: str,
        model: str = "gemini-2.5-pro",
        timeout: int = 60,
        enable_cache: bool = True,
        enable_hooks: bool = True,
    ) -> "LLMClient":
        """Create LLMClient from YAML provider config."""
        providers = cls._build_providers_from_config(config_path)
        return cls(
            model=model,
            timeout=timeout,
            enable_cache=enable_cache,
            enable_hooks=enable_hooks,
            providers=providers,
        )

    # ------------------------------------------------------------------
    # Provider builders
    # ------------------------------------------------------------------

    def _build_providers_from_env(self) -> list[LLMProvider]:
        """Auto-detect providers from environment variables (priority order)."""
        built: list[LLMProvider] = []

        gemini_key = self.gemini_key
        if gemini_key:
            built.append(GeminiProvider(api_key=gemini_key, model=self.model))

        proxy_url = self.proxy_url
        if proxy_url:
            built.append(
                OpenAICompatibleProvider(
                    base_url=proxy_url,
                    api_key=self.api_key or "",
                    model=self.model,
                    provider_name="proxy",
                    timeout=self.timeout,
                ),
            )

        openai_key = self.api_key
        if openai_key and not proxy_url:
            built.append(
                OpenAICompatibleProvider(
                    base_url="https://api.openai.com/v1",
                    api_key=openai_key,
                    model=self.model,
                    provider_name="openai",
                    timeout=self.timeout,
                ),
            )

        built.append(OfflineProvider())
        return built

    @staticmethod
    def _build_providers_from_config(config_path: str) -> list[LLMProvider]:
        """Load providers from YAML config file."""
        try:
            import yaml  # type: ignore
        except ImportError:
            logger.exception("[LLMClient] PyYAML not installed — cannot load config")
            return [OfflineProvider()]

        try:
            with open(config_path) as f:
                config = yaml.safe_load(f)
        except OSError as e:
            logger.exception("[LLMClient] Cannot read config %s: %s", config_path, e)
            return [OfflineProvider()]

        built: list[LLMProvider] = []
        for entry in config.get("providers", []):
            ptype = entry.get("type", "")
            if ptype == "gemini":
                key_env = entry.get("api_key_env", "GEMINI_API_KEY")
                api_key = os.getenv(key_env, "")
                model = entry.get("model", "gemini-2.5-pro")
                if api_key:
                    built.append(GeminiProvider(api_key=api_key, model=model))
            elif ptype == "openai_compatible":
                base_url = entry.get("base_url", "")
                key_env = entry.get("api_key_env", "OPENAI_API_KEY")
                api_key = os.getenv(key_env, "")
                model = entry.get("model", "")
                pname = entry.get("name", "openai_compatible")
                timeout = entry.get("timeout", 60)
                if base_url:
                    built.append(
                        OpenAICompatibleProvider(
                            base_url=base_url,
                            api_key=api_key,
                            model=model,
                            provider_name=pname,
                            timeout=timeout,
                        ),
                    )
            else:
                logger.warning("[LLMClient] Unknown provider type in config: %s", ptype)

        built.append(OfflineProvider())
        return built

    # ------------------------------------------------------------------
    # Public API (UNCHANGED)
    # ------------------------------------------------------------------

    @property
    def is_available(self) -> bool:
        """True if any non-offline provider is configured."""
        return any(
            p.is_available() and p.name != "offline"
            for p in self.providers
        )

    def chat(
        self,
        messages: list[dict[str, str]],
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        json_mode: bool = False,
    ) -> LLMResponse:
        """Send chat completion with runtime provider failover.
        Portkey-inspired: hooks → cache → status-code failover.
        """
        use_model = model or self.model
        call_start = time.time()

        # Pre-request hooks
        hook_ctx = HookContext(
            messages=messages, model=use_model,
            temperature=temperature, max_tokens=max_tokens,
            start_time=call_start,
        )
        if self.hooks:
            pre_results = self.hooks.run_phase(HookPhase.PRE_REQUEST, hook_ctx)
            for r in pre_results:
                if not r.passed:
                    logger.warning("[LLM] Pre-request hook failed: %s", r.error_message)
                    return self._offline_response(messages, error=f"hook: {r.error_message}")

        # Cache check (skip for json_mode)
        if self.cache and not json_mode:
            cached = self.cache.get(messages, use_model, temperature)
            if cached:
                logger.debug("[LLM] Cache hit for model=%s", use_model)
                return LLMResponse(
                    content=cached.content, model=cached.model,
                    usage=cached.usage, raw={"cache": True},
                )

        # Provider failover with circuit breaker
        candidates = self._get_healthy_providers()
        if not candidates:
            return self._offline_response(messages, error="no providers available")

        last_error = ""
        for provider in candidates:
            if provider.name == "offline":
                break  # Reached fallback — handled below

            # Ensure health entry exists (providers may be added after init)
            if provider.name not in self._provider_health:
                self._provider_health[provider.name] = ProviderHealth()

            hook_ctx.provider = provider.name
            try:
                result = provider.chat(
                    messages=messages,
                    model=use_model,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    json_mode=json_mode,
                )
                self._provider_health[provider.name].record_success()

                # Cache successful response
                if self.cache and not json_mode and result.content:
                    self.cache.put(
                        messages, result.content, result.model,
                        temperature, result.usage,
                    )

                # Post-request hooks
                if self.hooks:
                    hook_ctx.response_content = result.content
                    hook_ctx.response_model = result.model
                    hook_ctx.usage = result.usage or {}
                    self.hooks.run_phase(HookPhase.POST_REQUEST, hook_ctx)

                return result

            except requests.HTTPError as e:
                status_code = e.response.status_code if e.response is not None else 0
                last_error = f"{provider.name}:{status_code}:{e}"
                logger.warning("[LLM] Provider %s HTTP %d: %s", provider.name, status_code, e)
                self._provider_health[provider.name].record_failure()

                if status_code == 400:
                    return self._offline_response(messages, error=f"bad request: {e}")
                continue

            except Exception as e:
                last_error = str(e)
                logger.warning("[LLM] Provider %s failed: %s", provider.name, e)
                self._provider_health[provider.name].record_failure()

                if self.hooks:
                    hook_ctx.error = e
                    self.hooks.run_phase(HookPhase.ON_ERROR, hook_ctx)
                continue

        return self._offline_response(messages, error=f"all providers failed: {last_error}")

    def generate(self, prompt: str, **kwargs: Any) -> str:
        """Simple text generation helper."""
        messages = [{"role": "user", "content": prompt}]
        response = self.chat(messages, **kwargs)
        return response.content

    def generate_json(self, prompt: str, **kwargs: Any) -> dict[str, Any]:
        """Generate and parse JSON response."""
        messages = [
            {"role": "system", "content": "You are a helpful assistant. Always respond with valid JSON."},
            {"role": "user", "content": prompt},
        ]
        response = self.chat(messages, json_mode=True, **kwargs)

        try:
            return dict(json.loads(response.content))
        except json.JSONDecodeError:
            json_match = re.search(
                r"```(?:json)?\s*\n(.*?)\n```", response.content, re.DOTALL,
            )
            if json_match:
                try:
                    return dict(json.loads(json_match.group(1)))
                except json.JSONDecodeError:
                    pass
            return {"raw_content": response.content}

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _get_healthy_providers(self) -> list[LLMProvider]:
        """Return providers in order, skipping circuit-broken ones."""
        available = [p for p in self.providers if p.is_available()]
        if not available:
            return [OfflineProvider()]

        healthy = [
            p for p in available
            if p.name == "offline"
            or self._provider_health.get(p.name, ProviderHealth()).is_healthy
        ]
        return healthy if healthy else available  # All unhealthy — try all

    def _request_hash(self, messages: list[dict[str, str]], model: str, temperature: float) -> str:
        """Generate hash for request deduplication."""
        content = json.dumps({
            "messages": messages,
            "model": model,
            "temperature": temperature,
        }, sort_keys=True)
        return hashlib.sha256(content.encode()).hexdigest()[:16]

    def _offline_response(
        self, messages: list[dict[str, str]], error: str = "",
    ) -> LLMResponse:
        """Generate offline placeholder response."""
        user_msg = "unknown"
        for m in reversed(messages):
            if m.get("role") == "user":
                user_msg = m.get("content", "")
                break
        content = (
            f"[OFFLINE MODE] LLM unavailable"
            f"{f' ({error})' if error else ''}. "
            f"Request: {user_msg[:200]}"
        )
        return LLMResponse(content=content, model="offline")


# ---------------------------------------------------------------------------
# Module-level convenience
# ---------------------------------------------------------------------------

_default_client: LLMClient | None = None


def get_client() -> LLMClient:
    """Get or create default LLM client (env-var auto-detection)."""
    global _default_client
    if _default_client is None:
        _default_client = LLMClient()
    return _default_client


__all__ = ["LLMClient", "LLMResponse", "ProviderHealth", "get_client"]
