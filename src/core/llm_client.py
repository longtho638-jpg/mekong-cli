"""
Mekong CLI - LLM Client

Provides LLM integration supporting Google GenAI (Gemini), Antigravity Proxy, and OpenAI.
Priority:
1. GEMINI_API_KEY (Google GenAI - Gemini 2.5 Pro)
2. ANTIGRAVITY_PROXY_URL (custom proxy)
3. OPENAI_API_KEY (direct OpenAI)
4. Fallback: offline mode

Runtime failover: If one provider fails, tries the next in priority order.
Circuit breaker: After 3 consecutive failures, provider is cooled down for 60s.
Portkey-inspired: Status-code based failover, hooks pipeline, LRU cache.
"""

import os
import json
import logging
import random
import re
import time
from typing import Optional, Dict, Any, List
from dataclasses import dataclass

import requests

from .hooks import HookContext, HookPhase, HookPipeline, create_default_pipeline
from .llm_cache import LLMCache

logger = logging.getLogger(__name__)


@dataclass
class LLMResponse:
    """Response from LLM call"""

    content: str
    model: str = ""
    usage: Optional[Dict[str, int]] = None
    raw: Optional[Dict[str, Any]] = None

    def __post_init__(self) -> None:
        """Set default values for mutable fields after dataclass init."""
        if self.usage is None:
            self.usage = {}
        if self.raw is None:
            self.raw = {}


@dataclass
class ProviderHealth:
    """Tracks consecutive failures per provider for circuit breaker."""
    failures: int = 0
    last_failure: float = 0.0
    cooldown_secs: float = 60.0

    @property
    def is_healthy(self) -> bool:
        """Check if this provider is healthy enough to receive requests.

        Returns:
            True if fewer than 3 consecutive failures, or cooldown has elapsed.
        """
        if self.failures < 3:
            return True
        return (time.time() - self.last_failure) > self.cooldown_secs

    def record_failure(self) -> None:
        """Record a failed request, incrementing the failure counter."""
        self.failures += 1
        self.last_failure = time.time()

    def record_success(self) -> None:
        """Record a successful request, resetting the failure counter."""
        self.failures = 0


class LLMClient:
    """
    LLMClient supporting Google GenAI (Gemini), Antigravity Proxy, and OpenAI.
    Runtime failover between providers with circuit breaker protection.
    """

    def __init__(
        self,
        proxy_url: Optional[str] = None,
        api_key: Optional[str] = None,
        gemini_key: Optional[str] = None,
        model: str = "gemini-2.5-pro",
        timeout: int = 60,
        enable_cache: bool = True,
        enable_hooks: bool = True,
    ) -> None:
        """Initialize LLMClient with provider credentials and failover config.

        Args:
            proxy_url: Antigravity Proxy URL. Falls back to ANTIGRAVITY_PROXY_URL env var.
            api_key: OpenAI API key. Falls back to OPENAI_API_KEY env var.
            gemini_key: Google Gemini API key. Falls back to GEMINI_API_KEY env var.
            model: Default model name for requests.
            timeout: HTTP request timeout in seconds.
            enable_cache: Enable LRU response caching.
            enable_hooks: Enable hooks middleware pipeline.
        """
        self.proxy_url = proxy_url or os.getenv("ANTIGRAVITY_PROXY_URL", "")
        self.api_key = api_key or os.getenv("OPENAI_API_KEY", "")
        self.gemini_key = gemini_key or os.getenv("GEMINI_API_KEY", "")
        self.model = model
        self.timeout = timeout
        self._genai_client = None

        # Portkey-inspired: hooks pipeline + LRU cache
        self.hooks: Optional[HookPipeline] = create_default_pipeline() if enable_hooks else None
        self.cache: Optional[LLMCache] = LLMCache() if enable_cache else None

        # Provider health tracking for circuit breaker
        self._provider_health = {
            "vertex": ProviderHealth(),
            "proxy": ProviderHealth(),
            "openai": ProviderHealth(),
        }

        # Remove GOOGLE_API_KEY entirely — google-genai SDK auto-reads it
        # and it conflicts with GEMINI_API_KEY, causing empty responses.
        if self.gemini_key:
            popped = os.environ.pop("GOOGLE_API_KEY", None)
            if popped:
                logger.info("[LLM] Removed GOOGLE_API_KEY from env to prevent SDK conflict")

        # Determine initial mode (for is_available check)
        if self.gemini_key:
            self.mode = "vertex"
            try:
                from google import genai

                self._genai_client = genai.Client(api_key=self.gemini_key)
            except ImportError:
                logger.warning("google-genai not installed, falling back")
                self.mode = "offline"
        elif self.proxy_url:
            self.mode = "proxy"
            self.base_url = self.proxy_url.rstrip("/")
        elif self.api_key:
            self.mode = "openai"
            self.base_url = "https://api.openai.com/v1"
        else:
            self.mode = "offline"
            self.base_url = ""

    @property
    def is_available(self) -> bool:
        """Check if LLM is available"""
        return self.mode != "offline"

    def _get_ordered_providers(self) -> List[str]:
        """Return available providers in priority order, skipping unhealthy ones."""
        candidates = []
        if self.gemini_key:
            candidates.append("vertex")
        if self.proxy_url:
            candidates.append("proxy")
        if self.api_key:
            candidates.append("openai")
        healthy = [p for p in candidates if self._provider_health[p].is_healthy]
        if not healthy:
            return candidates  # All unhealthy — try all anyway
        return healthy

    def chat(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        json_mode: bool = False,
    ) -> LLMResponse:
        """
        Send chat completion request with runtime provider failover.
        Portkey-inspired: hooks pipeline → cache check → status-code failover.
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
                    logger.warning(f"[LLM] Pre-request hook failed: {r.error_message}")
                    return self._offline_response(messages, error=f"hook: {r.error_message}")

        # Cache check (skip for json_mode — unique responses expected)
        if self.cache and not json_mode:
            cached = self.cache.get(messages, use_model, temperature)
            if cached:
                logger.debug(f"[LLM] Cache hit for model={use_model}")
                return LLMResponse(
                    content=cached.content, model=cached.model,
                    usage=cached.usage, raw={"cache": True},
                )

        # Provider failover with status-code awareness
        providers = self._get_ordered_providers()
        if not providers:
            return self._offline_response(messages, error="no providers available")

        last_error = ""
        for provider in providers:
            hook_ctx.provider = provider
            try:
                result = self._call_provider(
                    provider, messages, model, temperature, max_tokens, json_mode
                )
                self._provider_health[provider].record_success()

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
                last_error = f"{provider}:{status_code}:{e}"
                logger.warning(f"[LLM] Provider {provider} HTTP {status_code}: {e}")
                self._provider_health[provider].record_failure()

                # Status-code based routing (Portkey pattern)
                if status_code == 400:
                    # Client error: don't retry, return immediately
                    return self._offline_response(messages, error=f"bad request: {e}")
                # 401/403: auth error — skip to next provider
                # 429/5xx: transient — continue failover
                continue
            except Exception as e:
                last_error = str(e)
                logger.warning(f"[LLM] Provider {provider} failed: {e}")
                self._provider_health[provider].record_failure()

                # Error hooks
                if self.hooks:
                    hook_ctx.error = e
                    self.hooks.run_phase(HookPhase.ON_ERROR, hook_ctx)
                continue

        return self._offline_response(messages, error=f"all providers failed: {last_error}")

    def _call_provider(
        self,
        provider: str,
        messages: List[Dict[str, str]],
        model: Optional[str],
        temperature: float,
        max_tokens: int,
        json_mode: bool,
    ) -> LLMResponse:
        """Dispatch to provider-specific implementation. Raises on failure."""
        if provider == "vertex":
            # Clean GOOGLE_API_KEY at call time too (env var may be set after init)
            if "GOOGLE_API_KEY" in os.environ:
                os.environ.pop("GOOGLE_API_KEY")
            if not self._genai_client:
                try:
                    from google import genai
                    self._genai_client = genai.Client(api_key=self.gemini_key)
                except ImportError:
                    raise RuntimeError("google-genai not installed")
            return self._vertex_chat(messages, model, temperature, max_tokens, json_mode)

        # proxy or openai — both use OpenAI-compatible REST API
        use_model = model or self.model
        payload: Dict[str, Any] = {
            "model": use_model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        headers = {"Content-Type": "application/json"}

        if provider == "proxy":
            base = self.proxy_url.rstrip("/")
        else:  # openai
            base = "https://api.openai.com/v1"
            headers["Authorization"] = f"Bearer {self.api_key}"

        if self.api_key and provider == "proxy":
            headers["Authorization"] = f"Bearer {self.api_key}"

        url = f"{base}/chat/completions"
        logger.debug(f"[LLM] {provider} -> {use_model}: {url}")

        response = requests.post(url, headers=headers, json=payload, timeout=self.timeout)
        response.raise_for_status()
        data = response.json()

        content = data["choices"][0]["message"]["content"]
        usage = data.get("usage", {})

        return LLMResponse(
            content=content,
            model=data.get("model", use_model),
            usage=usage,
            raw=data,
        )

    def _vertex_chat(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        json_mode: bool = False,
    ) -> LLMResponse:
        """Handle chat via Google GenAI SDK with retry, jitter backoff, and circuit breaker."""
        use_model = model or self.model

        system_instruction = None
        prompt_parts = []

        for m in messages:
            role = m["role"]
            content = m["content"]
            if role == "system":
                system_instruction = content
            elif role == "user":
                prompt_parts.append(content)

        prompt_text = "\n\n".join(prompt_parts) if prompt_parts else ""

        if not prompt_text.strip():
            logger.warning("[LLM] Vertex called with empty prompt, returning offline")
            return self._offline_response(messages, error="empty prompt")

        config = {
            "temperature": temperature,
            "max_output_tokens": max_tokens,
        }
        if json_mode:
            config["response_mime_type"] = "application/json"

        if system_instruction:
            config["system_instruction"] = system_instruction

        # Retry with exponential backoff + jitter (3 attempts)
        max_retries = 3
        for attempt in range(max_retries):
            try:
                logger.debug(
                    f"[LLM] vertex -> {use_model} (attempt {attempt + 1}/{max_retries})"
                )
                response = self._genai_client.models.generate_content(
                    model=use_model,
                    contents=prompt_text,
                    config=config,
                )

                # Safely extract text
                text = None
                try:
                    text = response.text
                except (ValueError, AttributeError):
                    if (
                        response.candidates
                        and response.candidates[0].content
                        and response.candidates[0].content.parts
                    ):
                        text = response.candidates[0].content.parts[0].text

                finish_reason = "unknown"
                if response.candidates:
                    finish_reason = str(response.candidates[0].finish_reason)

                if not text:
                    logger.warning(
                        f"[LLM] Vertex empty response (attempt {attempt + 1}). "
                        f"Finish reason: {finish_reason}. "
                        f"Model: {use_model}, prompt_len: {len(prompt_text)}"
                    )
                    if attempt < max_retries - 1:
                        delay = random.uniform(0, 2 ** attempt)  # full jitter
                        logger.info(f"[LLM] Retrying in {delay:.1f}s...")
                        time.sleep(delay)
                        continue
                    return self._offline_response(
                        messages, error=f"empty after {max_retries} attempts"
                    )

                tokens = 0
                if response.usage_metadata:
                    tokens = response.usage_metadata.total_token_count

                return LLMResponse(
                    content=text,
                    model=use_model,
                    usage={"total_tokens": tokens},
                    raw={"finish_reason": finish_reason},
                )

            except Exception as e:
                error_str = str(e).lower()
                is_retryable = any(
                    kw in error_str
                    for kw in [
                        "429",
                        "resource_exhausted",
                        "quota",
                        "503",
                        "500",
                        "deadline",
                        "timeout",
                        "unavailable",
                    ]
                )

                if is_retryable and attempt < max_retries - 1:
                    delay = random.uniform(0, 2 ** attempt)  # full jitter
                    logger.warning(
                        f"[LLM] Vertex error (attempt {attempt + 1}): {e}. "
                        f"Retrying in {delay:.1f}s..."
                    )
                    time.sleep(delay)
                    continue

                logger.error(f"[LLM] Vertex call failed: {e}")
                raise  # Let caller handle failover

    def generate(self, prompt: str, **kwargs) -> str:
        """Simple text generation helper."""
        messages = [{"role": "user", "content": prompt}]
        response = self.chat(messages, **kwargs)
        return response.content

    def generate_json(self, prompt: str, **kwargs) -> Dict[str, Any]:
        """Generate and parse JSON response."""
        messages = [
            {
                "role": "system",
                "content": "You are a helpful assistant. Always respond with valid JSON.",
            },
            {"role": "user", "content": prompt},
        ]
        response = self.chat(messages, json_mode=True, **kwargs)

        try:
            return json.loads(response.content)
        except json.JSONDecodeError:
            json_match = re.search(
                r"```(?:json)?\s*\n(.*?)\n```", response.content, re.DOTALL
            )
            if json_match:
                try:
                    return json.loads(json_match.group(1))
                except json.JSONDecodeError:
                    pass
            return {"raw_content": response.content}

    def _offline_response(
        self, messages: List[Dict[str, str]], error: str = ""
    ) -> LLMResponse:
        """Generate offline placeholder response"""
        user_msg = "unknown"
        for m in reversed(messages):
            if m["role"] == "user":
                user_msg = m["content"]
                break

        content = (
            f"[OFFLINE MODE] LLM unavailable"
            f"{f' ({error})' if error else ''}. "
            f"Request: {user_msg[:200]}"
        )
        return LLMResponse(content=content, model="offline")


# Module-level convenience
_default_client: Optional[LLMClient] = None


def get_client() -> LLMClient:
    """Get or create default LLM client"""
    global _default_client
    if _default_client is None:
        _default_client = LLMClient()
    return _default_client


__all__ = ["LLMClient", "LLMResponse", "ProviderHealth", "get_client"]
