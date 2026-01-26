from typing import Dict, Type
from app.core.config import settings
from .base import BaseProvider
from .google import GoogleProvider
from .github import GitHubProvider
from .discord import DiscordProvider

class ProviderFactory:
    _providers: Dict[str, Type[BaseProvider]] = {
        "google": GoogleProvider,
        "github": GitHubProvider,
        "discord": DiscordProvider,
    }

    @classmethod
    def get_provider(cls, provider_name: str, redirect_uri: str) -> BaseProvider:
        provider_class = cls._providers.get(provider_name)
        if not provider_class:
            raise ValueError(f"Unknown provider: {provider_name}")

        if provider_name == "google":
            return GoogleProvider(
                client_id=settings.GOOGLE_CLIENT_ID,
                client_secret=settings.GOOGLE_CLIENT_SECRET,
                redirect_uri=redirect_uri
            )
        elif provider_name == "github":
            return GitHubProvider(
                client_id=settings.GITHUB_CLIENT_ID,
                client_secret=settings.GITHUB_CLIENT_SECRET,
                redirect_uri=redirect_uri
            )
        elif provider_name == "discord":
            return DiscordProvider(
                client_id=settings.DISCORD_CLIENT_ID,
                client_secret=settings.DISCORD_CLIENT_SECRET,
                redirect_uri=redirect_uri
            )
        raise ValueError(f"Configuration missing for provider: {provider_name}")
