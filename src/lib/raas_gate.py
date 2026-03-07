"""
RaaS License Gate — ROIaaS Phase 6

Gates premium CLI features behind RAAS_LICENSE_KEY environment variable.
Phase 6: Real-time quota enforcement, violation tracking, analytics integration.
Reference: /Users/macbookprom1/mekong-cli/docs/HIEN_PHAP_ROIAAS.md
"""

import os
import requests
from typing import Optional, Tuple, Dict, Any

from src.lib.raas_gate_utils import get_upgrade_message, format_license_preview
from src.lib.license_generator import validate_license
from src.lib.usage_meter import record_usage, get_usage_summary
from src.lib.quota_error_messages import (
    format_quota_error,
    format_quota_warning,
    format_free_tier_upgrade,
    format_license_revoked,
    format_license_expired,
    format_offline_grace_period,
    format_grace_period_expired,
    format_jwt_error,
    get_warning_threshold,
    QuotaErrorContext,
    QuotaWarningContext,
)
from src.raas.violation_tracker import ViolationEvent, get_tracker as get_violation_tracker
from src.raas.credit_rate_limiter import CreditRateLimiter, TIER_LIMITS
from src.raas.quota_cache import get_cached_quota, cache_quota, GRACE_PERIOD_SECONDS
from src.raas.validation_logger import ValidationLog, get_logger as get_validation_logger
from src.lib.jwt_license_generator import validate_jwt_license
from src.core.license_monitor import record_failure as record_license_failure


class RaasLicenseGate:
    """RaaS License validation and feature gating with Phase 2 features."""

    FREE_COMMANDS = {"init", "version", "list", "search", "status", "config", "doctor", "help", "dash"}
    PREMIUM_COMMANDS = {"cook", "gateway", "binh-phap", "swarm", "schedule", "telegram", "autonomous", "agi"}

    def __init__(self, enable_remote: bool = True) -> None:
        self._license_key: Optional[str] = os.getenv("RAAS_LICENSE_KEY")
        self._validated: bool = False
        self._license_tier: Optional[str] = None
        self._key_id: Optional[str] = None
        self._enable_remote = enable_remote
        self._remote_url = os.getenv("RAAS_API_URL", "http://localhost:8787")
        # Phase 6: Credit rate limiter for sliding window enforcement
        self._rate_limiter: Optional[CreditRateLimiter] = None
        # Phase 6b: Quota warning state
        self._warning_displayed: set = set()  # Track displayed warnings per key_id
        # Phase 6c: License status tracking
        self._license_status: str = "active"  # active, revoked, expired
        self._license_expires_at: Optional[int] = None  # Unix timestamp
        # Phase 6d: Offline grace period
        self._offline_failures: int = 0
        self._last_offline_error: Optional[str] = None
        # Phase 7: JWT offline license
        self._jwt_payload: Optional[Dict[str, Any]] = None
        self._jwt_validator: Optional[Any] = None

    def _show_quota_warning(self, command: str, tier_limits: dict) -> None:
        """
        Show quota warning if usage >= 80% or >= 90%.

        Args:
            command: Current command name
            tier_limits: Tier limit dict with daily limit

        Side Effects:
            - Prints warning to console if threshold exceeded
            - Caches quota state
        """
        if not self._key_id or not self._license_tier:
            return

        # Check if already displayed warning for this session
        warning_key = f"{self._key_id}:warning"
        if warning_key in self._warning_displayed:
            return

        # Phase 6c: Check license status first
        if self._license_status == "revoked":
            from rich.console import Console
            console = Console()
            console.print(f"\n{format_license_revoked()}\n")
            return
        if self._license_status == "expired":
            from rich.console import Console
            console = Console()
            expiry_date = ""
            if self._license_expires_at:
                from datetime import datetime, timezone
                expiry_date = datetime.fromtimestamp(self._license_expires_at, tz=timezone.utc).strftime("%Y-%m-%d")
            console.print(f"\n{format_license_expired(expiry_date)}\n")
            return

        # Get current usage
        try:
            from src.db.repository import get_repository
            repo = get_repository()
            import asyncio
            usage = asyncio.get_event_loop().run_until_complete(
                repo.get_usage(self._key_id)
            )
            daily_used = usage["commands_count"] if usage else 0
        except Exception:
            return  # Don't fail on warning

        daily_limit = tier_limits.get("daily", 0)

        # Skip if unlimited
        if daily_limit <= 0:
            return

        # Calculate percentage and remaining
        percentage = (daily_used / daily_limit) * 100
        remaining = max(0, daily_limit - daily_used)

        # Cache quota state with license status
        try:
            cache_quota(
                key_id=self._key_id,
                daily_used=daily_used,
                daily_limit=daily_limit,
                tier=self._license_tier,
                status=self._license_status,
                expires_at_ts=self._license_expires_at or 0,
            )
        except Exception:
            pass  # Don't fail on caching

        # Check thresholds
        threshold = get_warning_threshold(daily_used, daily_limit)

        if threshold:
            from rich.console import Console
            console = Console()

            ctx = QuotaWarningContext(
                tier=self._license_tier,
                daily_used=daily_used,
                daily_limit=daily_limit,
                percentage=percentage,
                remaining=remaining,
                command=command,
                threshold=threshold,
            )

            warning_msg = format_quota_warning(ctx)
            console.print(f"\n{warning_msg}\n")

            # Mark warning as displayed
            self._warning_displayed.add(warning_key)

        # Show free tier upgrade prompt
        if self._license_tier == "free" and daily_used > 0:
            from rich.console import Console
            console = Console()
            console.print(f"\n{format_free_tier_upgrade()}\n")
            self._warning_displayed.add(f"{self._key_id}:free_upgrade")

    def _validate_jwt_token(self, license_key: str) -> Tuple[bool, Optional[str], Optional[Dict[str, Any]]]:
        """
        Validate JWT license token.

        Args:
            license_key: License key (raasjwt-[tier]-[jwt_token])

        Returns:
            Tuple of (is_valid, error_message, decoded_payload)
        """
        # Check if it's a JWT token
        if not license_key.startswith("raasjwt-"):
            return False, None, None

        # Validate JWT
        is_valid, payload, error = validate_jwt_license(license_key)

        if not is_valid:
            return False, error, None

        # Extract info from payload
        self._jwt_payload = payload
        self._license_tier = payload.get("tier")
        self._key_id = payload.get("key_id")

        return True, None, payload

    @property
    def license_key(self) -> Optional[str]:
        return self._license_key

    @property
    def has_license(self) -> bool:
        return self._license_key is not None and len(self._license_key) > 0

    def is_free_command(self, command: str) -> bool:
        return command.lower() in self.FREE_COMMANDS

    def is_premium_command(self, command: str) -> bool:
        return command.lower() in self.PREMIUM_COMMANDS

    def validate_license_format(self, license_key: Optional[str] = None) -> Tuple[bool, str]:
        key = license_key or self._license_key
        if not key:
            return False, "RAAS_LICENSE_KEY not set"
        if not key.startswith("raas-"):
            return False, "Invalid format: must start with 'raas-'"
        parts = key.split("-")
        if len(parts) < 4:  # Phase 2: raas-[tier]-[id]-[signature]
            return False, "Invalid format: expected raas-[tier]-[id]-[signature]"
        tier = parts[1].lower()
        if tier not in {"free", "pro", "enterprise", "trial"}:
            return False, f"Invalid tier: {tier}"
        return True, ""

    def validate_remote(self, license_key: str) -> Tuple[bool, Optional[dict], str]:
        """
        Validate license key with remote API.

        Args:
            license_key: License key to validate

        Returns:
            Tuple of (is_valid, license_info, error_message)

        Side Effects:
            - Logs validation attempt
            - Sets offline mode if remote unavailable
            - Uses grace period for offline fallback
        """
        import time
        start_time = time.time()

        if not self._enable_remote:
            # Fallback to local validation
            is_valid, info, error = validate_license(license_key)
            if is_valid:
                self._license_tier = info.get("tier") if info else None
                self._key_id = info.get("key_id") if info else None
            return is_valid, info, error

        try:
            response = requests.post(
                f"{self._remote_url}/api/v1/license/validate",
                json={"license_key": license_key},
                timeout=5,
            )
            if response.status_code == 200:
                data = response.json()

                # Check license status
                status = data.get("status", "active")
                if status == "revoked":
                    self._offline_failures = 0  # Reset on success
                    return False, None, "License has been revoked"
                if status == "expired":
                    self._offline_failures = 0  # Reset on success
                    return False, None, "License has expired"

                self._validated = True
                self._license_tier = data.get("tier")
                self._key_id = data.get("key_id")
                self._license_status = status
                self._license_expires_at = data.get("expires_at")  # Unix timestamp
                self._offline_failures = 0  # Reset on success

                # Cache successful validation with full grace period
                if self._key_id:
                    cache_quota(
                        key_id=self._key_id,
                        daily_used=0,  # Will be updated by usage meter
                        daily_limit=TIER_LIMITS.get(self._license_tier, {}).get("daily", 10),
                        tier=self._license_tier,
                        status=self._license_status,
                        expires_at_ts=self._license_expires_at or 0,
                        is_offline_mode=False,
                        grace_period_remaining=GRACE_PERIOD_SECONDS,
                    )

                return True, data, ""
            elif response.status_code == 401:
                self._offline_failures = 0
                # Record license validation failure
                record_license_failure(
                    error_code="invalid_or_revoked",
                    key_id=None,
                    command=None,
                    error_message="Invalid or revoked license key",
                )
                return False, None, "Invalid or revoked license key"
            elif response.status_code == 403:
                # License revoked or expired
                data = response.json() if response.content else {}
                reason = data.get("reason", "forbidden")
                self._offline_failures = 0
                if reason == "revoked":
                    record_license_failure(
                        error_code="revoked",
                        key_id=None,
                        command=None,
                        error_message="License has been revoked",
                    )
                    return False, None, "License has been revoked"
                elif reason == "expired":
                    record_license_failure(
                        error_code="expired",
                        key_id=None,
                        command=None,
                        error_message="License has expired",
                    )
                    return False, None, "License has expired"
                record_license_failure(
                    error_code="access_denied",
                    key_id=None,
                    command=None,
                    error_message="Access denied",
                )
                return False, None, "Access denied"
            elif response.status_code == 429:
                record_license_failure(
                    error_code="rate_limit",
                    key_id=None,
                    command=None,
                    error_message="Rate limit exceeded",
                )
                return False, None, "Rate limit exceeded. Try again later."
            else:
                self._offline_failures += 1
                self._last_offline_error = f"HTTP {response.status_code}"
                record_license_failure(
                    error_code=f"http_{response.status_code}",
                    key_id=None,
                    command=None,
                    error_message=f"Remote validation failed: {response.status_code}",
                )
                return False, None, f"Remote validation failed: {response.status_code}"

        except requests.exceptions.RequestException as e:
            # Network error - check grace period
            self._offline_failures += 1
            self._last_offline_error = str(e)

            # Check if we have cached state in grace period
            if self._key_id:
                cached_state = get_cached_quota(self._key_id)
                if cached_state and cached_state.is_in_grace_period():
                    # Allow with offline mode
                    remaining_hours = cached_state.remaining_grace_hours()
                    print(f"\n⚠️  OFFLINE MODE: {remaining_hours}h grace period remaining\n")
                    return True, None, ""  # Allow during grace period

            # Fallback to local validation on network error
            print(f"⚠️  Remote validation unavailable, using local validation: {e}")
            is_valid, info, error = validate_license(license_key)
            if is_valid:
                self._license_tier = info.get("tier") if info else None
                self._key_id = info.get("key_id") if info else None
            return is_valid, info, error

    def check(self, command: str) -> Tuple[bool, Optional[str]]:
        """
        Check license and quota for command execution.

        Validation sequence:
        1. Check if JWT token (raasjwt-*) → validate offline with RSA public key
        2. Check cached license status (revoked/expired) - FAST (< 10ms)
        3. Validate license format
        4. Validate with remote API (or local fallback)
        5. Check grace period if remote unavailable
        6. Check rate limits (sliding window)
        7. Check monthly quota (PostgreSQL backend)
        8. Check daily quota (PostgreSQL backend)

        Args:
            command: Command name to check

        Returns:
            Tuple of (allowed, error_message)

        Side Effects:
            - Shows warning if quota >= 80% or >= 90%
            - Caches quota state for 5 minutes
            - Records violation if blocked
            - Logs all validation attempts
        """
        import time
        start_time = time.time()
        error_type = None
        offline_mode = False
        grace_period_remaining = None

        if self.is_free_command(command):
            return True, None

        if self.is_premium_command(command):
            if not self.has_license:
                error_type = "no_license"
                return False, get_upgrade_message(command)

            # PHASE 7: Check if JWT token (raasjwt-*)
            if self._license_key and self._license_key.startswith("raasjwt-"):
                jwt_valid, jwt_error, jwt_payload = self._validate_jwt_token(self._license_key)
                if not jwt_valid:
                    error_type = "jwt_invalid"
                    return False, format_jwt_error(jwt_error or "Invalid JWT token")

                # JWT valid - extract quotas from payload
                self._jwt_payload = jwt_payload
                quotas = jwt_payload.get("quotas", {})
                self._license_tier = jwt_payload.get("tier")
                self._key_id = jwt_payload.get("key_id")

                # Use embedded quotas from JWT
                tier_limits = {
                    "daily": quotas.get("commands_per_day", 10),
                    "monthly": quotas.get("commands_per_month", 300),
                }

                # Check quota from JWT payload (offline - no DB needed)
                # Note: For full offline mode, we track usage in local cache
                # For hybrid mode, we still check PostgreSQL
                if self._enable_remote:
                    # Hybrid mode: check PostgreSQL for usage tracking
                    pass  # Continue to quota check below
                else:
                    # Full offline mode: skip DB checks, trust JWT quotas
                    self._validated = True
                    return True, None

            # Validate format (non-JWT licenses)
            is_valid, error = self.validate_license_format()
            if not is_valid:
                error_type = "invalid_format"
                # Record license validation failure
                record_license_failure(
                    error_code="invalid_format",
                    key_id=None,
                    command=command,
                    error_message=f"Invalid license: {error}",
                )
                return False, f"Invalid license: {error}"

            # FAST PATH: Check cached license status first (revoked/expired)
            # This avoids remote API calls for known revoked/expired licenses
            if self._key_id:
                cached_state = get_cached_quota(self._key_id)
                if cached_state and not cached_state.is_expired():
                    if cached_state.is_revoked():
                        error_type = "revoked"
                        return False, format_license_revoked()
                    if cached_state.is_license_expired():
                        expiry_date = ""
                        if cached_state.expires_at_ts:
                            from datetime import datetime, timezone
                            expiry_date = datetime.fromtimestamp(
                                cached_state.expires_at_ts, tz=timezone.utc
                            ).strftime("%Y-%m-%d")
                        error_type = "expired"
                        return False, format_license_expired(expiry_date)

            # Validate with remote API (or local fallback)
            is_valid, info, error = self.validate_remote(self._license_key)

            # Check if remote failed and we need grace period
            if not is_valid and error and self._key_id:
                cached_state = get_cached_quota(self._key_id)
                if cached_state and cached_state.is_in_grace_period():
                    # Allow with offline mode warning
                    remaining_hours = cached_state.remaining_grace_hours()
                    offline_mode = True
                    grace_period_remaining = cached_state.remaining_grace_seconds()
                    print(f"\n{format_offline_grace_period(remaining_hours)}\n")
                    # Continue with cached state
                    is_valid = True
                elif cached_state and not cached_state.is_in_grace_period():
                    # Grace period expired
                    error_type = "grace_period_expired"
                    return False, format_grace_period_expired()

            if not is_valid:
                error_type = "validation_failed"
                # Record license validation failure
                record_license_failure(
                    error_code="validation_failed",
                    key_id=self._key_id,
                    command=command,
                    error_message=f"License validation failed: {error}",
                )
                return False, f"License validation failed: {error}"

            # Phase 6: Check quota and rate limits BEFORE allowing
            if self._key_id and self._license_tier:
                tier_limits = TIER_LIMITS.get(self._license_tier, TIER_LIMITS["free"])

                # Check rate limit first (sliding window)
                self._rate_limiter = CreditRateLimiter(
                    daily_limit=tier_limits["daily"],
                    monthly_limit=tier_limits["monthly"],
                )

                rate_status = self._rate_limiter.check_limit(self._key_id)

                if not rate_status.allowed:
                    # Record violation for analytics
                    violation = ViolationEvent(
                        key_id=self._key_id,
                        tier=self._license_tier,
                        violation_type="rate_limit",
                        command=command,
                        daily_used=rate_status.daily_used,
                        daily_limit=rate_status.daily_limit,
                        monthly_used=rate_status.monthly_used,
                        monthly_limit=rate_status.monthly_limit,
                        retry_after_seconds=rate_status.retry_after_seconds,
                    )
                    # Fire and forget
                    try:
                        asyncio.run(get_violation_tracker().record_violation(violation))
                    except Exception:
                        pass

                    ctx = QuotaErrorContext(
                        tier=self._license_tier,
                        daily_used=rate_status.daily_used,
                        daily_limit=rate_status.daily_limit,
                        command=command,
                        monthly_used=rate_status.monthly_used,
                        monthly_limit=rate_status.monthly_limit,
                        retry_after_seconds=rate_status.retry_after_seconds,
                        violation_type="rate_limit",
                    )
                    error_type = "rate_limit"
                    return False, format_quota_error(ctx)

                # Check monthly and daily quota (PostgreSQL backend)
                allowed, usage_error = record_usage(self._key_id, self._license_tier)
                if not allowed:
                    # Record violation for analytics
                    usage_parts = usage_error.split("/")
                    daily_used_val = (
                        int(usage_parts[0].split(":")[1].strip())
                        if ":" in usage_parts[0] and len(usage_parts) > 0
                        else 0
                    )
                    violation = ViolationEvent(
                        key_id=self._key_id,
                        tier=self._license_tier,
                        violation_type="quota_exceeded",
                        command=command,
                        daily_used=daily_used_val,
                        daily_limit=tier_limits["daily"],
                        monthly_used=int(usage_parts[0].strip()) if "Monthly" in usage_error else 0,
                        monthly_limit=tier_limits["monthly"],
                        retry_after_seconds=None,
                    )
                    try:
                        asyncio.run(get_violation_tracker().record_violation(violation))
                    except Exception:
                        pass

                    ctx = QuotaErrorContext(
                        tier=self._license_tier,
                        daily_used=daily_used_val,
                        daily_limit=tier_limits["daily"],
                        command=command,
                        monthly_used=int(usage_parts[0].strip()) if "Monthly" in usage_error else 0,
                        monthly_limit=tier_limits["monthly"],
                        violation_type="quota_exceeded",
                    )
                    error_type = "quota_exceeded"
                    return False, format_quota_error(ctx)

                # SUCCESS: Cache quota state and check for warnings
                self._show_quota_warning(command, tier_limits)

            self._validated = True

            # Log successful validation
            duration_ms = (time.time() - start_time) * 1000
            try:
                log = ValidationLog(
                    key_id=self._key_id or "unknown",
                    result="offline_grace" if offline_mode else "success",
                    command=command,
                    duration_ms=duration_ms,
                    offline_mode=offline_mode,
                    grace_period_remaining=grace_period_remaining,
                )
                asyncio.run(get_validation_logger().log_validation(log))
            except Exception:
                pass  # Don't fail on logging

            return True, None

        return True, None

    def get_license_info(self) -> dict:
        if not self.has_license:
            return {"status": "no_license", "message": "No license key found", "upgrade_url": "https://raas.mekong.dev/pricing"}

        is_valid, error = self.validate_license_format()
        tier = (self._license_key or "").split("-")[1] if self._license_key else "unknown"

        info = {
            "status": "valid" if is_valid else "invalid",
            "tier": tier,
            "key_preview": format_license_preview(self._license_key),
            "error": error if not is_valid else None,
        }

        # Add usage summary if available
        if self._key_id:
            try:
                info["usage"] = get_usage_summary(self._key_id)
            except Exception:
                pass

        return info


_license_gate: Optional[RaasLicenseGate] = None


def get_license_gate(enable_remote: bool = True) -> RaasLicenseGate:
    global _license_gate
    if _license_gate is None:
        _license_gate = RaasLicenseGate(enable_remote=enable_remote)
    return _license_gate


def require_license(command: str) -> None:
    gate = get_license_gate()
    allowed, error = gate.check(command)
    if not allowed:
        from rich.console import Console
        console = Console()
        console.print(f"[bold red]License Error:[/bold red] {error}")
        raise SystemExit(1)


def check_license(command: str) -> bool:
    gate = get_license_gate()
    allowed, _ = gate.check(command)
    return allowed


__all__ = ["RaasLicenseGate", "get_license_gate", "require_license", "check_license"]
