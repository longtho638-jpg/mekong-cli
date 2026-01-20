"""
📋 Environment Variable Definitions
==================================
Standard definitions for all security-critical environment variables.
"""

from .manager import EnvironmentVariable, SecureEnvironmentManager, VariableType


def load_default_definitions(manager: SecureEnvironmentManager):
    """Load security-critical environment variable definitions into the manager."""

    # Auth
    manager.register(EnvironmentVariable(
        name="JWT_SECRET_KEY", var_type=VariableType.JWT_SECRET,
        min_length=32, is_secret=True, auto_generate=True,
        description="Secret key for JWT token signing"
    ))
    manager.register(EnvironmentVariable(
        name="JWT_EXPIRATION_HOURS", var_type=VariableType.INTEGER,
        required=False, default="24", description="JWT token expiration in hours"
    ))

    # API Keys
    for key in ["API_KEY_MASTER", "API_KEY_READ_ONLY", "API_KEY_WRITE_ACCESS"]:
        manager.register(EnvironmentVariable(
            name=key, var_type=VariableType.API_KEY,
            required=False, min_length=32, is_secret=True, auto_generate=True,
            description=f"{key.replace('_', ' ').title()}"
        ))

    # Braintree
    manager.register(EnvironmentVariable(
        name="BRAINTREE_MERCHANT_ID", var_type=VariableType.STRING,
        required=False, is_secret=True, description="Braintree merchant ID"
    ))
    manager.register(EnvironmentVariable(
        name="BRAINTREE_PUBLIC_KEY", var_type=VariableType.API_KEY,
        required=False, is_secret=True, description="Braintree public key"
    ))
    manager.register(EnvironmentVariable(
        name="BRAINTREE_PRIVATE_KEY", var_type=VariableType.API_KEY,
        required=False, is_secret=True, description="Braintree private key"
    ))
    manager.register(EnvironmentVariable(
        name="BRAINTREE_ENV", var_type=VariableType.STRING,
        required=False, default="sandbox", validation_pattern=r"^(sandbox|production)$",
        description="Braintree environment (sandbox/production)"
    ))

    # Others
    others = [
        ("GUMROAD_ACCESS_TOKEN", "Gumroad API access token"),
        ("POLAR_ACCESS_TOKEN", "Polar API access token"),
        ("TWITTER_BEARER_TOKEN", "Twitter API bearer token"),
        ("TWITTER_API_KEY", "Twitter API key"),
        ("TWITTER_API_SECRET", "Twitter API secret"),
        ("TWITTER_ACCESS_TOKEN", "Twitter access token"),
        ("TWITTER_ACCESS_SECRET", "Twitter access secret"),
        ("GEMINI_API_KEY", "Google Gemini API key"),
    ]
    for name, desc in others:
        manager.register(EnvironmentVariable(
            name=name, var_type=VariableType.API_KEY, required=False, is_secret=True, description=desc
        ))

    # Webhooks
    for name in ["DISCORD_WEBHOOK_URL", "SLACK_WEBHOOK_URL"]:
        manager.register(EnvironmentVariable(
            name=name, var_type=VariableType.URL, required=False, is_secret=True, description=f"{name.split('_')[0].title()} webhook URL"
        ))

    # Config
    manager.register(EnvironmentVariable(
        name="ALLOWED_ORIGINS", var_type=VariableType.STRING, required=False,
        default="http://localhost:3000,http://localhost:8080", description="CORS allowed origins"
    ))
    manager.register(EnvironmentVariable(
        name="RATE_LIMIT_REQUESTS", var_type=VariableType.INTEGER, required=False, default="100"
    ))
    manager.register(EnvironmentVariable(
        name="RATE_LIMIT_WINDOW", var_type=VariableType.INTEGER, required=False, default="3600"
    ))
    manager.register(EnvironmentVariable(
        name="DATABASE_URL", var_type=VariableType.DATABASE_URL, required=False, is_secret=True
    ))
    manager.register(EnvironmentVariable(
        name="VIBE_KANBAN_URL", var_type=VariableType.URL, required=False, default="http://localhost:3000"
    ))
    manager.register(EnvironmentVariable(
        name="VIBE_KANBAN_TOKEN", var_type=VariableType.API_KEY, required=False, default="default_token", is_secret=True
    ))
    manager.register(EnvironmentVariable(
        name="ANTIBRIDGE_PORT", var_type=VariableType.INTEGER, required=False, default="8000"
    ))
