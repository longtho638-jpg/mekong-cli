"""
Quota Error Message Templates — ROIaaS Phase 6b

User-friendly error messages with upgrade CTAs for quota exceeded scenarios.
Includes warning messages for approaching limits (80%, 90% thresholds).
"""

from typing import Optional
from dataclasses import dataclass


@dataclass
class QuotaErrorContext:
    """Context for formatting quota errors."""
    tier: str
    daily_used: int
    daily_limit: int
    command: str
    monthly_used: int = 0
    monthly_limit: int = 0
    retry_after_seconds: Optional[int] = None
    violation_type: str = "quota_exceeded"


@dataclass
class QuotaWarningContext:
    """Context for formatting quota warnings.

    Attributes:
        tier: License tier
        daily_used: Commands used today
        daily_limit: Daily command limit
        percentage: Usage percentage (0-100)
        remaining: Commands remaining
        command: Current command being executed
        threshold: Warning threshold (80 or 90)
    """
    tier: str
    daily_used: int
    daily_limit: int
    percentage: float
    remaining: int
    command: str
    threshold: int = 80


# Warning thresholds
WARNING_80_TEMPLATE = """
╔══════════════════════════════════════════════════════════════╗
║  🟡  Quota Warning: 80% Used                                 ║
╠══════════════════════════════════════════════════════════════╣
║  You've used {daily_used}/{daily_limit} commands today ({percentage}%).║
║                                                              ║
║  Remaining: {remaining} commands                            ║
║                                                              ║
║  💡 Consider upgrading to Pro for 1000 commands/day:        ║
║     → https://raas.mekong.dev/pricing                        ║
╚══════════════════════════════════════════════════════════════╝
"""

WARNING_90_TEMPLATE = """
╔══════════════════════════════════════════════════════════════╗
║  🟠  Quota Warning: 90% Used                                 ║
╠══════════════════════════════════════════════════════════════╣
║  You've used {daily_used}/{daily_limit} commands today ({percentage}%).║
║                                                              ║
║  ⚠️  Only {remaining} commands remaining!                   ║
║                                                              ║
║  🚀 Upgrade to Pro NOW to avoid interruption:               ║
║     → https://raas.mekong.dev/pricing                        ║
╚══════════════════════════════════════════════════════════════╝
"""

# Upgrade prompt for free tier
FREE_TIER_UPGRADE_TEMPLATE = """
╔══════════════════════════════════════════════════════════════╗
║  💎 Unlock Pro Features                                      ║
╠══════════════════════════════════════════════════════════════╣
║  You're on the Free tier (10 commands/day).                 ║
║                                                              ║
║  Upgrade to Pro for:                                         ║
║  ✅ 1000 commands/day (100x more)                           ║
║  ✅ Premium agents (Swarm, Schedule, Telegram)              ║
║  ✅ Priority support                                        ║
║  ✅ Advanced analytics                                      ║
║                                                              ║
║  🎯 Special offer: First month 50% off                      ║
║     → https://raas.mekong.dev/pricing                        ║
╚══════════════════════════════════════════════════════════════╝
"""

# Revoked license template
LICENSE_REVOKED_TEMPLATE = """
╔══════════════════════════════════════════════════════════════╗
║  🔒  License Revoked                                         ║
╠══════════════════════════════════════════════════════════════╣
║  Your license key has been revoked.                         ║
║                                                              ║
║  Access to premium features is blocked.                     ║
║                                                              ║
║  Possible reasons:                                           ║
║  • Terms of Service violation                               ║
║  • Payment issue                                            ║
║  • Account suspension                                       ║
║                                                              ║
║  📞 Contact support to appeal:                              ║
║     → support@raas.mekong.dev                               ║
║     → https://raas.mekong.dev/support                        ║
╚══════════════════════════════════════════════════════════════╝
"""

# Expired license template
LICENSE_EXPIRED_TEMPLATE = """
╔══════════════════════════════════════════════════════════════╗
║  ⏰  License Expired                                         ║
╠══════════════════════════════════════════════════════════════╣
║  Your license expired on {expiry_date}.                     ║
║                                                              ║
║  Access to premium features is blocked.                     ║
║                                                              ║
║  🔄 Renew your license to continue:                         ║
║     → https://raas.mekong.dev/pricing                        ║
║                                                              ║
║  Need help? Contact us:                                     ║
║     → support@raas.mekong.dev                               ║
╚══════════════════════════════════════════════════════════════╝
"""

# Offline grace period template (Phase 6d)
OFFLINE_GRACE_PERIOD_TEMPLATE = """
╔══════════════════════════════════════════════════════════════╗
║  📡  Offline Mode Activated                                  ║
╠══════════════════════════════════════════════════════════════╣
║  Remote validation unavailable.                             ║
║  Using cached license state (grace period).                 ║
║                                                              ║
║  ⏳ Grace period remaining: {remaining_hours} hours       ║
║                                                              ║
║  Commands allowed during grace period.                      ║
║                                                              ║
║  💡 Restore connectivity to re-validate license.            ║
╚══════════════════════════════════════════════════════════════╝
"""

# Grace period expired template
GRACE_PERIOD_EXPIRED_TEMPLATE = """
╔══════════════════════════════════════════════════════════════╗
║  📡  Offline Grace Period Expired                            ║
╠══════════════════════════════════════════════════════════════╣
║  Your 24-hour offline grace period has expired.             ║
║                                                              ║
║  Network connection required to validate license.           ║
║                                                              ║
║  Please connect to the internet and try again.              ║
║                                                              ║
║  Having issues? Contact support:                            ║
║     → support@raas.mekong.dev                               ║
╚══════════════════════════════════════════════════════════════╝
"""

# Network error template
NETWORK_ERROR_TEMPLATE = """
╔══════════════════════════════════════════════════════════════╗
║  🌐  Network Error                                           ║
╠══════════════════════════════════════════════════════════════╣
║  Cannot reach license server.                               ║
║                                                              ║
║  Error: {error_message}                                      ║
║                                                              ║
║  Check your internet connection and try again.              ║
║                                                              ║
║  If the problem persists:                                   ║
║     → https://raas.mekong.dev/status                        ║
║     → support@raas.mekong.dev                               ║
╚══════════════════════════════════════════════════════════════╝
"""

# JWT license error template (Phase 7)
JWT_ERROR_TEMPLATE = """
╔══════════════════════════════════════════════════════════════╗
║  🔑  JWT License Error                                       ║
╠══════════════════════════════════════════════════════════════╣
║  {message}                                                   ║
║                                                              ║
║  JWT tokens are cryptographically signed and verified       ║
║  offline - no network required.                             ║
║                                                              ║
║  Get a new JWT token:                                        ║
║     → mekong license generate --tier {tier}                  ║
║     → https://raas.mekong.dev/pricing                        ║
╚══════════════════════════════════════════════════════════════╝
"""


QUOTA_TEMPLATES = {
    "free": """
╔══════════════════════════════════════════════════════════════╗
║  ⚠️  Free Tier Quota Exceeded                                ║
╠══════════════════════════════════════════════════════════════╣
║  You've used {daily_used}/{daily_limit} commands today.     ║
║                                                              ║
║  Command '{command}' requires additional quota.              ║
║                                                              ║
║  💡 Upgrade to Pro for 1000 commands/day:                   ║
║     → https://raas.mekong.dev/pricing                        ║
║                                                              ║
║  Plans:                                                      ║
║  • Trial: FREE (50 commands/day)                            ║
║  • Pro: $29/mo (1000 commands/day)                          ║
║  • Enterprise: Custom (Unlimited)                           ║
╚══════════════════════════════════════════════════════════════╝
""",
    "trial": """
╔══════════════════════════════════════════════════════════════╗
║  ⚠️  Trial Quota Exceeded                                    ║
╠══════════════════════════════════════════════════════════════╣
║  You've used {daily_used}/{daily_limit} commands today.     ║
║                                                              ║
║  Your trial quota is exhausted.                             ║
║                                                              ║
║  🚀 Upgrade to Pro to continue:                             ║
║     → https://raas.mekong.dev/pricing                        ║
║                                                              ║
║  Quota resets in: {retry_after}                             ║
╚══════════════════════════════════════════════════════════════╝
""",
    "starter": """
╔══════════════════════════════════════════════════════════════╗
║  ⚠️  Starter Tier Quota Exceeded                             ║
╠══════════════════════════════════════════════════════════════╣
║  You've used {daily_used}/{daily_limit} commands today.     ║
║                                                              ║
║  Quota resets in: {retry_after}                             ║
║                                                              ║
║  Need more? Upgrade to Pro:                                 ║
║     → https://raas.mekong.dev/pricing                        ║
╚══════════════════════════════════════════════════════════════╝
""",
    "growth": """
╔══════════════════════════════════════════════════════════════╗
║  ⚠️  Growth Tier Quota Exceeded                              ║
╠══════════════════════════════════════════════════════════════╣
║  You've used {daily_used}/{daily_limit} commands today.     ║
║                                                              ║
║  Quota resets in: {retry_after}                             ║
║                                                              ║
║  Need more? Upgrade to Enterprise:                          ║
║     → https://raas.mekong.dev/enterprise                     ║
╚══════════════════════════════════════════════════════════════╝
""",
    "pro": """
╔══════════════════════════════════════════════════════════════╗
║  ⚠️  Daily Quota Exceeded                                    ║
╠══════════════════════════════════════════════════════════════╣
║  You've used {daily_used}/{daily_limit} commands today.     ║
║                                                              ║
║  Quota resets in: {retry_after}                             ║
║                                                              ║
║  Need more? Upgrade to Enterprise:                          ║
║     → https://raas.mekong.dev/enterprise                     ║
╚══════════════════════════════════════════════════════════════╝
""",
    "enterprise": """
╔══════════════════════════════════════════════════════════════╗
║  ⚠️  Quota Alert                                             ║
╠══════════════════════════════════════════════════════════════╣
║  You've used {daily_used} commands today.                   ║
║                                                              ║
║  Enterprise tier has unlimited quota.                       ║
║  This alert may indicate a temporary issue.                 ║
║                                                              ║
║  Contact support: support@raas.mekong.dev                   ║
╚══════════════════════════════════════════════════════════════╝
""",
}

# Rate limit specific template
RATE_LIMIT_TEMPLATE = """
╔══════════════════════════════════════════════════════════════╗
║  ⚠️  Rate Limit Exceeded                                     ║
╠══════════════════════════════════════════════════════════════╣
║  Too many requests in a short period.                       ║
║                                                              ║
║  Please wait {retry_after} before trying again.             ║
║                                                              ║
║  This protects fair usage for all users.                    ║
║  Need higher limits? Contact us:                            ║
║     → https://raas.mekong.dev/enterprise                     ║
╚══════════════════════════════════════════════════════════════╝
"""

# Invalid/revoked license template
LICENSE_ERROR_TEMPLATE = """
╔══════════════════════════════════════════════════════════════╗
║  🔒  License Error                                           ║
╠══════════════════════════════════════════════════════════════╣
║  {message}                                                   ║
║                                                              ║
║  Command '{command}' requires a valid license.               ║
║                                                              ║
║  Get your license key:                                       ║
║     → https://raas.mekong.dev/pricing                        ║
║                                                              ║
║  Already have a key? Check with:                            ║
║     mekong license status                                    ║
╚══════════════════════════════════════════════════════════════╝
"""


def _format_retry_after(seconds: Optional[int]) -> str:
    """Format retry_after into human-readable string."""
    if seconds is None:
        return "midnight UTC"

    if seconds < 60:
        return f"{seconds} seconds"
    elif seconds < 3600:
        minutes = seconds // 60
        return f"{minutes} minute{'s' if minutes != 1 else ''}"
    else:
        hours = seconds // 3600
        minutes = (seconds % 3600) // 60
        if minutes > 0:
            return f"{hours}h {minutes}m"
        return f"{hours} hour{'s' if hours != 1 else ''}"


def format_quota_error(ctx: QuotaErrorContext) -> str:
    """Format error message with context.

    Args:
        ctx: QuotaErrorContext with usage data

    Returns:
        Formatted error message string
    """
    # Handle rate limit separately
    if ctx.violation_type == "rate_limit":
        return RATE_LIMIT_TEMPLATE.format(
            retry_after=_format_retry_after(ctx.retry_after_seconds)
        ).strip()

    # Handle license errors
    if ctx.violation_type in ("invalid_license", "revoked"):
        message = {
            "invalid_license": "Invalid or malformed license key.",
            "revoked": "This license has been revoked.",
        }.get(ctx.violation_type, "License validation failed.")

        return LICENSE_ERROR_TEMPLATE.format(
            message=message,
            command=ctx.command
        ).strip()

    # Get template for tier
    template = QUOTA_TEMPLATES.get(ctx.tier, QUOTA_TEMPLATES["free"])

    return template.format(
        daily_used=ctx.daily_used,
        daily_limit=ctx.daily_limit,
        command=ctx.command,
        retry_after=_format_retry_after(ctx.retry_after_seconds),
    ).strip()


def get_upgrade_url(tier: str) -> str:
    """Get upgrade URL for tier."""
    urls = {
        "free": "https://raas.mekong.dev/pricing",
        "trial": "https://raas.mekong.dev/pricing",
        "starter": "https://raas.mekong.dev/pricing",
        "growth": "https://raas.mekong.dev/pricing",
        "pro": "https://raas.mekong.dev/enterprise",
        "enterprise": "https://raas.mekong.dev/contact",
    }
    return urls.get(tier, urls["free"])


def get_renewal_url(key_id: str = "", tier: str = "", email: str = "") -> str:
    """
    Get renewal URL with optional user context for deep linking.

    Args:
        key_id: License key ID for pre-filling renewal form
        tier: Current/expired tier for upgrade suggestions
        email: User email for pre-filling

    Returns:
        Renewal URL with query parameters
    """
    base_url = "https://raas.mekong.dev/renew"
    params = []

    if key_id:
        params.append(f"key_id={key_id}")
    if tier:
        params.append(f"tier={tier}")
    if email:
        params.append(f"email={email}")

    if params:
        return f"{base_url}?{'&'.join(params)}"
    return base_url


def format_license_expired_with_renewal(expiry_date: str = "", renewal_url: str = "") -> str:
    """
    Format expired license message with renewal CTA.

    Args:
        expiry_date: Expiration date string
        renewal_url: Deep-linked renewal URL

    Returns:
        Formatted error message with renewal link
    """
    if not expiry_date:
        expiry_date = "an unknown date"
    if not renewal_url:
        renewal_url = "https://raas.mekong.dev/renew"

    template = """
╔══════════════════════════════════════════════════════════════╗
║  ⏰  License Expired                                         ║
╠══════════════════════════════════════════════════════════════╣
║  Your license expired on {expiry_date}.                     ║
║                                                              ║
║  Access to premium features is blocked.                     ║
║                                                              ║
║  🔄 Renew your license to continue:                         ║
║     → {renewal_url}                                          ║
║                                                              ║
║  Need help? Contact us:                                     ║
║     → support@raas.mekong.dev                               ║
╚══════════════════════════════════════════════════════════════╝
"""
    return template.format(expiry_date=expiry_date, renewal_url=renewal_url).strip()


def format_simple_error(
    tier: str,
    daily_used: int,
    daily_limit: int,
    retry_after_seconds: Optional[int] = None
) -> str:
    """Format a simple one-line error for quick display.

    Args:
        tier: License tier
        daily_used: Commands used today
        daily_limit: Daily command limit
        retry_after_seconds: Seconds until reset

    Returns:
        Simple error string
    """
    retry_str = _format_retry_after(retry_after_seconds)

    if tier == "free":
        return f"⚠️  Free tier quota exceeded ({daily_used}/{daily_limit}). Upgrade: https://raas.mekong.dev/pricing"
    elif tier == "enterprise":
        return f"⚠️  Quota alert: {daily_used} commands today. Contact support if this persists."
    else:
        return f"⚠️  Quota exceeded ({daily_used}/{daily_limit}). Resets in {retry_str}. Upgrade: https://raas.mekong.dev/enterprise"


def format_quota_warning(ctx: QuotaWarningContext) -> str:
    """Format warning message for approaching quota limit.

    Args:
        ctx: QuotaWarningContext with usage data

    Returns:
        Formatted warning message string
    """
    percentage_str = f"{ctx.percentage:.0f}"

    if ctx.threshold >= 90:
        template = WARNING_90_TEMPLATE
    else:
        template = WARNING_80_TEMPLATE

    return template.format(
        daily_used=ctx.daily_used,
        daily_limit=ctx.daily_limit,
        percentage=percentage_str,
        remaining=ctx.remaining,
        command=ctx.command,
    ).strip()


def format_free_tier_upgrade() -> str:
    """Format upgrade prompt for free tier users.

    Returns:
        Formatted upgrade prompt
    """
    return FREE_TIER_UPGRADE_TEMPLATE.strip()


def format_license_revoked() -> str:
    """Format error message for revoked license.

    Returns:
        Formatted error message
    """
    return LICENSE_REVOKED_TEMPLATE.strip()


def format_license_expired(expiry_date: str = "") -> str:
    """Format error message for expired license.

    Args:
        expiry_date: Expiration date string (YYYY-MM-DD)

    Returns:
        Formatted error message
    """
    if not expiry_date:
        expiry_date = "an unknown date"
    return LICENSE_EXPIRED_TEMPLATE.format(expiry_date=expiry_date).strip()


def format_offline_grace_period(remaining_hours: float) -> str:
    """Format offline grace period warning message.

    Args:
        remaining_hours: Hours remaining in grace period

    Returns:
        Formatted warning message
    """
    return OFFLINE_GRACE_PERIOD_TEMPLATE.format(remaining_hours=remaining_hours).strip()


def format_grace_period_expired() -> str:
    """Format grace period expired error message.

    Returns:
        Formatted error message
    """
    return GRACE_PERIOD_EXPIRED_TEMPLATE.strip()


def format_network_error(error_message: str) -> str:
    """Format network error message.

    Args:
        error_message: Original error message

    Returns:
        Formatted error message
    """
    return NETWORK_ERROR_TEMPLATE.format(error_message=error_message).strip()


def format_jwt_error(message: str, tier: str = "pro") -> str:
    """Format JWT license error message.

    Args:
        message: Error message
        tier: Suggested tier for upgrade

    Returns:
        Formatted error message
    """
    return JWT_ERROR_TEMPLATE.format(message=message, tier=tier).strip()


def get_warning_threshold(daily_used: int, daily_limit: int) -> Optional[int]:
    """
    Get warning threshold if usage exceeds it.

    Args:
        daily_used: Commands used today
        daily_limit: Daily command limit

    Returns:
        90 if >= 90%, 80 if >= 80%, None otherwise
    """
    if daily_limit <= 0:  # Unlimited
        return None

    percentage = (daily_used / daily_limit) * 100

    if percentage >= 90:
        return 90
    elif percentage >= 80:
        return 80
    return None


__all__ = [
    "format_quota_error",
    "format_simple_error",
    "format_quota_warning",
    "format_free_tier_upgrade",
    "format_license_revoked",
    "format_license_expired",
    "format_offline_grace_period",
    "format_grace_period_expired",
    "format_network_error",
    "format_jwt_error",
    "get_warning_threshold",
    "get_upgrade_url",
    "get_renewal_url",
    "format_license_expired_with_renewal",
    "QuotaErrorContext",
    "QuotaWarningContext",
]
