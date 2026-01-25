"""
Payment Configuration
=====================
Centralized configuration for payment providers (PayPal, Polar).

Environment Variables:
- PAYMENT_PROVIDER_ORDER: Comma-separated provider priority (default: "paypal,polar")
- PAYPAL_CLIENT_ID: PayPal API client ID
- PAYPAL_CLIENT_SECRET: PayPal API client secret
- PAYPAL_MODE: "sandbox" or "live"
- PAYPAL_WEBHOOK_ID: PayPal webhook identifier
- POLAR_API_KEY: Polar API key
- POLAR_WEBHOOK_SECRET: Polar webhook secret
"""

import os
from typing import List, Optional

from pydantic import BaseModel, Field


class PayPalConfig(BaseModel):
    """PayPal API configuration"""
    client_id: str = Field(..., description="PayPal Client ID")
    client_secret: str = Field(..., description="PayPal Client Secret")
    mode: str = Field(default="sandbox", description="PayPal mode (sandbox/live)")
    webhook_id: Optional[str] = Field(default=None, description="PayPal Webhook ID for verification")

    @classmethod
    def from_env(cls) -> "PayPalConfig":
        """Load PayPal config from environment variables"""
        return cls(
            client_id=os.getenv("PAYPAL_CLIENT_ID", ""),
            client_secret=os.getenv("PAYPAL_CLIENT_SECRET", ""),
            mode=os.getenv("PAYPAL_MODE", "sandbox"),
            webhook_id=os.getenv("PAYPAL_WEBHOOK_ID")
        )

    def is_configured(self) -> bool:
        """Check if PayPal is properly configured"""
        return bool(self.client_id and self.client_secret)


class PolarConfig(BaseModel):
    """Polar API configuration"""
    api_key: str = Field(..., description="Polar API Key")
    webhook_secret: Optional[str] = Field(default=None, description="Polar webhook signing secret")
    base_url: str = Field(default="https://api.polar.sh", description="Polar API base URL")

    @classmethod
    def from_env(cls) -> "PolarConfig":
        """Load Polar config from environment variables"""
        return cls(
            api_key=os.getenv("POLAR_API_KEY", ""),
            webhook_secret=os.getenv("POLAR_WEBHOOK_SECRET"),
            base_url=os.getenv("POLAR_BASE_URL", "https://api.polar.sh")
        )

    def is_configured(self) -> bool:
        """Check if Polar is properly configured"""
        return bool(self.api_key)


class PaymentConfig(BaseModel):
    """Unified payment configuration"""
    provider_order: List[str] = Field(
        default=["paypal", "polar"],
        description="Provider priority order for failover"
    )
    paypal: PayPalConfig = Field(default_factory=PayPalConfig.from_env)
    polar: PolarConfig = Field(default_factory=PolarConfig.from_env)

    # Failover settings
    max_retries: int = Field(default=2, description="Maximum retry attempts per provider")
    timeout_seconds: int = Field(default=30, description="API request timeout")

    # Vietnam Tax Strategy 2026 - Revenue Thresholds
    revenue_threshold_soft_cap: int = Field(
        default=450_000_000,
        description="Soft cap threshold (450M VND) - triggers registration alert"
    )
    revenue_threshold_hard_cap: int = Field(
        default=500_000_000,
        description="Hard cap threshold (500M VND) - legal registration required"
    )

    @classmethod
    def from_env(cls) -> "PaymentConfig":
        """Load payment config from environment variables"""
        provider_order_str = os.getenv("PAYMENT_PROVIDER_ORDER", "paypal,polar")
        provider_order = [p.strip() for p in provider_order_str.split(",")]

        return cls(
            provider_order=provider_order,
            paypal=PayPalConfig.from_env(),
            polar=PolarConfig.from_env(),
            max_retries=int(os.getenv("PAYMENT_MAX_RETRIES", "2")),
            timeout_seconds=int(os.getenv("PAYMENT_TIMEOUT", "30"))
        )

    def get_available_providers(self) -> List[str]:
        """Get list of configured providers"""
        available = []
        if self.paypal.is_configured():
            available.append("paypal")
        if self.polar.is_configured():
            available.append("polar")
        return available

    def validate(self) -> bool:
        """Validate configuration"""
        available = self.get_available_providers()

        if not available:
            raise ValueError("No payment providers configured")

        # Check that provider_order contains only configured providers
        for provider in self.provider_order:
            if provider not in ["paypal", "polar"]:
                raise ValueError(f"Unknown provider in order: {provider}")

        return True


# Global configuration instance
_config: Optional[PaymentConfig] = None


def get_payment_config() -> PaymentConfig:
    """
    Get global payment configuration.

    Singleton pattern - loads once from environment.
    """
    global _config
    if _config is None:
        _config = PaymentConfig.from_env()
        _config.validate()
    return _config


def reload_payment_config() -> PaymentConfig:
    """
    Reload payment configuration from environment.

    Useful for testing or configuration updates.
    """
    global _config
    _config = None
    return get_payment_config()


# Example usage and documentation
if __name__ == "__main__":
    # Load config
    config = get_payment_config()

    print("Payment Configuration:")
    print(f"  Provider Order: {config.provider_order}")
    print(f"  Available Providers: {config.get_available_providers()}")
    print("\nPayPal:")
    print(f"  Configured: {config.paypal.is_configured()}")
    print(f"  Mode: {config.paypal.mode}")
    print("\nPolar:")
    print(f"  Configured: {config.polar.is_configured()}")
    print(f"  Base URL: {config.polar.base_url}")
