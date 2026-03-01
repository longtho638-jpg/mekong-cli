"""
Mekong CLI - Provider Registry

Maps Vercel AI SDK's createProviderRegistry() to Python.
Manages multi-provider LLM routing with colon-separated model refs.
Example: "gemini:gemini-2.5-pro", "openai:gpt-4o", "proxy:gemini-3-pro-high"
"""

from typing import Callable, Dict, List, Optional, Protocol, runtime_checkable
from dataclasses import dataclass, field


@runtime_checkable
class ProviderSpec(Protocol):
    """Protocol matching Vercel AI SDK's LanguageModelV2 interface.

    Each provider implements: provider name, supported models, and generate.
    """

    @property
    def provider_name(self) -> str:
        """Unique provider identifier (e.g., 'gemini', 'openai', 'proxy')."""
        ...

    @property
    def supported_models(self) -> List[str]:
        """List of model IDs this provider serves."""
        ...

    def get_capabilities(self, model_id: str) -> Dict[str, bool]:
        """Return model capabilities (tools, structured_output, streaming)."""
        ...


@dataclass
class ResolvedModel:
    """Result of resolving a model reference string."""

    provider_name: str
    model_id: str
    capabilities: Dict[str, bool] = field(default_factory=dict)


@dataclass
class ProviderConfig:
    """Configuration for a registered provider."""

    name: str
    factory: Callable[..., "ProviderSpec"]
    default_model: str = ""
    aliases: Dict[str, str] = field(default_factory=dict)


class ProviderRegistry:
    """
    Central registry for LLM providers.

    Maps Vercel AI SDK's createProviderRegistry() pattern.
    Supports colon-separated model refs: "provider:model-id"
    """

    def __init__(self) -> None:
        """Initialize empty registry."""
        self._providers: Dict[str, ProviderConfig] = {}
        self._instances: Dict[str, ProviderSpec] = {}
        self._default_provider: str = ""

    def register(
        self,
        name: str,
        factory: Callable[..., "ProviderSpec"],
        default_model: str = "",
        aliases: Optional[Dict[str, str]] = None,
    ) -> None:
        """Register a provider with lazy initialization.

        Args:
            name: Provider identifier (e.g., 'gemini', 'openai')
            factory: Callable that creates provider instance
            default_model: Default model when only provider name given
            aliases: Model alias mappings (e.g., {"fast": "gemini-2.0-flash"})
        """
        self._providers[name] = ProviderConfig(
            name=name,
            factory=factory,
            default_model=default_model,
            aliases=aliases or {},
        )
        if not self._default_provider:
            self._default_provider = name

    def set_default(self, provider_name: str) -> None:
        """Set the default provider for unqualified model refs.

        Args:
            provider_name: Name of registered provider
        """
        if provider_name not in self._providers:
            raise ValueError(f"Provider not registered: {provider_name}")
        self._default_provider = provider_name

    def resolve(self, model_ref: str) -> ResolvedModel:
        """Resolve a model reference string to provider + model.

        Supports formats:
        - "gemini:gemini-2.5-pro" → (gemini, gemini-2.5-pro)
        - "openai:gpt-4o" → (openai, gpt-4o)
        - "fast" → resolve alias from default provider
        - "gemini-2.5-pro" → use default provider

        Args:
            model_ref: Colon-separated or plain model reference

        Returns:
            ResolvedModel with provider_name, model_id, capabilities
        """
        if ":" in model_ref:
            parts = model_ref.split(":", 1)
            provider_name, model_id = parts[0], parts[1]
        else:
            provider_name = self._default_provider
            model_id = model_ref

        if provider_name not in self._providers:
            raise ValueError(
                f"Unknown provider '{provider_name}'. "
                f"Registered: {list(self._providers.keys())}"
            )

        config = self._providers[provider_name]

        # Check aliases
        if model_id in config.aliases:
            model_id = config.aliases[model_id]

        # Use default model if empty
        if not model_id and config.default_model:
            model_id = config.default_model

        # Get capabilities from provider instance
        instance = self._get_instance(provider_name)
        capabilities = {}
        if instance:
            capabilities = instance.get_capabilities(model_id)

        return ResolvedModel(
            provider_name=provider_name,
            model_id=model_id,
            capabilities=capabilities,
        )

    def _get_instance(self, provider_name: str) -> Optional[ProviderSpec]:
        """Lazy-initialize and cache provider instance.

        Args:
            provider_name: Registered provider name

        Returns:
            Provider instance or None if initialization fails
        """
        if provider_name in self._instances:
            return self._instances[provider_name]

        config = self._providers.get(provider_name)
        if not config:
            return None

        try:
            instance = config.factory()
            self._instances[provider_name] = instance
            return instance
        except Exception:
            return None

    def list_providers(self) -> List[str]:
        """Return names of all registered providers."""
        return list(self._providers.keys())

    def list_models(self, provider_name: str) -> List[str]:
        """Return supported models for a provider.

        Args:
            provider_name: Provider to query

        Returns:
            List of model IDs
        """
        instance = self._get_instance(provider_name)
        if instance:
            return instance.supported_models
        return []


# Built-in provider specs


class AntigravityProvider:
    """Provider for Antigravity Proxy (OpenAI-compatible, port 9191)."""

    @property
    def provider_name(self) -> str:
        return "proxy"

    @property
    def supported_models(self) -> List[str]:
        return [
            "gemini-3-pro-high",
            "gemini-2.5-pro",
            "gemini-2.0-flash",
            "claude-sonnet-4-6",
            "claude-opus-4-6",
        ]

    def get_capabilities(self, model_id: str) -> Dict[str, bool]:
        return {
            "tools": True,
            "structured_output": True,
            "streaming": True,
            "system_message": True,
        }


class GeminiProvider:
    """Provider for Google Gemini (direct API via google-genai SDK)."""

    @property
    def provider_name(self) -> str:
        return "gemini"

    @property
    def supported_models(self) -> List[str]:
        return [
            "gemini-2.5-pro",
            "gemini-2.0-flash",
            "gemini-3-pro-preview",
        ]

    def get_capabilities(self, model_id: str) -> Dict[str, bool]:
        return {
            "tools": True,
            "structured_output": True,
            "streaming": True,
            "system_message": True,
        }


class OpenAIProvider:
    """Provider for OpenAI (direct API)."""

    @property
    def provider_name(self) -> str:
        return "openai"

    @property
    def supported_models(self) -> List[str]:
        return ["gpt-4o", "gpt-4o-mini", "o1", "o3-mini"]

    def get_capabilities(self, model_id: str) -> Dict[str, bool]:
        is_reasoning = model_id.startswith("o")
        return {
            "tools": not is_reasoning,
            "structured_output": True,
            "streaming": True,
            "system_message": not is_reasoning,
        }


def create_default_registry() -> ProviderRegistry:
    """Create registry with built-in providers pre-registered.

    Returns:
        ProviderRegistry with proxy, gemini, openai providers
    """
    registry = ProviderRegistry()

    registry.register(
        "proxy",
        factory=AntigravityProvider,
        default_model="gemini-3-pro-high",
        aliases={"fast": "gemini-2.0-flash", "best": "gemini-3-pro-high"},
    )
    registry.register(
        "gemini",
        factory=GeminiProvider,
        default_model="gemini-2.5-pro",
        aliases={"fast": "gemini-2.0-flash", "pro": "gemini-2.5-pro"},
    )
    registry.register(
        "openai",
        factory=OpenAIProvider,
        default_model="gpt-4o",
        aliases={"fast": "gpt-4o-mini", "best": "gpt-4o"},
    )

    return registry


__all__ = [
    "ProviderRegistry",
    "ProviderSpec",
    "ProviderConfig",
    "ResolvedModel",
    "AntigravityProvider",
    "GeminiProvider",
    "OpenAIProvider",
    "create_default_registry",
]
